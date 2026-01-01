"use client";

import React, { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { 
  TrendingUp, MapPin, DollarSign, Users, Download, 
  Lock, AlertCircle, Check, ArrowRight 
} from 'lucide-react';

// --- Mock Data ---
const MARKET_DATA = {
  'Dallas, TX': {
    avgPay: 44.50,
    payTrend: '+5.2%',
    activeSeekers: 142,
    timeToHire: '18 Days',
    competitors: ['City Ford', 'Texas Toyota', 'AutoNation'],
    benefitsTrend: ['Sign-on Bonus ($2k)', '4 Day Work Week', 'Tool Allowance'],
  },
  'Phoenix, AZ': {
    avgPay: 39.00,
    payTrend: '+2.1%',
    activeSeekers: 85,
    timeToHire: '24 Days',
    competitors: ['Camelback Ford', 'Peoria Nissan'],
    benefitsTrend: ['Relocation Assistance', 'AC Shop Guarantee'],
  },
  'Miami, FL': {
    avgPay: 41.25,
    payTrend: '+3.8%',
    activeSeekers: 110,
    timeToHire: '21 Days',
    competitors: ['Braman Motors', 'South Motors'],
    benefitsTrend: ['Performance Bonus', 'Tuition Reimbursement'],
  }
};

export default function MarketDataPage() {
  const [selectedCity, setSelectedCity] = useState<keyof typeof MARKET_DATA>('Dallas, TX');
  const data = MARKET_DATA[selectedCity];

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Market Intelligence" subtitle="Real-time salary and hiring insights." />
        
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* --- CONTROL BAR --- */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
             <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <MapPin className="w-5 h-5 text-indigo-600 ml-2" />
                <select 
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value as any)}
                >
                   {Object.keys(MARKET_DATA).map(city => (
                      <option key={city} value={city}>{city}</option>
                   ))}
                </select>
             </div>
             
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" /> Download PDF Report
             </button>
          </div>

          {/* --- HERO STATS --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg. Master Pay</p>
                <div className="flex items-end gap-2">
                   <h3 className="text-3xl font-bold text-slate-800">${data.avgPay}<span className="text-lg text-slate-400">/hr</span></h3>
                   <span className="text-xs font-bold text-emerald-600 mb-1 bg-emerald-50 px-1.5 py-0.5 rounded">{data.payTrend}</span>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Candidates</p>
                <h3 className="text-3xl font-bold text-slate-800">{data.activeSeekers}</h3>
                <p className="text-xs text-slate-500 mt-1">Updated today</p>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg. Time to Hire</p>
                <h3 className="text-3xl font-bold text-slate-800">{data.timeToHire}</h3>
                <p className="text-xs text-slate-500 mt-1">vs 45 Days (National)</p>
             </div>
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl shadow-md text-white">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">Opportunity</p>
                <h3 className="text-lg font-bold leading-tight mb-2">Hiring is 20% faster in {selectedCity.split(',')[0]} right now.</h3>
                <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded transition-colors flex items-center gap-1 mt-2">
                   Post a Job <ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* --- CHART: SALARY BANDS (Left 2/3) --- */}
             <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" /> Compensation Bands by Role
                   </h3>
                   <div className="flex gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                         <div className="w-3 h-3 bg-slate-300 rounded-sm"></div> Low
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                         <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Median
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                         <div className="w-3 h-3 bg-indigo-200 rounded-sm"></div> High
                      </div>
                   </div>
                </div>

                {/* Custom CSS Chart */}
                <div className="space-y-6">
                   {/* Row 1: Lube Tech */}
                   <div>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">Lube Technician</span>
                         <span className="font-bold text-slate-900">$16 - $22 /hr</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                         {/* The range bar */}
                         <div className="absolute top-0 bottom-0 bg-indigo-100" style={{left: '10%', width: '30%'}}></div>
                         {/* The median marker */}
                         <div className="absolute top-0 bottom-0 bg-indigo-600 w-1 rounded-full" style={{left: '25%'}}></div>
                      </div>
                   </div>

                   {/* Row 2: C-Level */}
                   <div>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">C-Level Tech</span>
                         <span className="font-bold text-slate-900">$22 - $28 /hr</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                         <div className="absolute top-0 bottom-0 bg-indigo-100" style={{left: '30%', width: '25%'}}></div>
                         <div className="absolute top-0 bottom-0 bg-indigo-600 w-1 rounded-full" style={{left: '42%'}}></div>
                      </div>
                   </div>

                   {/* Row 3: B-Level */}
                   <div>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">B-Level Tech</span>
                         <span className="font-bold text-slate-900">$28 - $38 /hr</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                         <div className="absolute top-0 bottom-0 bg-indigo-100" style={{left: '45%', width: '35%'}}></div>
                         <div className="absolute top-0 bottom-0 bg-indigo-600 w-1 rounded-full" style={{left: '60%'}}></div>
                      </div>
                   </div>

                   {/* Row 4: Master */}
                   <div>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="font-medium text-slate-700">Master Tech (ASE)</span>
                         <span className="font-bold text-slate-900">$40 - $65 /hr</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                         <div className="absolute top-0 bottom-0 bg-indigo-100" style={{left: '60%', width: '40%'}}></div>
                         <div className="absolute top-0 bottom-0 bg-indigo-600 w-1 rounded-full" style={{left: '80%'}}></div>
                      </div>
                   </div>
                </div>
                
                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 items-start">
                   <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                   <div>
                      <h4 className="text-sm font-bold text-slate-800">Insight</h4>
                      <p className="text-xs text-slate-600 mt-1">
                         Master Tech wages in {selectedCity.split(',')[0]} have risen faster than any other role this quarter. 
                         If you are offering below $42/hr, your offer rejection rate is likely 60%.
                      </p>
                   </div>
                </div>

             </div>

             {/* --- COMPETITOR INSIGHTS (Right 1/3) --- */}
             <div className="flex flex-col gap-6">
                
                {/* Benefits Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" /> Trending Benefits
                   </h3>
                   <p className="text-xs text-slate-500 mb-4">What your competitors are offering to win talent.</p>
                   <ul className="space-y-3">
                      {data.benefitsTrend.map((benefit, i) => (
                         <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <Check className="w-4 h-4 text-emerald-500" /> {benefit}
                         </li>
                      ))}
                   </ul>
                </div>

                {/* Competitor Watchlist (Upsell) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" /> Competitor Watch
                   </h3>
                   
                   <div className="space-y-4 blur-[2px] opacity-60 select-none">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                         <span className="font-medium">City Ford</span>
                         <span className="text-red-500 text-xs font-bold">Hiring 3 Techs</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                         <span className="font-medium">Texas Toyota</span>
                         <span className="text-red-500 text-xs font-bold">Hiring 1 Advisor</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="font-medium">AutoNation</span>
                         <span className="text-slate-400 text-xs">No Openings</span>
                      </div>
                   </div>

                   {/* Lock Overlay */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 z-10">
                      <div className="bg-slate-900 text-white p-2 rounded-full mb-3 shadow-lg">
                         <Lock className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Unlock Competitor Data</p>
                      <button className="mt-2 text-xs font-medium text-indigo-700 hover:underline">Upgrade to Premium</button>
                   </div>
                </div>

             </div>

          </div>
        </main>
      </div>
    </div>
  );
}