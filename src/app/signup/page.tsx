export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StripeForm from "./StripeForm";

const plans = [
  { id: "basic", name: "Basic", price: 49 },
  { id: "pro", name: "Pro", price: 99 },
  { id: "elite", name: "Elite", price: 149 }
];

export default async function SignupPage({
  searchParams
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const step = searchParams.step ?? "info";

  const email = searchParams.email ?? "";
  const company = searchParams.company ?? "";
  const job = searchParams.job ?? "";
  const selectedPlan = searchParams.plan ?? "";

  const currentPlan = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="max-w-6xl mx-auto py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* LEFT — STEP 1 */}
      <div className="space-y-6 opacity-100">
        <h2 className="text-xl font-semibold">1. Your Info</h2>

        <form action={submitUserInfo} className="space-y-4">
          <input className="border p-3 w-full rounded"
            type="email"
            name="email"
            placeholder="Work email"
            defaultValue={email}
            required
          />

          <input className="border p-3 w-full rounded"
            type="password"
            name="password"
            placeholder="Password"
            required
          />

          <input className="border p-3 w-full rounded"
            type="text"
            name="company"
            placeholder="Company name"
            defaultValue={company}
            required
          />

          <input className="border p-3 w-full rounded"
            type="text"
            name="job"
            placeholder="Primary job title"
            defaultValue={job}
            required
          />

          <button className="bg-black text-white p-3 rounded w-full">
            Save & Continue
          </button>
        </form>
      </div>

      {/* MIDDLE — STEP 2 */}
      <div className="space-y-6 opacity-100">
        <h2 className="text-xl font-semibold">2. Choose Your Plan</h2>

        <form action={selectPlan} className="space-y-3">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="company" value={company} />
          <input type="hidden" name="job" value={job} />

          {plans.map((plan) => (
            <button
              key={plan.id}
              name="plan"
              value={plan.id}
              className={`w-full border p-4 rounded text-left ${
                selectedPlan === plan.id ? "border-black bg-gray-50" : "border-gray-300"
              }`}
            >
              <div className="font-semibold">{plan.name}</div>
              <div className="text-sm text-gray-600">${plan.price}/month</div>
            </button>
          ))}
        </form>
      </div>

      {/* RIGHT — STEP 3 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">3. Summary & Payment</h2>

        <div className="border rounded p-4 space-y-2">
          <div className="font-medium">Plan:</div>
          <div>
            {currentPlan ? (
              <>
                {currentPlan.name} – <b>${currentPlan.price}/mo</b>
              </>
            ) : (
              <span className="text-gray-500">No plan selected</span>
            )}
          </div>

          <div className="pt-4 font-medium">Job Title:</div>
          <div>{job || <span className="text-gray-500">None yet</span>}</div>

          <div className="pt-4 font-medium">Total:</div>
          <div className="text-2xl font-semibold">
            ${currentPlan?.price ?? 0}/mo
          </div>
        </div>

        {currentPlan && email && company && job && (
          <StripeForm
            email={email}
            company={company}
            job={job}
            plan={selectedPlan}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------- SERVER ACTIONS ----------------------- */

async function submitUserInfo(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const company = formData.get("company") as string;
  const job = formData.get("job") as string;

  const supabase = await createClient();

  // Create auth user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  const authUserId = data.user?.id;
  if (!authUserId) throw new Error("User creation failed.");

  // Store their company + job
  await supabase.from("client_profiles").insert({
    auth_user_id: authUserId,
    email,
    company_name: company,
    primary_job_title: job
  });

  redirect(`/signup?step=plan&email=${email}&company=${company}&job=${job}`);
}

async function selectPlan(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const job = formData.get("job") as string;
  const plan = formData.get("plan") as string;

  redirect(
    `/signup?step=summary&email=${email}&company=${company}&job=${job}&plan=${plan}`
  );
}
