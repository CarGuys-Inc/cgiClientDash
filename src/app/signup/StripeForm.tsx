"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StripeFormProps {
  priceId: string;
  productId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  jobName: string; 
  incomeMin: string | number;
  incomeMax: string | number;
  incomeRate: string;
  subscriptionName: string;
  hasUpsell?: boolean; 
  upsellJobName?: string;
  upsellIncomeMin?: string | number;
  upsellIncomeMax?: string | number;
  upsellIncomeRate?: string;

  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;

}

export default function StripeForm(props: StripeFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}

function CheckoutForm(props: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedDescription, setFetchedDescription] = useState("");
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // NEW: Store the subscription ID from the API response
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // 2. Pre-Fetch the Payment Intent & Subscription ID
  useEffect(() => {
    let isMounted = true;

    async function createPaymentIntent() {
      setClientSecret(null);
      setSubscriptionId(null);
      
      if (!props.priceId || !props.email) return;

      try {
        const res = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              priceId: props.priceId, 
              email: props.email,
              companyName: props.companyName,
              hasUpsell: props.hasUpsell
          }),
        });
        
        const data = await res.json();
        if (isMounted && data.clientSecret) {
            setClientSecret(data.clientSecret);
            setSubscriptionId(data.subscriptionId); // Capture the ID here
        }
      } catch (err) {
        console.error("Background intent creation failed", err);
      }
    }

    createPaymentIntent();
    return () => { isMounted = false; };
  }, [props.priceId, props.email, props.hasUpsell]);

  useEffect(() => {
    async function getJobDescription() {
      if (!props.jobName) return;
      try {
        const { data, error } = await supabase
          .from("job_description") 
          .select("description")
          .eq("title", props.jobName)
          .single();

        if (data) setFetchedDescription(data.description || "");
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    }
    getJobDescription();
  }, [props.jobName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError(null);

    try {
      let secret = clientSecret;
      let subId = subscriptionId;

      // Fallback: If pre-fetch hasn't finished, fetch now
      if (!secret) {
         const res = await fetch("/api/stripe/create-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                companyName: props.companyName,
                priceId: props.priceId, 
                email: props.email,
                hasUpsell: props.hasUpsell 
            }),
         });
         const data = await res.json();
         if (data.error) throw new Error(data.error);
         secret = data.clientSecret;
         subId = data.subscriptionId;
      }

      if (!secret) throw new Error("Payment initialization failed.");

      const card = elements.getElement(CardElement)!;
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: { card }
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent?.status === "succeeded") {
        // 6. Save Data including the subscriptionId
        const saveRes = await fetch("/api/save-signup-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: props.firstName,
            lastName: props.lastName,
            email: props.email,

            companyName: props.companyName,
            jobName: props.jobName,

            stripePaymentId: paymentIntent.id,
            stripeSubscriptionId: subId, // <--- PASSED HERE
            companyPhone: props.companyPhone,   // billing/business
            contactPhone: props.contactPhone,   // ✅ hiring contact

            companyAddress: props.companyAddress,
            companyCity: props.companyCity,
            companyState: props.companyState,
            companyZip: props.companyZip,

            incomeMin: props.incomeMin,
            incomeMax: props.incomeMax,
            incomeRate: props.incomeRate,
            subscriptionName: props.subscriptionName,
            amountPaid: paymentIntent.amount / 100,

            hasUpsell: props.hasUpsell,
            upsellJobName: props.upsellJobName,
            upsellIncomeMin: props.upsellIncomeMin,
            upsellIncomeMax: props.upsellIncomeMax,
            upsellIncomeRate: props.upsellIncomeRate,

            stripe_product_id: props.productId,
            stripe_price_id: props.priceId,

            utm_source: props.utm_source,
            utm_medium: props.utm_medium,
            utm_campaign: props.utm_campaign,
            utm_content: props.utm_content,
            utm_term: props.utm_term,
            utm_id: props.utm_id,
          })
        });

        const saveResult = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveResult.error || "Setup failed.");

        window.location.href = "/login?new_signup=true";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setLoading(false);
    }
  }

  const buttonText = loading 
    ? "Processing..." 
    : (props.hasUpsell ? "Pay Now (Includes Bonus Job)" : "Pay Now & Complete");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded bg-white">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">{error}</div>}
      <button
        type="submit"
        disabled={loading || !stripe} 
        className="bg-black text-white p-3 rounded w-full disabled:opacity-50 font-bold transition-all"
      >
        {buttonText}
      </button>
    </form>
  );
}