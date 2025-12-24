export const dynamic = "force-dynamic";

import sql from "@/lib/db"; // Uses your direct SQL helper
import { redirect } from "next/navigation";
import StripeForm from "./StripeForm";
import { stripe } from "@/lib/stripe/server";
import ClientOnly from "@/components/ClientOnly";

export default async function SignupPage({ searchParams }) {
  const params = await searchParams ?? {};

  // ---- URL state ----
  const email = params.email ?? "";
  const company = params.company ?? "";
  const job = params.job ?? "";
  const phone = params.phone ?? "";
  const address1 = params.address1 ?? "";
  const address2 = params.address2 ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";
  const zip = params.zip ?? "";
  const selectedPriceId = params.priceId ?? "";
  const incomeLow = params.incomeLow ?? "";
  const incomeHigh = params.incomeHigh ?? "";
  const incomeRate = params.incomeRate ?? "";

  const intentId =
    params.intent && params.intent !== "null" ? params.intent : "";

  // ---- Stripe plans ----
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

  const currentPlan = plans.find(
    (p) => p.priceId === selectedPriceId
  );

  // ---- Fetch Job Titles (SQL) ----
  let jobTitles = [];
  try {
    // Added DISTINCT to prevent duplicate keys for "Other"
    jobTitles = await sql`
      SELECT DISTINCT title 
      FROM job_titles 
      ORDER BY title ASC
    `;
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw new Error(`Database Error: ${error.message}`);
  }

  return (
    <div className="max-w-6xl mx-auto py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* ================= STEP 1 ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">1. Your Info</h2>

        <form action={submitUserInfo} className="space-y-4">
          <span className="text-sm text-gray-500">
            Please provide your company and contact details.
          </span>
          <input type="hidden" name="intent" value={intentId} />

          <input className="border p-3 w-full rounded" name="email" type="email" placeholder="Your company email" defaultValue={email} required />
          <input className="border p-3 w-full rounded" name="password" type="password" placeholder="Create a password" required />
          <input className="border p-3 w-full rounded" name="company" placeholder="Company name - You are recruiting for" defaultValue={company} required />

          <input className="border p-3 w-full rounded" name="phone" placeholder="Your company phone number" defaultValue={phone} required />

          <input className="border p-3 w-full rounded" name="address1" placeholder="Company street address" defaultValue={address1} required />
          <input className="border p-3 w-full rounded" name="address2" placeholder="Address line 2" defaultValue={address2} />

          <div className="grid grid-cols-2 gap-2">
            <input className="border p-3 rounded" name="city" placeholder="City" defaultValue={city} required />
            <input className="border p-3 rounded" name="state" placeholder="State" defaultValue={state} required />
          </div>

          <input className="border p-3 w-full rounded" name="zip" placeholder="ZIP code" defaultValue={zip} required />

          <p className="text-sm text-gray-500 pt-4">Please provide info about the job you are recruiting for.</p>
          <select
            name="job"
            required
            defaultValue={job}
            className="border p-3 w-full rounded bg-white"
          >
            <option value="" disabled>
              Select job title you are recruiting for
            </option>

            {jobTitles.map((jt) => (
              <option key={jt.title} value={jt.title}>
                {jt.title}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              className="border p-3 rounded"
              name="incomeLow"
              type="number"
              placeholder="Minimum Income ($)"
              defaultValue={incomeLow}
              required
            />
            <input
              className="border p-3 rounded"
              name="incomeHigh"
              type="number"
              placeholder="Maximum Income ($)"
              defaultValue={incomeHigh}
              required
            />
          </div>
          <select
            name="incomeRate"
            required
            defaultValue={incomeRate}
            className="border p-3 w-full rounded bg-white"
          >
            <option value="" disabled>
              Income Rate
            </option>

            <option key="hourly" value="hourly">
              Hourly
            </option>
            <option key="salary" value="salary">
              Salary
            </option>

          </select>
          <button className="bg-black text-white p-3 rounded w-full">
            Save & Continue
          </button>
        </form>
      </div>

      {/* ================= STEP 2 ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">2. Choose Your Plan</h2>

        {intentId ? (
          <form action={selectPlan} className="space-y-3">
            {Object.entries({
              intent: intentId,
              email,
              company,
              job,
              incomeLow,
              incomeHigh,
              incomeRate,
              phone,
              address1,
              address2,
              city,
              state,
              zip,
            }).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}

            {plans.map((plan) => (
              <button
                key={plan.priceId}
                type="submit"
                name="priceId"
                value={plan.priceId}
                className={`w-full border p-4 rounded text-left ${selectedPriceId === plan.priceId
                    ? "border-black bg-gray-50"
                    : "border-gray-300"
                  }`}
              >
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-gray-600">
                  ${(plan.amount / 100).toFixed(2)} / {plan.interval}
                </div>
              </button>
            ))}
          </form>
        ) : (
          <div className="text-gray-500">
            Complete Step 1 to select a plan.
          </div>
        )}
      </div>

      {/* ================= STEP 3 ================= */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">3. Summary & Payment</h2>

        <div className="border rounded p-4 space-y-2">
          <div className="font-medium">Plan:</div>
          <div>
            {currentPlan ? (
              <>
                {currentPlan.name} –{" "}
                <b>${(currentPlan.amount / 100).toFixed(2)}/mo</b>
              </>
            ) : (
              <span className="text-gray-500">No plan selected</span>
            )}
          </div>
        </div>

        <ClientOnly>
          {currentPlan && email && company && job && (
            <StripeForm
              priceId={currentPlan.priceId}
              email={email}
            />
          )}
        </ClientOnly>
      </div>
    </div>
  );
}

/* ================= SERVER ACTIONS ================= */

async function submitUserInfo(formData) {
  "use server";

  const sql = require("@/lib/db").default;
  const data = Object.fromEntries(formData.entries());
  
  let intentId;

  try {
    const [intent] = await sql`
      INSERT INTO signup_intents (
        email, company_name, primary_job_title, phone, 
        income_low, income_high, income_rate, 
        address_1, address_2, city, state, zip, status
      ) VALUES (
        ${data.email}, ${data.company}, ${data.job}, ${data.phone},
        ${Number(data.incomeLow)}, ${Number(data.incomeHigh)}, ${data.incomeRate},
        ${data.address1}, ${data.address2}, ${data.city}, ${data.state}, ${data.zip}, 'pending'
      )
      RETURNING id
    `;
    
    intentId = intent.id;

  } catch (error) {
    throw new Error(error.message);
  }

  // Redirect MUST be outside try/catch
  const params = new URLSearchParams({
    intent: intentId,
    email: data.email,
    company: data.company,
    job: data.job,
    incomeLow: data.incomeLow,
    incomeHigh: data.incomeHigh,
    incomeRate: data.incomeRate,
    phone: data.phone,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    state: data.state,
    zip: data.zip,
  });

  redirect(`/signup?${params.toString()}`);
}

async function selectPlan(formData) {
  "use server";

  const sql = require("@/lib/db").default;
  const intentId = formData.get("intent");
  const priceId = formData.get("priceId");

  if (!intentId || !priceId) {
    throw new Error("Invalid signup intent");
  }

  try {
    await sql`
      UPDATE signup_intents 
      SET stripe_price_id = ${priceId}
      WHERE id = ${intentId}
    `;
  } catch (error) {
    throw new Error(error.message);
  }

  // Redirect MUST be outside try/catch
  const params = new URLSearchParams({
    intent: intentId,
    priceId,
    email: formData.get("email"),
    company: formData.get("company"),
    job: formData.get("job"),
    incomeLow: formData.get("incomeLow"),
    incomeHigh: formData.get("incomeHigh"),
    incomeRate: formData.get("incomeRate"),
    phone: formData.get("phone"),
    address1: formData.get("address1"),
    address2: formData.get("address2"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
  });

  redirect(`/signup?${params.toString()}`);
}