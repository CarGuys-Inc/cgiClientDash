import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Destructure all fields (Added Upsell fields)
    const { 
      firstName,        
      lastName,         
      jobDescription,   
      email, 
      companyName, 
      jobName, 
      stripePaymentId,
      companyPhone,
      companyAddress,
      companyCity,
      companyState,
      companyZip,
      incomeMin,
      incomeMax,
      incomeRate,
      amountPaid,
      subscriptionName,
      // --- NEW UPSELL DATA ---
      hasUpsell,
      upsellJobName,
      // (Optional) If you want specific salary info for the 2nd job, capture it here:
      upsellIncomeMin,
      upsellIncomeMax,
      upsellIncomeRate
    } = body;

    console.log("🚀 Forwarding data to Recruiterflow for:", email);

    // 2. Determine the correct Backend URL dynamically
    const API_BASE = process.env.NODE_ENV === "production"
      ? "https://dashboard.carguysinc.com" 
      : "http://localhost:8000";

    // 3. Pass them to the external Webhook
    const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        source: "nextjs_checkout",
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
        
        // --- FORWARD UPSELL DATA ---
        // Your Laravel backend can now check: if (hasUpsell) { createJob2(); }
        hasUpsell,
        upsellJobName,
        upsellIncomeMin, // Pass these if available so Job 2 has the right salary
        upsellIncomeMax,
        upsellIncomeRate
      }),
    });

    if (!webhookRes.ok) {
      let errorData;
      try {
        errorData = await webhookRes.json();
      } catch (e) {
        errorData = await webhookRes.text();
      }

      console.error("❌ Recruiterflow rejected the data:", errorData);
      return NextResponse.json(
        { error: `Backend Error: ${webhookRes.status}` }, 
        { status: 502 }
      );
    }

    console.log("✅ Recruiterflow confirmed receipt.");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL WEBHOOK FAILURE:", error.message);
    return NextResponse.json(
      { error: "Setup system is currently unreachable." }, 
      { status: 500 }
    );
  }
}