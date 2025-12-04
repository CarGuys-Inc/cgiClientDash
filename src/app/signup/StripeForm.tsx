"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeForm() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<{ id: string; nickname: string; unit_amount: number }[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  // Fetch subscription prices from your server
  useEffect(() => {
    fetch("/api/stripe/stripe-prices")
      .then((res) => res.json())
      .then((data) => {
        setPrices(data);
        if (data.length > 0) setSelectedPrice(data[0].id);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !selectedPrice) return;

    setLoading(true);

    try {
      // Create PaymentIntent / Subscription on the server
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: selectedPrice }),
      });
      const { clientSecret } = await res.json();

      const cardElement = elements.getElement(CardElement)!;
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        await fetch("/api/finalize-signup", { method: "POST" });
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("Unexpected error");
      console.error(err);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {prices.map((price) => (
          <label key={price.id} className="flex items-center space-x-2">
            <input
              type="radio"
              name="price"
              value={price.id}
              checked={selectedPrice === price.id}
              onChange={() => setSelectedPrice(price.id)}
            />
            <span>{price.nickname} — ${(price.unit_amount / 100).toFixed(2)}/month</span>
          </label>
        ))}
      </div>

      <CardElement className="border p-3 rounded" />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="bg-black text-white p-3 rounded w-full">
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
}
