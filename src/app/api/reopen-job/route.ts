import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rfId = Number(body.recruiterflow_job_id);

    const response = await fetch("https://dashboard.carguysinc.com/webhooks/clientdash/open-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterflow_job_id: rfId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Admin Dash rejected reopen: ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}