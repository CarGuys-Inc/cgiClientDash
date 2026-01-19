export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import StripeForm from "../signup/StripeForm"; 
import { stripe } from "@/lib/stripe/server";
import ClientOnly from "@/components/ClientOnly";
import RealTimeToast from "@/components/RealTimeToast"; 

// =========================================================================
// 🟢 PAGE CONFIGURATION
// =========================================================================
const BASE_PATH = "/add-job-checkout"; 
const LOGO_URL = "https://static.wixstatic.com/media/ab8453_a440e78742794377aa1d88a94c1e589b~mv2.webp/v1/fill/w_350,h_94,al_c,lg_1,q_80,enc_avif,quality_auto/Untitled%20design%20(25)%20(1).webp";

const UPSELL_PRICE_ID = "price_YOUR_UPSELL_ID_HERE"; 
const UPSELL_AMOUNT_CENTS = 59900; 
// =========================================================================

/* --- HELPER: ORDER BUMP --- */
const OrderBump = ({ isChecked, allParams }) => (
  <form action={async () => {
      "use server";
      const params = new URLSearchParams(allParams);
      isChecked ? params.delete("upsell") : params.set("upsell", "true");
      redirect(`${BASE_PATH}?${params.toString()}`);
  }}>
    <label className={`relative block border-2 rounded-xl p-3 cursor-pointer transition-all group ${isChecked ? 'border-black bg-yellow-50' : 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-400'}`}>
        <div className="flex items-start gap-3">
            <div className="pt-1">
                <input type="checkbox" checked={isChecked} readOnly className="w-5 h-5 accent-black cursor-pointer" />
                <button type="submit" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"></button>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm">Add a 2nd Active Job Slot</span>
                    <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SAVE 45%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                    Hire for three roles simultaneously for an additional <span className="font-bold text-black">$599 / Mo</span>.
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Billed monthly ($599)</p>
            </div>
        </div>
    </label>
  </form>
);

