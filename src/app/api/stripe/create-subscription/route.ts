import { NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

// 1. PIN THE API VERSION
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

// --- CONFIGURATION ---
// Replace this with your actual Stripe Price ID for the $599 product
const UPSELL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_UPSELL_PRICE_ID!;

export async function POST(req: Request) {
  try {
    // const { priceId, email, hasUpsell } = await req.json();
    console.log("📨 Create Subscription Request for req:", await req.json());
    return;
    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    // 2. Find user in DB
    const rows = await sql`
      SELECT id, stripe_customer_id 
      FROM signup_intents 
      WHERE email = ${email} 
      LIMIT 1
    `;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let customerId = user.stripe_customer_id;

    // 3. Create Stripe Customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { supabase_id: user.id },
      });
      customerId = customer.id;

      await sql`
        UPDATE signup_intents
        SET stripe_customer_id = ${customerId}
        WHERE id = ${user.id}
      `;
    }

    // 4. Build Subscription Items Array
    const subscriptionItems = [
        { price: priceId, quantity: 1 } // Main Plan
    ];

    // IF Upsell is checked, add the second item
    if (hasUpsell) {
        subscriptionItems.push({
            price: UPSELL_PRICE_ID,
            quantity: 1
        });
    }

    // 5. Create Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: subscriptionItems, // <--- Use the dynamic array
      payment_behavior: "default_incomplete",
      payment_settings: { 
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        hasUpsell: hasUpsell ? "true" : "false"
      }
    });

    // 6. Retrieve the Invoice
    let invoice = subscription.latest_invoice as Stripe.Invoice | string | null;

    if (typeof invoice === 'string') {
      invoice = await stripe.invoices.retrieve(invoice);
    }
    
    if (!invoice || typeof invoice === 'string') {
        throw new Error("Could not retrieve invoice details.");
    }
    
    const fullInvoice = invoice as Stripe.Invoice;

    // 7. Get Client Secret
    let clientSecret = null;
    
    // Attempt A
    const pi = (fullInvoice as any).payment_intent;
    if (pi && pi.client_secret) {
        clientSecret = pi.client_secret;
    }

    // Attempt B (Recovery)
    if (!clientSecret) {
        const refreshedInvoice = await stripe.invoices.retrieve(fullInvoice.id, {
            expand: ['payment_intent']
        });
        const refreshedPi = (refreshedInvoice as any).payment_intent;
        if (refreshedPi && refreshedPi.client_secret) {
             clientSecret = refreshedPi.client_secret;
        }
    }

    if (!clientSecret) {
      console.error("CRITICAL DEBUG: Invoice JSON:", JSON.stringify(fullInvoice, null, 2));
      throw new Error(`Stripe Error: Invoice ${fullInvoice.id} has no Client Secret.`);
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
    });

  } catch (error: any) {
    console.error("Stripe API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}