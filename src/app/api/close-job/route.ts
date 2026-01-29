import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // The server (Node.js) makes the call, bypassing the browser's CORS security
    const response = await fetch("https://dashboard.carguysinc.com/webhooks/clientdash/close-job", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // If your admin dashboard requires an API key, add it here:
        // "Authorization": `Bearer ${process.env.ADMIN_DASHBOARD_API_KEY}`
      },
      body: JSON.stringify({
        recruiterflow_job_id: body.recruiterflow_job_id
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Admin Dash Error:", errorText);
      throw new Error("Admin Dashboard rejected the request.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Proxy Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}