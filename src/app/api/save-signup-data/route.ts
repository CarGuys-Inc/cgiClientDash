import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Destructure all the new fields from the incoming request
    const { 
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
      subscriptionName
    } = body;

    console.log("🚀 Forwarding data to Recruiterflow for:", email);

    // 2. Determine the correct Backend URL dynamically
    // Use the live domain in production, or localhost for local testing.
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
        email,             // company email
        companyName,
        companyPhone,
        companyAddress,
        companyCity,
        companyState,
        companyZip,
        jobName,          // job title
        incomeMin,
        incomeMax,
        incomeRate,
        amountPaid,
        subscriptionName,
        stripePaymentId,
      }),
    });

    if (!webhookRes.ok) {
      // Try to parse error JSON, but handle cases where response isn't JSON
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