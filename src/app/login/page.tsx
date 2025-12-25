import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

export default async function Login(props: { searchParams: Promise<{ message?: string; returnUrl?: string }> }) {
  
  const searchParams = await props.searchParams;

  // Added prevState as the first argument
  const signIn = async (prevState: any, formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return a state object instead of redirecting for a better UI experience
      return { message: error.message || "Could not authenticate user" };
    }

    return redirect(searchParams.returnUrl || "/dashboard");
  };

  // Added prevState as the first argument
  const signUp = async (prevState: any, formData: FormData) => {
    "use server";

    const origin = (await headers()).get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?returnUrl=${searchParams.returnUrl || ""}`,
      },
    });

    if (error) {
      return { message: error.message || "Could not authenticate user" };
    }

    // Success message for sign up
    return { message: "Check email to continue sign in process" };
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md text-foreground bg-muted hover:bg-muted/70 flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Use your email and password to sign in.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Note: We don't put action on the form itself anymore, 
              as the SubmitButtons handle the specific actions */}
          <form className="flex flex-col gap-4 text-foreground">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            <SubmitButton formAction={signIn} pendingText="Signing In...">
              Sign In
            </SubmitButton>

            <SubmitButton
              formAction={signUp}
              variant="outline"
              pendingText="Signing Up..."
            >
              Sign Up
            </SubmitButton>

            {/* Displays messages passed via URL (legacy) */}
            {searchParams?.message && (
              <p className="mt-2 p-3 rounded-md bg-muted text-center text-sm">
                {searchParams.message}
              </p>
            )}
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms & Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}