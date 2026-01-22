'use client';

import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Lock
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function InterviewCalendar() {
  // We've removed the fetchScheduledInterviews import and state logic 
  // to prevent build errors until the feature is ready.

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Interview Calendar" subtitle="Manage your upcoming candidate meetings" />
        
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
              <CalendarIcon size={32} />
            </div>
            
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
              Calendar Coming Soon
            </h2>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              We are currently finalizing the interview scheduling system. Once active, you will be able to sync your meetings here.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Lock size={12} /> Feature Development in Progress
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}