// dashboard/leads/[id]/page.tsx
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import LeadProfile from '@/components/LeadProfile';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { fetchApplicantsByBucket } from '@/services/jobService';

export default async function LeadDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bucket?: string; jobId?: string }>;
}) {
  const { id } = await params;
  const { bucket, jobId } = await searchParams;
  const supabase = await createClient();

  // 1. Fetch current Applicant core info
  const { data: applicant, error } = await supabase
    .from('applicants')
    .select('*, resume_url')
    .eq('id', id)
    .single();

  if (error || !applicant) return notFound();

  // 2. FETCH THE QUEUE (Reconstructing the list for navigation)
  let idList: string[] = [];
  
  if (bucket && jobId) {
    const { data: jobData } = await supabase
      .from('job_postings')
      .select('*, applicantPipeline:applicant_pipelines(statusBuckets:applicant_pipeline_status_buckets(*))')
      .eq('id', jobId)
      .single();

    if (jobData) {
      // Re-use standard service to ensure the order matches the drawer
      const applicantsInBucket = await fetchApplicantsByBucket(supabase, jobData, bucket);
      idList = applicantsInBucket.map((a: any) => a.id);
    }
  }

  // 3. Calculate Neighbors
  const currentIndex = idList.indexOf(id);
  const prevId = currentIndex > 0 ? idList[currentIndex - 1] : null;
  const nextId = currentIndex < idList.length - 1 && currentIndex !== -1 ? idList[currentIndex + 1] : null;

  // 4. Fetch Activity (standard logic)
  const [messagesRes, callsRes, notesRes] = await Promise.all([
    supabase.from('messages').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
    supabase.from('calls').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
    supabase.from('client_dashboard_notes').select('*').eq('applicant_id', id).order('created_at', { ascending: false }),
  ]);

  // 5. Map to LeadProfileProps
  const leadData = {
    ...applicant,
    name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim(),
    email: applicant.email,
    phone: applicant.mobile,
    // Import the bucket from the URL to set the current status/stage highlight
    status: bucket ? bucket.replace('-', ' ') : (applicant.stage || 'applied'),
    tags: applicant.tags || [],
    labels: applicant.labels || [],
    messages: (messagesRes.data || []),
    calls: (callsRes.data || []),
    
    // Combine everything into activity feed
    activity: [
      ...(notesRes.data || []).map(n => ({
        id: n.id,
        type: 'note' as const,
        title: 'Internal Note',
        description: n.body,
        timestamp: new Date(n.created_at).toLocaleString(),
      })),
      // ... messages/calls mapping as per existing logic
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    
    navigation: {
      prevId,
      nextId,
      currentIndex: currentIndex === -1 ? 0 : currentIndex,
      totalCount: idList.length,
      bucket: bucket || 'applied',
      jobId: jobId || ''
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={leadData.name} subtitle={leadData.email} />
        <main className="flex-1 p-6 overflow-auto bg-slate-950/50 custom-scrollbar">
          <LeadProfile lead={leadData as any} />
        </main>
      </div>
    </div>
  );
}