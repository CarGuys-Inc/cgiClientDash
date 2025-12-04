// app/signup/page.tsx
export const dynamic = "force-dynamic"; // fresh SSR for auth

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StripeForm from "./StripeForm";

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto pt-16 space-y-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      {/* Signup Form */}
      <SignupForm />

      <div>
        <h2 className="text-lg font-semibold mt-6 mb-2">Payment</h2>
        <StripeForm />
      </div>
    </div>
  );
}

// Server action form
function SignupForm() {
  async function signup(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const companyName = formData.get("companyName") as string;

    const supabase = await createClient();

    // 1️⃣ Create Supabase Auth user
    const { data: user, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // 2️⃣ Insert client profile (we do NOT redirect yet)
    await supabase.from("client_profiles").insert({
      auth_user_id: user.id,
      email,
      company_name: companyName,
    });

    // Note: Do not redirect yet — we want payment first
  }

  return (
    <form action={signup} className="space-y-4">
      <input
        className="border p-3 w-full rounded"
        type="email"
        name="email"
        placeholder="Work email"
        required
      />
      <input
        className="border p-3 w-full rounded"
        type="password"
        name="password"
        placeholder="Password"
        required
      />
      <input
        className="border p-3 w-full rounded"
        type="text"
        name="companyName"
        placeholder="Company name"
        required
      />
      <button type="submit" className="bg-black text-white p-3 rounded w-full">
        Continue
      </button>
    </form>
  );
}
