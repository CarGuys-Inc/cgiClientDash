import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; 

export async function POST(req: Request) {
  try {
    // 1. Await the client creation
    const supabase = await createClient(); 
    
    // 2. Access auth user
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUserId = user?.id || null;

    const body = await req.json();

    // 3. Destructure all fields - ADDED stripeSubscriptionId
    const { 
      firstName, lastName, jobDescription, email, 
      companyName, jobName, stripePaymentId, 
      stripeSubscriptionId,
      companyPhone, companyAddress, companyCity, companyState, companyZip,
      incomeMin, incomeMax, incomeRate, amountPaid,
      subscriptionName, hasUpsell, upsellJobName,
      upsellIncomeMin, upsellIncomeMax, upsellIncomeRate
    } = body;

    console.log("🚀 Forwarding data to Project B for:", email, "User ID:", supabaseUserId);

    // 4. Determine the correct Backend URL dynamically
    const API_BASE = process.env.NODE_ENV === "production"
      ? "https://dashboard.carguysinc.com" 
      : "http://127.0.0.1:8000";

    // 5. Pass them to the external Webhook
    const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        source: "nextjs_checkout",
        supabaseUserId, 
        firstName, 
        lastName, 
        jobDescription, 
        email,             
        companyName, 
        companyPhone, 
        companyAddress,
        companyCity, 
        companyState, 
        companyZip,
        jobName, 
        incomeMin, 
        incomeMax, 
        incomeRate,
        amountPaid, 
        subscriptionName, 
        stripePaymentId,
        stripeSubscriptionId, // <--- FORWARDED TO WEBHOOK
        hasUpsell, 
        upsellJobName,
        upsellIncomeMin, 
        upsellIncomeMax, 
        upsellIncomeRate
      }),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text();
      console.error("❌ WEBHOOK ERROR RESPONSE:", errorText);
      return NextResponse.json({ error: `Backend Error: ${webhookRes.status}` }, { status: 502 });
    }

    console.log("✅ Project B confirmed receipt with Subscription ID.");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL WEBHOOK FAILURE:", error.message);
    return NextResponse.json({ error: "Setup system is currently unreachable." }, { status: 500 });
  }
}