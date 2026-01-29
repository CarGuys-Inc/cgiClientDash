'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function ConfirmInvitePage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password set! Redirecting to dashboard...");
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black">Set Your Password</h2>
          <p className="text-slate-500 text-sm text-center mt-2">
            Welcome to CarGuys Inc. Please create a password to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <input 
            type="password" 
            placeholder="New Password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}