'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  StickyNote, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  XCircle
} from 'lucide-react';
import AddNoteForm from './AddNoteForm';
import SMSWindow from '@/components/SMSWindow'; // Ensure this path is correct
import { createClient } from '@/utils/supabase/client';
import { moveApplicantBucket } from '@/services/jobService';

/* ---------- TYPES ---------- */
export type ActivityItem = { id: string; type: 'note' | 'call' | 'sms' | 'email' | 'status' | 'task'; title: string; description?: string; timestamp: string; meta?: any; };
export type Message = { id: string; from: 'lead' | 'agent'; channel: 'sms' | 'email'; body: string; timestamp: string; };
export type CallLog = { id: string; direction: 'inbound' | 'outbound'; outcome: 'answered' | 'missed' | 'voicemail'; timestamp: string; duration: string; notes?: string; };
export type DocumentItem = { id: string; name: string; type: string; uploadedAt: string; };

export type LeadProfileProps = {
  lead: {
    id: string; name: string; status: string; source: string; resume_url?: string; priceRange?: string; journeyStage?: string; tags: string[]; labels: string[]; location?: string; email: string; phone: string; createdAt: string; lastContact: string; nextTask?: string; notes?: string; activity: ActivityItem[]; messages: Message[]; calls: CallLog[]; documents: DocumentItem[];
    company_id: number; // Added to ensure SMS works
    navigation?: {
      prevId: string | null;
      nextId: string | null;
      currentIndex: number;
      totalCount: number;
      bucket: string;
      jobId: string;
    };
  };
};

const TABS = ['Timeline', 'Notes', 'Messages', 'Calls', 'Documents'] as const;
type Tab = (typeof TABS)[number];

const HIRING_STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'not-qualified', label: 'Not Qualified' }
];

