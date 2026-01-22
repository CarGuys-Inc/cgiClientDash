import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover" as any,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUserId = user?.id || null;

    const body = await req.json();

    // Destructure all possible fields
    const {
      isAdditionalJob, // Flag from your Modal
      jobTitle,        // Title from your Modal
      firstName, lastName, jobDescription, email,
      companyName, companyPhone, contactPhone,
      companyAddress, companyCity, companyState, companyZip,
      jobName, incomeMin, incomeMax, incomeRate,
      amountPaid, subscriptionName,
      stripePaymentId, stripeSubscriptionId,
      stripe_product_id, stripe_price_id,
      hasUpsell, upsellJobName, upsellIncomeMin, upsellIncomeMax, upsellIncomeRate,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id,
    } = body;

    // --- LOGIC BLOCK: ADDITIONAL JOB UPGRADE ---
    if (isAdditionalJob) {
      if (!supabaseUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // 1. Find the Stripe Customer ID in your database
      // We join through client_profiles to find the company
      const { data: profile, error: profileError } = await supabase
        .from("client_profiles")
        .select("company:companies(id, stripe_customer_id, name)")
        .eq("auth_user_id", supabaseUserId)
        .single();

      const companyData = profile?.company as any;

      if (!companyData?.stripe_customer_id) {
        return NextResponse.json({ 
          error: "No payment method found on file.",
          requiresAction: true,
          checkoutUrl: "/dashboard/billing" // Redirect them to add a card
        }, { status: 402 });
      }

      try {
        // 2. Attempt the Stripe Charge ($599.00)
        // Note: For a real subscription add-on, you'd usually use stripe.subscriptions.create
        // This example uses a PaymentIntent for immediate "one-click" style charging
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 59900,
          currency: "usd",
          customer: companyData.stripe_customer_id,
          payment_method_types: ["card"],
          confirm: true,
          off_session: true, // Use saved card without prompt
          description: `Additional Job Pipeline: ${jobTitle}`,
          metadata: { company_id: companyData.id, job_title: jobTitle }
        });

        if (paymentIntent.status !== "succeeded") {
          throw new Error("Payment declined or requires authentication.");
        }

        // 3. Payment Succeeded -> Prepare payload for Project B (Recruiterflow/Job creation)
        const upgradePayload = {
          source: "additional_job_upgrade",
          supabaseUserId,
          companyId: companyData.id,
          companyName: companyData.name,
          jobName: jobTitle,
          stripePaymentId: paymentIntent.id,
          isUpgrade: true
        };

        // Forward to your external backend (Project B)
        const API_BASE = process.env.NODE_ENV === "production"
          ? "https://dashboard.carguysinc.com"
          : "http://127.0.0.1:8000";

        const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(upgradePayload),
        });

        if (!webhookRes.ok) throw new Error("Backend synchronization failed.");

        return NextResponse.json({ success: true, message: "Job added and paid." });

      } catch (stripeErr: any) {
        console.error("Stripe Charge Failed:", stripeErr.message);
        return NextResponse.json({ error: stripeErr.message }, { status: 402 });
      }
    }

    // --- LOGIC BLOCK: STANDARD NEW SIGNUP (EXISTING CODE) ---
    const API_BASE = process.env.NODE_ENV === "production"
      ? "https://dashboard.carguysinc.com" 
      : "http://127.0.0.1:8000";

    // Zapier (Non-blocking)
    try {
      await fetch("https://hooks.zapier.com/hooks/catch/12481932/uwnzp6i/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "nextjs_checkout",
          supabaseUserId,
          firstName, lastName, email, contactPhone,
          companyName, companyPhone,
          jobName, incomeMin, incomeMax, incomeRate,
          hasUpsell, upsellJobName, upsellIncomeMin, upsellIncomeMax, upsellIncomeRate,
          stripePaymentId, stripeSubscriptionId, stripe_product_id, stripe_price_id,
          subscriptionName, amountPaid,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id,
          sentAt: new Date().toISOString(),
        }),
      });
    } catch (zapierError: any) {
      console.error("Zapier failed:", zapierError?.message);
    }

    // Forward to Project B
    const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        source: "nextjs_checkout",
        supabaseUserId, firstName, lastName, jobDescription, email,             
        companyName, companyPhone, contactPhone,
        companyAddress, companyCity, companyState, companyZip,
        jobName, incomeMin, incomeMax, incomeRate,
        amountPaid, subscriptionName, stripePaymentId,
        stripeSubscriptionId,
        hasUpsell, upsellJobName, upsellIncomeMin, upsellIncomeMax, upsellIncomeRate,
        stripe_product_id
      }),
    });

    if (!webhookRes.ok) {
      return NextResponse.json({ error: `Backend Error: ${webhookRes.status}` }, { status: 502 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL FAILURE:", error.message);
    return NextResponse.json({ error: "System currently unreachable." }, { status: 500 });
  }
}