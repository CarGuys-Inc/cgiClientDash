'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchPipelineData, updateJobInfo } from '@/services/jobService';
import { 
  Search, Plus, Info, MoreVertical, Calendar, 
  RotateCcw, Loader2, Building2, Check, X, DollarSign, Settings2, Edit3
} from 'lucide-react';

// --- Types ---
interface Job {
  id: string;
  title: string; // This will now be populated by the service
  status: string;
  created_at: string;
  income_min?: number;
  income_max?: number;
  description?: string;
  job_title_id?: string;
}

interface Applicant {
  id: string;
  job_id?: string;
  job_title_id?: string;
  stage: string;
}

export default function JobPipeline() {
  const supabase = createClient();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('OPEN JOBS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [supabase]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await fetchPipelineData(supabase);
      setJobs(data.jobs || []);
      setApplicants(data.applicants || []);
    } catch (err: any) {
      setError(err.message || "Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (job: Job) => {
    setSelectedJob({ ...job });
    setIsModalOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    try {
      setIsSaving(true);
      // Note: We update 'title' in 'job_postings' if the user edits it in the modal
      await updateJobInfo(supabase, selectedJob.id, {
        title: selectedJob.title,
        status: selectedJob.status,
        income_min: selectedJob.income_min,
        income_max: selectedJob.income_max,
      });
      
      setJobs(jobs.map(j => j.id === selectedJob.id ? selectedJob : j));
      setIsModalOpen(false);
    } catch (err) {
      alert("Error updating job. Please check your permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const jobStats = useMemo(() => {
    const stats: Record<string, { applied: number, qualified: number, notQualified: number }> = {};
    jobs.forEach(job => {
      const jobApps = applicants.filter(a => (a.job_id === job.id || a.job_title_id === job.id));
      stats[job.id] = {
        applied: jobApps.length,
        qualified: jobApps.filter(a => ['Interview', 'Offer', 'Hired'].includes(a.stage || '')).length,
        notQualified: jobApps.filter(a => a.stage === 'Rejected').length
      };
    });
    return stats;
  }, [jobs, applicants]);

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-blue-50/50 p-1 rounded-lg border border-blue-100">
          {['OPEN JOBS', 'PAUSED JOBS', 'CLOSED JOBS', 'ALL JOBS'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-wider transition-all rounded-md ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search jobs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Active Job Pipelines
          </h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> POST NEW JOB
          </button>
        </div>

        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold text-gray-800">{job.title}</h3>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-200">
                    {job.status || 'open'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-blue-500"><DollarSign className="w-3.5 h-3.5" /> Comp: {job.income_min ? `${job.income_min/1000}k - ${job.income_max ? job.income_max/1000 : '?'}k` : 'Not Set'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <button 
                  onClick={() => handleOpenModal(job)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors"
                >
                  <Settings2 className="w-4 h-4" /> EDIT JOB INFO
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-300"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Applied</p>
                <p className="text-3xl font-black text-gray-900">{jobStats[job.id]?.applied || 0}</p>
              </div>
              <div className="text-center border-x border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Qualified</p>
                <p className="text-3xl font-black text-blue-600">{jobStats[job.id]?.qualified || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Not Qualified</p>
                <p className="text-3xl font-black text-gray-400">{jobStats[job.id]?.notQualified || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- EDIT MODAL OVERLAY --- */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" /> Edit Job Details
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Job Title</label>
                <input 
                  type="text" 
                  value={selectedJob.title}
                  onChange={(e) => setSelectedJob({...selectedJob, title: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <select 
                    value={selectedJob.status}
                    onChange={(e) => setSelectedJob({...selectedJob, status: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 outline-none appearance-none"
                  >
                    <option value="open">OPEN</option>
                    <option value="paused">PAUSED</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider text-blue-500">Min Pay ($)</label>
                  <input 
                    type="number" 
                    value={selectedJob.income_min || 0}
                    onChange={(e) => setSelectedJob({...selectedJob, income_min: Number(e.target.value)})}
                    className="w-full p-4 rounded-2xl bg-blue-50 border-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider text-blue-500">Max Pay ($)</label>
                <input 
                  type="number" 
                  value={selectedJob.income_max || 0}
                  onChange={(e) => setSelectedJob({...selectedJob, income_max: Number(e.target.value)})}
                  className="w-full p-4 rounded-2xl bg-blue-50 border-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                CANCEL
              </button>
              <button 
                disabled={isSaving}
                onClick={handleUpdateJob}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}