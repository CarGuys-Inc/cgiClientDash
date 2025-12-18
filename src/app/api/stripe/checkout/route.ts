import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });

export async function POST(req: Request) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1000, // example $10
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
    headers: { "Content-Type": "application/json" },
  });
}
