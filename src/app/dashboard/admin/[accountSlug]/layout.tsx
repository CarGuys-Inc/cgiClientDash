// app/dashboard/[accountSlug]/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({ children, params }: any) {
  type Company = {
    id: string;
    name: string;
    slug: string;
    account_type: string;
  };
  
  type CompanyUser = {
    company_id: string;
    role: string;
    // Supabase returns related rows as an array; accept either a single Company or an array
    companies: Company | Company[];
  };
  // ✅ MUST AWAIT params in Next.js 15+
  const resolvedParams = await params;
  const accountSlugParam = resolvedParams.accountSlug;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companyUser, error } = await supabase
    .schema("basejump")
    .from("company_users")
    .select(`company_id, role, companies(id, name, slug, account_type)`)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!companyUser) redirect("/setup");

  // Normalize companies to a single company object (Supabase returns an array for joined rows)
  const companies = companyUser.companies;
  const company = Array.isArray(companies) ? companies[0] : companies;

  if (!company) redirect("/setup");

  const slug = company.slug;

  // If URL slug is wrong, fix it
  if (accountSlugParam !== slug) {
    redirect(`/dashboard/${slug}`);
  }

  // Provide a fallback navigation if not available in this file
    const navigation: any[] = [];
  
    // Cast components to `any` to allow passing runtime props (like `role`) when their
    // declared Props types don't include those fields.
    const DashboardHeaderAny: any = DashboardHeader;
    const DashboardShellAny: any = DashboardShell;
  
    return (
      <>
        <DashboardHeaderAny
          accountId={company.id}
          navigation={navigation}
          role={companyUser.role}
          accountType={company.account_type}
        />
  
        <DashboardShellAny
          user={user}
          company={company}
          role={companyUser.role}
          navigation={navigation}
        >
          {children}
        </DashboardShellAny>
      </>
    );
}
