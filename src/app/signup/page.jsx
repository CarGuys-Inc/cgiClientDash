export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StripeForm from "./StripeForm";
import { stripe } from "@/lib/stripe/server";
import ClientOnly from "@/components/ClientOnly";

export default async function SignupPage({ searchParams }) {
  const params = searchParams ?? {};

  const step = params.step ?? "info";
  const email = params.email ?? "";
  const company = params.company ?? "";
  const job = params.job ?? "";
  const selectedPriceId = params.priceId ?? "";
  const rawIntent = params.intent;
  const intentId = rawIntent && rawIntent !== "null" ? rawIntent : "";

  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const plans = prices.data.map((price) => ({
    priceId: price.id,
    name: price.product.name,
    amount: price.unit_amount,
    interval: price.recurring?.interval,
  }));

  const currentPlan = plans.find((p) => p.priceId === selectedPriceId);

  return (
    <div className="max-w-6xl mx-auto py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* LEFT — STEP 1 */}
      <div className="space-y-6 opacity-100 md:col-span-1">
        <h2 className="text-xl font-semibold">1. Your Info</h2>
        <form action={submitUserInfo} className="space-y-4">
          <input type="hidden" name="intent" value={intentId} />
          <input className="border p-3 w-full rounded" type="email" name="email" placeholder="Work email" defaultValue={email} required />
          <input className="border p-3 w-full rounded" type="password" name="password" placeholder="Password" required />
          <input className="border p-3 w-full rounded" type="text" name="company" placeholder="Company name" defaultValue={company} required />
          <input className="border p-3 w-full rounded" type="text" name="job" placeholder="Primary job title" defaultValue={job} required />
          <button className="bg-black text-white p-3 rounded w-full">Save & Continue</button>
        </form>
      </div>

      {/* MIDDLE — STEP 2 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">2. Choose Your Plan</h2>
        {intentId ? (
          <form action={selectPlan} className="space-y-3">
            <input type="hidden" name="intent" value={intentId} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="company" value={company} />
            <input type="hidden" name="job" value={job} />
            {plans.map((plan) => (
              <button type="submit" key={plan.priceId} name="priceId" value={plan.priceId} className={`w-full border p-4 rounded text-left ${selectedPriceId === plan.priceId ? "border-black bg-gray-50" : "border-gray-300"}`}>
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-gray-600">${(plan.amount / 100).toFixed(2)} / {plan.interval}</div>
              </button>
            ))}
          </form>
        ) : (
          <div className="text-gray-500">Please complete Step 1 to select a plan.</div>
        )}
      </div>

      {/* RIGHT — STEP 3 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">3. Summary & Payment</h2>
        <div className="border rounded p-4 space-y-2">
          <div className="font-medium">Plan:</div>
          <div>{currentPlan ? (<>{currentPlan.name} – <b>${currentPlan.amount}/mo</b></>) : (<span className="text-gray-500">No plan selected</span>)}</div>
          <div className="pt-4 font-medium">Job Title:</div>
          <div>{job || <span className="text-gray-500">None yet</span>}</div>
          <div className="pt-4 font-medium">Total:</div>
          <div className="text-2xl font-semibold">${currentPlan?.amount ?? 0}/mo</div>
        </div>
        <ClientOnly>
          {currentPlan && email && company && job && <StripeForm priceId={currentPlan.priceId} email={email} />}
        </ClientOnly>
      </div>
    </div>
  );
}

/* -------------------- SERVER ACTIONS ----------------------- */

async function submitUserInfo(formData) {
  "use server";

  const email = formData.get("email");
  const company = formData.get("company");
  const job = formData.get("job");

  const supabase = await createClient();

  const { data: intent, error } = await supabase
    .from("signup_intents")
    .insert({
      email,
      company_name: company,
      primary_job_title: job,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!intent) throw new Error("Failed to create signup intent");

  redirect(`/signup?intent=${intent.id}`);
}

async function selectPlan(formData) {
  "use server";

  const intentId = formData.get("intent");
  if (!intentId || intentId === "null") throw new Error("Invalid signup intent. Restart signup.");
  const priceId = formData.get("priceId");

  const supabase = await createClient();
  const { error } = await supabase
    .from("signup_intents")
    .update({ stripe_price_id: priceId })
    .eq("id", intentId);

  if (error) throw new Error(error.message);

  redirect(`/signup?intent=${intentId}&priceId=${priceId}&step=summary`);
}

async function addJobTitle(formData) {
  "use server";

  const intentId = formData.get("intent");
  const jobTitle = formData.get("job");

  const supabase = await createClient();
  await supabase.rpc("append_job_title", {
    intent_id: intentId,
    job_title: jobTitle,
  });

  redirect(`/signup?intent=${intentId}`);
}
