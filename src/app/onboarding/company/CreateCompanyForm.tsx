// app/onboarding/company/CreateCompanyForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/onboarding/company", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    const { checkoutUrl } = await res.json();

    router.push(checkoutUrl);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Company name"
        className="border p-3 rounded w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button className="bg-black text-white p-3 rounded w-full">
        Continue to checkout
      </button>
    </form>
  );
}
