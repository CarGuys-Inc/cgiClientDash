'use client';

import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Globe, 
  ShieldCheck, 
  Save,
  ChevronRight,
  LogOut,
  Loader2,
  UserPlus
} from 'lucide-react';

type SettingSection = 'profile' | 'account' | 'notifications' | 'billing' | 'security';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'account', label: 'Account Settings', icon: <Globe size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard size={18} /> },
    { id: 'Add User', label: 'Add User', icon: <UserPlus size={18} /> },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500); // Simulate API call
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Account Settings" subtitle="Manage your profile and application preferences." />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            
            {/* LEFT SIDE: Navigation Menu */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as SettingSection)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeSection === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    <ChevronRight size={14} className={activeSection === item.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t dark:border-slate-800">
                   <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
                     <LogOut size={18} />
                     Sign Out
                   </button>
                </div>
              </nav>
            </aside>

            {/* RIGHT SIDE: Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              
              {/* Profile Section Content */}
              {activeSection === 'profile' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden">
                        <UserCircle size={60} />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white dark:border-slate-900 shadow-md hover:bg-blue-700 transition-colors">
                        <Edit3 size={14} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Profile Photo</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recommended: 400x400px. JPG or PNG.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="First Name" defaultValue="John" />
                    <InputField label="Last Name" defaultValue="Doe" />
                    <InputField label="Email Address" defaultValue="john@carguys.com" type="email" />
                    <InputField label="Phone Number" defaultValue="+1 (555) 000-0000" />
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Professional Bio</label>
                      <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] dark:text-white"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Section Content */}
              {activeSection === 'billing' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-black mb-6">Subscription Plan</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 flex justify-between items-center mb-8">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Current Plan</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">Enterprise Plus</p>
                      <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">Next billing date: Feb 15, 2026</p>
                    </div>
                    <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all">
                      Manage Subscription
                    </button>
                  </div>

                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Payment Methods</h3>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y dark:divide-slate-800">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded border dark:border-slate-700 flex items-center justify-center font-bold text-[10px]">VISA</div>
                        <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                      </div>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Default</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t dark:border-slate-800 flex justify-between items-center">
                <p className="text-xs text-slate-400 italic">Last profile update: 2 hours ago</p>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

/* REUSABLE INPUT COMPONENT */
function InputField({ label, defaultValue, type = "text" }: { label: string, defaultValue: string, type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 px-1">
        {label}
      </label>
      <input 
        type={type}
        defaultValue={defaultValue}
        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm"
      />
    </div>
  );
}

/* ICONS NOT IN LUCIDE CORE */
function UserCircle({ size, className }: { size: number, className?: string }) {
  return <User size={size} className={className} />;
}

function Edit3({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );
}