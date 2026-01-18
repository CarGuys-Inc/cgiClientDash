'use client';

import { useState } from 'react';
import { 
  Plus, 
  Phone, 
  MessageSquare, 
  Mail, 
  StickyNote, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import AddNoteForm from './AddNoteForm';

/* ---------- TYPES ---------- */

export type ActivityItem = {
  id: string;
  type: 'note' | 'call' | 'sms' | 'email' | 'status' | 'task';
  title: string;
  description?: string;
  timestamp: string;
  meta?: string;
};

export type Message = {
  id: string;
  from: 'lead' | 'agent';
  channel: 'sms' | 'email';
  body: string;
  timestamp: string;
};

export type CallLog = {
  id: string;
  direction: 'inbound' | 'outbound';
  outcome: 'answered' | 'missed' | 'voicemail';
  timestamp: string;
  duration: string;
  notes?: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
};

export type LeadProfileProps = {
  lead: {
    id: string;
    name: string;
    status: string;
    source: string;
    resume_url?: string;
    priceRange?: string;
    journeyStage?: string;
    tags: string[];
    labels: string[];
    location?: string;
    email: string;
    phone: string;
    createdAt: string;
    lastContact: string;
    nextTask?: string;
    notes?: string;
    activity: ActivityItem[];
    messages: Message[];
    calls: CallLog[];
    documents: DocumentItem[];
  };
};

// ADDED 'Notes' TO TABS
const TABS = ['Timeline', 'Notes', 'Messages', 'Calls', 'Documents'] as const;
type Tab = (typeof TABS)[number];

/* ---------- MAIN COMPONENT ---------- */

export default function LeadProfile({ lead }: LeadProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Timeline');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const handleViewResume = () => {
    if (lead.resume_url) {
      window.open(lead.resume_url, '_blank', 'noopener,noreferrer');
    } else {
      alert('No resume URL found for this applicant.');
    }
  };
  
  // Filter out only the note-type activities for the Notes tab
  const onlyNotes = lead.activity.filter(item => item.type === 'note');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 h-full">
      
      {/* LEFT COLUMN: Summary & Main Content */}
      <section className="space-y-4">
        
        {/* Profile Summary Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">{lead.name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {lead.priceRange && `${lead.priceRange} • `}
                {lead.journeyStage ?? 'Lead details'}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                Source: <span className="text-slate-300 font-medium">{lead.source}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {lead.status}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock size={12} /> {lead.lastContact}
              </span>
            </div>
          </div>

          {/* Badges Section */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {lead.tags.map((tag) => (
              <span key={tag} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
                {tag}
              </span>
            ))}
            {lead.labels.map((label) => (
              <span key={label} className="rounded-md bg-emerald-500/10 border border-emerald-500/40 px-2 py-1 text-emerald-200">
                {label}
              </span>
            ))}
          </div>

          {lead.notes && (
            <div className="border-t border-slate-800 pt-3 mt-1">
              <p className="text-xs text-slate-400 italic leading-relaxed">
                "{lead.notes}"
              </p>
            </div>
          )}
        </div>

        {/* --- DYNAMIC NOTE FORM --- */}
        {showNoteForm && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <StickyNote size={14} /> Internal Note
              </h3>
              <button 
                onClick={() => setShowNoteForm(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <AddNoteForm applicantId={lead.id} />
          </div>
        )}

        {/* Main Tabs Container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col min-h-[520px] shadow-2xl overflow-hidden">
          {/* Tab Header Navigation */}
          <div className="border-b border-slate-800 px-4 py-3 bg-slate-900/40">
            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
              {TABS.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'Timeline' && <TimelineView activity={lead.activity} />}
            {activeTab === 'Notes' && <NotesView notes={onlyNotes} />}
            {activeTab === 'Messages' && <MessagesView messages={lead.messages} />}
            {activeTab === 'Calls' && <CallsView calls={lead.calls} />}
            {activeTab === 'Documents' && <DocumentsView documents={lead.documents} />}
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: Sidebar Details */}
      <aside className="space-y-4">
        {/* Contact Info Block */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">Email</span>
              <span className="text-slate-200 truncate">{lead.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">Phone</span>
              <span className="text-slate-200">{lead.phone}</span>
            </div>
            {lead.location && (
              <div className="flex flex-col">
                <span className="text-slate-500 text-[10px] uppercase">Location</span>
                <span className="text-slate-200">{lead.location}</span>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Joined {lead.createdAt}
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Actions</h3>
          <div className="flex flex-col gap-2.5">
            <button className="w-full px-4 py-2 text-xs rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
              <Phone size={14} /> Call Now
            </button>
            
            <button 
              onClick={() => setShowNoteForm(!showNoteForm)}
              className={`w-full px-4 py-2 text-xs rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${
                showNoteForm 
                ? 'bg-white text-slate-950 border-white' 
                : 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
              }`}
            >
              <StickyNote size={14} /> {showNoteForm ? 'Cancel Note' : 'Log a Note'}
            </button>

            <button className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <MessageSquare size={14} /> Send SMS
            </button>
            
            <button className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Mail size={14} /> Send Email
            </button>

            {/* UPDATED RESUME BUTTON */}
            <button 
              onClick={handleViewResume}
              className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={14} /> View Resume
            </button>
          </div>

          {lead.nextTask && (
            <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Next Task
              </p>
              <p className="text-xs text-slate-200">{lead.nextTask}</p>
            </div>
          )}
        </div>

      </aside>
    </div>
  );
}

/* ---------- SUB-VIEW COMPONENTS ---------- */

function TimelineView({ activity }: { activity: ActivityItem[] }) {
  if (!activity.length) return <EmptyState message="No activity recorded yet." />;

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-slate-800/60">
      {activity.map((item) => (
        <div key={item.id} className="relative flex items-start pl-8 group">
          <div className="absolute left-0 mt-1.5 h-5 w-5 -translate-x-1/2 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-500 group-hover:bg-emerald-400" />
          </div>
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-900/60 transition-all shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
                {item.type}
              </span>
              <span className="text-[10px] text-slate-500">{item.timestamp}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
            {item.description && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>}
            {item.meta && <p className="text-[10px] text-slate-600 mt-2 font-mono">{item.meta}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// NEW SUB-VIEW FOR NOTES ONLY
function NotesView({ notes }: { notes: ActivityItem[] }) {
  if (!notes.length) return <EmptyState message="No internal notes found." />;

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
              <StickyNote size={10} /> {note.title}
            </span>
            <span className="text-[10px] text-slate-500">{note.timestamp}</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {note.description}
          </p>
          {note.meta && (
            <p className="mt-2 text-[9px] text-slate-600 font-mono">
              {note.meta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MessagesView({ messages }: { messages: Message[] }) {
  if (!messages.length) return <EmptyState message="No messages found." />;

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isAgent = msg.from === 'agent';
        return (
          <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
              isAgent ? 'bg-emerald-500 text-slate-950 rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none'
            }`}>
              <p className="text-xs whitespace-pre-wrap font-medium">{msg.body}</p>
              <div className={`mt-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-tighter ${
                isAgent ? 'text-slate-900/60' : 'text-slate-500'
              }`}>
                {msg.channel} • {msg.timestamp}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CallsView({ calls }: { calls: CallLog[] }) {
  if (!calls.length) return <EmptyState message="No call logs available." />;

  return (
    <div className="grid gap-3">
      {calls.map((call) => (
        <div key={call.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              call.direction === 'outbound' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {call.direction}
            </span>
            <span className="text-[10px] text-slate-500">{call.timestamp}</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-slate-200 capitalize">{call.outcome}</p>
              <p className="text-[10px] text-slate-500 mt-1">Duration: {call.duration}</p>
            </div>
            {call.notes && <div className="text-[11px] text-slate-400 max-w-[60%] text-right italic">"{call.notes}"</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsView({ documents }: { documents: DocumentItem[] }) {
  if (!documents.length) return <EmptyState message="No files uploaded." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {documents.map((doc) => (
        <div key={doc.id} className="group relative rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:bg-slate-800/40 transition-all cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:text-emerald-400 transition-colors">
              <FileText size={20} />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-200 truncate pr-4">{doc.name}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{doc.type} • {doc.uploadedAt}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800/50 rounded-2xl">
      <p className="text-xs font-medium italic">{message}</p>
    </div>
  );
}