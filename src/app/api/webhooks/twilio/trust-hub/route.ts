import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Twilio sends data as application/x-www-form-urlencoded
    const formData = await req.formData();
    const profileSid = formData.get('CustomerProfileSid') as string;
    const status = formData.get('Status') as string; // 'approved', 'rejected', 'pending-review'

    console.log(`Twilio Trust Hub Webhook: Profile ${profileSid} is now ${status}`);

    if (profileSid && status) {
      // Update the registration status in our relational config table
      const { error } = await supabaseAdmin
        .from('company_twilio_configs')
        .update({ 
          registration_status: status,
          // If rejected, you might want to log a generic message or pull from Twilio's error logs
          failure_reason: status === 'rejected' ? 'Profile rejected by Twilio/Carrier vetting.' : null,
          updated_at: new Date().toISOString()
        })
        .eq('trust_bundle_sid', profileSid);

      if (error) {
        console.error('Database Update Error:', error.message);
        throw error;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook Route Failure:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}