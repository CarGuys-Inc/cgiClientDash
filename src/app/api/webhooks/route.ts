import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/utils/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log("🔔 Webhook Triggered"); 

  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const errorMessage = (err as Error).message;
    console.error(`❌ Signature verification failed: ${errorMessage}`)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // LOG THE EVENT TYPE SO WE KNOW WHAT IS HAPPENING
  console.log(`➡️ Received Event Type: ${event.type}`);

  // -----------------------------------------------------------------
  // HANDLING: CHECKOUT SESSION (Hosted Page) OR INVOICE (Custom Form)
  // -----------------------------------------------------------------
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    
    // 1. Normalize the data (Invoice and Session objects look different)
    const session = event.data.object as any; // Using 'any' to handle both types flexibly
    
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    const dashboardUrl = process.env.DASHBOARD_URL;

    console.log(`🔍 Processing for: ${customerEmail}`);

    if (customerEmail && dashboardUrl) {
      // 2. Create Supabase User
      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin.auth.signInWithOtp({
        email: customerEmail,
        options: {
          emailRedirectTo: `${dashboardUrl}/auth/callback?next=/dashboard`,
          data: {
            is_paid_user: true,
            stripe_customer_id: customerId as string
          }
        }
      })

      if (error) {
        console.error('❌ Supabase Auth Error:', error.message)
      } else {
        console.log('✅ Supabase Magic Link Sent / User Created');
      }
      
      // Note: We skip the Laravel forwarding here because your frontend 
      // is already doing it via the 'save-signup-data' route.
      
    } else {
      console.warn("⚠️ SKIPPED: Missing Email or DASHBOARD_URL");
    }
  } 

  return new Response('Success', { status: 200 })
}