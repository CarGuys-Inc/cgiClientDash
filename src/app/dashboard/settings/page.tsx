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
  Save,
  ChevronRight,
  LogOut,
  Loader2,
  UserPlus,
  Mail,
  UserCheck
} from 'lucide-react';
import { inviteClientUser } from '@/app/actions/inviteUser'; // Ensure this path is correct

// Updated Type to include 'add-user'
type SettingSection = 'profile' | 'account' | 'notifications' | 'billing' | 'security' | 'add-user';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // 1. Updated Menu Items with consistent IDs
  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'account', label: 'Account Settings', icon: <Globe size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard size={18} /> },
    { id: 'add-user', label: 'Add User', icon: <UserPlus size={18} /> },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Account Settings" subtitle="Manage your profile and team preferences." />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            
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

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
              
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
                  </div>
                </div>
              )}

              {/* Add User Section (NEW) */}
              {activeSection === 'add-user' && (
                <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">Invite Team Member</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Add a new user to your company account.</p>
                    </div>
                  </div>
                  
                  {/* We pass a mock companyId for now - replace with your actual session company_id */}
                  <AddUserForm companyId={1} /> 
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
                </div>
              )}

              {/* FOOTER ACTIONS - Only show for general profile/account settings */}
              {activeSection !== 'add-user' && (
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t dark:border-slate-800 flex justify-between items-center">
                  <p className="text-xs text-slate-400 italic">Last update: 2 hours ago</p>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving Changes...' : 'Save All Changes'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

/* NEW ADD USER FORM COMPONENT */
function AddUserForm({ companyId }: { companyId: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    const result = await inviteClientUser({ email, companyId, firstName, lastName });

    if (result.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "Failed to send invitation.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-8 rounded-3xl text-center space-y-4">
        <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600">
          <UserCheck size={32} />
        </div>
        <h4 className="text-xl font-black text-slate-900 dark:text-white">Invitation Sent!</h4>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">We've sent an invite email. They will appear in your team once they accept.</p>
        <button onClick={() => setSuccess(false)} className="text-blue-600 font-bold text-sm">Invite another person</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 px-1">First Name</label>
          <input name="firstName" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm" placeholder="Jane" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 px-1">Last Name</label>
          <input name="lastName" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm" placeholder="Smith" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 px-1">Email Address</label>
        <div className="relative">
          <input name="email" type="email" required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all shadow-sm" placeholder="jane@example.com" />
          <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 font-bold px-1 italic">! {error}</p>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
        {loading ? 'Sending Invite...' : 'Send Invitation Email'}
      </button>
    </form>
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

/* ICONS */
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