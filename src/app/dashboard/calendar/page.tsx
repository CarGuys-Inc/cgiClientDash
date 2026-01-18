'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchScheduledInterviews } from '@/services/jobService';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, Briefcase, Loader2, MapPin 
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function InterviewCalendar() {
  const supabase = createClient();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function loadInterviews() {
      try {
        const data = await fetchScheduledInterviews(supabase);
        setInterviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInterviews();
  }, []);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title="Interview Calendar" subtitle="Manage your upcoming candidate meetings" />
        
        <main className="p-6 max-w-6xl mx-auto w-full">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                <CalendarIcon size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {monthName} <span className="text-slate-400 font-medium">{currentDate.getFullYear()}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600">Today</button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[120px]">
              {/* Empty offsets for first day of month */}
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/30" />
              ))}

              {/* Day cells */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayInterviews = interviews.filter(int => 
                  int.date.getDate() === day && 
                  int.date.getMonth() === currentDate.getMonth() &&
                  int.date.getFullYear() === currentDate.getFullYear()
                );

                return (
                  <div key={day} className="border-r border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group relative">
                    <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600">{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                      {dayInterviews.map(int => (
                        <div key={int.id} className="bg-blue-50 border-l-4 border-blue-600 p-1.5 rounded-md shadow-sm">
                          <p className="text-[10px] font-black text-blue-800 truncate leading-none mb-1">{int.title}</p>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-blue-500 uppercase">
                            <Clock size={8} /> {int.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming List View (Sidebar style) */}
          <div className="mt-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Agenda Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {interviews
                .filter(int => int.date >= new Date())
                .sort((a, b) => a.date - b.date)
                .slice(0, 3)
                .map(int => (
                  <div key={int.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl font-black text-center min-w-[50px]">
                      <div className="text-[10px] uppercase leading-none">{int.date.toLocaleString('default', { month: 'short' })}</div>
                      <div className="text-xl">{int.date.getDate()}</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-tight">{int.title}</h4>
                      <p className="text-xs text-slate-500 mb-2">{int.jobTitle}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                        <Clock size={12} /> {int.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}