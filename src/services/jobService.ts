import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * Fetches the main pipeline data including nested bucket counts
 * Implements priority filtering to prevent keyword overlap
 */
export const fetchPipelineData = async (supabase: SupabaseClient): Promise<PipelineData> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required");

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  const clientCompanyId = profile?.company_id;
  if (!clientCompanyId) throw new Error("No company associated with this account");

  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      status,
      created_at,
      income_min,
      income_max,
      recruiterflow_id,
      company:companies(id, name, slug),
      contractLength:contract_lengths(length, interval, label),
      job_titles(title),
      applicantPipeline:applicant_pipelines(
        statusBuckets:applicant_pipeline_status_buckets(
          id,
          name,
          bucket_count:applicant_status_bucket_applicant(count)
        )
      )
    `)
    .eq('company_id', clientCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const formattedJobs = (data || []).map(job => {
    const buckets = job.applicantPipeline?.[0]?.statusBuckets || [];
    const stats = { applied: 0, qualified: 0, notQualified: 0 };

    buckets.forEach((bucket: any) => {
      const count = bucket.bucket_count?.[0]?.count || 0;
      const bucketName = (bucket.name || "").toLowerCase();

      // Priority Logic: Check Rejected keywords FIRST
      const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => bucketName.includes(s));
      const isQualified = !isRejected && ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => bucketName.includes(s));

      if (isQualified) {
        stats.qualified += count;
      } else if (isRejected) {
        stats.notQualified += count;
      } else {
        stats.applied += count;
      }
    });

    const joinedTitle = Array.isArray(job.job_titles) ? job.job_titles[0]?.title : (job.job_titles as any)?.title;

    return {
      ...job,
      title: job.title || joinedTitle || "Untitled Position",
      stats
    };
  });

  return { jobs: formattedJobs };
};

/**
 * Fetches ALL unique applicants for the company
 * Uses Map to prevent duplicate rows in the table
 */
export const fetchAllCompanyApplicants = async (supabase: SupabaseClient) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      applicant:applicants (
        id, first_name, last_name, email, mobile, resume_url, created_at
      ),
      bucket:applicant_pipeline_status_buckets (
        name,
        pipeline:applicant_pipelines (
          job:job_postings (company_id)
        )
      )
    `)
    .eq('bucket.pipeline.job.company_id', companyId);

  if (error) throw error;

  const uniqueMap = new Map();
  (data || []).forEach((item: any) => {
    const app = item.applicant;
    if (!app || uniqueMap.has(app.id)) return;

    const bucketName = (item.bucket?.name || "").toLowerCase();
    let status: 'New' | 'Working' | 'Hot' = 'Working';
    if (['applied', 'new'].some(s => bucketName.includes(s))) status = 'New';
    else if (['interview', 'offer', 'vetted', 'hot'].some(s => bucketName.includes(s))) status = 'Hot';

    uniqueMap.set(app.id, {
      id: app.id,
      name: `${app.first_name} ${app.last_name}`,
      email: app.email,
      phone: app.mobile || "N/A",
      resume_url: app.resume_url,
      source: "Direct Application",
      status: status,
      lastContact: new Date(app.created_at).toLocaleDateString(),
      company_id: companyId
    });
  });

  return Array.from(uniqueMap.values());
};

/**
 * Fetches applicants for a specific bucket category (Applied/Qualified/Rejected)
 * Includes de-duplication to prevent double-listing
 */
export const fetchApplicantsByBucket = async (supabase: SupabaseClient, job: any, bucketType: string) => {
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  
  const targetBucketIds = allBuckets
    .filter((b: any) => {
      const name = b.name.toLowerCase();
      const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => name.includes(s));
      const isQualified = !isRejected && ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => name.includes(s));
      
      if (bucketType === 'qualified') return isQualified;
      if (bucketType === 'not-qualified') return isRejected;
      return !isQualified && !isRejected;
    })
    .map((b: any) => b.id);

  if (targetBucketIds.length === 0) return [];

  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      applicant:applicants (
        id, first_name, last_name, email, mobile, resume_url, created_at, recruiterflow_id
      )
    `)
    .in('status_bucket_id', targetBucketIds);

  if (error) throw error;

  const uniqueMap = new Map();
  (data || []).forEach((item: any) => {
    if (item.applicant && !uniqueMap.has(item.applicant.id)) {
      uniqueMap.set(item.applicant.id, {
        ...item.applicant,
        full_name: `${item.applicant.first_name} ${item.applicant.last_name}`
      });
    }
  });

  return Array.from(uniqueMap.values());
};

/**
 * Moves an applicant to a new bucket
 * Targets specific junction record to prevent duplicates
 */
export const moveApplicantBucket = async (supabase: SupabaseClient, applicantId: string, newBucketId: string) => {
  // Find the existing specific junction record
  const { data: existing } = await supabase
    .from('applicant_status_bucket_applicant')
    .select('id')
    .eq('applicant_id', applicantId)
    .limit(1)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('applicant_status_bucket_applicant')
      .update({ status_bucket_id: newBucketId })
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    // If no record exists (fallback), create one
    const { data, error } = await supabase
      .from('applicant_status_bucket_applicant')
      .insert({ applicant_id: applicantId, status_bucket_id: newBucketId })
      .select();
    if (error) throw error;
    return data;
  }
};

/**
 * Fetches all scheduled interviews for the company calendar
 */
export const fetchScheduledInterviews = async (supabase: SupabaseClient) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      id,
      interview_date,
      applicant:applicants (id, first_name, last_name, email),
      bucket:applicant_pipeline_status_buckets (
        name,
        pipeline:applicant_pipelines (
          job:job_postings (title, company_id)
        )
      )
    `)
    .not('interview_date', 'is', null);

  if (error) throw error;

  const uniqueInterviews = new Map();
  (data || []).forEach((item: any) => {
    if (item.bucket?.pipeline?.job?.company_id === companyId && !uniqueInterviews.has(item.applicant.id)) {
      uniqueInterviews.set(item.applicant.id, {
        id: item.id,
        title: `${item.applicant.first_name} ${item.applicant.last_name}`,
        jobTitle: item.bucket?.pipeline?.job?.title || "General Application",
        date: new Date(item.interview_date),
        email: item.applicant.email
      });
    }
  });

  return Array.from(uniqueInterviews.values());
};

/**
 * Updates job posting metadata
 */
export const updateJobInfo = async (supabase: SupabaseClient, jobId: string, updates: any) => {
  const { data, error } = await supabase
    .from('job_postings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select();
  if (error) throw error;
  return data;
};