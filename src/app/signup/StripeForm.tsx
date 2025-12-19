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
  console.log("Stripe Form Initialized");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const res = await fetch("/api/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, email }),
    });

    const { clientSecret } = await res.json();

    const card = elements.getElement(CardElement)!;

    const { error: stripeError } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card } }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="border p-3 rounded" />

      {error && <p className="text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white p-3 rounded w-full"
      >
        {loading ? "Processing…" : "Pay & Create Account"}
      </button>
    </form>
  );
}
