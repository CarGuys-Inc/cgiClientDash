'use server'

import { createClient } from '@/utils/supabase/server';
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function onboardTwilioCompany(companyId: number, businessData: any) {
  const supabase = await createClient();

  try {
    // 1. Create a dedicated Twilio Subaccount
    const subaccount = await twilio.api.v2010.accounts.create({
      friendlyName: `CGI - ${businessData.businessName}`,
    });

    // 2. Register Customer Profile (Trust Hub)
    const profile = await twilio.trusthub.v1.customerProfiles.create({
      friendlyName: businessData.businessName,
      email: businessData.email,
      policySid: process.env.TWILIO_A2P_POLICY_SID,
      // Twilio will ping the webhook we created above when status changes
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/trust-hub`
    });

    // 3. Update the dedicated company_twilio_configs table
    // We use upsert so that if they re-submit after a rejection, it updates the same row
    const { error } = await supabase
      .from('company_twilio_configs')
      .upsert({
        company_id: companyId,
        twilio_subaccount_sid: subaccount.sid,
        trust_bundle_sid: profile.sid,
        registration_status: 'pending',
        business_name: businessData.businessName,
        ein: businessData.ein,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'company_id' 
      });

    if (error) {
      console.error("Supabase Upsert Error:", error.message);
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Twilio Onboarding Action Error:", err.message);
    return { error: err.message };
  }
}