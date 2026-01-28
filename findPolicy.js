// Load the dotenv library to read your .env.local
require('dotenv').config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !accountSid.startsWith('AC')) {
  console.error("❌ ERROR: TWILIO_ACCOUNT_SID is missing or invalid in .env.local");
  process.exit(1);
}

const client = require('twilio')(accountSid, authToken);

async function getPolicies() {
  try {
    console.log("Searching for Trust Hub Policies...");
    const policies = await client.trusthub.v1.policies.list();
    
    console.log("\n--- COPY THE SID FOR 'Customer Profile' ---");
    policies.forEach(p => {
      console.log(`[${p.friendlyName}] SID: ${p.sid}`);
    });
    console.log("-------------------------------------------\n");
  } catch (err) {
    console.error("❌ API ERROR:", err.message);
  }
}

getPolicies();