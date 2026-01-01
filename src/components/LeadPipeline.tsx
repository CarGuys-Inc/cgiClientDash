'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  Plus, DollarSign, Clock, GripVertical, 
  Briefcase, ChevronDown, ArrowUpRight, Loader2, AlertCircle
} from 'lucide-react';

// --- 1. Types ---

type Stage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

interface Job {
  id: string;
  title: string;
  status: string;
}

interface Applicant {
  id: string;
  job_title_id: string; // Updated to match your schema
  name: string;
  source: string;
  expected_pay: string;
  stage: Stage;
  last_activity: string;
  match_score: number; 
}

const STAGES: Stage[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const STAGE_CONFIG: Record<Stage, { color: string, border: string }> = {
  'Applied':   { color: 'bg-slate-100', border: 'border-slate-200' },
  'Screening': { color: 'bg-blue-50',   border: 'border-blue-200' },
  'Interview': { color: 'bg-indigo-50', border: 'border-indigo-200' },
  'Offer':     { color: 'bg-amber-50',  border: 'border-amber-200' },
  'Hired':     { color: 'bg-emerald-50', border: 'border-emerald-200' },
  'Rejected':  { color: 'bg-red-50',    border: 'border-red-200' },
};

export default function JobPipeline() {
  const supabase = createClient();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 1. Fetch Job Titles
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('job_titles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setJobs(data);
          setSelectedJobId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching job_titles:", err);
        setLoading(false);
      }
    };
    fetchJobs();
  }, [supabase]);

  // 2. Fetch Applicants for Selected Job
  useEffect(() => {
    if (!selectedJobId) return;

    const fetchApplicants = async () => {
      setLoading(true);
      try {
        console.log("🔍 Fetching applicants for job_title_id:", selectedJobId);
        
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .eq('job_title_id', selectedJobId); // Matching your DB column name

        if (error) throw error;
        
        console.log("✅ Data received:", data);
        setApplicants(data || []);
      } catch (err) {
        console.error("Error fetching applicants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [selectedJobId, supabase]);

  const currentJob = jobs.find(j => j.id === selectedJobId);

  // 3. Columns Logic
  const columns = useMemo(() => {
    const cols: Record<Stage, Applicant[]> = {
      Applied: [], Screening: [], Interview: [], Offer: [], Hired: [], Rejected: []
    };
    applicants.forEach(app => {
      // Logic check: ensuring the DB stage matches the code stages exactly
      if (cols[app.stage]) {
        cols[app.stage].push(app);
      } else {
        console.warn(`⚠️ Applicant ${app.name} has unknown stage: ${app.stage}`);
      }
    });
    return cols;
  }, [applicants]);

  // --- Handlers ---

  const onDragStart = (id: string) => setDraggedId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = async (newStage: Stage) => {
    if (!draggedId) return;

    const prevApplicants = [...applicants];
    setApplicants(prev => prev.map(a => 
      a.id === draggedId ? { ...a, stage: newStage, last_activity: new Date().toISOString() } : a
    ));
    setDraggedId(null);

    const { error } = await supabase
      .from('applicants')
      .update({ stage: newStage, last_activity: new Date().toISOString() })
      .eq('id', draggedId);

    if (error) {
      console.error("Update failed:", error.message);
      setApplicants(prevApplicants);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Loading Database...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
             <Briefcase className="w-5 h-5" />
          </div>
          <div>
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Pipeline:</label>
             <div className="relative group">
                <select 
                  value={selectedJobId} 
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="appearance-none bg-transparent font-bold text-lg text-slate-800 pr-8 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${currentJob?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {currentJob?.status || 'Active'}
            </span>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Add Candidate
            </button>
        </div>
      </div>

      {/* --- KANBAN --- */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max h-full">
          {STAGES.map((stage) => {
            const items = columns[stage];
            const config = STAGE_CONFIG[stage];

            return (
              <div 
                key={stage}
                onDragOver={onDragOver}
                onDrop={() => onDrop(stage)}
                className={`flex flex-col w-80 rounded-xl border ${config.border} ${config.color} bg-opacity-30 h-full max-h-full transition-colors`}
              >
                <div className="p-3 flex items-center justify-between border-b border-white/50 bg-white/40 rounded-t-xl">
                  <h3 className="font-bold text-sm text-slate-800">{stage}</h3>
                  <span className="bg-white text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-100">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                  {items.map((applicant) => (
                    <div
                      key={applicant.id}
                      draggable
                      onDragStart={() => onDragStart(applicant.id)}
                      className="group bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-indigo-300 transition-all relative"
                    >
                      <div className="absolute top-4 right-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className="mb-3">
                        <h4 className="font-bold text-slate-800 text-sm">{applicant.name}</h4>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                          Source: {applicant.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                         <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                            <DollarSign className="w-3 h-3 text-slate-400" />
                            <span className="font-bold">{applicant.expected_pay}</span>
                         </div>
                         {applicant.match_score > 85 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                               {applicant.match_score}% Match
                            </span>
                         )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{applicant.last_activity ? new Date(applicant.last_activity).toLocaleDateString() : 'New'}</span>
                         </div>
                         
                         <Link 
                            href={`/dashboard/leads/${applicant.id}`}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                         >
                            View Profile <ArrowUpRight className="w-3 h-3" />
                         </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}