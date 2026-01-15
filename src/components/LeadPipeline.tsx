'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchPipelineData, updateJobInfo, fetchApplicantsByBucket } from '@/services/jobService';
import { 
  Search, Plus, Info, MoreVertical, Calendar, 
  RotateCcw, Loader2, Building2, Check, X, DollarSign, Settings2, Edit3, User, ChevronRight, Mail, Phone
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  income_min?: number;
  income_max?: number;
  recruiterflow_id?: string;
  applicantPipeline?: any[]; // To store the nested bucket IDs
  stats?: {
    applied: number;
    qualified: number;
    notQualified: number;
  };
}

export default function JobPipeline() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('OPEN JOBS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeBucket, setActiveBucket] = useState<{label: string, title: string} | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [supabase]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await fetchPipelineData(supabase);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async (job: Job, bucketLabel: string) => {
    setActiveBucket({ label: bucketLabel, title: job.title });
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData([]); // Clear previous data
    
    try {
      const type = bucketLabel.toLowerCase().replace(' ', '-');
      // Pass the whole job object so service can find bucket IDs
      const data = await fetchApplicantsByBucket(supabase, job, type);
      setDrawerData(data);
    } catch (err: any) {
      console.error("Detailed Fetch Error:", err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    try {
      setIsSaving(true);
      await updateJobInfo(supabase, selectedJob.id, {
        title: selectedJob.title,
        status: selectedJob.status,
        income_min: selectedJob.income_min,
        income_max: selectedJob.income_max,
      });
      setJobs(jobs.map(j => j.id === selectedJob.id ? selectedJob : j));
      setIsModalOpen(false);
    } catch (err) {
      alert("Error updating job.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    (job?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-sm text-gray-500 font-medium">Loading Pipeline...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans overflow-x-hidden">
      {/* Top Navigation */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-blue-50/50 p-1 rounded-lg border border-blue-100">
          {['OPEN JOBS', 'PAUSED JOBS', 'CLOSED JOBS', 'ALL JOBS'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-md ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{tab}</button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search jobs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-600" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> Active Job Pipelines
          </h2>
          <button className="bg-slate-200 hover:bg-slate-300 text-blue-600 px-4 py-2 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Add An Additional Job
          </button>
        </div>

        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold text-gray-800">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${job.status === 'closed' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-100 text-green-700 border-green-200'}`}>{job.status || 'open'}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-blue-500"><DollarSign className="w-3.5 h-3.5" /> Comp: {job.income_min ? `${job.income_min/1000}k - ${job.income_max ? job.income_max/1000 : '?'}k` : 'Not Set'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors">
                  <Settings2 className="w-4 h-4" /> EDIT JOB INFO
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-300"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-6">
              <button onClick={() => handleOpenDrawer(job, 'Applied')} className="text-center hover:bg-slate-50 p-2 rounded-xl group transition-colors">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500">Applied</p>
                <p className="text-3xl font-black text-gray-900">{job.stats?.applied || 0}</p>
              </button>
              <button onClick={() => handleOpenDrawer(job, 'Qualified')} className="text-center border-x border-gray-50 hover:bg-slate-50 p-2 rounded-xl group transition-colors">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">Qualified</p>
                <p className="text-3xl font-black text-blue-600">{job.stats?.qualified || 0}</p>
              </button>
              <button onClick={() => handleOpenDrawer(job, 'Not Qualified')} className="text-center hover:bg-slate-50 p-2 rounded-xl group transition-colors">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-red-500">Not Qualified</p>
                <p className="text-3xl font-black text-gray-400">{job.stats?.notQualified || 0}</p>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- APPLICANT DRAWER --- */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 ${drawerOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeBucket?.label}</h2>
                <p className="text-xs text-blue-500 font-bold">{activeBucket?.title}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : drawerData.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium italic">No candidates found in this category.</div>
              ) : (
                drawerData.map((item) => (
                  <div key={item.id} className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                        {item.first_name?.charAt(0)}{item.last_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{item.full_name}</p>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Mail className="w-3 h-3" /> {item.email}</span>
                          {item.phone && <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Phone className="w-3 h-3" /> {item.phone}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Logic (Existing) */}
      {/* ... (Same as your previous Edit Modal code) ... */}
    </div>
  );
}