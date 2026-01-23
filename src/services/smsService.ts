import { Twilio } from "twilio";
import { SupabaseClient } from "@supabase/supabase-js";

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const sendSMS = async (
  supabase: SupabaseClient,
  { to, body, applicantId, companyId, conversationId }: { 
    to: string, 
    body: string, 
    applicantId: string, 
    companyId: number,
    conversationId: string 
  }
) => {
  try {
    // 1. Send via Twilio
    const message = await client.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER, // This should be your verified A2P number
      to: to,
    });

    // 2. Log to sms_conversation_messages
    const { data, error } = await supabase
      .from('sms_conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'company', // identifying who sent it
        body: body,
        twilio_sid: message.sid,
        status: message.status,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("SMS Service Error:", error.message);
    throw error;
  }
};