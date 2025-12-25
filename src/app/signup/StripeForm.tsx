"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 1. Updated Interface to include all required Recruiterflow fields
interface StripeFormProps {
  priceId: string;
  email: string; // company email
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  jobName: string; // job title
  incomeMin: string | number;
  incomeMax: string | number;
  incomeRate: string; // e.g., "Hourly", "Yearly"
  subscriptionName: string;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Create Subscription
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: props.priceId, email: props.email }),
      });
      const { clientSecret } = await res.json();

      // Confirm Payment
      const card = elements.getElement(CardElement)!;
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent?.status === "succeeded") {
        // --- Delay to let Stripe finish background processing ---
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 2. Send all data to your internal API
        const saveRes = await fetch("/api/save-signup-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Existing fields
            email: props.email,
            companyName: props.companyName,
            jobName: props.jobName,
            stripePaymentId: paymentIntent.id,
            
            // New fields passed from props
            companyPhone: props.companyPhone,
            companyAddress: props.companyAddress,
            companyCity: props.companyCity,
            companyState: props.companyState,
            companyZip: props.companyZip,
            incomeMin: props.incomeMin,
            incomeMax: props.incomeMax,
            incomeRate: props.incomeRate,
            subscriptionName: props.subscriptionName,

            // Amount paid comes directly from the successful Stripe PaymentIntent (in cents)
            // We divide by 100 to get the dollar amount
            amountPaid: paymentIntent.amount / 100 
          }),
        });

        const saveResult = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveResult.error || "Setup failed.");

        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded bg-white">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">{error}</div>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="bg-black text-white p-3 rounded w-full disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & Complete Signup"}
      </button>
    </form>
  );
}