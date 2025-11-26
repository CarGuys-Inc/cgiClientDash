import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";
import {UserIcon} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";

export default async function UserAccountButton() {
    const supabaseClient = await createClient();
const { data: { user } } = await supabaseClient.auth.getUser();

if (!user || !user.id) {
  // No authenticated user — redirect to home (or show a fallback UI)
  redirect('/');
}

const { data: profile, error } = await supabaseClient
  .schema('basejump')
  .from("profiles")
  .select("full_name")
  .eq("id", user.id)
  .maybeSingle();
if (error) console.error(error)

    const signOut = async () => {
        'use server'

        const supabase = await createClient()
        await supabase.auth.signOut()
        return redirect('/')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <UserIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name ?? 'Unknown user'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings/teams">Teams</Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                <form action={signOut}>
                    <button>Log out</button>
                </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
