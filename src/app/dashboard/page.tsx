"use client";

import React from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Bell } from 'lucide-react';

export default function DashboardHome() {
  // Mock Data for "Market Pulse"
  const marketData = {
    avgTechPay: 42.50,
    payTrend: '+4.2%',
    topMarket: 'Dallas-Fort Worth',
    activeSeekers: 124
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Executive Overview" subtitle="Welcome back, Service Manager." />
        
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* --- ROI METRICS ROW --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Money Saved (The Retention Hook) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Recruiting Fees Saved</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">$15,400</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                <span className="text-emerald-600 font-medium">+ $5k</span> since last month based on 3 hires.
              </p>
            </div>

            {/* Card 2: Candidates Pipeline */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Candidates</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">12</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">4 Interviewing • 8 Unscreened</p>
            </div>

            {/* Card 3: Outreach Volume */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Outreach</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">450</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                 Texts & Emails sent this billing cycle.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto">
            
            {/* --- MARKET PULSE WIDGET (Left 2/3) --- */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" /> Market Pulse: Technician Salary Data
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">Region: Dallas, TX</span>
              </div>

              {/* Data Visualization (Simple CSS Bars) */}
              <div className="flex items-end justify-between h-40 gap-4 mb-6 px-4">
                {/* Bar 1 */}
                <div className="flex flex-col items-center gap-2 w-full">
                   <div className="w-full bg-slate-100 rounded-t-md relative group h-24">
                      <div className="absolute bottom-0 w-full bg-slate-300 rounded-t-md transition-all hover:bg-indigo-400" style={{height: '60%'}}></div>
                   </div>
                   <span className="text-xs font-medium text-slate-500">Lube Tech</span>
                   <span className="text-xs font-bold text-slate-800">$18/hr</span>
                </div>
                {/* Bar 2 */}
                <div className="flex flex-col items-center gap-2 w-full">
                   <div className="w-full bg-slate-100 rounded-t-md relative group h-24">
                      <div className="absolute bottom-0 w-full bg-slate-300 rounded-t-md transition-all hover:bg-indigo-400" style={{height: '75%'}}></div>
                   </div>
                   <span className="text-xs font-medium text-slate-500">C-Level</span>
                   <span className="text-xs font-bold text-slate-800">$24/hr</span>
                </div>
                {/* Bar 3 */}
                <div className="flex flex-col items-center gap-2 w-full">
                   <div className="w-full bg-slate-100 rounded-t-md relative group h-24">
                      <div className="absolute bottom-0 w-full bg-slate-300 rounded-t-md transition-all hover:bg-indigo-400" style={{height: '85%'}}></div>
                   </div>
                   <span className="text-xs font-medium text-slate-500">Service Advisor</span>
                   <span className="text-xs font-bold text-slate-800">$65k/yr</span>
                </div>
                {/* Bar 4 (Highlighted) */}
                <div className="flex flex-col items-center gap-2 w-full">
                   <div className="w-full bg-slate-100 rounded-t-md relative group h-24">
                      <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t-md shadow-lg shadow-indigo-200" style={{height: '95%'}}></div>
                   </div>
                   <span className="text-xs font-medium text-indigo-700">Master Tech</span>
                   <span className="text-xs font-bold text-slate-800">$42/hr</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded shadow-sm">
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Market is heating up.</p>
                    <p className="text-xs text-slate-500">Master Tech wages increased by {marketData.payTrend} this quarter.</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-indigo-600 hover:underline">Download Full Report</button>
              </div>
            </div>

            {/* --- RECENT ACTIVITY / INBOX PREVIEW (Right 1/3) --- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Recent Alerts
              </h3>
              <div className="space-y-4">
                 {/* Activity Item 1 */}
                 <div className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">New Application: John D.</p>
                      <p className="text-xs text-slate-500 mb-1">Applied for "Diesel Tech"</p>
                      <span className="text-[10px] text-slate-400">2 mins ago</span>
                    </div>
                 </div>
                 {/* Activity Item 2 */}
                 <div className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Campaign Completed</p>
                      <p className="text-xs text-slate-500 mb-1">"Service Advisor Blast" sent to 45 candidates.</p>
                      <span className="text-[10px] text-slate-400">1 hour ago</span>
                    </div>
                 </div>
                 {/* Activity Item 3 */}
                 <div className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Subscripton Renewal</p>
                      <p className="text-xs text-slate-500 mb-1">Your "All Access" pass renews in 3 days.</p>
                      <span className="text-[10px] text-slate-400">Yesterday</span>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                View All Notifications
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}