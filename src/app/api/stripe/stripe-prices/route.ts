// app/api/stripe-prices/route.ts
import Stripe from "stripe";

// CHANGED: Updated apiVersion to match the installed SDK's requirement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" }); 

export async function GET() {
  const prices = await stripe.prices.list({
    active: true,
    limit: 100, 
    expand: ["data.product"],
  });

  // Filter the results in memory
  const filteredPrices = prices.data.filter((p) => 
    p.metadata['created_in_admin_panel'] === 'true'
  );

  const data = filteredPrices.map((p) => ({
    id: p.id,
    nickname: p.nickname || (p.product as Stripe.Product).name,
    unit_amount: p.unit_amount,
  }));

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}