import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming Twilio Form Data
    const formData = await req.formData();
    const body = formData.get("Body") as string;
    const rawFrom = formData.get("From") as string; // Applicant's number
    const rawTo = formData.get("To") as string;     // Your Twilio number
    const messageSid = formData.get("MessageSid") as string;

    // 2. Standardize numbers for the search
    // We strip everything but digits to avoid issues with '+' or '1' prefixes
    const matchFrom = rawFrom.replace(/\D/g, '').slice(-10);
    const matchTo = rawTo.replace(/\D/g, '').slice(-10);

    console.log(`🔍 WEBHOOK: Received "${body}" from ${rawFrom}`);

    // 3. Initialize Admin Client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Find the Conversation (Handling the duplicate row issue)
    const { data: convs, error: convError } = await supabaseAdmin
      .from('sms_conversations')
      .select('id')
      .ilike('recipient_phone', `%${matchFrom}%`)
      .ilike('company_phone', `%${matchTo}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    // Safely grab the first result from the array
    const conv = convs?.[0];

    if (convError || !conv) {
      console.error("❌ MATCH FAILED:", {
        error: convError?.message,
        searched: { matchFrom, matchTo }
      });
      
      // Return TwiML error message to the user for debugging
      return new Response(
        `<Response><Message>Technical error: Conversation link not found for ${matchFrom}.</Message></Response>`, 
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    console.log(`✅ MATCH FOUND: Conversation ID ${conv.id}`);

    // 5. Insert the Inbound Message
    const { error: msgError } = await supabaseAdmin
      .from('sms_conversation_messages')
      .insert({
        sms_conversation_id: conv.id,
        type: 'External', // 'External' satisfies your DB Check Constraint
        text: body,
        message_sid: messageSid,
        status: 'received',
        from: rawFrom,
        to: rawTo
      });

    if (msgError) {
      console.error("❌ DB INSERT ERROR:", msgError.message);
      throw msgError;
    }

    // 6. Respond with empty TwiML so Twilio knows we received it
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error: any) {
    console.error("💀 WEBHOOK CRITICAL FAILURE:", error.message);
    // Return 200 even on error so Twilio stops retrying the webhook
    return new Response("<Response></Response>", { 
      status: 200, 
      headers: { "Content-Type": "text/xml" } 
    });
  }
}