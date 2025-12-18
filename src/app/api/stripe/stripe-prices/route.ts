// app/api/stripe-prices/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });

export async function GET() {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  // Return only the data we need
  const data = prices.data.map((p) => ({
    id: p.id,
    nickname: p.nickname || (p.product as Stripe.Product).name,
    unit_amount: p.unit_amount,
  }));

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
