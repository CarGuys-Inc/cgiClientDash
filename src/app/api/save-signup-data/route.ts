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
      consentToCharge,
      signatureDisplayName,
      signatureDateString,
      signedTermsUrl,
      signedTermsPath
    } = body;

    const appEnv = process.env.APP_ENV || 'local';
    const isTestMode = appEnv === 'local' || appEnv === 'staging';
    const API_BASE = (process.env.NODE_ENV === "production" && appEnv === 'production')
      ? "https://dashboard.carguysinc.com"
      : "http://127.0.0.1:8000";

    // --- LOGIC BLOCK: ADDITIONAL JOB UPGRADE ---
    if (isAdditionalJob) {
      if (!supabaseUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase
        .from("client_profiles")
        .select("company:companies(id, stripe_customer_id, name)")
        .eq("auth_user_id", supabaseUserId)
        .single();

      const companyData = profile?.company as any;
      let stripeCustomerId = companyData?.stripe_customer_id;

      if (stripeCustomerId && isTestMode && !stripeCustomerId.includes("_test_")) {
        stripeCustomerId = null;
      }

      if (!stripeCustomerId) {
        return NextResponse.json({ 
          error: "Payment method required.",
          requiresAction: true,
          checkoutUrl: "/dashboard/billing" 
        }, { status: 402 });
      }

      try {
        const amount = isTestMode ? 100 : 59900;
        
        // FIX 1: IDEMPOTENCY KEY
        // This prevents double-charging if the request is retried or the button is double-clicked
        const idempotencyKey = `job-${companyData.id}-${jobTitle.replace(/\s+/g, '-').toLowerCase()}`;

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          customer: stripeCustomerId,
          confirm: true,
          off_session: true,
          description: `Additional Job: ${jobTitle}`,
          metadata: { company_id: companyData.id, job_title: jobTitle }
        }, {
          idempotencyKey // <--- Stripe will reject duplicate requests with this key
        });

        if (paymentIntent.status !== "succeeded") throw new Error("Payment declined.");

        // FIX 2: Faster Backend Sync
        const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "additional_job_upgrade",
            supabaseUserId,
            companyId: companyData.id,
            jobName: jobTitle,
            stripePaymentId: paymentIntent.id,
            isUpgrade: true
          }),
        });

        if (!webhookRes.ok) throw new Error("Sync failed.");
        return NextResponse.json({ success: true });

      } catch (stripeErr: any) {
        if (stripeErr.message.includes("No such customer")) {
          await supabase.from('companies').update({ stripe_customer_id: null }).eq('id', companyData.id);
        }
        return NextResponse.json({ error: stripeErr.message }, { status: 402 });
      }
    }

    // --- LOGIC BLOCK: STANDARD NEW SIGNUP ---
    
    // FIX 3: FIRE-AND-FORGET ZAPIER
    // We do NOT 'await' this. It lets the response finish faster.
    fetch("https://hooks.zapier.com/hooks/catch/12481932/uwnzp6i/", {
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
    }).catch(err => console.error("Zapier Background Error:", err));

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
      if (rawBody.includes("companies_slug_unique")) {
        return NextResponse.json({ error: "Company name already in use." }, { status: 409 });
      }
      return NextResponse.json({ error: "Setup sync failed." }, { status: 502 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL FAILURE:", error.message);
    return NextResponse.json({ error: "Setup system is currently unreachable." }, { status: 500 });
  }
}