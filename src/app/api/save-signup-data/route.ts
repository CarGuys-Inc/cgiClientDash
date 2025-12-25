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

    // 2. Pass them to the external Webhook
    const webhookRes = await fetch("http://localhost:8000/webhook/recruiterflow", {
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
      const errorData = await webhookRes.json();
      console.error("❌ Recruiterflow rejected the data:", errorData);
      return NextResponse.json(
        { error: `Recruiterflow Error: ${webhookRes.status}` }, 
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