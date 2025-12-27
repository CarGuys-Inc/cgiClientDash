export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import StripeForm from "./StripeForm";
import { stripe } from "@/lib/stripe/server";
import ClientOnly from "@/components/ClientOnly";

export default async function SignupPage({ searchParams }) {
  const params = await searchParams ?? {};

  // ---- URL Data State ----
  const intentId = params.intent && params.intent !== "null" ? params.intent : "";
  const accountType = params.type; 

  // New Fields (Just passing through URL, not saving to DB)
  const firstName = params.firstName ?? "";
  const lastName = params.lastName ?? "";

  // Step 1 Data
  const email = params.email ?? "";
  const company = params.company ?? "";
  const phone = params.phone ?? "";
  const address1 = params.address1 ?? "";
  const address2 = params.address2 ?? "";
  const city = params.city ?? "";
  const state = params.state ?? "";
  const zip = params.zip ?? "";

  // Step 2 Data
  const job = params.job ?? "";
  const incomeLow = params.incomeLow ?? "";
  const incomeHigh = params.incomeHigh ?? "";
  const incomeRate = params.incomeRate ?? "";

  // Step 3 Data
  const selectedPriceId = params.priceId ?? "";

  // ---- Logic: Determine Active & Completed Steps ----
  const isStep1Complete = !!intentId; 
  const isStep1Active = !isStep1Complete;
  
  const isStep2Complete = isStep1Complete && !!job;
  const isStep2Active = isStep1Complete && !isStep2Complete;
  
  const isStep3Complete = isStep2Complete && !!selectedPriceId;
  const isStep3Active = isStep2Complete && !isStep3Complete;
  
  const isStep4Active = isStep3Complete;

  // ---- Stripe Data ----
  const prices = await stripe.prices.list({ active: true, expand: ["data.product"] });
  const plans = prices.data.map((p) => ({
    priceId: p.id, name: p.product.name, amount: p.unit_amount, interval: p.recurring?.interval,
  }));
  const currentPlan = plans.find((p) => p.priceId === selectedPriceId);

  // ---- Job Titles ----
  let jobTitles = [];
  try { jobTitles = await sql`SELECT DISTINCT title FROM job_titles ORDER BY title ASC`; } 
  catch (error) { console.error("DB Error:", error); }

  // ---- Helper Variables & Components ----
  // IMPORTANT: Added firstName and lastName to this string so they persist in URLs
  const allParams = `intent=${intentId}&type=${accountType}&firstName=${firstName}&lastName=${lastName}&email=${email}&company=${company}&phone=${phone}&address1=${address1}&address2=${address2}&city=${city}&state=${state}&zip=${zip}&job=${job}&incomeLow=${incomeLow}&incomeHigh=${incomeHigh}&incomeRate=${incomeRate}`;

  const SectionHeader = ({ title, isLocked, isComplete, onEdit }) => (
    <div className={`flex justify-between items-center py-4 border-b border-gray-200 ${isLocked ? 'text-gray-300' : 'text-black'}`}>
      <h2 className="text-lg font-medium">{title}</h2>
      {isComplete && !isLocked && <Link href={onEdit} className="text-xs underline text-gray-500 hover:text-black">Edit</Link>}
      {isLocked && <LockIcon />}
    </div>
  );

  const NikeInput = ({ name, type = "text", placeholder, defaultValue, required = false, className="" }) => (
    <input
      name={name} type={type} required={required} defaultValue={defaultValue} placeholder={required ? `${placeholder}*` : placeholder}
      className={`border border-gray-300 rounded-lg px-3 py-3 w-full text-sm placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all ${className}`}
    />
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-10">
        
        <h1 className="text-2xl font-medium mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="space-y-1">

            {/* ----- STEP 1: IDENTITY & LOCATION ----- */}
            <div id="step-1">
              <SectionHeader 
                title={!accountType ? "1. Account Type" : (accountType === 'corporate' ? "1. Corporate Identity" : "1. Dealership / Location")} 
                isComplete={isStep1Complete}
                onEdit={`/signup?${allParams}`} 
              />
              
              {isStep1Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  
                  {/* --- STATE A: SELECTION MODE --- */}
                  {!accountType ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Please select your account structure:</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/signup?type=individual" scroll={false} className="group block p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-all text-center">
                                <div className="mb-2 text-gray-400 group-hover:text-black mx-auto w-fit"><StoreIcon size={28}/></div>
                                <h3 className="font-bold text-gray-900 text-sm">Single Location</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">Recruiting for a specific store/branch.</p>
                            </Link>
                            <Link href="/signup?type=corporate" scroll={false} className="group block p-4 border-2 border-gray-200 rounded-xl hover:border-black transition-all text-center">
                                <div className="mb-2 text-gray-400 group-hover:text-black mx-auto w-fit"><BuildingIcon size={28}/></div>
                                <h3 className="font-bold text-gray-900 text-sm">Corporate Account</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">Master account for an auto group.</p>
                            </Link>
                        </div>
                    </div>
                  ) : (
                    
                    /* --- STATE B: FORM MODE (COMPACT GRID) --- */
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                                {accountType === 'corporate' ? <BuildingIcon size={14}/> : <StoreIcon size={14}/>}
                                {accountType === 'corporate' ? "Corporate Account" : "Single Location Setup"}
                            </span>
                            <Link href="/signup" className="text-xs text-gray-500 hover:text-black underline">Change</Link>
                        </div>

                        <form action={actionSaveCompany} className="space-y-4">
                            <input type="hidden" name="intent" value={intentId} />
                            <input type="hidden" name="accountType" value={accountType} />
                            {Object.entries({ job, incomeLow, incomeHigh, incomeRate }).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v} />))}

                            <div className="grid grid-cols-12 gap-3">
                                
                                {/* New Fields: First/Last Name */}
                                <div className="col-span-6"><NikeInput name="firstName" placeholder="First Name" defaultValue={firstName} required /></div>
                                <div className="col-span-6"><NikeInput name="lastName" placeholder="Last Name" defaultValue={lastName} required /></div>

                                {/* Row 1: Login */}
                                <div className="col-span-6"><NikeInput name="email" type="email" placeholder="Work Email" defaultValue={email} required /></div>
                                <div className="col-span-6"><NikeInput name="password" type="password" placeholder="Password" required /></div>

                                <div className="col-span-12 my-2 border-t border-gray-100"></div>

                                {/* Row 2: Entity */}
                                <div className="col-span-6"><NikeInput name="company" placeholder={accountType === 'corporate' ? "Corporate Name" : "Store Name"} defaultValue={company} required /></div>
                                <div className="col-span-6"><NikeInput name="phone" placeholder="Phone" defaultValue={phone} required /></div>

                                {/* Row 3: Address */}
                                <div className="col-span-8"><NikeInput name="address1" placeholder="Street Address" defaultValue={address1} required /></div>
                                <div className="col-span-4"><NikeInput name="address2" placeholder="Suite/Unit" defaultValue={address2} /></div>

                                {/* Row 4: City/State/Zip */}
                                <div className="col-span-5"><NikeInput name="city" placeholder="City" defaultValue={city} required /></div>
                                <div className="col-span-3"><NikeInput name="state" placeholder="State" defaultValue={state} required /></div>
                                <div className="col-span-4"><NikeInput name="zip" placeholder="ZIP" defaultValue={zip} required /></div>
                            </div>

                            {accountType !== 'corporate' && (
                                <div className="flex gap-2 items-start px-1">
                                    <input type="checkbox" id="loc-confirm" name="locationConfirmed" required className="mt-1 h-3 w-3 rounded border-gray-300 text-black focus:ring-black" />
                                    <label htmlFor="loc-confirm" className="text-xs text-gray-500 leading-tight">
                                        I confirm <strong>{address1 || "this"}</strong> is the physical work location, not a corporate HQ.
                                    </label>
                                </div>
                            )}

                            <div className="pt-2">
                                <button className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full text-sm font-bold transition-colors shadow-md">
                                    {accountType === 'corporate' ? "Create Account" : "Confirm Location"}
                                </button>
                            </div>
                        </form>
                    </div>
                  )}
                </div>
              )}

              {/* COMPLETED SUMMARY */}
              {isStep1Complete && (
                <div className="py-3 text-gray-500 text-xs grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-bold text-black text-sm">{company}</p>
                        <p>{firstName} {lastName}</p>
                        <p>{email}</p>
                    </div>
                    <div className="text-right">
                        <p>{address1}, {city}</p>
                        <p>{state} {zip}</p>
                    </div>
                </div>
              )}
            </div>

            {/* ----- STEP 2: JOB INFO ----- */}
            <div id="step-2">
              <SectionHeader 
                title={accountType === 'corporate' ? "2. First Job Listing" : "2. Job Details"} 
                isLocked={!isStep1Complete}
                isComplete={isStep2Complete}
                onEdit={`/signup?${allParams}`}
              />

              {isStep2Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                   <form action={actionSaveJob} className="space-y-3">
                        <input type="hidden" name="intent" value={intentId} />
                        <input type="hidden" name="accountType" value={accountType} />
                        
                        {/* KEY PART: Passing Name to next step */}
                        {Object.entries({ firstName, lastName, email, company, phone, address1, address2, city, state, zip }).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v} />))}

                        <div className="relative">
                            <select name="job" required defaultValue={job} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none">
                                <option value="" disabled>Select Job Title*</option>
                                {jobTitles.map((jt) => <option key={jt.title} value={jt.title}>{jt.title}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <NikeInput name="incomeLow" type="number" placeholder="Min Income" defaultValue={incomeLow} required />
                            <NikeInput name="incomeHigh" type="number" placeholder="Max Income" defaultValue={incomeHigh} required />
                        </div>
                        
                        <div className="relative">
                             <select name="incomeRate" required defaultValue={incomeRate} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none">
                                <option value="" disabled>Rate Type*</option>
                                <option value="hourly">Hourly</option>
                                <option value="salary">Salary</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                        </div>

                        <div className="pt-2">
                            <button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 py-3 rounded-full text-sm font-bold transition-colors">
                                Save & Continue
                            </button>
                        </div>
                   </form>
                </div>
              )}
              {isStep2Complete && (
                <div className="py-3 text-gray-500 text-xs flex justify-between">
                    <span className="font-bold text-black">{job}</span>
                    <span>${Number(incomeLow).toLocaleString()} - {Number(incomeHigh).toLocaleString()} ({incomeRate})</span>
                </div>
              )}
            </div>

            {/* ----- STEP 3: PLAN ----- */}
            <div id="step-3">
              <SectionHeader title="3. Select Plan" isLocked={!isStep2Complete} isComplete={isStep3Complete} onEdit={`/signup?${allParams}`} />
              {isStep3Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <form action={actionSelectPlan} className="space-y-3">
                        {/* KEY PART: Passing Name to next step */}
                        {Object.entries({ intent: intentId, type: accountType, firstName, lastName, email, company, phone, job, incomeLow, incomeHigh, incomeRate, address1, address2, city, state, zip }).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v} />))}
                        <div className="grid grid-cols-1 gap-3">
                            {plans.map((plan) => (
                                <label key={plan.priceId} className="cursor-pointer group block">
                                    <input type="submit" name="priceId" value={plan.priceId} className="hidden" />
                                    <div className="border border-gray-300 rounded-lg p-4 hover:border-black transition-all flex justify-between items-center bg-white">
                                        <div>
                                            <div className="font-bold text-sm">{plan.name}</div>
                                            <div className="text-gray-500 text-xs">Auto-renews monthly</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-sm">${(plan.amount / 100).toFixed(0)}</div>
                                            <div className="text-gray-500 text-[10px] uppercase">/ {plan.interval}</div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </form>
                </div>
              )}
              {isStep3Complete && currentPlan && <div className="py-3 text-gray-500 text-xs"><span className="font-bold text-black">{currentPlan.name}</span> — ${(currentPlan.amount / 100).toFixed(2)}/{currentPlan.interval}</div>}
            </div>

            {/* ----- STEP 4: PAYMENT ----- */}
            <div id="step-4">
              <SectionHeader title="4. Payment Info" isLocked={!isStep3Complete} />
              {isStep4Active && (
                 <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <ClientOnly>
                        <StripeForm
                            priceId={currentPlan.priceId}
                            // Pass name into StripeForm
                            firstName={firstName}
                            lastName={lastName}
                            email={email}
                            companyName={company}
                            companyPhone={phone}
                            companyAddress={`${address1} ${address2}`.trim()}
                            companyCity={city}
                            companyState={state}
                            companyZip={zip}
                            jobName={job}
                            incomeMin={incomeLow}
                            incomeMax={incomeHigh}
                            incomeRate={incomeRate}
                            subscriptionName={currentPlan.name}
                        />
                    </ClientOnly>
                 </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Summary) */}
          <div className="hidden lg:block sticky top-8 h-fit">
             <h2 className="text-lg font-medium mb-4">Order Summary</h2>
             {currentPlan ? (
                 <div className="flex gap-3 mb-4 animate-in fade-in">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border border-gray-200"><BagIcon /></div>
                    <div>
                        <p className="font-bold text-sm">{currentPlan.name}</p>
                        <p className="text-gray-500 text-xs">{accountType === 'corporate' ? "Corporate" : "Single Site"}</p>
                        <p className="text-gray-500 text-xs">Qty 1</p>
                    </div>
                 </div>
             ) : (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs">Select plan to see summary.</div>
             )}
             <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{currentPlan ? `$${(currentPlan.amount / 100).toFixed(2)}` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>$0.00</span></div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base mt-1"><span>Total</span><span>{currentPlan ? `$${(currentPlan.amount / 100).toFixed(2)}` : '—'}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SERVER ACTIONS ================= */

async function actionSaveCompany(formData) {
  "use server";
  const sql = require("@/lib/db").default;
  const data = Object.fromEntries(formData.entries());
  let intentId = data.intent;

  try {
    if (intentId) {
        // --- UPDATE EXISTING (NO NAME SAVED HERE) ---
        await sql`
            UPDATE signup_intents SET 
            email=${data.email}, 
            company_name=${data.company}, 
            phone=${String(data.phone)}, 
            address_1=${data.address1}, 
            address_2=${data.address2}, 
            city=${data.city}, 
            state=${data.state}, 
            zip=${String(data.zip)}
            WHERE id=${intentId}
        `;
    } else {
        // --- INSERT NEW (NO NAME SAVED HERE) ---
        try {
            const result = await sql`
                INSERT INTO signup_intents (
                    email, company_name, phone, 
                    address_1, address_2, city, state, zip, 
                    status
                ) VALUES (
                    ${data.email}, ${data.company}, ${String(data.phone)}, 
                    ${data.address1}, ${data.address2}, ${data.city}, ${data.state}, ${String(data.zip)}, 
                    'pending'
                ) 
                RETURNING id
            `;
            const row = Array.isArray(result) ? result[0] : result.rows?.[0];
            if (row) intentId = row.id;
        } catch (insertError) {
            // --- HANDLE DUPLICATE EMAIL ---
            const existingUser = await sql`SELECT id FROM signup_intents WHERE email = ${data.email} LIMIT 1`;
            const row = Array.isArray(existingUser) ? existingUser[0] : existingUser.rows?.[0];

            if (row) {
                intentId = row.id;
                await sql`
                    UPDATE signup_intents SET 
                    company_name=${data.company}, phone=${String(data.phone)},
                    address_1=${data.address1}, address_2=${data.address2}, 
                    city=${data.city}, state=${data.state}, zip=${String(data.zip)}
                    WHERE id=${intentId}
                `;
            } else {
                throw insertError; 
            }
        }
    }
    
    if (!intentId) throw new Error("Could not retrieve Account ID");

  } catch (err) {
    throw new Error("Database failed: " + err.message);
  }

  // --- REDIRECT (PASS NAME HERE INSTEAD) ---
  const params = new URLSearchParams({ 
      intent: intentId, 
      type: data.accountType || 'individual',
      firstName: data.firstName, // Carried in URL
      lastName: data.lastName,   // Carried in URL
      email: data.email,
      company: data.company,
      phone: data.phone,
      address1: data.address1,
      address2: data.address2,
      city: data.city,
      state: data.state,
      zip: data.zip
  });

  redirect(`/signup?${params.toString()}`);
}

async function actionSaveJob(formData) {
    "use server";
    const sql = require("@/lib/db").default;
    const data = Object.fromEntries(formData.entries());
    
    try {
        await sql`UPDATE signup_intents SET primary_job_title = ${data.job}, income_low = ${Number(data.incomeLow)}, income_high = ${Number(data.incomeHigh)}, income_rate = ${data.incomeRate} WHERE id = ${data.intent}`;
    } catch (err) { throw new Error(err.message); }

    // Pass names forward again
    const params = new URLSearchParams({ type: data.accountType, ...data }); 
    redirect(`/signup?${params.toString()}`);
}

async function actionSelectPlan(formData) {
    "use server";
    const sql = require("@/lib/db").default;
    const data = Object.fromEntries(formData.entries());

    try {
        await sql`UPDATE signup_intents SET stripe_price_id = ${data.priceId} WHERE id = ${data.intent}`;
    } catch (err) { throw new Error(err.message); }

    // Pass names forward again
    const params = new URLSearchParams({ type: data.type, ...data });
    redirect(`/signup?${params.toString()}`);
}

// --- Icons ---
function LockIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> }
function ChevronDown({ className }) { return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> }
function BagIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> }
function StoreIcon({ size=24 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18V3H3zM9 14v7M15 14v7M9 9h6"/></svg> }
function BuildingIcon({ size=24 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> }