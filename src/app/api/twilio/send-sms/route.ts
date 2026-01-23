import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Twilio } from "twilio";

// Initialize Twilio Client
const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    console.log("🚀 1. SMS Route Hit");
    const supabase = await createClient();
    const { to, body, applicantId, companyId } = await req.json();

    console.log("📋 2. Incoming Data:", { to, body, applicantId, companyId });

    const systemPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!systemPhone) throw new Error("TWILIO_PHONE_NUMBER env var missing");

    // 1. Format numbers to E.164 (Standardize for Twilio and DB)
    const cleanedTo = to.replace(/\D/g, '');
    const formattedTo = cleanedTo.startsWith('1') ? `+${cleanedTo}` : `+1${cleanedTo}`;

    // 2. Find or Create Conversation
    console.log("🔄 3. Upserting Conversation...");
    const { data: conv, error: convError } = await supabase
      .from('sms_conversations')
      .upsert(
        { 
          company_id: companyId, 
          applicant_id: applicantId,
          company_phone: systemPhone,
          recipient_phone: formattedTo 
        },
        { onConflict: 'company_id, applicant_id' }
      )
      .select()
      .single();

    if (convError) {
      console.error("❌ Conversation Upsert Error:", convError);
      throw convError;
    }
    console.log("✅ 4. Conversation Synced:", conv.id);

    // 3. Setup Twilio Payload & Environment-Aware Webhooks
    // Uses NEXT_PUBLIC_APP_URL (Prod) or NEXT_PUBLIC_URL (Local)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL;
    
    const twilioPayload: any = {
      body,
      from: systemPhone,
      to: formattedTo,
    };

    /** * ENVIRONMENT LOGIC: 
     * Twilio requires a publicly accessible URL for callbacks.
     * We only attach the statusCallback if we are NOT on localhost.
     */
    if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('undefined')) {
      twilioPayload.statusCallback = `${baseUrl}/api/twilio/status`;
      console.log("📡 Status Callback enabled:", twilioPayload.statusCallback);
    } else {
      console.log("🏠 Running locally or URL missing - skipping Status Callback");
    }

    // 4. Send via Twilio
    console.log("📲 5. Attempting Twilio Send...");
    const message = await client.messages.create(twilioPayload);
    console.log("✅ 6. Twilio SID Received:", message.sid);

    // 5. Log the message in the database
    // SATISFYING: sms_conversation_id, type (Internal), text, message_sid, status, to, from
    console.log("📝 7. Logging message to DB...");
    const { error: msgError } = await supabase
      .from('sms_conversation_messages')
      .insert({
        sms_conversation_id: conv.id, 
        type: 'Internal', 
        text: body, 
        message_sid: message.sid,
        status: 'sent', 
        to: formattedTo,
        from: systemPhone 
      });

    if (msgError) {
      console.error("❌ Message Insert Error:", msgError);
      throw msgError;
    }

    console.log("🎉 8. All steps complete! SMS logged successfully.");

    return NextResponse.json({ success: true, sid: message.sid });

  } catch (error: any) {
    console.error("💀 CRITICAL SMS ROUTE FAILURE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}