import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const formData = await req.formData();
  const sid = formData.get("MessageSid") as string;
  const status = formData.get("MessageStatus") as string;

  const supabase = createAdminClient();

  await supabase
    .from('sms_conversation_messages')
    .update({ status })
    .eq('twilio_sid', sid);

  return NextResponse.json({ success: true });
}