/* ---------- MAIN COMPONENT ---------- */
export default function LeadProfile({ lead }: LeadProfileProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<Tab>('Timeline');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false); // SMS Modal State
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(lead.status);

  const nav = lead.navigation || {
    prevId: null, nextId: null, currentIndex: 0, totalCount: 0, bucket: 'applied', jobId: ''
  };

  useEffect(() => {
    setCurrentStatus(lead.status);
  }, [lead.status, lead.id]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && nav.prevId) {
        router.push(`/dashboard/leads/${nav.prevId}?bucket=${nav.bucket}&jobId=${nav.jobId}`);
      } else if (e.key === 'ArrowRight' && nav.nextId) {
        router.push(`/dashboard/leads/${nav.nextId}?bucket=${nav.bucket}&jobId=${nav.jobId}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nav, router]);

  const handleMoveStage = async (stageId: string) => {
    if (movingTo || !nav.jobId) return;
    const originalStatus = currentStatus;
    setCurrentStatus(stageId.replace('-', ' '));
    setMovingTo(stageId);
    
    try {
      const { data: job } = await supabase
        .from('job_postings')
        .select('*, applicantPipeline:applicant_pipelines(statusBuckets:applicant_pipeline_status_buckets(*))')
        .eq('id', nav.jobId)
        .single();

      const targetBucket = job?.applicantPipeline?.[0]?.statusBuckets?.find(
        (b: any) => (b.name || "").toLowerCase().includes(stageId.toLowerCase().replace('-', ' '))
      );

      if (targetBucket) {
        await moveApplicantBucket(supabase, lead.id, targetBucket.id);
        router.push(`/dashboard/leads/${lead.id}?bucket=${stageId}&jobId=${nav.jobId}`, { scroll: false });
        router.refresh(); 
      } else {
        alert(`Stage "${stageId}" not found.`);
        setCurrentStatus(originalStatus);
      }
    } catch (err) {
      console.error("Move Error:", err);
      setCurrentStatus(originalStatus);
    } finally {
      setMovingTo(null);
    }
  };

  const handleViewResume = () => {
    if (lead.resume_url) window.open(lead.resume_url, '_blank', 'noopener,noreferrer');
    else alert('No resume URL found.');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      
      {/* --- QUICK SMS MODAL --- */}
      {showSMSModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-blue-600">Quick SMS: {lead.name}</h3>
              <button onClick={() => setShowSMSModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-2">
                <SMSWindow applicant={{ id: lead.id, mobile: lead.phone }} companyId={lead.company_id} />
            </div>
          </div>
        </div>
      )}

      {/* --- NAVIGATION HEADER --- */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
            <ListFilter size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Queue Context</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
              {(nav.bucket || 'Queue').replace('-', ' ')} <span className="text-slate-400 dark:text-slate-600 font-medium mx-1">/</span> {lead.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {nav.totalCount > 0 ? nav.currentIndex + 1 : 0} <span className="text-slate-400 dark:text-slate-600 font-medium">of</span> {nav.totalCount}
          </span>
          <div className="flex gap-2">
            <Link href={nav.prevId ? `/dashboard/leads/${nav.prevId}?bucket=${nav.bucket}&jobId=${nav.jobId}` : '#'} className={`p-2 rounded-xl border transition-all ${nav.prevId ? 'bg-white dark:bg-slate-800 border-slate-200 hover:bg-slate-50 text-slate-600 dark:text-slate-300' : 'opacity-50 cursor-not-allowed text-slate-300'}`}><ChevronLeft size={16} /></Link>
            <Link href={nav.nextId ? `/dashboard/leads/${nav.nextId}?bucket=${nav.bucket}&jobId=${nav.jobId}` : '#'} className={`p-2 rounded-xl border transition-all ${nav.nextId ? 'bg-white dark:bg-slate-800 border-slate-200 hover:bg-slate-50 text-slate-600 dark:text-slate-300' : 'opacity-50 cursor-not-allowed text-slate-300'}`}><ChevronRight size={16} /></Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-6 h-full relative text-slate-900 dark:text-white">
        
        {showInterviewModal && <ScheduleInterviewModal leadName={lead.name} onClose={() => setShowInterviewModal(false)} />}

        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col gap-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Candidate Profile</span>
                    <h2 className="text-3xl font-black tracking-tight">{lead.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1"><Mail size={12}/> {lead.email}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-xs text-slate-500 font-bold">Source: {lead.source}</span>
                    </div>
                </div>

                <div className="relative min-w-[300px] md:min-w-[380px] px-2">
                  <div className="absolute top-[17px] left-8 right-8 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full" />
                  <div className="relative flex justify-between">
                    {HIRING_STAGES.map((stage) => {
                      const statusNorm = (currentStatus || '').toLowerCase();
                      const stageMatch = stage.id.replace('-', ' ');
                      const isCurrent = statusNorm.includes(stageMatch);
                      const isRejected = stage.id === 'not-qualified';
                      return (
                        <div key={stage.id} className="flex flex-col items-center group">
                          <button
                            onClick={() => handleMoveStage(stage.id)}
                            disabled={!!movingTo}
                            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-[3px] shadow-sm ${
                              isCurrent 
                                ? (isRejected ? 'bg-red-600 border-white dark:border-slate-900' : 'bg-orange-600 border-white dark:border-slate-900')
                                : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900 hover:bg-slate-300'
                            }`}
                          >
                            {movingTo === stage.id ? <Loader2 size={16} className="animate-spin text-white" /> : <CheckCircle2 size={16} className={isCurrent ? 'text-white' : 'text-slate-500'} />}
                          </button>
                          <span className={`mt-3 text-[11px] font-bold uppercase tracking-wide ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50 dark:border-slate-800/50">
              <span className={`inline-flex items-center rounded-lg px-3 py-1 font-black uppercase tracking-tighter border text-[10px] ${ (currentStatus || '').toLowerCase().includes('not qualified') ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }`}>
                {currentStatus || 'Applied'}
              </span>
              {(lead.tags || []).map((tag) => (
                <span key={tag} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-slate-500 dark:text-slate-400 font-bold text-[10px]">{tag}</span>
              ))}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-bold ml-auto uppercase tracking-tighter"><Clock size={12} /> {lead.lastContact}</span>
            </div>
          </div>

          {showNoteForm && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2"><StickyNote size={14} /> New Internal Note</h3>
                <button onClick={() => setShowNoteForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
              <AddNoteForm applicantId={lead.id} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 flex flex-col min-h-[520px] shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200">
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 text-xs rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-100 text-slate-900 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'Timeline' && <TimelineView activity={lead.activity} />}
              {activeTab === 'Notes' && <NotesView notes={lead.activity.filter(a => a.type === 'note')} />}
              {activeTab === 'Messages' && <SMSWindow applicant={{ id: lead.id, mobile: lead.phone }} companyId={lead.company_id} />}
              {activeTab === 'Calls' && <CallsView calls={lead.calls} />}
              {activeTab === 'Documents' && <DocumentsView documents={lead.documents} />}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">Contact Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col"><span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Email</span><span className="text-slate-700 dark:text-slate-200 truncate font-bold">{lead.email}</span></div>
              <div className="flex flex-col"><span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Phone</span><span className="text-slate-700 dark:text-slate-200 font-bold">{lead.phone}</span></div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Applied {lead.createdAt}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-black">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              <button className="w-full px-4 py-2.5 text-xs rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"><Phone size={14} /> CALL NOW</button>
              
              <button onClick={() => setShowNoteForm(!showNoteForm)} className={`w-full px-4 py-2.5 text-xs rounded-xl font-black transition-all flex items-center justify-center gap-2 border ${showNoteForm ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700'}`}><StickyNote size={14} /> {showNoteForm ? 'CANCEL NOTE' : 'LOG A NOTE'}</button>

              <button onClick={() => setShowSMSModal(true)} className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><MessageSquare size={14} /> SEND SMS</button>
              
              <button className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><Mail size={14} /> SEND EMAIL</button>

              <button onClick={() => setShowInterviewModal(true)} className="w-full px-4 py-2.5 text-xs rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-black hover:bg-blue-100 flex items-center justify-center gap-2 transition-all shadow-sm"><Calendar size={14} /> SCHEDULE INTERVIEW</button>

              <button onClick={handleViewResume} className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black hover:bg-slate-50 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"><FileText size={14} /> VIEW RESUME</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --- SUB-VIEW COMPONENTS --- */

function TimelineView({ activity }: { activity: ActivityItem[] }) {
  if (!activity || activity.length === 0) return <EmptyState message="No activity recorded yet." />;
  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-slate-200 dark:before:bg-slate-800/60 transition-colors">
      {activity.map((item) => (
        <div key={item.id} className="relative flex items-start pl-8 group">
          <div className="absolute left-0 mt-1.5 h-5 w-5 -translate-x-1/2 rounded-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-blue-500 transition-all">
            <div className={`h-1.5 w-1.5 rounded-full ${item.type === 'note' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-500'}`} />
          </div>
          <div className="flex-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 hover:bg-white dark:hover:bg-slate-900/60 transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${item.type === 'note' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{item.type}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{item.timestamp}</span>
            </div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{item.title}</h4>
            {item.description && <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesView({ notes }: { notes: ActivityItem[] }) {
  if (!notes || notes.length === 0) return <EmptyState message="No internal notes found." />;
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1 tracking-widest font-black"><StickyNote size={10} /> {note.title}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{note.timestamp}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-medium leading-relaxed">{note.description}</p>
        </div>
      ))}
    </div>
  );
}

function CallsView({ calls }: { calls: CallLog[] }) {
  if (!calls || calls.length === 0) return <EmptyState message="No call logs available." />;
  return (
    <div className="grid gap-3">
      {calls.map((call) => (
        <div key={call.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${call.direction === 'outbound' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>{call.direction}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{call.timestamp}</span>
          </div>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200 capitalize">{call.outcome}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-widest">Duration: {call.duration}</p>
        </div>
      ))}
    </div>
  );
}

function DocumentsView({ documents }: { documents: DocumentItem[] }) {
  if (!documents || documents.length === 0) return <EmptyState message="No files uploaded." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-colors">
      {documents.map((doc) => (
        <div key={doc.id} className="group rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 hover:bg-white dark:hover:bg-slate-800/40 transition-all cursor-pointer shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group-hover:text-blue-600 shadow-sm transition-colors"><FileText size={20} /></div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate pr-2 uppercase tracking-tight">{doc.name}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">{doc.uploadedAt}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10">
      <p className="text-xs font-bold italic uppercase tracking-widest">{message}</p>
    </div>
  );
}

function ScheduleInterviewModal({ leadName, onClose }: { leadName: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white"><Calendar className="text-blue-500" size={20} /> Schedule Interview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <p className="text-sm dark:text-slate-300">Scheduling with <span className="font-black dark:text-white">{leadName}</span>.</p>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-1 px-1">Select Date & Time</label>
            <input type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold dark:text-white" />
          </div>
          <button onClick={() => { alert("Feature coming soon.."); onClose(); }} className="w-full mt-4 py-3.5 bg-blue-600 text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Confirm</button>
        </div>
      </div>
    </div>
  );
}