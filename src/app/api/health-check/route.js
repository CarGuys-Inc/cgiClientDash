import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stripeSecretExists: !!process.env.STRIPE_SECRET_KEY,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 7),
    supabaseUrlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    appEnv: process.env.APP_ENV || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
}