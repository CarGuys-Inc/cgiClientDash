export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import StripeForm from "./StripeForm";
import { stripe } from "@/lib/stripe/server";
import ClientOnly from "@/components/ClientOnly";
import RealTimeToast from "@/components/RealTimeToast"; 

/* --- HELPER COMPONENT: ORDER BUMP (SIDEBAR) --- */
const OrderBump = ({ isChecked, allParams }) => (
  <form action={async () => {
      "use server";
      const params = new URLSearchParams(allParams);
      if (isChecked) {
          params.delete("upsell");
      } else {
          params.set("upsell", "true");
      }
      redirect(`/signup?${params.toString()}`);
  }}>
    <label className={`relative block border-2 rounded-xl p-3 cursor-pointer transition-all group ${isChecked ? 'border-black bg-yellow-50' : 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-400'}`}>
        <div className="flex items-start gap-3">
            <div className="pt-1">
                <input 
                    type="checkbox" 
                    checked={isChecked} 
                    readOnly 
                    className="w-5 h-5 accent-black cursor-pointer" 
                />
                <button type="submit" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"></button>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm">Add a 2nd Job To Your Account</span>
                    <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">SAVE 40%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-snug">
                    Hire for another role for ONLY <span className="font-bold text-black">$599 / Mo</span> 30-day listing.
                </p>
            </div>
        </div>
    </label>
  </form>
);

