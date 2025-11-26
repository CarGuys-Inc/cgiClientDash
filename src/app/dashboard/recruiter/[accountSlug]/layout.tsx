// app/dashboard/[accountSlug]/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardHeader from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout(props) {
  const { children, params } = props;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companyUser, error } = await supabase
    .schema("basejump")
    .from("company_users")
    .select("company_id, role, companies(name, slug, account_type)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!companyUser) redirect("/setup");

  const company = Array.isArray(companyUser.companies)
    ? companyUser.companies[0]
    : companyUser.companies;

  const slug = company?.slug;

  // If there is no company or slug, send user to setup
  if (!company || !slug) redirect("/setup");

  // If URL slug is wrong, fix it
  if (params.accountSlug !== slug) {
    redirect(`/dashboard/${slug}`);
  }

  const navigation = [
    { name: "Overview", href: `/dashboard/${slug}` },
    { name: "Settings", href: `/dashboard/${slug}/settings` },
  ];

  return (
    <>
      <DashboardHeader
        accountId={companyUser.company_id}
        navigation={navigation}
      />
      <DashboardShell
        user={user}
        company={company}
        role={companyUser.role}
        navigation={navigation}
      >
        {children}
      </DashboardShell>
    </>
  );
}
