// app/onboarding/company/route.ts

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import Stripe from "stripe";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Get auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. Create company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: body.name })
    .select("*")
    .single();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 400 });
  }

  // 3. Link user to company
  await supabase
    .from("users")
    .update({ company_id: company.id })
    .eq("id", user.id);

  // 4. Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_creation: "always",
    line_items: [
      { price: process.env.STRIPE_PRICE_ID, quantity: 1 },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${company.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/company`,
    metadata: {
      company_id: company.id,
    },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
