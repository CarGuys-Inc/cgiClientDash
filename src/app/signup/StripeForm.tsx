"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js"; // 1. Import Supabase

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// 2. Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StripeFormProps {
  priceId: string;
  // --- NEW FIELDS ---
  firstName: string;
  lastName: string;
  // ------------------
  email: string;
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
  
  // 3. State to hold the fetched description
  const [fetchedDescription, setFetchedDescription] = useState("");

  // 4. Fetch the description when the component loads
  useEffect(() => {
    async function getJobDescription() {
      if (!props.jobName) return;

      try {
        // Make sure this table name matches your Supabase table EXACTLY
        const { data, error } = await supabase
          .from("job_description") 
          .select("description")
          .eq("title", props.jobName)
          .single();

        if (error) {
          console.error("Supabase error fetching description:", error);
        } else if (data) {
          setFetchedDescription(data.description || "");
        }
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
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 5. Send all data to your internal API
        const saveRes = await fetch("/api/save-signup-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // --- NEW FIELDS ---
            firstName: props.firstName,
            lastName: props.lastName,
            jobDescription: fetchedDescription, 
            // ------------------
            
            email: props.email,
            companyName: props.companyName,
            jobName: props.jobName,
            stripePaymentId: paymentIntent.id,
            companyPhone: props.companyPhone,
            companyAddress: props.companyAddress,
            companyCity: props.companyCity,
            companyState: props.companyState,
            companyZip: props.companyZip,
            incomeMin: props.incomeMin,
            incomeMax: props.incomeMax,
            incomeRate: props.incomeRate,
            subscriptionName: props.subscriptionName,
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