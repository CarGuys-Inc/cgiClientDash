// app/api/create-subscription/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export async function POST(req: Request) {
  const { priceId } = await req.json();

  // Create PaymentIntent for the selected price
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // optional override if you want one-time charge; for subscriptions, create subscription object
    currency: "usd",
    payment_method_types: ["card"],
    metadata: { priceId },
  });

  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
    headers: { "Content-Type": "application/json" },
  });
}
