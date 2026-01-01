"use client";

import React, { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Send, MessageSquare, Users, CheckCircle, Smartphone, Mail, ChevronRight, Play } from 'lucide-react';

export default function CampaignPage() {
  const [step, setStep] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email'>('sms');

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Outreach Campaigns" subtitle="Automate your recruiting with broadcast messages." />
        
        <main className="flex-1 overflow-y-auto p-8">
          
          <div className="max-w-4xl mx-auto">
            
            {/* --- WIZARD HEADER --- */}
            <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800">New Campaign Blast</h2>
                  <span className="text-sm text-slate-500">Step {step} of 3</span>
               </div>
               {/* Progress Bar */}
               <div className="w-full h-2 bg-slate-200 rounded-full flex">
                  <div className={`h-full bg-indigo-600 rounded-full transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
               </div>
            </div>

            {/* --- WIZARD CONTENT --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
              
              {/* STEP 1: AUDIENCE SELECTION */}
              {step === 1 && (
                <div className="p-8 flex-1">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> Select Audience
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-indigo-200 bg-indigo-50 rounded-lg cursor-pointer ring-1 ring-indigo-500">
                      <div className="flex items-center gap-4">
                        <input type="radio" name="audience" defaultChecked className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-800">Matched Candidates (Smart)</p>
                          <p className="text-sm text-slate-600">Candidates matching "Master Tech" in "Dallas" (Active last 30 days).</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-700 shadow-sm">42 People</span>
                    </label>

                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <input type="radio" name="audience" className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-bold text-slate-800">Past Applicants</p>
                          <p className="text-sm text-slate-600">Re-engage people who applied over 6 months ago.</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">128 People</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: MESSAGE TEMPLATE */}
              {step === 2 && (
                <div className="p-8 flex-1">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" /> Compose Message
                  </h3>

                  {/* Channel Toggle */}
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setSelectedChannel('sms')}
                      className={`flex-1 py-3 border rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${selectedChannel === 'sms' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                    >
                      <Smartphone className="w-4 h-4" /> SMS / Text
                    </button>
                    <button 
                       onClick={() => setSelectedChannel('email')}
                       className={`flex-1 py-3 border rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${selectedChannel === 'email' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>

                  {/* Editor */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Message Body</label>
                    <textarea 
                      className="w-full h-32 p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      defaultValue={selectedChannel === 'sms' ? "Hey {{first_name}}, this is Mike from City Ford. We're looking for a Master Tech ($45/hr). Interested in a quick chat?" : "Hi {{first_name}}, \n\nI reviewed your profile and I think you'd be a great fit for our Master Technician role at City Ford..."}
                    ></textarea>
                    <p className="text-xs text-slate-400 mt-2 text-right">112 / 160 characters</p>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & LAUNCH */}
              {step === 3 && (
                <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Launch?</h3>
                  <p className="text-slate-500 max-w-md mb-8">
                    You are about to send an <strong>SMS Blast</strong> to <strong>42 Candidates</strong> in Dallas, TX. Estimated cost: $1.26.
                  </p>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 w-full max-w-md text-left mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Preview:</p>
                    <p className="text-sm text-slate-700 italic">"Hey John, this is Mike from City Ford. We're looking for a Master Tech ($45/hr). Interested in a quick chat?"</p>
                  </div>
                </div>
              )}

              {/* --- FOOTER ACTIONS --- */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
                {step > 1 ? (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div></div> /* Spacer */
                )}

                {step < 3 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200 transition-colors"
                    onClick={() => alert("Campaign Launched! (This would trigger the API)")}
                  >
                    <Play className="w-4 h-4" /> Launch Campaign
                  </button>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}