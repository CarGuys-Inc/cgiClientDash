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
      consentToCharge,
      signatureDisplayName,
      signatureDateString,
      signedTermsUrl,
      signedTermsPath
    } = body;

    // --- ENVIRONMENT DETECTION ---
    const appEnv = process.env.APP_ENV || 'local';
    const isTestMode = appEnv === 'local' || appEnv === 'staging';
    
    // Fix: Staging should NOT hit 127.0.0.1
    const API_BASE = (appEnv === 'local')
      ? "http://127.0.0.1:8000"
      : "https://dashboard.carguysinc.com";

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

      // Environment Safety Check
      if (stripeCustomerId && isTestMode && !stripeCustomerId.includes("_test_")) {
        stripeCustomerId = null;
      }

      if (!stripeCustomerId) {
        return NextResponse.json({ 
          error: "Payment method required for this environment.",
          requiresAction: true,
          checkoutUrl: "/dashboard/billing" 
        }, { status: 402 });
      }

      try {
        const amount = isTestMode ? 100 : 59900;
        
        // IDEMPOTENCY KEY: Prevents double-charging on retries
        const idempotencyKey = `job-upgrade-${companyData.id}-${jobTitle.replace(/\s+/g, '-').toLowerCase()}`;

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          customer: stripeCustomerId,
          confirm: true,
          off_session: true,
          description: `Additional Job Pipeline: ${jobTitle}`,
          metadata: { company_id: companyData.id, job_title: jobTitle }
        }, { idempotencyKey });

        if (paymentIntent.status !== "succeeded") throw new Error("Payment declined.");

        // Sync to Project B (Recruiterflow)
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

        if (!webhookRes.ok) throw new Error("Backend synchronization failed.");

        return NextResponse.json({ success: true, message: "Job added." });

      } catch (stripeErr: any) {
        if (stripeErr.message.includes("No such customer")) {
          await supabase.from('companies').update({ stripe_customer_id: null }).eq('id', companyData.id);
        }
        return NextResponse.json({ error: stripeErr.message }, { status: 402 });
      }
    }

    // --- LOGIC BLOCK: STANDARD NEW SIGNUP ---

    // 1. Forward to Project B (Recruiterflow)
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
        return NextResponse.json({ error: "That company name is already in use." }, { status: 409 });
      }
      throw new Error("Initial setup synchronization failed.");
    }

    // 2. RECORD THE CONTRACT IN SUPABASE
    if (supabaseUserId && stripeSubscriptionId) {
      // Logic: 12 months for standard, 3 for basic (customise as needed)
      const termMonths = subscriptionName?.toLowerCase().includes("12") ? 12 : 
                         subscriptionName?.toLowerCase().includes("6") ? 6 : 3;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + termMonths);

      const { data: profile } = await supabase
        .from('client_profiles')
        .select('company_id')
        .eq('auth_user_id', supabaseUserId)
        .single();

      if (profile?.company_id) {
        await supabase.from('subscriptions').insert({
          company_id: profile.company_id,
          stripe_subscription_id: stripeSubscriptionId,
          plan_type: subscriptionName || "Standard Plan",
          contract_start_date: startDate.toISOString(),
          contract_end_date: endDate.toISOString(),
          contract_term_months: termMonths,
          status: 'active',
          auto_renew: true
        });
      }
    }

    // 3. FIRE-AND-FORGET ZAPIER (Speeds up response)
    fetch("https://hooks.zapier.com/hooks/catch/12481932/uwnzp6i/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        source: "nextjs_checkout",
        sentAt: new Date().toISOString(),
      }),
    }).catch(err => console.error("Zapier Background Error:", err));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL FAILURE:", error.message);
    return NextResponse.json({ error: error.message || "System unreachable." }, { status: 500 });
  }
}