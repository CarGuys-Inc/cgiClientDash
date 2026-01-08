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

  console.log(`➡️ Received Event Type: ${event.type}`);

  // Handle both Checkout Sessions and direct Invoice payments
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    
    const session = event.data.object as any; 
    
    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;

    // Use a single environment variable for the site URL
    // Make sure this is http://localhost:3000 in your .env
    const siteUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    console.log("-----------------------------------------");
    console.log("🔍 PROCESSING WEBHOOK:");
    console.log(`   - Email: ${customerEmail}`);
    console.log(`   - Site URL: ${siteUrl}`);
    console.log("-----------------------------------------");

    // Magic Link
    // if (customerEmail) {
    //   const supabaseAdmin = createAdminClient()
      
    //   console.log('🚀 Generating Magic Link via Supabase Admin...');

    //   const { error } = await supabaseAdmin.auth.signInWithOtp({
    //   email: customerEmail,
    //         options: {
    //           // Point directly to /login instead of /auth/callback
    //           emailRedirectTo: `${siteUrl}/login`, 
    //           data: {
    //             is_paid_user: true,
    //             stripe_customer_id: customerId as string
    //           }
    //         }
    //   })

    //   if (error) {
    //     console.error('❌ Supabase Auth Error:', error.message)
    //   } else {
    //     console.log('✅ Success: User created and Magic Link sent.');
    //   }
      
    // } else {
    //   console.warn("⚠️ SKIPPED: customerEmail is missing from the Stripe event.");
    // }

    if (customerEmail) {
        const supabaseAdmin = createAdminClient()

        console.log('🚀 Creating user via Supabase Admin (no email sent)...')

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true, // ✅ prevents magic link / confirmation email
          user_metadata: {
            is_paid_user: true,
            stripe_customer_id: customerId as string,
          },
        })

        if (error) {
          console.error('❌ Supabase Admin Error:', error.message)
        } else {
          console.log('✅ Success: User created WITHOUT magic link.', {
            userId: data.user.id,
            email: data.user.email,
          })
        }
      } else {
        console.warn('⚠️ SKIPPED: customerEmail is missing from the Stripe event.')
      }

  } 

  return new Response('Success', { status: 200 })
}