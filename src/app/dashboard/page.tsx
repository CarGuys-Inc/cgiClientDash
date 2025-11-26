// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");


const { data: companyUser, error } = await supabase
  .schema('basejump')
  .from("company_users")
  .select("company_id, role, companies(name, slug, account_type)")
  .eq("user_id", user.id)
  .maybeSingle();
if (error) console.error(error)

  console.log("success", companyUser)

if (!companyUser) redirect("/setup");

// companies can be returned as an array; pick the first item or use the object directly
const company = Array.isArray(companyUser.companies)
  ? companyUser.companies[0]
  : companyUser.companies;

if (!company) redirect("/setup");

switch (company.account_type) {
  case 'admin':
    redirect(`/dashboard/admin/${company.slug}`);
    break;
  case 'recruiter':
    redirect(`/dashboard/recruiter/${company.slug}`);
    break;
  default:
}

}
