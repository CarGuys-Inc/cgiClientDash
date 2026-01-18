import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import LeadProfile, { type LeadProfileProps } from '@/components/LeadProfile';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Applicant Core Info (Including resume_url)
  const { data: applicant, error: applicantError } = await supabase
    .from('applicants')
    .select('*, resume_url')
    .eq('id', id)
    .single();

  // Handle case where ID doesn't exist
  if (applicantError || !applicant) {
    return notFound();
  }

  // 2. Fetch all secondary activity linked to this applicant_id
  const [messagesRes, callsRes, notesRes] = await Promise.all([
    supabase.from('messages').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
    supabase.from('calls').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
    supabase.from('client_dashboard_notes').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
  ]);

  // 3. Map Data to LeadProfileProps structure
  const leadData = {
    id: applicant.id,
    name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || "Unnamed Lead",
    email: applicant.email || "No Email",
    phone: applicant.mobile || "No Phone",
    status: applicant.stage || 'New Lead',
    source: applicant.source || 'Direct',
    location: applicant.location || 'Unknown',
    createdAt: applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : 'N/A',
    lastContact: applicant.last_activity ? new Date(applicant.last_activity).toLocaleDateString() : 'New', 
    
    // --- FIXED: ADDED RESUME URL TO THE MAPPED DATA ---
    resume_url: applicant.resume_url || null, 

    // Defensive fallbacks for arrays
    tags: applicant.tags || [],
    labels: applicant.labels || [],
    documents: applicant.documents || [],
    journeyStage: applicant.journey_stage || 'Discovery',
    priceRange: applicant.price_range || 'N/A',
    notes: applicant.general_notes || '',

    // Messages Mapping
    messages: (messagesRes.data || []).map(m => ({
      id: m.id,
      from: m.direction === 'inbound' ? 'lead' : 'agent',
      channel: m.type || 'sms',
      body: m.body,
      timestamp: new Date(m.created_at).toLocaleString(),
    })),

    // Calls Mapping
    calls: (callsRes.data || []).map(c => ({
      id: c.id,
      direction: c.direction,
      outcome: c.outcome,
      timestamp: new Date(c.created_at).toLocaleString(),
      duration: c.duration || '0 min',
      notes: c.notes || '',
    })),

    // Activity Feed (Combining everything chronologically)
    activity: [
      ...(notesRes.data || []).map(n => ({
        id: n.id,
        type: 'note',
        title: 'Internal Note',
        description: n.body,
        timestamp: new Date(n.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        meta: 'Team Note',
      })),
      ...(messagesRes.data || []).map(m => ({
        id: m.id,
        type: 'sms',
        title: m.direction === 'inbound' ? 'Lead: Message received' : 'You: Sent message',
        description: m.body,
        timestamp: new Date(m.created_at).toLocaleString(),
      })),
      ...(callsRes.data || []).map(c => ({
        id: c.id,
        type: 'call',
        title: `Call: ${c.direction}`,
        description: `Outcome: ${c.outcome}. ${c.notes || ''}`,
        timestamp: new Date(c.created_at).toLocaleString(),
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-background)]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title={leadData.name}
          subtitle={`${leadData.email} · ${leadData.status}`}
        />
        <main className="flex-1 p-6 overflow-auto bg-slate-950/50">
          <LeadProfile lead={leadData as any} />
        </main>
      </div>
    </div>
  );
}