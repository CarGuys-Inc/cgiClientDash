// lib/getCurrentAccount.ts
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAccount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: accountUser } = await supabase
    .from("basejump.account_user")
    .select("account_id, accounts!inner(account_type)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!accountUser) return null;

  const accountType = Array.isArray(accountUser.accounts)
    ? accountUser.accounts[0]?.account_type ?? null
    : (accountUser.accounts as any)?.account_type ?? null;

  return {
    user,
    account_id: accountUser.account_id,
    account_type: accountType,
  };
}
