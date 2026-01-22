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

    // 1. Destructure ALL fields to resolve "Cannot find name" errors
    const {
      isAdditionalJob,
      jobTitle,
      firstName, lastName, jobDescription, email,
      companyName, companyPhone, contactPhone,
      companyAddress, companyCity, companyState, companyZip,
      jobName, incomeMin, incomeMax, incomeRate,
      amountPaid, subscriptionName,
      stripePaymentId, stripeSubscriptionId,
      stripe_product_id, stripe_price_id,
      hasUpsell, upsellJobName, upsellIncomeMin, upsellIncomeMax, upsellIncomeRate,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id,
      // ADDED THESE TO FIX YOUR ERRORS:
      consentToCharge,
      signatureDisplayName,
      signatureDateString,
      signedTermsUrl,
      signedTermsPath
    } = body;

    // --- ENVIRONMENT DETECTION ---
    const appEnv = process.env.APP_ENV || 'local';
    const isTestMode = appEnv === 'local' || appEnv === 'staging';
    const API_BASE = (process.env.NODE_ENV === "production" && appEnv === 'production')
      ? "https://dashboard.carguysinc.com"
      : "http://127.0.0.1:8000";

    // --- LOGIC BLOCK: ADDITIONAL JOB UPGRADE ---
    if (isAdditionalJob) {
      if (!supabaseUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("client_profiles")
        .select("company:companies(id, stripe_customer_id, name)")
        .eq("auth_user_id", supabaseUserId)
        .single();

      const companyData = profile?.company as any;
      let stripeCustomerId = companyData?.stripe_customer_id;

      // Reset ID if there's an environment mismatch
      if (stripeCustomerId) {
        const isLiveId = !stripeCustomerId.includes("_test_") && stripeCustomerId.startsWith("cus_");
        if (isTestMode && isLiveId) stripeCustomerId = null;
      }

      if (!stripeCustomerId) {
        return NextResponse.json({ 
          error: "No payment method found for this environment.",
          requiresAction: true,
          checkoutUrl: "/dashboard/billing" 
        }, { status: 402 });
      }

      try {
        const amount = isTestMode ? 100 : 59900;
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          customer: stripeCustomerId,
          confirm: true,
          off_session: true,
          description: `Additional Job Pipeline: ${jobTitle}`,
          metadata: { company_id: companyData.id, job_title: jobTitle }
        });

        if (paymentIntent.status !== "succeeded") throw new Error("Payment declined.");

        const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "additional_job_upgrade",
            supabaseUserId,
            companyId: companyData.id,
            companyName: companyData.name,
            jobName: jobTitle,
            stripePaymentId: paymentIntent.id,
            isUpgrade: true
          }),
        });

        if (!webhookRes.ok) throw new Error("Backend sync failed.");
        return NextResponse.json({ success: true, message: "Job added." });

      } catch (stripeErr: any) {
        if (stripeErr.message.includes("No such customer")) {
          await supabase.from('companies').update({ stripe_customer_id: null }).eq('id', companyData.id);
        }
        return NextResponse.json({ error: stripeErr.message }, { status: 402 });
      }
    }

    // --- LOGIC BLOCK: STANDARD NEW SIGNUP ---
    
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
          consentToCharge: consentToCharge === true,
          signatureName: signatureDisplayName,
          signatureDate: signatureDateString,
          signedTermsUrl,
          signedTermsPath,
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
        stripe_product_id,
        consentToCharge: consentToCharge === true,
        signatureName: signatureDisplayName,
        signatureDate: signatureDateString,
        signedTermsUrl,
        signedTermsPath,
      }),
    });

    if (!webhookRes.ok) {
      const rawBody = await webhookRes.text().catch(() => "");
      // Logic for handling duplicate slugs...
      if (rawBody.includes("companies_slug_unique")) {
        return NextResponse.json({ error: "That company name is already in use." }, { status: 409 });
      }
      return NextResponse.json({ error: "Could not complete setup." }, { status: 502 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL FAILURE:", error.message);
    return NextResponse.json({ error: "System currently unreachable." }, { status: 500 });
  }
}