export default async function SignupPage({ searchParams }) {
  const params = await searchParams ?? {};

  // =========================================================================
  // 🟢 LOGO CONFIGURATION
  // =========================================================================
  const LOGO_URL = "https://static.wixstatic.com/media/ab8453_a440e78742794377aa1d88a94c1e589b~mv2.webp/v1/fill/w_350,h_94,al_c,lg_1,q_80,enc_avif,quality_auto/Untitled%20design%20(25)%20(1).webp";
  // =========================================================================

  const getSafeParam = (val) => {
    if (Array.isArray(val)) return val[0]; 
    return val && val !== "null" ? val : "";
  };

  // ---- URL Data State ----
  const intentId = getSafeParam(params.intent);
  const accountType = getSafeParam(params.type) || "individual"; 
  const editStep = getSafeParam(params.edit);

  // Personal
  const firstName = getSafeParam(params.firstName);
  const lastName = getSafeParam(params.lastName);
  // 🟢 NEW PARAM: User's Title
  const userTitle = getSafeParam(params.userTitle);

  // Account
  const email = getSafeParam(params.email);
  const company = getSafeParam(params.company);
  const phone = getSafeParam(params.phone);
  const contactPhone =
    getSafeParam(params.contactPhone) ||
    getSafeParam(params.contact_phone) ||
    "";
  // Location
  const address1 = getSafeParam(params.address1);
  const address2 = getSafeParam(params.address2);
  const city = getSafeParam(params.city);
  const state = getSafeParam(params.state);
  const zip = getSafeParam(params.zip);

  // Job 1
  const job = getSafeParam(params.job);
  const incomeLow = getSafeParam(params.incomeLow);
  const incomeHigh = getSafeParam(params.incomeHigh);
  const incomeRate = getSafeParam(params.incomeRate);

  // UPSELL STATE (Job 2)
  const hasUpsell = getSafeParam(params.upsell) === "true";
  const job2 = getSafeParam(params.job2);
  const incomeLow2 = getSafeParam(params.incomeLow2);
  const incomeHigh2 = getSafeParam(params.incomeHigh2);
  const incomeRate2 = getSafeParam(params.incomeRate2);

  // Plan
  const selectedPriceId = getSafeParam(params.priceId);

  // ---- Logic: Determine Active & Completed Steps ----
  const isStep1Complete = !!job && !!incomeLow && !!email && !!zip;
  const isStep1Active = !isStep1Complete || editStep === "1";

  const isUpsellFormComplete = !hasUpsell || (!!job2 && !!incomeLow2);
  const isUpsellActive = (isStep1Complete && hasUpsell && !isUpsellFormComplete) || (hasUpsell && editStep === "1b");

  const isStep2Complete = isStep1Complete && isUpsellFormComplete && !!selectedPriceId;
  const isStep2Active = (isStep1Complete && isUpsellFormComplete && !isStep2Complete) || editStep === "2";

  const isStep3Complete = !!intentId; 
  const isStep3Active = (isStep2Complete && !isStep3Complete) || editStep === "3";

  const isStep4Active = isStep3Complete && editStep !== "3";

  // ---- Stripe Data (UPDATED WITH FILTER) ----
  // 1. Fetch up to 100 prices to ensure we get them all
  const prices = await stripe.prices.list({ 
      active: true, 
      limit: 100,
      expand: ["data.product"] 
  });

  console.log("Fetched Prices:", prices.data);

  // 2. Filter using the same logic as your route.ts
  const filteredPrices = prices.data.filter((p) => {
      return p.metadata['created_in_admin_panel'] === 'true';
  });

  // 3. Map the filtered prices to plans
  const plans = filteredPrices.map((p) => ({
    priceId: p.id, 
    productId: p.product.id,
    name: p.product.name, 
    amount: p.unit_amount, 
    interval: p.recurring?.interval,
    
  }));
  
  const currentPlan = plans.find((p) => p.priceId === selectedPriceId);

  // ---- Job Titles ----
  let jobTitles = [];
  try { jobTitles = await sql`SELECT DISTINCT title FROM job_titles ORDER BY title ASC`; } 
  catch (error) { console.error("DB Error:", error); }


    const UTM_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'utm_id'
    ];
    const utmParams = Object.fromEntries(
        UTM_KEYS
            .map((key) => [key, getSafeParam(params[key])])
            .filter(([_, value]) => value)
        );

    const {
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        utm_id
    } = utmParams;

    const trackingParams = {
        firstName,
        lastName,
        email,
        contactPhone,
        ...utmParams
    };

    const allParamsObj = {
    intent: intentId,
    type: accountType,
    firstName,
    lastName,
    userTitle,
    email,
    company,
    phone,
    contactPhone,

    address1,
    address2,
    city,
    state,
    zip,

    job,
    incomeLow,
    incomeHigh,
    incomeRate,

    priceId: selectedPriceId,
    upsell: hasUpsell ? "true" : "",
    job2,
    incomeLow2,
    incomeHigh2,
    incomeRate2,

    // ✅ ADD THIS
    ...utmParams
    };

    const finalFormParams = {
    ...allParamsObj,
    };
    
    const currentQueryString = new URLSearchParams(
        Object.entries(allParamsObj).filter(([_, v]) => v != null && v !== "")
    ).toString();

    const SectionHeader = ({ title, isLocked, isComplete, onEdit }) => (
        <div className={`flex justify-between items-center py-4 border-b border-gray-200 ${isLocked ? 'text-gray-300' : 'text-black'}`}>
        <h2 className="text-lg font-medium">{title}</h2>
        {isComplete && !isLocked && <Link href={onEdit} className="text-xs underline text-gray-500 hover:text-black">Edit</Link>}
        {isLocked && <LockIcon />}
        </div>
    );

  const NikeInput = ({ name, type = "text", placeholder, defaultValue, required = false, className="", autoFocus = false }) => (
    <input
      name={name} type={type} required={required} defaultValue={defaultValue} placeholder={required ? `${placeholder}*` : placeholder} autoFocus={autoFocus}
      className={`border border-gray-300 rounded-lg px-3 py-3 w-full text-sm placeholder:text-gray-500 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all ${className}`}
    />
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      
      {/* 🔴 TOAST */}
      <RealTimeToast jobTitle={job} />

      {/* ================= HEADER ================= */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="block">
                {LOGO_URL ? (
                    <img src={LOGO_URL} alt="Company Logo" className="h-10 w-auto object-contain" />
                ) : (
                    <div className="font-bold text-xl tracking-tight">JobBoard</div>
                )}
            </Link>

            <div className="flex items-center gap-1.5 text-xs bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-gray-500 font-medium">
                <div className="text-green-600"><LockIcon /></div>
                <span>Secure Checkout</span>
            </div>
         </div>
      </div>
      {/* ========================================= */}

      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-10">
        <h1 className="text-2xl font-medium mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="space-y-1">

            {/* ----- STEP 1: JOB 1 & LOCATION ----- */}
            <div id="step-1">
              <SectionHeader 
                title="1. Job & Location" 
                isComplete={isStep1Complete}
                onEdit={`/signup?${currentQueryString}&edit=1`} 
                isLocked={false}
              />

              {isStep1Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                   <form action={actionStageJob} className="space-y-5">
                        {Object.entries(allParamsObj).map(([k,v]) => <input key={k} type="hidden" name={k} value={v} />)}
                        
                        {/* CONTACT EMAIL */}
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-900 ml-1">Contact Email</label>
                            <p className="text-[11px] text-gray-500 ml-1 mb-1.5">Where should we send candidate applications?</p>
                            <NikeInput name="email" type="email" placeholder="work@company.com" defaultValue={email} required autoFocus />
                        </div>
                        {/* CONTACT PHONE */}
                        <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-900 ml-1">
                            Contact Phone
                        </label>
                        <p className="text-[11px] text-gray-500 ml-1 mb-1.5">
                            Used if candidates or our team need to reach you directly.
                        </p>
                        <NikeInput
                            name="contactPhone"
                            type="tel"
                            placeholder="(555) 555-5555"
                            defaultValue={contactPhone}
                            required
                        />
                        </div>


                        {/* JOB ROLE */}
                        <div className="space-y-1">
                            <label className="text-xl font-bold text-gray-900 ml-1">What Specific Position Are You Hiring For?</label>
                            <p className="text-[11px] text-gray-500 ml-1 mb-1.5">Select The Job Role</p>
                            <div className="relative">
                                <select name="job" required defaultValue={job} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none">
                                    <option value="" disabled>Select Job Title*</option>
                                    {jobTitles.map((jt) => <option key={jt.title} value={jt.title}>{jt.title}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                            </div>
                        </div>

                        {/* LOCATION */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                             <div className="flex items-center gap-2 text-gray-900 mb-1">
                                <MapPinIcon className="w-4 h-4" />
                                <span className="text-xl font-bold uppercase tracking-wide">ADDRESS FOR THE LOCATION THAT YOU ARE HIRING FOR</span>
                             </div>
                             <p className="text-[11px] text-gray-500 leading-snug">Enter the <strong>exact address</strong> of your shop/office. We use this to find candidates within a 30-mile radius.</p>
                             
                             <NikeInput name="address1" placeholder="Street Address" defaultValue={address1} required className="bg-white" />
                             <div className="grid grid-cols-2 gap-3">
                                <NikeInput name="city" placeholder="City" defaultValue={city} required className="bg-white" />
                                <NikeInput name="state" placeholder="State" defaultValue={state} required className="bg-white" />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <NikeInput name="zip" placeholder="Zip Code" defaultValue={zip} required className="bg-white" />
                                <NikeInput name="address2" placeholder="Suite (Optional)" defaultValue={address2} className="bg-white" />
                             </div>
                        </div>

                        {/* PAY RANGE */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                            <div className="flex items-center gap-2 text-gray-900 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wide">Compensation Range For The Position That You Are Hiring For:</span>
                                <span className="bg-white border border-gray-200 text-[10px] px-2 py-0.5 rounded-full text-gray-500">Required</span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-snug mb-2">
                                Candidates are 40% more likely to apply when they see a clear pay range.
                            </p>

                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Minimum</label>
                                    <NikeInput name="incomeLow" type="number" placeholder="20" defaultValue={incomeLow} required className="bg-white" />
                                </div>
                                <div className="col-span-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Maximum</label>
                                    <NikeInput name="incomeHigh" type="number" placeholder="40" defaultValue={incomeHigh} required className="bg-white" />
                                </div>
                                <div className="col-span-4 relative">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Frequency</label>
                                    <div className="relative">
                                        <select name="incomeRate" required defaultValue={incomeRate} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black focus:ring-1 focus:ring-black outline-none">
                                            <option value="" disabled>Select...</option>
                                            <option value="hourly">/ Hour</option>
                                            <option value="salary">/ Year</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <button className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full text-sm font-bold transition-colors shadow-md flex items-center justify-center gap-2">
                                Next: Select Plan <span className="text-lg leading-none">→</span>
                            </button>
                        </div>
                   </form>
                </div>
              )}
              {isStep1Complete && (
                <div className="py-3 text-gray-500 text-xs flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                         <span className="font-bold text-black text-sm">{job}</span>
                         <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">${Number(incomeLow).toLocaleString()} - {Number(incomeHigh).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-80">
                         <MapPinIcon className="w-3 h-3" />
                         <span>{city}, {state} {zip}</span>
                    </div>
                </div>
              )}
            </div>

            {/* ----- STEP 1b: UPSELL JOB ----- */}
            {hasUpsell && (
                <div id="step-upsell" className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <SectionHeader 
                        title="1b. Second Job Details" 
                        isComplete={isUpsellFormComplete}
                        onEdit={`/signup?${currentQueryString}&edit=1b`}
                        isLocked={!isStep1Complete}
                    />
                    
                    {isUpsellActive && (
                        <div className="py-4 bg-gray-50 -mx-4 px-4 rounded-lg mb-4 border border-gray-200 shadow-inner">
                             <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                                <span className="bg-black text-white text-xs px-2 py-0.5 rounded font-bold">BONUS</span>
                                <span>Save $400 on this second listing.</span>
                             </div>

                             <form action={actionStageUpsell} className="space-y-4">
                                {Object.entries(allParamsObj).map(([k, v]) => (
                                    <input key={k} type="hidden" name={k} value={v} />
                                ))}
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-900 ml-1">Second Role Title</label>
                                    <div className="relative">
                                        <select name="job2" required defaultValue={job2} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black focus:ring-1 outline-none">
                                            <option value="" disabled>Select Job Title*</option>
                                            {jobTitles.map((jt) => <option key={jt.title} value={jt.title}>{jt.title}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-4"><NikeInput name="incomeLow2" type="number" placeholder="Min Pay" defaultValue={incomeLow2} required className="bg-white" /></div>
                                    <div className="col-span-4"><NikeInput name="incomeHigh2" type="number" placeholder="Max Pay" defaultValue={incomeHigh2} required className="bg-white" /></div>
                                    <div className="col-span-4 relative">
                                        <select name="incomeRate2" required defaultValue={incomeRate2} className="appearance-none border border-gray-300 rounded-lg px-3 py-3 w-full text-sm bg-white focus:border-black outline-none">
                                            <option value="" disabled>Rate*</option>
                                            <option value="hourly">/hr</option>
                                            <option value="salary">/yr</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button className="w-full bg-white border-2 border-black text-black hover:bg-gray-100 py-2 rounded-full text-sm font-bold transition-colors">
                                        Save Second Job
                                    </button>
                                </div>
                             </form>
                        </div>
                    )}
                    {isUpsellFormComplete && hasUpsell && (
                        <div className="py-3 text-gray-500 text-xs flex justify-between border-l-2 border-black pl-3 ml-1 mb-2">
                            <span className="font-bold text-black">{job2}</span>
                            <span>${Number(incomeLow2).toLocaleString()} - {Number(incomeHigh2).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ----- STEP 2: PLAN SELECTION ----- */}
            <div id="step-2">
              <SectionHeader 
                title="2. Select Plan" 
                isLocked={!isStep1Complete} 
                isComplete={isStep2Complete} 
                onEdit={`/signup?${currentQueryString}&edit=2`} 
              />
              {isStep2Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <form action={actionStagePlan} className="space-y-3">
                        {Object.entries(allParamsObj).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v ?? ""} />))}
                        
                        <div className="grid grid-cols-1 gap-3">
                            {plans.map((plan) => (
                                <label key={plan.priceId} className="cursor-pointer group block">
                                    <input type="submit" name="priceId" value={plan.priceId} className="hidden" />
                                    <div className="border border-gray-300 rounded-lg p-4 hover:border-black transition-all flex justify-between items-center bg-white hover:shadow-md relative overflow-hidden">
                                        {plan.name.includes('Standard') && <div className="absolute top-0 right-0 bg-black text-white text-[10px] px-2 py-0.5 rounded-bl">Best Value</div>}
                                        <div>
                                            <div className="font-bold text-sm">{plan.name}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">Cancel anytime in dashboard</div>
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
              {isStep2Complete && currentPlan && <div className="py-3 text-gray-500 text-xs"><span className="font-bold text-black">{currentPlan.name}</span> — ${(currentPlan.amount / 100).toFixed(2)}/{currentPlan.interval}</div>}
            </div>

            {/* ----- STEP 3: FINAL DETAILS (UPDATED) ----- */}
            <div id="step-3">
              <SectionHeader 
                title="3. Final Details" 
                isLocked={!isStep2Complete}
                isComplete={isStep3Complete}
                onEdit={`/signup?${currentQueryString}&edit=3`} 
              />
              
              {isStep3Active && (
                <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-center mb-6">
                             <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
                                <Link href={`/signup?${currentQueryString}&edit=3&type=individual`} scroll={false} className={`px-4 py-2 rounded-md transition-all ${accountType !== 'corporate' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}>Single Location</Link>
                                <Link href={`/signup?${currentQueryString}&edit=3&type=corporate`} scroll={false} className={`px-4 py-2 rounded-md transition-all ${accountType === 'corporate' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}>Corporate Group</Link>
                             </div>
                        </div>

                        <form action={actionSaveFullProfile} className="space-y-4">

          

                            {/* REQUIRED FOR Msgsndr */}
                            <input type="email" name="email" defaultValue={email} hidden />

                            {Object.entries(finalFormParams).map(([k, v]) => (
                                <input key={k} type="hidden" name={k} value={v ?? ""} />
                            ))}
       
                            <div className="grid grid-cols-2 gap-3">
                                <NikeInput name="firstName" placeholder="First Name" defaultValue={firstName} required autoFocus />
                                <NikeInput name="lastName" placeholder="Last Name" defaultValue={lastName} required />
                            </div>

                            {/* 🟢 ADDED: User Role Title */}
                            <div className="grid grid-cols-2 gap-3">
                                <NikeInput name="userTitle" placeholder="Your Job Title" defaultValue={userTitle} required />
                                <NikeInput name="company" placeholder={accountType === 'corporate' ? "Corporate Name" : "Company Name"} defaultValue={company} required />
                            </div>

                            <div className="grid grid-cols-1">
                                <NikeInput name="phone" placeholder="Phone Number" defaultValue={phone} required />
                            </div>

                            <div className="pt-2">
                                <input
                                    type="submit"
                                    value="Go To Payment"
                                    className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full text-sm font-bold transition-colors shadow-md cursor-pointer"
                                />

                                <p className="text-[10px] text-center text-gray-500 mt-3">
                                    You won't be charged until the next step.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
              )}

              {isStep3Complete && (
                <div className="py-3 text-gray-500 text-xs grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-bold text-black text-sm">{company}</p>
                        <p>{firstName} {lastName}</p>
                        {userTitle && <p className="text-[10px] opacity-75">{userTitle}</p>}
                    </div>
                    <div className="text-right">
                         <p>{email}</p>
                         <p>{phone}</p>
                    </div>
                </div>
              )}
            </div>

            {/* ----- STEP 4: PAYMENT ----- */}
            <div id="step-4">
              <SectionHeader title="4. Payment" isLocked={!isStep3Complete} />
              {isStep4Active && job && (
                 <div className="py-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <ClientOnly>
                        <StripeForm
                        priceId={currentPlan?.priceId}
                        productId={currentPlan?.productId}
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        companyName={company}
                        companyPhone={phone}
                        contactPhone={phone}
                        companyAddress={`${address1} ${address2}`.trim()}
                        companyCity={city}
                        companyState={state}
                        companyZip={zip}
                        jobName={job}
                        incomeMin={incomeLow}
                        incomeMax={incomeHigh}
                        incomeRate={incomeRate}
                        subscriptionName={currentPlan?.name}

                        // --- UPSELL PROPS ---
                        hasUpsell={hasUpsell}
                        upsellJobName={job2}
                        upsellIncomeMin={incomeLow2}
                        upsellIncomeMax={incomeHigh2}
                        upsellIncomeRate={incomeRate2}

                        // --- UTM PROPS ---
                        utm_source={utm_source}
                        utm_medium={utm_medium}
                        utm_campaign={utm_campaign}
                        utm_content={utm_content}
                        utm_term={utm_term}
                        utm_id={utm_id}
                        />

                    </ClientOnly>
                    <div className="mt-4 text-center">
                         <p className="text-[10px] text-gray-400">Cancel anytime.</p>
                    </div>
                 </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN (SUMMARY) ================= */}
          <div className="hidden lg:block sticky top-8 h-fit">
              <div className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  {currentPlan ? (
                      <div className="flex gap-3 mb-4 animate-in fade-in">
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border border-gray-200"><BagIcon /></div>
                        <div>
                            <p className="font-bold text-sm">{currentPlan.name}</p>
                            <p className="text-gray-500 text-xs">{job || "Job Post"}</p>
                            <p className="text-gray-500 text-xs">Qty 1</p>
                        </div>
                      </div>
                  ) : (
                     <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs">Select plan to see summary.</div>
                  )}

                  <div className="my-4 pt-4 border-t border-dashed border-gray-200">
                     <OrderBump isChecked={hasUpsell} allParams={currentQueryString} />
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                     <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{currentPlan ? `$${(currentPlan.amount / 100).toFixed(2)}` : '—'}</span></div>
                     {hasUpsell && (
                        <div className="flex justify-between text-green-700 animate-in fade-in">
                            <span>+ Second Job</span>
                            <span>$599.00</span>
                        </div>
                     )}
                     <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>$0.00</span></div>
                     <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base mt-1">
                        <span>Total</span>
                        <span>
                            {currentPlan 
                                ? `$${((currentPlan.amount + (hasUpsell ? 59900 : 0)) / 100).toFixed(2)}` 
                                : '—'}
                        </span>
                     </div>
                  </div>
              </div>

              {/* 🔴 INJECTED: High Demand / Fake Notification */}
              {/* FIX: ONLY SHOW IF 'job' PARAM EXISTS */}
              {job && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-right-4 duration-1000">
                      <div className="flex gap-3">
                          <div className="text-2xl select-none pt-0.5">🔥</div>
                          <div>
                              <h3 className="font-bold text-sm text-gray-900">High Demand</h3>
                              <p className="text-xs text-gray-700 leading-snug mt-1">
                                  <span className="font-bold capitalize">{job}</span> in <span className="font-bold capitalize">{city || "your area"}</span> are actively looking for jobs right now. Complete payment to start reaching them.
                              </p>
                          </div>
                      </div>
                  </div>
              )}
              {/* 🔴 END INJECTION */}

              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-start gap-3">
                 <div className="text-green-600 mt-0.5"><LockIcon /></div>
                 <div>
                     <div className="text-xs font-bold text-gray-800">Secure SSL Checkout</div>
                     <p className="text-[10px] text-gray-500 leading-snug mt-1">
                         Your payment data is encrypted and processed securely by Stripe.
                     </p>
                 </div>
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
    if (data.edit) delete data.edit;
    const params = new URLSearchParams(data); 
    redirect(`/signup?${params.toString()}`);
}

async function actionStageUpsell(formData) {
    "use server";
    const data = Object.fromEntries(formData.entries());
    if (data.edit) delete data.edit;
    const params = new URLSearchParams(data); 
    redirect(`/signup?${params.toString()}`);
}

async function actionStagePlan(formData) {
    "use server";
    const data = Object.fromEntries(formData.entries());
    if (data.edit) delete data.edit;
    const params = new URLSearchParams(data);
    redirect(`/signup?${params.toString()}`);
}

async function actionSaveFullProfile(formData) {
  "use server";
  const sql = require("@/lib/db").default;
  const data = Object.fromEntries(formData.entries());
  
  // FIX: Sanitize UUID by splitting commas if duplicates exist
  let intentId = data.intent ? String(data.intent).split(',')[0].trim() : "";

  try {
    if (intentId && intentId !== "null") {
        await sql`
            UPDATE signup_intents SET 
            email=${data.email}, 
            company_name=${data.company}, 
            user_title=${data.userTitle}, 
            phone=${String(data.phone)}, 
            address_1=${data.address1}, 
            address_2=${data.address2}, 
            city=${data.city}, 
            state=${data.state}, 
            zip=${String(data.zip)},
            primary_job_title=${data.job}, 
            income_low=${Number(data.incomeLow)}, 
            income_high=${Number(data.incomeHigh)}, 
            income_rate=${data.incomeRate},
            stripe_price_id=${data.priceId},
            
            has_upsell=${data.upsell === "true"},
            upsell_job_title=${data.job2 || null},
            upsell_income_low=${data.incomeLow2 ? Number(data.incomeLow2) : null},
            upsell_income_high=${data.incomeHigh2 ? Number(data.incomeHigh2) : null}

            WHERE id=${intentId}
        `;
    } else {
        const result = await sql`
            INSERT INTO signup_intents (
                email, company_name, user_title, phone, 
                address_1, address_2, city, state, zip, 
                primary_job_title, income_low, income_high, income_rate,
                stripe_price_id,
                has_upsell, upsell_job_title, upsell_income_low, upsell_income_high,
                status
            ) VALUES (
                ${data.email}, ${data.company}, ${data.userTitle}, ${String(data.phone)}, 
                ${data.address1}, ${data.address2}, ${data.city}, ${data.state}, ${String(data.zip)}, 
                ${data.job}, ${Number(data.incomeLow)}, ${Number(data.incomeHigh)}, ${data.incomeRate},
                ${data.priceId},
                ${data.upsell === "true"}, ${data.job2 || null}, ${data.incomeLow2 ? Number(data.incomeLow2) : null}, ${data.incomeHigh2 ? Number(data.incomeHigh2) : null},
                'pending'
            ) 
            RETURNING id
        `;
        const row = Array.isArray(result) ? result[0] : result.rows?.[0];
        if (row) intentId = row.id;
    }
    
    if (!intentId) throw new Error("Could not retrieve Account ID");

  } catch (err) {
    throw new Error("Database failed: " + err.message);
  }

  const params = new URLSearchParams(data);
  params.set("intent", intentId);
  params.delete("edit"); 
  
  redirect(`/signup?${params.toString()}`);
}

function LockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> }
function ChevronDown({ className }) { return <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg> }
function BagIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> }
function MapPinIcon({ className }) { return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}