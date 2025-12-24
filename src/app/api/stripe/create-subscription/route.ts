import { NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

// 1. PIN THE API VERSION to ensure stable behavior
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any, // Use latest or your preferred version
});

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

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

    // 4. Create Subscription (Use Automatic Payment Methods)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { 
        save_default_payment_method: "on_subscription",
        // REMOVED "payment_method_types" to prevent conflicts with Dashboard
      },
      expand: ["latest_invoice.payment_intent"],
    });

    // 5. Retrieve the Invoice
    let invoice = subscription.latest_invoice as Stripe.Invoice | string | null;

    if (typeof invoice === 'string') {
      invoice = await stripe.invoices.retrieve(invoice);
    }
    
    if (!invoice || typeof invoice === 'string') {
        throw new Error("Could not retrieve invoice details.");
    }
    
    const fullInvoice = invoice as Stripe.Invoice;

    // 6. Handle "Free/Trial/Paid" Plans
    if (fullInvoice.amount_due === 0 || fullInvoice.status === 'paid') {
        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: null, 
            message: "Subscription active (No payment needed)" 
        });
    }

    // 7. Get Client Secret (With Robust Fallback)
    let clientSecret = null;
    
    // Attempt A: Get secret from expanded Payment Intent
    const pi = (fullInvoice as any).payment_intent;
    if (pi && pi.client_secret) {
        clientSecret = pi.client_secret;
    }

    // Attempt B: Recovery - If PI is missing, re-fetch specifically for it
    if (!clientSecret) {
        console.log("Payment Intent missing. Attempting refetch...");
        const refreshedInvoice = await stripe.invoices.retrieve(fullInvoice.id, {
            expand: ['payment_intent']
        });
        const refreshedPi = (refreshedInvoice as any).payment_intent;
        if (refreshedPi && refreshedPi.client_secret) {
             clientSecret = refreshedPi.client_secret;
        }
    }

    // Attempt C: Final Fail-Safe - Check for "setup_intent" or "confirmation_secret" (Newer API feature)
    if (!clientSecret) {
         // Some configurations put the secret directly on the invoice
         // @ts-ignore
         if (fullInvoice.confirmation_secret) {
             // @ts-ignore
             clientSecret = fullInvoice.confirmation_secret;
         }
    }

    if (!clientSecret) {
      // DEBUG LOG: This will show up in DigitalOcean logs if it fails
      console.error("CRITICAL DEBUG: Invoice JSON:", JSON.stringify(fullInvoice, null, 2));
      throw new Error(`Stripe Error: Invoice ${fullInvoice.id} is Open but has no Client Secret. Check 'Default' Payment Settings in Stripe Dashboard.`);
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