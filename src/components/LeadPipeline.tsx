'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
// 1. Import the service logic
import { fetchPipelineData } from '@/services/jobService';
import { 
  Search, Plus, Info, MoreVertical, Calendar, 
  RotateCcw, Loader2, Building2 
} from 'lucide-react';

// --- Types ---
interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Applicant {
  id: string;
  job_title_id: string;
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

  // 2. Updated Fetch Logic using the Service
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchPipelineData(supabase);
        setJobs(data.jobs);
        setApplicants(data.applicants);
      } catch (err: any) {
        console.error("Pipeline Error:", err);
        setError(err.message || "Failed to load pipeline data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  // 3. Logic: Group metrics by Job ID
  const jobStats = useMemo(() => {
    const stats: Record<string, { applied: number, qualified: number, notQualified: number }> = {};
    
    jobs.forEach(job => {
      const jobApps = applicants.filter(a => a.job_title_id === job.id);
      stats[job.id] = {
        applied: jobApps.length,
        qualified: jobApps.filter(a => ['Interview', 'Offer', 'Hired'].includes(a.stage)).length,
        notQualified: jobApps.filter(a => a.stage === 'Rejected').length
      };
    });
    
    return stats;
  }, [jobs, applicants]);

  // 4. Filter Jobs based on search
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-red-600 font-bold mb-2">Something went wrong</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      {/* --- TOP NAVIGATION & SEARCH --- */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-blue-50/50 p-1 rounded-lg border border-blue-100">
          {['OPEN JOBS', 'PAUSED JOBS', 'CLOSED JOBS', 'ALL JOBS'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-wider transition-all rounded-md ${
                activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search jobs" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-600"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              All American Automotive Wichita
            </h2>
            <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl shadow-md transition-transform active:scale-95">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No jobs found matching your criteria.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-hover hover:shadow-md">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-gray-800">{job.title}</h3>
                      <RotateCcw className="w-4 h-4 text-blue-300 cursor-pointer" />
                      <div className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {job.status || 'open'}
                      </div>
                      <Info className="w-4 h-4 text-blue-400 cursor-help" />
                    </div>

                    <div className="flex items-center gap-4 text-[11px] flex-wrap">
                      <div className="flex items-center gap-1 font-bold text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" /> 
                        {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-red-400" /> 
                        Jan 12, 2026
                      </div>
                      <div className="text-green-600 font-bold bg-green-50/50 px-2 py-1 rounded-md border border-green-100/50">
                        14 Day PPD - Auto Renews Every 14 Days
                      </div>
                      <button className="p-1 hover:bg-gray-50 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-5">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied</p>
                      <p className="text-3xl font-black text-gray-900">{jobStats[job.id]?.applied || 0}</p>
                    </div>
                    <div className="text-center border-x border-gray-50">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qualified</p>
                      <p className="text-3xl font-black text-gray-900">{jobStats[job.id]?.qualified || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Not Qualified</p>
                      <p className="text-3xl font-black text-gray-900">{jobStats[job.id]?.notQualified || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}