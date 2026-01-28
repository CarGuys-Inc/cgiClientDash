'use server'

import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

export async function updateSubscription(companyId: number, newPriceId: string) {
  const supabase = await createClient();

  // 1. Fetch Company Contract Data
  const { data: company, error } = await supabase
    .from('companies')
    .select('stripe_subscription_id, contract_end_date, contract_type')
    .eq('id', companyId)
    .single();

  if (error || !company?.stripe_subscription_id) {
    return { error: "No active subscription found to modify." };
  }

  // 2. LOGIC: Enforce Contract Rules
  const today = new Date();
  if (company.contract_end_date && new Date(company.contract_end_date) > today) {
    // Logic: Allow upgrades, but block downgrades if under contract
    return { error: "Your contract is locked until " + company.contract_end_date + ". Please contact support to modify." };
  }

  try {
    // 3. Update Stripe Subscription directly
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
    await stripe.subscriptions.update(company.stripe_subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice',
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}