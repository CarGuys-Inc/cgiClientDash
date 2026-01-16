"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { createClient } from '@/utils/supabase/client';
import { 
  Search, MapPin, Filter, UserPlus, Lock, 
  MessageSquare, X, CreditCard, Loader2 
} from 'lucide-react';

// --- Types ---
interface Candidate {
  id: string;
  name: string;
  location: string;
  // UI Fallbacks
  role: string;
  matchScore: number;
}

export default function CandidateSearchPage() {
  const supabase = createClient();

  // --- State ---
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubscriber, setIsSubscriber] = useState(true); 
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [messageBody, setMessageBody] = useState("Hi {{name}}, I saw your profile and have a great opening. Are you free to chat?");

  // --- Fetch Fields from Supabase ---
  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('applicants')
          .select('id, first_name, last_name, location')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData: Candidate[] = (data || []).map(item => {
          // --- FIX FOR RUNTIME ERROR ---
          // If location is a JSON object with city/state, format it. 
          // If it's a string, use it. Otherwise, fallback.
          let displayLocation = "Location Not Listed";
          
          if (item.location && typeof item.location === 'object') {
            const { city, state } = item.location as any;
            displayLocation = city && state ? `${city}, ${state}` : city || state || "Address on File";
          } else if (typeof item.location === 'string') {
            displayLocation = item.location;
          }

          return {
            id: item.id,
            name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || "Anonymous Candidate",
            location: displayLocation,
            role: 'Automotive Professional',
            matchScore: 95
          };
        });

        setCandidates(transformedData);
      } catch (err) {
        console.error("Database fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCandidates();
  }, [supabase]);

  // --- Filter Logic ---
  const filteredCandidates = candidates.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) || 
      c.location.toLowerCase().includes(searchLower)
    );
  });

  const costPerLead = 2.00;
  const totalCost = (filteredCandidates.length * costPerLead).toFixed(2);

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          title="Candidate Database" 
          subtitle="Search talent by name and location."
        />

        <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* --- LEFT FILTER SIDEBAR --- */}
          <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto z-10 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Quick Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name or location..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isSubscriber ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => setIsSubscriber(!isSubscriber)}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isSubscriber ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs font-semibold text-indigo-900">Subscription Active</span>
               </div>
            </div>
          </aside>

          {/* --- RIGHT CONTENT AREA --- */}
          <section className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="font-medium animate-pulse">Syncing with database...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {filteredCandidates.length} Candidates Found
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Search results from the applicant database.
                    </p>
                  </div>
                  {isSubscriber && filteredCandidates.length > 0 && (
                    <button 
                      onClick={() => setShowBulkModal(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" /> Message All ({filteredCandidates.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-20">
                  {filteredCandidates.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xl border border-slate-200">
                             {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                              {isSubscriber ? candidate.name : "Candidate Locked"}
                              {!isSubscriber && <Lock className="w-4 h-4 text-slate-400" />}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              {/* Ensure location is rendered as a string here */}
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{candidate.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex gap-3">
                        {isSubscriber ? (
                          <>
                            <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2">
                               <UserPlus className="w-4 h-4" /> Invite to Apply
                            </button>
                            <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                               View Profile
                            </button>
                          </>
                        ) : (
                          <button className="w-full bg-slate-900 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2">
                             <Lock className="w-4 h-4" /> Upgrade to Unlock
                          </button>
                        )}
                      </div>
                      
                      {!isSubscriber && (
                        <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-[2px] flex items-center justify-center"></div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* --- MODAL --- */}
          {showBulkModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Blast Campaign</h3>
                    <button onClick={() => setShowBulkModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                 </div>
                 <div className="p-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                        <div className="flex justify-between text-indigo-900 font-bold">
                          <span>Total Candidates:</span>
                          <span>{filteredCandidates.length}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600 text-lg font-black mt-1">
                          <span>Total to Pay:</span>
                          <span>${totalCost}</span>
                        </div>
                    </div>
                    <button onClick={() => alert("Campaign Sent!")} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                      <CreditCard className="w-4 h-4" /> Checkout & Send
                    </button>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}