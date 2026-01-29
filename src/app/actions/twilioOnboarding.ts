'use server'

import { createClient } from '@/utils/supabase/server';
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function onboardTwilioCompany(companyId: number, data: any) {
  const supabase = await createClient();

  try {
    // 1. Create Subaccount
    const subaccount = await twilio.api.v2010.accounts.create({ friendlyName: `CGI - ${data.businessName}` });

    // 2. Create the Empty Bundle (Secondary Profile)
    const profile = await twilio.trusthub.v1.customerProfiles.create({
      friendlyName: data.businessName,
      email: process.env.TWILIO_NOTIFICATION_EMAIL, // ISV usually monitors status
      policySid: process.env.TWILIO_A2P_POLICY_SID,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/trust-hub`
    });

    // 3. Create Business Info EndUser
    const businessInfo = await twilio.trusthub.v1.endUsers.create({
      friendlyName: `${data.businessName} Identity`,
      type: 'customer_profile_business_information',
      attributes: {
        business_name: data.businessName,
        business_type: data.businessType, // e.g., "Limited Liability Corporation"
        business_industry: data.industry, // e.g., "AUTOMOTIVE"
        business_registration_identifier: "EIN", 
        business_registration_number: data.ein,
        website_url: data.website,
        business_regions_of_operation: ["USA_AND_CANADA"],
        business_identity: "isv_reseller_or_partner"
      }
    });

    // 4. Create Address Resource
    const address = await twilio.addresses.create({
      customerName: data.businessName,
      street: data.street,
      city: data.city,
      region: data.state,
      postalCode: data.zipcode,
      isoCountry: 'US'
    });

    // 5. Create Authorized Rep EndUser
    const rep = await twilio.trusthub.v1.endUsers.create({
      friendlyName: `${data.businessName} Rep`,
      type: 'authorized_representative_1',
      attributes: {
        first_name: data.repFirstName,
        last_name: data.repLastName,
        email: data.repEmail,
        phone_number: data.repPhone,
        business_title: data.repTitle,
        job_position: data.repPosition // e.g., "CEO", "Director", "GM"
      }
    });

    // 6. LINK EVERYTHING (Entity Assignments)
    const assignments = [
      { objectSid: process.env.TWILIO_PRIMARY_PROFILE_SID }, // Link to YOU (the Parent)
      { objectSid: businessInfo.sid },
      { objectSid: rep.sid }
    ];

    for (const item of assignments) {
      await twilio.trusthub.v1.customerProfiles(profile.sid).customerProfilesEntityAssignments.create(item);
    }

    // Attach the Address (Special endpoint for addresses)
    await twilio.trusthub.v1.customerProfiles(profile.sid).customerProfilesEntityAssignments.create({
        objectSid: address.sid
    });

    // 7. FINALLY: Submit for Review
    await twilio.trusthub.v1.customerProfiles(profile.sid).update({ status: 'pending-review' });

    // 8. Save to Supabase
    await supabase.from('company_twilio_configs').upsert({
      company_id: companyId,
      subaccount_sid: subaccount.sid,
      trust_bundle_sid: profile.sid,
      registration_status: 'pending'
    }, { onConflict: 'company_id' });

    return { success: true };
  } catch (err: any) {
    console.error("Full Onboarding Error:", err.message);
    return { error: err.message };
  }
}