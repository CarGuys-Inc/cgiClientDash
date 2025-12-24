"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function StripeForm({
  priceId,
  email,
}: {
  priceId: string;
  email: string;
}) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm priceId={priceId} email={email} />
    </Elements>
  );
}

function CheckoutForm({ priceId, email }: { priceId: string; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // 1. Create Subscription on Server
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email }),
      });

      // CHECK: Did the server fail?
      if (!res.ok) {
        const errorText = await res.text(); // Get the raw error message
        throw new Error(`Server Error: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      const { clientSecret } = data;

      if (!clientSecret) {
        throw new Error("No clientSecret returned from server");
      }

      // 2. Confirm Payment with Stripe
      const card = elements.getElement(CardElement)!;

      const { error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card } }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // 3. Success!
      window.location.href = "/dashboard";

    } catch (err: any) {
      console.error("Payment Error:", err);
      // Display the error to the user so it doesn't just "hang"
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement
        className="border p-3 rounded"
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />

      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="bg-black text-white p-3 rounded w-full disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & Create Account"}
      </button>
    </form>
  );
}