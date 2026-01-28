'use server'

import { createClient } from '@/utils/supabase/server';
// We use 'require' for Twilio to handle the subaccount context switching more easily in some environments
const twilio = require('twilio');

/**
 * Searches for available local phone numbers in the US based on area code.
 * Uses the specific client's subaccount context.
 */
export async function searchAvailableNumbers(companyId: number, areaCode: string) {
  const supabase = await createClient();
  
  // 1. Get the subaccount SID for this company
  const { data: company, error: dbError } = await supabase
    .from('companies')
    .select('twilio_subaccount_sid')
    .eq('id', companyId)
    .single();

  // Guard: Ensure company exists and has a subaccount
  if (dbError || !company?.twilio_subaccount_sid) {
    console.error("Search Error: Company or Subaccount SID not found", dbError);
    return { success: false, error: "Twilio subaccount not found. Please complete compliance registration first." };
  }

  // 2. Initialize Twilio Client using the Main Auth but scoped to the Subaccount SID
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, 
    process.env.TWILIO_AUTH_TOKEN, 
    { accountSid: company.twilio_subaccount_sid }
  );

  try {
    const numbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: areaCode,
      limit: 5,
      smsEnabled: true
    });

    return { 
      success: true, 
      numbers: numbers.map((n: any) => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region
      }))
    };
  } catch (err: any) {
    console.error("Twilio Search API Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Provisions (purchases) a specific phone number for the client's subaccount
 * and updates the company record in Supabase.
 */
export async function provisionNumber(companyId: number, phoneNumber: string) {
  const supabase = await createClient();
  
  // 1. Fetch the subaccount SID
  const { data: company, error: dbError } = await supabase
    .from('companies')
    .select('twilio_subaccount_sid')
    .eq('id', companyId)
    .single();

  // Guard: Check for null company or DB errors
  if (dbError || !company?.twilio_subaccount_sid) {
    return { success: false, error: "Record not found. Cannot provision number without a subaccount." };
  }

  // 2. Initialize Twilio Client scoped to Subaccount
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, 
    process.env.TWILIO_AUTH_TOKEN, 
    { accountSid: company.twilio_subaccount_sid }
  );

  try {
    // 3. Purchase the number through Twilio
    // Note: This will incur a monthly cost on your Twilio project balance
    await client.incomingPhoneNumbers.create({ phoneNumber });

    // 4. Update the phone_number column in the companies table
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        phone_number: phoneNumber
      })
      .eq('id', companyId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    console.error("Twilio Provisioning Error:", err.message);
    return { success: false, error: err.message };
  }
}