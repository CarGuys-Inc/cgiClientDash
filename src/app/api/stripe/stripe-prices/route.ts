// app/api/stripe/stripe-prices/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

// 🔴 CRITICAL FIX: This prevents Next.js from caching the response
export const dynamic = "force-dynamic";

// Ensure apiVersion matches your package.json version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });

export async function GET() {
  try {
    // 1. Fetch up to 100 active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100, 
      expand: ["data.product"],
    });

    // 2. Filter: Stripe metadata values are ALWAYS strings. 
    // We check strictly for the string "true".
    const filteredPrices = prices.data.filter((p) => {
      return p.metadata['created_in_admin_panel'] === 'true';
    });

    // 3. Map only the filtered data
    const data = filteredPrices.map((p) => ({
      id: p.id,
      nickname: p.nickname || (p.product as Stripe.Product).name,
      unit_amount: p.unit_amount,
      currency: p.currency,
    }));

    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}