import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    console.log("📧 1. Email Route Hit");
    const supabase = await createClient();
    const { to, body, subject, applicantId, companyId } = await req.json();

    const systemEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!systemEmail) throw new Error("SENDGRID_FROM_EMAIL env var missing");

    // 1. Find or Create Email Conversation
    // Note: We use company_id/applicant_id if you have them, or match by email strings
    console.log("🔄 2. Upserting Email Conversation...");
    const { data: conv, error: convError } = await supabase
      .from('email_conversations')
      .upsert(
        { 
          company_email: systemEmail, 
          recipient_email: to,
          subject: subject || "Update regarding your application"
        },
        { onConflict: 'company_email, recipient_email' } // Ensure you have a unique constraint on these columns
      )
      .select()
      .single();

    if (convError) {
      console.error("❌ Email Conversation Upsert Error:", convError);
      throw convError;
    }

    // 2. Prepare SendGrid Payload
    const msg = {
      to: to,
      from: systemEmail,
      subject: subject || "Update regarding your application",
      text: body, // Plain text version
      html: `<div style="font-family: sans-serif;">${body.replace(/\n/g, '<br>')}</div>`,
    };

    // 3. Send via SendGrid
    console.log("📤 3. Sending via SendGrid...");
    const [response] = await sgMail.send(msg);
    
    // SendGrid returns a message-id in the headers
    const messageId = response.headers['x-message-id'];

    // 4. Log the message in the database
    console.log("📝 4. Logging email to DB...");
    const { error: msgError } = await supabase
      .from('email_conversation_messages')
      .insert({
        email_conversation_id: conv.id, 
        type: 'Internal', // 'Internal' = Company sent it
        text: body, 
        message_id: messageId,
        status: 'sent', 
        to: to,
        from: systemEmail,
        created_at: new Date().toISOString()
      });

    if (msgError) {
      console.error("❌ Email Message Insert Error:", msgError);
      throw msgError;
    }

    console.log("🎉 5. Email logged successfully.");
    return NextResponse.json({ success: true, messageId });

  } catch (error: any) {
    console.error("💀 EMAIL ROUTE FAILURE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}