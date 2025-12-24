import { NextResponse } from "next/server";
import Stripe from "stripe";
import sql from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    // 1. Find user in DB
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

    // 2. Create Stripe Customer if missing
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

    // 3. Create Subscription (Force Charge Automatically)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      collection_method: "charge_automatically", // <--- THIS IS THE KEY FIX
      expand: ["latest_invoice.payment_intent"],
    });

    // 4. Retrieve the Invoice
    let invoice = subscription.latest_invoice as Stripe.Invoice | string | null;

    if (typeof invoice === 'string') {
      invoice = await stripe.invoices.retrieve(invoice);
    }
    
    if (!invoice || typeof invoice === 'string') {
        throw new Error("Could not retrieve invoice details.");
    }
    
    const fullInvoice = invoice as Stripe.Invoice;

    // 5. Handle "Free", "Trial", or "Already Paid" Plans ($0 due)
    if (fullInvoice.amount_due === 0 || fullInvoice.status === 'paid') {
        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: null, 
            message: "Subscription active (No payment needed)" 
        });
    }

    // 6. Handle "Paid" Plans - Get Payment Intent
    let rawPaymentIntent: any = (fullInvoice as any).payment_intent;

    // --- RECOVERY BLOCK ---
    if (!rawPaymentIntent) {
        // Refetch to be sure
        const refreshedInvoice = await stripe.invoices.retrieve(fullInvoice.id, {
            expand: ['payment_intent']
        });
        rawPaymentIntent = (refreshedInvoice as any).payment_intent;
        
        // If still missing and invoice is draft, finalize it
        if (!rawPaymentIntent && refreshedInvoice.status === 'draft') {
             const finalizedInvoice = await stripe.invoices.finalizeInvoice(fullInvoice.id, {
                 expand: ['payment_intent']
             });
             rawPaymentIntent = (finalizedInvoice as any).payment_intent;
        }
    }

    let resolvedPaymentIntent: Stripe.PaymentIntent;

    if (typeof rawPaymentIntent === 'string') {
      resolvedPaymentIntent = await stripe.paymentIntents.retrieve(rawPaymentIntent);
    } else if (rawPaymentIntent && typeof rawPaymentIntent === 'object') {
      resolvedPaymentIntent = rawPaymentIntent as Stripe.PaymentIntent;
    } else {
      // DEBUG: If this throws, check your Stripe Dashboard -> Invoices
      console.error("Critical Stripe Error. Invoice JSON:", JSON.stringify(fullInvoice, null, 2));
      throw new Error(`Invoice ${fullInvoice.id} (${fullInvoice.status}) has amount ${fullInvoice.amount_due} but no Payment Intent.`);
    }

    // 7. Final Validation
    if (!resolvedPaymentIntent.client_secret) {
      throw new Error("Stripe Error: Missing Client Secret.");
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: resolvedPaymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error("Stripe API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}