import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * Fetches the main pipeline data based on the job_applications table.
 * Groups applicant counts by job_posting_id and categorizes them into buckets.
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

  // Main query: Fetch jobs and their nested applications from the centralized table
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
      applications:job_applications (
        id,
        status_bucket:applicant_pipeline_status_buckets (id, name)
      ),
      applicantPipeline:applicant_pipelines(
        statusBuckets:applicant_pipeline_status_buckets(id, name)
      )
    `)
    .eq('company_id', clientCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const formattedJobs = (data || []).map(job => {
    const stats = { applied: 0, qualified: 0, notQualified: 0 };
    
    // Logic: Iterate through applications specific to this job
    job.applications?.forEach((app: any) => {
      const bucketName = (app.status_bucket?.name || "").toLowerCase();

      const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => bucketName.includes(s));
      const isQualified = !isRejected && ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => bucketName.includes(s));

      if (isQualified) {
        stats.qualified++;
      } else if (isRejected) {
        stats.notQualified++;
      } else {
        stats.applied++;
      }
    });

    return {
      ...job,
      stats
    };
  });

  return { jobs: formattedJobs };
};

/**
 * Fetches applicants for a specific bucket category (Applied/Qualified/Rejected)
 * querying directly from the job_applications table.
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
    .from('job_applications')
    .select(`
      id,
      created_at,
      applicant:applicants (
        id, first_name, last_name, email, mobile, resume_url, recruiterflow_id
      )
    `)
    .eq('job_posting_id', job.id)
    .in('status_bucket_id', targetBucketIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item.applicant,
    application_id: item.id,
    full_name: `${item.applicant.first_name} ${item.applicant.last_name}`
  }));
};

/**
 * Moves an applicant to a new bucket by updating the job_applications record.
 */
export const moveApplicantBucket = async (supabase: SupabaseClient, applicantId: string, newBucketId: string) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status_bucket_id: newBucketId })
    .eq('applicant_id', applicantId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Fetches ALL applicants for a company across all their job postings.
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
    .from('job_applications')
    .select(`
      id,
      created_at,
      applicant:applicants (
        id, first_name, last_name, email, mobile, resume_url
      ),
      status_bucket:applicant_pipeline_status_buckets (name)
    `)
    .eq('company_id', companyId);

  if (error) throw error;

  return (data || []).map((item: any) => {
    const bucketName = (item.status_bucket?.name || "").toLowerCase();
    let status: 'New' | 'Working' | 'Hot' = 'Working';
    if (['applied', 'new'].some(s => bucketName.includes(s))) status = 'New';
    else if (['interview', 'offer', 'vetted', 'hot'].some(s => bucketName.includes(s))) status = 'Hot';

    return {
      id: item.applicant.id,
      name: `${item.applicant.first_name} ${item.applicant.last_name}`,
      email: item.applicant.email,
      phone: item.applicant.mobile || "N/A",
      resume_url: item.applicant.resume_url,
      status: status,
      lastContact: new Date(item.created_at).toLocaleDateString(),
      company_id: companyId
    };
  });
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