'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  fetchPipelineData, 
  updateJobInfo, 
  fetchApplicantsByBucket, 
  moveApplicantBucket 
} from '@/services/jobService';
import { 
  Search, Plus, MoreVertical, Calendar, Loader2, 
  Building2, X, DollarSign, Settings2, Edit3, ChevronRight, 
  Mail, RefreshCw, Inbox, UserCircle
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  income_min?: number;
  income_max?: number;
  recruiterflow_id?: string;
  applicantPipeline?: any[];
  company?: { name: string };
  stats?: {
    applied: number;
    qualified: number;
    notQualified: number;
  };
}

export default function JobPipeline() {
  const supabase = createClient();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('OPEN JOBS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeBucket, setActiveBucket] = useState<{label: string, title: string, job: Job} | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [supabase]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await fetchPipelineData(supabase);
      const fetchedJobs = data.jobs || [];
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0 && fetchedJobs[0].company?.name) {
        setCompanyName(fetchedJobs[0].company.name);
      }
    } catch (err: any) {
      console.error("Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async (job: Job, bucketLabel: string) => {
    setActiveBucket({ label: bucketLabel, title: job.title, job });
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData([]); 
    
    try {
      const type = bucketLabel.toLowerCase().replace(' ', '-');
      const data = await fetchApplicantsByBucket(supabase, job, type);
      setDrawerData(data);
    } catch (err: any) {
      console.error("Detailed Fetch Error:", err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleMove = async (e: React.ChangeEvent<HTMLSelectElement>, applicantId: string, newBucketId: string) => {
    e.stopPropagation();
    if (!newBucketId) return;
    setMovingId(applicantId);
    try {
      await moveApplicantBucket(supabase, applicantId, newBucketId);
      setDrawerData(prev => prev.filter(a => a.id !== applicantId));
      const data = await fetchPipelineData(supabase);
      setJobs(data.jobs || []);
    } catch (err) {
      alert("Failed to move candidate. Please try again.");
    } finally {
      setMovingId(null);
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (job?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'OPEN JOBS') return matchesSearch && job.status === 'open';
    if (activeTab === 'CLOSED JOBS') return matchesSearch && job.status === 'closed';
    return matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading Pipeline...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans overflow-x-hidden transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          {['OPEN JOBS', 'CLOSED JOBS', 'ALL JOBS'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search jobs" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-400 outline-none text-slate-600 dark:text-slate-300 placeholder-slate-400 shadow-sm" 
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> 
            {companyName ? `${companyName} - Jobs` : 'Active Job Pipelines'}
          </h2>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Link 
          href="/add-job-checkout"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
          >
         <Plus className="w-4 h-4" /> Add Additional Job
            </Link>
          </button>
        </div>

        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{job.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${job.status === 'closed' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'}`}>{job.status || 'open'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400"><DollarSign className="w-3.5 h-3.5" /> Comp: {job.income_min ? `${job.income_min/1000}k - ${job.income_max ? job.income_max/1000 : '?'}k` : 'Not Set'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button onClick={() => { setSelectedJob(job); setIsModalOpen(true); }} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors">
                    <Settings2 className="w-4 h-4" /> EDIT JOB INFO
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Link 
          href="/add-job-checkout"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
          >
         <Plus className="w-4 h-4" /> Swap Job
            </Link>
          </button>

          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Link 
          href="/add-job-checkout"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
          >
         <Plus className="w-4 h-4" /> Cancel Job
            </Link>
          </button>

                  </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                <button onClick={() => handleOpenDrawer(job, 'Applied')} className="text-center hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl group transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-500">Applied</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{job.stats?.applied || 0}</p>
                </button>
                <button onClick={() => handleOpenDrawer(job, 'Qualified')} className="text-center border-x border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl group transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-blue-600">Qualified</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-500">{job.stats?.qualified || 0}</p>
                </button>
                <button onClick={() => handleOpenDrawer(job, 'Not Qualified')} className="text-center hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl group transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-red-500">Not Qualified</p>
                  <p className="text-3xl font-black text-slate-400 dark:text-slate-600">{job.stats?.notQualified || 0}</p>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
              <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No jobs found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px] text-center">
              We couldn't find any jobs matching your current criteria.
            </p>
          </div>
        )}
      </div>

      {/* --- APPLICANT DRAWER --- */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 ${drawerOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{activeBucket?.label}</h2>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-bold">{activeBucket?.title}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : (
                drawerData.map((item) => (
                  <div 
                    key={item.id} 
  onClick={() => {
    // 1. Get current bucket label (e.g. "Applied") or fallback to "queue"
    const bucketLabel = activeBucket?.label?.toLowerCase()?.replace(' ', '-') || 'queue';
    
    // 2. Get current Job ID or fallback to empty string
    const jobId = activeBucket?.job?.id || '';

    router.push(`/dashboard/leads/${item.id}?bucket=${bucketLabel}&jobId=${jobId}`);
  }}
  className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col gap-4 cursor-pointer relative"
>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {item.first_name?.charAt(0)}{item.last_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 justify-between">
                           <p className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{item.full_name}</p>
                           <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-blue-600" />
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate"><Mail className="w-3 h-3" /> {item.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase mb-1 block">Move to Stage</label>
                        <select 
                          disabled={movingId === item.id}
                          onClick={(e) => e.stopPropagation()} 
                          onChange={(e) => handleMove(e, item.id, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none text-[11px] font-bold text-blue-600 dark:text-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none p-2 cursor-pointer"
                          value=""
                        >
                          <option value="" disabled>Select a stage...</option>
                          {activeBucket?.job?.applicantPipeline?.[0]?.statusBuckets.map((bucket: any) => (
                            <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
                          ))}
                        </select>
                      </div>
                      {movingId === item.id && <RefreshCw className="w-4 h-4 animate-spin text-blue-500 ml-3 self-end mb-2" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 border dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-500" /> Edit Job Details
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-6 h-6"/></button>
             </div>

             <div className="space-y-4 mb-8">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Job Title</label>
                 <input 
                   type="text" 
                   value={selectedJob.title}
                   onChange={(e) => setSelectedJob({...selectedJob, title: e.target.value})}
                   className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200 outline-none"
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
                   <select 
                     value={selectedJob.status}
                     onChange={(e) => setSelectedJob({...selectedJob, status: e.target.value})}
                     className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200 outline-none"
                   >
                     <option value="open">OPEN</option>
                     <option value="closed">CLOSED</option>
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Min Pay ($)</label>
                   <input 
                     type="number" 
                     value={selectedJob.income_min || 0}
                     onChange={(e) => setSelectedJob({...selectedJob, income_min: Number(e.target.value)})}
                     className="w-full p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 dark:text-blue-400 outline-none"
                   />
                 </div>
               </div>
             </div>

             <div className="flex gap-3">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors">CANCEL</button>
               <button 
                 onClick={handleUpdateJob} 
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center"
                 disabled={isSaving}
               >
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "SAVE CHANGES"}
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}