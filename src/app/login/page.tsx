"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { 
  Car, 
  ArrowRight, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const supabase = createClient();

  const isNewSignup = searchParams.get('new_signup') === 'true';

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;

      // 1. MANUAL TOKEN EXTRACTION (Strictly Client-Side)
      if (process.env.APP_ENV !== 'production' hash && hash.includes("access_token")) {
        console.log("⚡ Fragment detected. Manually extracting tokens...");
        
        // Convert hash fragment to search params
        const params = new URLSearchParams(hash.replace("#", "?"));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("🔑 Tokens found. Injecting session into Supabase...");
          
          // This forces the Supabase client to accept the session and set cookies
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (data?.session) {
            console.log("✅ Session established! Redirecting to dashboard...");
            // Hard redirect to ensure Middleware picks up the new cookies
            window.location.href = '/dashboard';
            return;
          }

          if (sessionError) {
            console.error("❌ Auth Error:", sessionError.message);
            setError("The login link is invalid or has expired.");
          }
        }
      }

      // 2. Auth State Listener (Backup)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Supabase Event:", event);
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
          window.location.href = '/dashboard';
        }
      });

      return () => subscription.unsubscribe();
    };

    handleAuth();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`, 
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  const showEmailSentView = sent || isNewSignup;

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-[600px] relative">
        <Link href="/" className="absolute top-8 left-8 text-slate-500 hover:text-red-700 flex items-center gap-2 text-sm font-bold transition">
          <ChevronLeft size={16} /> Back to Home
        </Link>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-8">
               <div className="bg-red-700 p-1.5 rounded-lg">
                <Car className="text-white w-6 h-6" />
               </div>
               <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Dealer<span className="text-red-700">Talent</span>
               </span>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900">
              {isNewSignup ? 'Account Created!' : (sent ? 'Check your inbox' : 'Welcome back')}
            </h2>
            <p className="mt-2 text-slate-600">
              {isNewSignup 
                ? 'Thanks for joining. Your dashboard is almost ready.' 
                : 'Enter your work email to access your dashboard.'}
            </p>
          </div>

          {showEmailSentView ? (
            <div className="bg-green-50 p-8 rounded-2xl border border-green-100 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Final Step: Verify Email
              </h3>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                We have sent a <strong>secure magic link</strong> to your email. Please click the link in that email to sign in to your dashboard instantly.
              </p>
              
              <div className="text-sm text-slate-500">
                <p className="mb-4 italic">Don't see it? Check your spam folder.</p>
                <button 
                  onClick={() => {
                    window.history.replaceState({}, '', '/login');
                    setSent(false);
                    window.location.reload();
                  }} 
                  className="block w-full text-red-600 font-bold hover:underline"
                >
                  Didn't get an email? Try again.
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="service.manager@dealership.com"
                    className="block w-full pl-10 pr-3 py-4 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent transition sm:text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <div className="text-red-600 mt-0.5"><ShieldCheck size={18} /></div>
                  <div className="text-sm text-red-700 font-medium">{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-red-900/20 text-sm font-bold text-white bg-red-700 hover:bg-red-800 disabled:opacity-70 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <>Send Login Link <ArrowRight className="ml-2 h-5 w-5" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <div className="absolute inset-0 h-full w-full object-cover bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-relaxed">
              "DealerTalent helped us scale our service department with 10x the speed of traditional agencies."
            </p>
            <footer className="text-lg font-bold text-red-500">— Service Director, Luxury Auto Group</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-700" size={48} /></div>}>
      <LoginContent />
    </Suspense>
  );
}