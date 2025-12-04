// app/onboarding/company/page.tsx
import CreateCompanyForm from "./CreateCompanyForm";

export default function CreateCompanyPage() {
  return (
    <div className="max-w-md mx-auto pt-16">
      <h1 className="text-2xl font-semibold mb-4">Your company</h1>
      <p className="text-gray-600 mb-6">
        Tell us the name of the company you recruit for.
      </p>
      <CreateCompanyForm />
    </div>
  );
}
