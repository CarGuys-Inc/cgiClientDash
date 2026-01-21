"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState, useEffect, useRef } from "react";
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
  amountDue: number;
  
  // --- UPSELL FIELDS ---
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
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureDisplayName =
    `${props.firstName ?? ""} ${props.lastName ?? ""}`.trim() || "Authorized Signer";
  
  // 1. Store the secret locally so we don't have to fetch it on click
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // 2. Pre-Fetch the Payment Intent (Background)
  useEffect(() => {
    let isMounted = true;

    async function createPaymentIntent() {
      // Clear old secret if params changed to prevent paying for wrong plan
      setClientSecret(null);
      
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
        if (isMounted) {
            if (data.clientSecret) setClientSecret(data.clientSecret);
            if (data.subscriptionId) setSubscriptionId(data.subscriptionId);
        }
      } catch (err) {
        console.error("Background intent creation failed", err);
      }
    }

    createPaymentIntent();

    return () => { isMounted = false; };
  }, [props.priceId, props.email, props.hasUpsell]); // Re-run if upsell is toggled

  // 3. Fetch description for MAIN job (Visual only)
  useEffect(() => {
    async function getJobDescription() {
      if (!props.jobName) return;
      try {
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

  useEffect(() => {
    if (!consentChecked) {
      setSignatureImage(null);
      return;
    }
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111111";
    ctx.font = "36px \"Brush Script MT\", \"Segoe Script\", cursive";
    ctx.textBaseline = "middle";
    ctx.fillText(signatureDisplayName, 4, height / 2);

    setSignatureImage(canvas.toDataURL("image/png"));
  }, [consentChecked, signatureDisplayName]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);
    setError(null);

    try {
      // 4. Use Pre-Fetched Secret (Or fetch fallback)
      let secret = clientSecret;

      if (!secret) {
         // Fallback: If user clicked FAST, fetch it now
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
         if (data.subscriptionId) setSubscriptionId(data.subscriptionId);
      }

      if (!secret) throw new Error("Payment initialization failed.");

      // 5. Confirm Payment
      const card = elements.getElement(CardElement)!;
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: { card }
      });

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent?.status === "succeeded") {
        
        // --- REMOVED 3-SECOND DELAY HERE FOR SPEED ---

        // 6. Save Data
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
            stripeSubscriptionId: subscriptionId,

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
            consentToCharge: consentChecked,
            signatureName: signatureDisplayName,
            signatureImage: signatureImage,
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

  const buttonText = loading ? "Processing..." : "Authorize & Complete Payment";
  const formattedAmount = `$${props.amountDue.toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded bg-white">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <label className="flex items-start gap-3 text-xs text-gray-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-black"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            required
          />
          <span>
            I agree to the{" "}
            <a href="/terms-of-service.pdf" className="underline hover:text-black">Terms of Service</a>{" "}
            and{" "}
            <a href="/refund-policy" className="underline hover:text-black">Refund Policy</a>, and I authorize
            CarGuys Inc. to charge my card {formattedAmount} today to begin my job promotion.
          </span>
        </label>
        {consentChecked && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Signature</div>
            {signatureImage ? (
              <img src={signatureImage} alt="Signature" className="mt-1 h-10 w-auto" />
            ) : (
              <div className="mt-1 text-xl text-gray-900" style={{ fontFamily: "\"Brush Script MT\", \"Segoe Script\", cursive" }}>
                {signatureDisplayName}
              </div>
            )}
            <div className="mt-1 text-[10px] text-gray-500">
              Date: {new Date().toLocaleDateString("en-US")}
            </div>
            <p className="mt-1 text-[10px] text-gray-600">
              By signing, I acknowledge that this is a non-refundable digital service that begins immediately upon payment.
            </p>
          </div>
        )}
      </div>
      <canvas ref={signatureCanvasRef} width={360} height={80} className="hidden" />
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">{error}</div>}
      <button
        type="submit"
        // Disable if loading, or if stripe hasn't loaded yet.
        // We do NOT disable if clientSecret is missing, because handleSubmit has a fallback fetch.
        disabled={loading || !stripe || !consentChecked} 
        className={`bg-black text-white p-3 rounded w-full disabled:opacity-50 font-bold transition-all`}
      >
        {buttonText}
      </button>
    </form>
  );
}
