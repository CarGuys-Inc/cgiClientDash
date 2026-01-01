"use client";

import React, { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { 
  Search, MapPin, Wrench, Briefcase, Filter, CheckCircle, 
  UserPlus, Lock, MessageSquare, Send, X, CreditCard, ChevronRight, ArrowLeft 
} from 'lucide-react';

// --- Types ---
interface Candidate {
  id: string;
  name: string;
  role: string;
  location: string;
  experience: number; 
  certifications: string[];
  skills: string[];
  status: 'Active' | 'Passive' | 'Hired';
  matchScore: number; 
  avatarUrl?: string;
  salaryExpectation: string;
  lastActive?: string;
}

// --- Mock Data ---
const MOCK_CANDIDATES: Candidate[] = [
  { id: '1', name: 'David Rodriguez', role: 'Master Technician', location: 'Dallas, TX', experience: 12, certifications: ['ASE Master', 'L1 Advanced', 'Ford Senior Master'], skills: ['Diesel', 'Electrical', 'Diagnostics'], status: 'Active', matchScore: 98, salaryExpectation: '$45-50/hr' },
  { id: '2', name: 'Sarah Chen', role: 'Service Advisor', location: 'Fort Worth, TX', experience: 5, certifications: ['ASE C1'], skills: ['CDK Drive', 'Customer Service', 'Warranty Processing'], status: 'Passive', matchScore: 85, salaryExpectation: '$75k/yr + Commission' },
  { id: '3', name: 'Mike Kowalski', role: 'Lube Technician', location: 'Plano, TX', experience: 2, certifications: ['G1 Maintenance'], skills: ['Oil Changes', 'Tire Rotation', 'MPI'], status: 'Active', matchScore: 72, salaryExpectation: '$18-22/hr' },
  { id: '4', name: 'James Wilson', role: 'Parts Manager', location: 'Dallas, TX', experience: 15, certifications: [], skills: ['Inventory Management', 'Wholesale', 'Reynolds & Reynolds'], status: 'Active', matchScore: 65, salaryExpectation: '$85k/yr' },
  { id: '5', name: 'Robert Miller', role: 'B-Level Technician', location: 'Arlington, TX', experience: 6, certifications: ['ASE A1-A4'], skills: ['Brakes', 'Suspension', 'Alignments'], status: 'Passive', matchScore: 90, salaryExpectation: '$30-35/hr' },
];

export default function CandidateSearchPage() {
  // --- State for Filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [minExp, setMinExp] = useState<number>(0);
  const [isSubscriber, setIsSubscriber] = useState(true); 
  
  // --- Modal & Payment State ---
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<'compose' | 'payment'>('compose');
  const [messageBody, setMessageBody] = useState("Hi {{name}}, I saw your profile and have a great opening at City Ford. Are you free to chat?");
  const [paymentMethod, setPaymentMethod] = useState<'saved' | 'new'>('saved');

  // --- Filter Logic ---
  const filteredCandidates = MOCK_CANDIDATES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'All' || c.role.includes(selectedRole);
    const matchesExp = c.experience >= minExp;
    return matchesSearch && matchesRole && matchesExp;
  });

  // Calculate Cost
  const costPerLead = 2.00;
  const totalCost = (filteredCandidates.length * costPerLead).toFixed(2);

  const handleFinalPayment = () => {
    alert(`Payment of $${totalCost} successful! Campaign sent.`);
    setShowBulkModal(false);
    setBulkStep('compose'); 
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar 
          title="Candidate Database" 
          subtitle="Search and invite pre-screened automotive talent."
        />

        <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* --- LEFT FILTER SIDEBAR --- */}
          <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto z-10 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedRole('All'); setMinExp(0);}}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="e.g. Diesel, CDK, BMW..." 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Job Role</label>
              <div className="space-y-2">
                {['All', 'Technician', 'Service Advisor', 'Parts', 'Management'].map((role) => (
                  <label key={role} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className={`text-sm ${selectedRole === role ? 'text-indigo-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {role === 'All' ? 'All Roles' : role}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</label>
                <span className="text-xs font-medium text-slate-700">{minExp}+ Years</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1" 
                value={minExp}
                onChange={(e) => setMinExp(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Entry</span>
                <span>Master</span>
              </div>
            </div>

             {/* Certifications (Checkboxes) */}
             <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Certifications</label>
              <div className="space-y-2">
                {['ASE Master', 'L1 Advanced', 'Manufacturer Certified', 'State Inspector'].map((cert) => (
                  <label key={cert} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-600">{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subscription Upsell Visual for Demo */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${isSubscriber ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => setIsSubscriber(!isSubscriber)}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isSubscriber ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs font-semibold text-indigo-900">Admin: Toggle Sub Status</span>
               </div>
               <p className="text-[10px] text-indigo-700 leading-tight">
                  Click toggle to test how the UI looks for non-paying users (blurred data).
               </p>
            </div>
          </aside>


          {/* --- RIGHT CONTENT AREA --- */}
          <section className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-8">
            
            {/* Header Stats & Bulk Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    {filteredCandidates.length} Active Candidates
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Technicians and advisors in your area matching your criteria.
                </p>
              </div>
              <div className="flex items-center gap-2">
                
                {/* --- MESSAGE ALL BUTTON --- */}
                {isSubscriber && filteredCandidates.length > 0 && (
                   <button 
                     onClick={() => setShowBulkModal(true)}
                     className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
                   >
                     <MessageSquare className="w-4 h-4" /> 
                     Message All ({filteredCandidates.length})
                   </button>
                )}

                <div className="hidden md:flex">
                  <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer">
                    <option>Sort by: Match Score</option>
                    <option>Sort by: Newest</option>
                    <option>Sort by: Experience</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredCandidates.map((candidate) => (
                <div 
                  key={candidate.id} 
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  
                  {/* --- Header Row --- */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-200">
                         {candidate.name.charAt(0)}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                          {isSubscriber ? candidate.name : "Candidate Locked"}
                          {!isSubscriber && <Lock className="w-4 h-4 text-slate-400" />}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{candidate.role}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>{candidate.experience} Yrs Exp</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Match Score Badge */}
                    <div className="flex flex-col items-end">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        candidate.matchScore > 90 ? 'bg-green-100 text-green-700' : 
                        candidate.matchScore > 75 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {candidate.matchScore}% Match
                      </div>
                      <span className="text-xs text-slate-400 mt-1">{candidate.lastActive || 'Active today'}</span>
                    </div>
                  </div>

                  {/* --- Info Grid --- */}
                  <div className={`grid grid-cols-2 gap-y-3 gap-x-4 mb-5 ${!isSubscriber ? 'blur-sm select-none' : ''}`}>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Location</p>
                        <p className="text-sm text-slate-700 font-medium">{candidate.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Salary Target</p>
                        <p className="text-sm text-slate-700 font-medium">{candidate.salaryExpectation}</p>
                      </div>
                    </div>
                  </div>

                  {/* --- Tags --- */}
                  <div className={`flex flex-wrap gap-2 mb-6 ${!isSubscriber ? 'blur-sm select-none' : ''}`}>
                    {candidate.certifications.map((cert) => (
                      <span key={cert} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-100 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {cert}
                      </span>
                    ))}
                    {candidate.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded border border-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* --- Actions --- */}
                  <div className="border-t border-slate-100 pt-4 flex gap-3">
                    {isSubscriber ? (
                      <>
                        <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                           <UserPlus className="w-4 h-4" /> Invite to Apply
                        </button>
                        <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                           View Profile
                        </button>
                      </>
                    ) : (
                      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg">
                         <Lock className="w-4 h-4" /> Upgrade to Unlock Candidates
                      </button>
                    )}
                  </div>

                  {/* Paywall Overlay */}
                  {!isSubscriber && (
                    <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[1px] flex items-center justify-center"></div>
                  )}

                </div>
              ))}
            </div>
          </section>

          {/* --- BULK MESSAGE & PAYMENT MODAL --- */}
          {showBulkModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                 
                 {/* Modal Header */}
                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       {bulkStep === 'compose' ? (
                         <><MessageSquare className="w-4 h-4 text-indigo-600" /> Compose Blast</>
                       ) : (
                         <><CreditCard className="w-4 h-4 text-indigo-600" /> Checkout</>
                       )}
                    </h3>
                    <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                       <X className="w-5 h-5" />
                    </button>
                 </div>
                 
                 {/* --- STEP 1: COMPOSE --- */}
                 {bulkStep === 'compose' && (
                   <div className="p-6">
                      <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 rounded-lg text-indigo-700 text-sm font-medium border border-indigo-100">
                         <UserPlus className="w-4 h-4" />
                         Messaging <span className="font-bold underline">{filteredCandidates.length} candidates</span>.
                      </div>

                      <div className="mb-4">
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Message Template</label>
                         <textarea 
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                         />
                         <p className="text-[10px] text-slate-400 mt-1">Estimated Cost: ${totalCost} ({filteredCandidates.length} leads x ${costPerLead.toFixed(2)})</p>
                      </div>

                      <div className="flex justify-end gap-2">
                         <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                            Cancel
                         </button>
                         <button 
                            onClick={() => setBulkStep('payment')} 
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                         >
                            Next: Payment <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 )}

                 {/* --- STEP 2: PAYMENT --- */}
                 {bulkStep === 'payment' && (
                   <div className="p-6">
                      
                      {/* Order Summary */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Order Summary</h4>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-600">Campaign Blast ({filteredCandidates.length} leads)</span>
                          <span className="font-medium text-slate-900">${totalCost}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-2">
                           <span className="text-slate-600">Processing Fee</span>
                           <span className="font-medium text-slate-900">$0.00</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                           <span className="font-bold text-slate-800">Total Due</span>
                           <span className="font-bold text-indigo-600 text-lg">${totalCost}</span>
                        </div>
                      </div>

                      {/* Payment Selection */}
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Payment Method</h4>
                      <div className="space-y-3 mb-6">
                         
                         {/* Option 1: Saved Card */}
                         <label className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'saved' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input 
                               type="radio" 
                               name="payment" 
                               checked={paymentMethod === 'saved'} 
                               onChange={() => setPaymentMethod('saved')}
                               className="w-4 h-4 text-indigo-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                               <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                               <div>
                                  <p className="text-sm font-bold text-slate-800">Visa ending in 4242</p>
                                  <p className="text-xs text-slate-500">Expires 12/28</p>
                               </div>
                            </div>
                         </label>

                         {/* Option 2: New Card */}
                         <label className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'new' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input 
                               type="radio" 
                               name="payment" 
                               checked={paymentMethod === 'new'} 
                               onChange={() => setPaymentMethod('new')}
                               className="w-4 h-4 text-indigo-600"
                            />
                            <span className="text-sm font-medium text-slate-700">Add New Card</span>
                         </label>

                         {/* New Card Form (Conditional) */}
                         {paymentMethod === 'new' && (
                            <div className="pl-8 pt-1 space-y-3 animate-in slide-in-from-top-2 duration-200">
                               <input type="text" placeholder="Card Number" className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500" />
                               <div className="flex gap-3">
                                  <input type="text" placeholder="MM / YY" className="w-1/2 p-2 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500" />
                                  <input type="text" placeholder="CVC" className="w-1/2 p-2 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500" />
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center">
                         <button 
                            onClick={() => setBulkStep('compose')} 
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-medium"
                         >
                            <ArrowLeft className="w-4 h-4" /> Back
                         </button>
                         <button 
                            onClick={handleFinalPayment} 
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors"
                         >
                            <Lock className="w-4 h-4" /> Pay ${totalCost} & Send
                         </button>
                      </div>
                   </div>
                 )}

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}