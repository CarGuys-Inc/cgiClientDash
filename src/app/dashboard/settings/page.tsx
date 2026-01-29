'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import NumberPicker from "@/components/NumberPicker"; // Ensure this component is created
import { createClient } from '@/utils/supabase/client';
import { 
  User, Lock, Bell, CreditCard, Globe, Save, ChevronRight, 
  LogOut, Loader2, UserPlus, ShieldCheck, Mail, Smartphone,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { inviteClientUser } from '@/app/actions/inviteUser';
import { onboardTwilioCompany } from '@/app/actions/twilioOnboarding';

type SettingSection = 'profile' | 'account' | 'billing' | 'security' | 'add-user' | 'sms-onboarding';

export default function SettingsPage() {
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile, company, AND twilio config in one go
    const { data: profile } = await supabase
      .from('client_profiles')
      .select(`
        *, 
        companies (*, company_twilio_configs (*))
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (profile) {
      setUserData(profile);
      setCompany(profile.companies);
      // Now you have company.company_twilio_configs[0].registration_status
    }
    setLoading(false);
  }
  loadData();
}, [supabase]);

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { id: 'billing', label: 'Billing & Plans', icon: <CreditCard size={18} /> },
    { id: 'sms-onboarding', label: 'SMS Compliance', icon: <Smartphone size={18} /> },
    { id: 'add-user', label: 'Team Management', icon: <UserPlus size={18} /> },
  ];

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar title="Settings" subtitle="Manage your team and platform configuration." />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            
            <aside className="w-full md:w-64 shrink-0">
              <nav className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as SettingSection)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      activeSection === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">{item.icon} {item.label}</div>
                    <ChevronRight size={14} className={activeSection === item.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
              
              {activeSection === 'profile' && (
                <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-black mb-6">Profile Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="First Name" defaultValue={userData?.first_name} />
                    <InputField label="Last Name" defaultValue={userData?.last_name} />
                    <InputField label="Email" defaultValue={userData?.email} disabled />
                  </div>
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black">Contract & Billing</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {company?.contract_type || 'Standard'}
                    </span>
                  </div>
                  <div className="bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Renewal Date</p>
                      <p className="text-2xl font-black mt-1">{company?.contract_end_date || 'Month-to-Month'}</p>
                    </div>
                    <ShieldCheck size={40} className="text-blue-500" />
                  </div>
                </div>
              )}

              {activeSection === 'sms-onboarding' && (
                <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                   {company?.twilio_registration_status === 'approved' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <CheckCircle2 className="text-emerald-500" size={24} />
                           <h3 className="text-xl font-black">Business Verified</h3>
                        </div>
                        <p className="text-sm text-slate-500">Step 2: Select your business phone number.</p>
                        <NumberPicker companyId={company.id} />
                      </div>
                   ) : (
                      <SMSOnboardingSection company={company} />
                   )}
                </div>
              )}

              {activeSection === 'add-user' && (
                <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-black mb-6">Invite Team Member</h3>
                  <AddUserForm companyId={company?.id} />
                </div>
              )}

              {activeSection === 'profile' && (
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t flex justify-end">
                  <button onClick={() => setIsSaving(true)} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Profile
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

/* --- TWILIO ONBOARDING COMPONENT --- */
function SMSOnboardingSection({ company }: { company: any }) {
  const [loading, setLoading] = useState(false);

  if (company?.twilio_registration_status === 'pending') {
    return (
      <div className="text-center space-y-4">
        <Clock className="mx-auto text-amber-500" size={48} />
        <h4 className="text-xl font-black">Registration Pending</h4>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Twilio is currently vetting your business details. This usually takes 3-5 business days. 
          You will be notified here once approved.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.target));
    
    // Ensure the phone number is in E.164 format (simple version)
    if (data.repPhone && !String(data.repPhone).startsWith('+')) {
      data.repPhone = `+1${data.repPhone.toString().replace(/\D/g, '')}`;
    }

    const res = await onboardTwilioCompany(company.id, data);
    if (res.error) {
      alert(`Onboarding Error: ${res.error}`);
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Smartphone size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black">A2P 10DLC Registration</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Carrier Compliance Required</p>
        </div>
      </div>

      {/* SECTION 1: Business Details */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Business Identity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Legal Business Name" name="businessName" placeholder="As it appears on tax docs" required />
          <InputField label="Tax ID (EIN)" name="ein" placeholder="12-3456789" required />
          <SelectField label="Business Type" name="businessType" required options={[
            "Partnership", "Limited Liability Corporation", "Non Profit Corporation", "Public Corporation", "Private Corporation"
          ]} />
          <SelectField label="Industry" name="industry" required options={[
            "AUTOMOTIVE", "RETAIL", "TECHNOLOGY", "HEALTHCARE", "EDUCATION", "HOSPITALITY"
          ]} />
          <InputField label="Business Website" name="website" placeholder="https://www.yourdealership.com" required />
          <InputField label="Regions of Operation" name="regions" defaultValue="USA_AND_CANADA" disabled />
        </div>
      </div>

      {/* SECTION 2: Physical Address */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Physical Address (No P.O. Boxes)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField label="Street Address" name="street" required />
          </div>
          <InputField label="City" name="city" required />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="State / Province" name="state" placeholder="NY" required />
            <InputField label="Zip / Postal Code" name="zipcode" required />
          </div>
        </div>
      </div>

      {/* SECTION 3: Authorized Representative */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Authorized Representative</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="First Name" name="repFirstName" required />
          <InputField label="Last Name" name="repLastName" required />
          <InputField label="Email Address" name="repEmail" type="email" required />
          <InputField label="Mobile Phone" name="repPhone" placeholder="555-123-4567" required />
          <InputField label="Business Title" name="repTitle" placeholder="Owner" required />
          <InputField label="Job Position" name="repPosition" placeholder="CEO" required />
        </div>
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-black hover:shadow-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
        Submit for Official Review
      </button>
    </form>
  );
}

/* --- REUSABLE SELECT --- */
function SelectField({ label, name, options, required }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">{label}</label>
      <select 
        name={name} 
        required={required}
        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white appearance-none"
      >
        <option value="">Select {label}...</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

/* --- ADD USER FORM --- */
function AddUserForm({ companyId }: { companyId: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const result = await inviteClientUser({
      email: formData.get('email') as string,
      companyId,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    });
    if (result.success) setSuccess(true);
    else alert(result.error);
    setLoading(false);
  };

  if (success) return (
    <div className="text-center p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
      <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
      <h4 className="text-lg font-black">Invite Sent!</h4>
      <button onClick={() => setSuccess(false)} className="text-blue-600 font-bold text-xs mt-2 underline">Invite another</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" name="firstName" required />
        <InputField label="Last Name" name="lastName" required />
      </div>
      <InputField label="Email Address" name="email" type="email" required />
      <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-blue-700">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
        Send Invitation
      </button>
    </form>
  );
}

/* --- REUSABLE INPUT --- */
function InputField({ label, name, defaultValue, type = "text", disabled, required, placeholder }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-1">{label}</label>
      <input 
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
      />
    </div>
  );
}