export default async function JobCheckoutPage({ searchParams }) {
  const params = await searchParams ?? {};
  const getSafeParam = (val) => (Array.isArray(val) ? val[0] : val && val !== "null" ? val : "");

  const intentId = getSafeParam(params.intent);
  const accountType = getSafeParam(params.type) || "individual"; 
  const editStep = getSafeParam(params.edit);
  const email = getSafeParam(params.email);
  const job = getSafeParam(params.job);
  const zip = getSafeParam(params.zip);
  const incomeLow = getSafeParam(params.incomeLow);
  const incomeHigh = getSafeParam(params.incomeHigh);
  const incomeRate = getSafeParam(params.incomeRate) || "hourly";
  const selectedPriceId = getSafeParam(params.priceId);
  const hasUpsell = getSafeParam(params.upsell) === "true";

  // ---- Fetch Job Description ----
  let jobDescription = "";
  if (job) {
    try {
        const result = await sql`SELECT description FROM job_titles WHERE title = ${job} LIMIT 1`;
        jobDescription = result[0]?.description || "Optimized listing template will be applied.";
    } catch (e) { console.error("DB Error:", e); }
  }

  // ---- Step Logic ----
  const isStep1Complete = !!job && !!incomeLow && !!email && !!zip;
  const isStep1Active = !isStep1Complete || editStep === "1";
  
  // Step 2 is active if Step 1 is done AND (Step 2 isn't done OR the user clicked Edit on Step 2)
  const isStep2Complete = isStep1Complete && !!selectedPriceId;
  const isStep2Active = isStep1Complete && (editStep === "2" || !selectedPriceId);
  
  const isStep3Complete = !!intentId; 
  const isStep3Active = isStep2Complete && (editStep === "3" || !isStep3Complete);
  const isStep4Active = isStep3Complete && !editStep;

  // ---- Stripe Data ----
  const stripeResponse = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
  
  // 💡 Ensure your Stripe Prices have metadata cgi_job_upsell_plan = true
  const plans = stripeResponse.data
    .filter((p) => p.metadata?.['cgi_job_upsell_plan'] === 'true')
    .map((p) => {
        let displayInterval = p.recurring?.interval || 'mo';
        if (p.recurring?.interval_count > 1) displayInterval = `${p.recurring.interval_count} ${p.recurring.interval}s`;
        return { priceId: p.id, name: p.product.name, amount: p.unit_amount, interval: displayInterval };
    });
  
  const currentPlan = plans.find((p) => p.priceId === selectedPriceId);

  let jobTitles = [];
  try { jobTitles = await sql`SELECT DISTINCT title FROM job_titles ORDER BY title ASC`; } catch (e) {}

  const allParamsObj = { ...params, intent: intentId, type: accountType, upsell: hasUpsell ? "true" : "" };
  const currentQueryString = new URLSearchParams(Object.entries(allParamsObj).filter(([_, v]) => v != null && v !== "")).toString();

  const SectionHeader = ({ title, isLocked, isComplete, onEdit }) => (
      <div className={`flex justify-between items-center py-4 border-b border-gray-200 ${isLocked ? 'text-gray-300' : 'text-black'}`}>
        <h2 className="text-lg font-medium">{title}</h2>
        {isComplete && !isLocked && <Link href={onEdit} className="text-xs underline text-gray-500 hover:text-black">Edit</Link>}
        {isLocked && <LockIcon />}
      </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <RealTimeToast jobTitle={job} />

      {/* HEADER */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/">{LOGO_URL ? <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" /> : <b>JobBoard</b>}</Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium"><LockIcon /> Secure Checkout</div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium mb-6">Job Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-1">
            {/* STEP 1 */}
            <SectionHeader title="1. Job & Location" isComplete={isStep1Complete} onEdit={`${BASE_PATH}?${currentQueryString}&edit=1`} isLocked={false} />
            {isStep1Active && (
                <form action={actionStageJob} className="py-4 space-y-5 animate-in fade-in slide-in-from-top-1">
                    <input type="hidden" name="basePath" value={BASE_PATH} />
                    {Object.entries(allParamsObj).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
                    <input name="email" type="email" placeholder="Email Address*" defaultValue={email} required className="border p-3 w-full rounded-lg outline-none focus:border-black" />
                    <select name="job" required defaultValue={job} className="border p-3 w-full rounded-lg bg-white">
                        <option value="" disabled>Select Job Title*</option>
                        {jobTitles.map((jt) => <option key={jt.title} value={jt.title}>{jt.title}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <input name="city" placeholder="City*" defaultValue={getSafeParam(params.city)} required className="border p-3 rounded-lg" />
                        <input name="zip" placeholder="Zip Code*" defaultValue={zip} required className="border p-3 rounded-lg" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border space-y-2 text-xs uppercase font-bold text-gray-500">
                        Compensation Range
                        <div className="grid grid-cols-3 gap-3 mt-1">
                            <input name="incomeLow" type="number" placeholder="Min" defaultValue={incomeLow} required className="border p-3 rounded-lg bg-white" />
                            <input name="incomeHigh" type="number" placeholder="Max" defaultValue={incomeHigh} required className="border p-3 rounded-lg bg-white" />
                            <select name="incomeRate" defaultValue={incomeRate} className="border p-3 rounded-lg bg-white">
                                <option value="hourly">/hr</option>
                                <option value="salary">/yr</option>
                            </select>
                        </div>
                    </div>
                    <button className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all">Next Step</button>
                </form>
            )}

            {/* STEP 2 */}
            <SectionHeader title="2. Select Plan" isLocked={!isStep1Complete} isComplete={isStep2Complete} onEdit={`${BASE_PATH}?${currentQueryString}&edit=2`} />
            {isStep2Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-1">
                    {plans.length > 0 ? (
                        <form action={actionStagePlan} className="grid gap-3">
                            <input type="hidden" name="basePath" value={BASE_PATH} />
                            {Object.entries(allParamsObj).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
                            {plans.map((plan) => (
                                <button key={plan.priceId} name="priceId" value={plan.priceId} className={`w-full border-2 p-5 rounded-xl flex justify-between items-center transition-all text-left ${selectedPriceId === plan.priceId ? 'border-black bg-gray-50' : 'hover:border-gray-400 bg-white'}`}>
                                    <div>
                                        <div className="font-bold text-base">{plan.name}</div>
                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">1 Active Slot</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-xl">${(plan.amount / 100).toFixed(0)}</div>
                                        <div className="text-gray-400 text-[10px] uppercase font-bold">/ {plan.interval}</div>
                                    </div>
                                </button>
                            ))}
                        </form>
                    ) : (
                        <div className="p-8 border-2 border-dashed rounded-xl text-center">
                            <p className="text-gray-500 text-sm">No plans found. Please check your Stripe price metadata.</p>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3 */}
            <SectionHeader title="3. Final Details" isLocked={!isStep2Complete} isComplete={isStep3Complete} onEdit={`${BASE_PATH}?${currentQueryString}&edit=3`} />
            {isStep3Active && (
                <form action={actionSaveFullProfile} className="py-4 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <input type="hidden" name="basePath" value={BASE_PATH} />
                    {Object.entries(allParamsObj).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
                    <div className="grid grid-cols-2 gap-3">
                        <input name="firstName" placeholder="First Name" required className="border p-3 rounded-lg" />
                        <input name="lastName" placeholder="Last Name" required className="border p-3 rounded-lg" />
                    </div>
                    <input name="company" placeholder="Company Name" required className="border p-3 w-full rounded-lg" />
                    <input name="phone" placeholder="Phone Number" required className="border p-3 w-full rounded-lg" />
                    <button className="w-full bg-black text-white py-4 rounded-full font-bold">Go To Payment</button>
                </form>
            )}

            {/* STEP 4 */}
            <SectionHeader title="4. Payment" isLocked={!isStep3Complete} />
            {isStep4Active && (
                 <div className="py-4 animate-in fade-in">
                    <ClientOnly>
                        <StripeForm 
                            {...allParamsObj} 
                            companyName={getSafeParam(params.company)} 
                            jobName={job} 
                            subscriptionName={currentPlan?.name} 
                            upsellPriceId={UPSELL_PRICE_ID} 
                        />
                    </ClientOnly>
                 </div>
            )}
          </div>

          {/* SIDEBAR SUMMARY */}
          <div className="border border-gray-200 rounded-xl p-6 h-fit bg-white sticky top-24 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Job Title</span>
                    <span className="font-medium">{job || "---"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium">{currentPlan?.name || "---"}</span>
                </div>
                {hasUpsell && (
                    <div className="flex justify-between text-green-700 font-medium">
                        <span>+ Bonus Slot</span>
                        <span>$599.00</span>
                    </div>
                )}
              </div>
              <div className="flex justify-between font-bold border-t pt-4 text-lg">
                  <span>Total</span>
                  <span>${(( (currentPlan?.amount || 0) + (hasUpsell ? UPSELL_AMOUNT_CENTS : 0) ) / 100).toFixed(2)}</span>
              </div>
              <div className="mt-6 border-t pt-6">
                <OrderBump isChecked={hasUpsell} allParams={currentQueryString} />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SERVER ACTIONS ================= */

async function actionStageJob(formData) {
    "use server";
    const data = Object.fromEntries(formData.entries());
    const path = data.basePath; delete data.basePath;
    redirect(`${path}?${new URLSearchParams(data).toString()}`);
}

async function actionStagePlan(formData) {
    "use server";
    const data = Object.fromEntries(formData.entries());
    const path = data.basePath; delete data.basePath;
    // When a plan is selected, we automatically advance to the next step
    redirect(`${path}?${new URLSearchParams(data).toString()}`);
}

async function actionSaveFullProfile(formData) {
  "use server";
  const data = Object.fromEntries(formData.entries());
  const path = data.basePath; delete data.basePath;
  const sql = require("@/lib/db").default;

  let intentId = data.intent ? String(data.intent).split(',')[0].trim() : "";

  try {
    if (intentId && intentId !== "null") {
        await sql`UPDATE signup_intents SET email=${data.email}, company_name=${data.company}, primary_job_title=${data.job}, stripe_price_id=${data.priceId} WHERE id=${intentId}`;
    } else {
        const result = await sql`INSERT INTO signup_intents (email, company_name, primary_job_title, stripe_price_id, status) VALUES (${data.email}, ${data.company}, ${data.job}, ${data.priceId}, 'pending') RETURNING id`;
        intentId = result[0].id;
    }
  } catch (err) { 
    console.error("Redirecting due to DB/Stripe mismatch:", err);
    redirect(`${path}?error=stale_session`);
  }

  const params = new URLSearchParams(data);
  params.set("intent", intentId);
  delete params.edit; delete params.basePath;
  redirect(`${path}?${params.toString()}`);
}

function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> }