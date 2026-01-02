import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Ensure this path is correct for your server client

export async function POST(req: Request) {
  try {
    // 1. Await the client creation
    const supabase = await createClient(); 
    
    // 2. Now you can access .auth
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUserId = user?.id || null;

    const body = await req.json();
    console.log("📨 Received signup data:", body);
    // 1. Destructure all fields
    const { 
      firstName, lastName, jobDescription, email, 
      companyName, jobName, stripePaymentId, companyPhone,
      companyAddress, companyCity, companyState, companyZip,
      incomeMin, incomeMax, incomeRate, amountPaid,
      subscriptionName, hasUpsell, upsellJobName,
      upsellIncomeMin, upsellIncomeMax, upsellIncomeRate, stripe_product_id,
    } = body;

    console.log("🚀 Forwarding data to Project B for:", email, "User ID:", supabaseUserId);

    // 2. Determine the correct Backend URL dynamically
    const API_BASE = process.env.NODE_ENV === "production"
      ? "https://dashboard.carguysinc.com" 
      : "http://127.0.0.1:8000";

    // 3. Pass them to the external Webhook
    const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        source: "nextjs_checkout",
        supabaseUserId, // <--- ADDED USER ID HERE
        firstName, lastName, jobDescription, email,             
        companyName, companyPhone, companyAddress,
        companyCity, companyState, companyZip,
        jobName, incomeMin, incomeMax, incomeRate,
        amountPaid, subscriptionName, stripePaymentId,
        hasUpsell, upsellJobName,
        upsellIncomeMin, upsellIncomeMax, upsellIncomeRate
      }),
    });

    if (!webhookRes.ok) {
      // ... (rest of your error handling logic)
      console.error("❌ Webhook Error:", await webhookRes.text());
      return NextResponse.json({ error: `Backend Error: ${webhookRes.status}` }, { status: 502 });
    }

    console.log("✅ Project B confirmed receipt.");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL WEBHOOK FAILURE:", error.message);
    return NextResponse.json({ error: "Setup system is currently unreachable." }, { status: 500 });
  }
}