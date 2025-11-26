import { createClient } from "@/lib/supabase/server";
import AccountBillingStatus from "@/components/basejump/account-billing-status";
import { Alert } from "@/components/ui/alert";

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function TeamBillingPage({ params }) {
  const { accountSlug } = params;

  const supabaseClient = await createClient();
  const { data: teamAccount, error } = await supabaseClient.rpc(
    "get_account_by_slug",
    { slug: accountSlug }
  );

  if (error) {
    console.error(error);
    return <Alert variant="destructive">Error loading account</Alert>;
  }

  if (!teamAccount || teamAccount.account_role !== "owner") {
    return (
      <Alert variant="destructive">
        You do not have permission to access this page
      </Alert>
    );
  }

  return (
    <div>
      <AccountBillingStatus
        accountId={teamAccount.account_id}
        returnUrl={`${returnUrl}/dashboard/${accountSlug}/settings/billing`}
      />
    </div>
  );
}
