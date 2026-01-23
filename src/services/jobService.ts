import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * Fetches the main pipeline data.
 * COMPLETELY DYNAMIC: Stats keys are generated solely from database records.
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
    // 1. Create a dynamic lookup of ALL valid buckets for this job's pipeline
    // This ensures we show buckets even if they have 0 applicants
    const stats: Record<string, number> = {};
    const pipelineBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
    
    pipelineBuckets.forEach((bucket: any) => {
      stats[bucket.name] = 0; 
    });

    // 2. Populate counts from current applications
    job.applications?.forEach((app: any) => {
      const bucketName = app.status_bucket?.name;
      if (bucketName !== undefined) {
        stats[bucketName] = (stats[bucketName] || 0) + 1;
      }
    });

    return {
      ...job,
      stats // Object keys are now exactly the names in your DB
    };
  });

  return { jobs: formattedJobs };
};

/**
 * Fetches applicants for ANY bucket name passed from the UI.
 */
export const fetchApplicantsByBucket = async (supabase: SupabaseClient, job: any, bucketName: string) => {
  // Find the database ID for the bucket name clicked in the dashboard
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  const targetBucket = allBuckets.find((b: any) => b.name === bucketName);

  if (!targetBucket) {
    console.error(`Bucket "${bucketName}" not found in pipeline for job ${job.id}`);
    return [];
  }

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
    .eq('status_bucket_id', targetBucket.id) 
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item.applicant,
    application_id: item.id,
    full_name: `${item.applicant.first_name} ${item.applicant.last_name}`
  }));
};

/**
 * Move applicant - updates the status_bucket_id for a specific application record
 */
export const moveApplicantBucket = async (
  supabase: SupabaseClient, 
  applicationId: string, 
  newBucketId: string
) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status_bucket_id: newBucketId })
    .eq('id', applicationId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Fetches ALL applicants for a company.
 * Status labels (New/Working/Hot) are now derived from the bucket names in DB.
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
    
    let theme: 'New' | 'Working' | 'Hot' = 'Working';
    if (bucketName.includes('applied') || bucketName.includes('new')) theme = 'New';
    if (['interview', 'offer', 'hired'].some(s => bucketName.includes(s))) theme = 'Hot';

    return {
      id: item.applicant.id,
      name: `${item.applicant.first_name} ${item.applicant.last_name}`,
      email: item.applicant.email,
      phone: item.applicant.mobile || "N/A",
      resume_url: item.applicant.resume_url,
      status: theme,
      bucket_name: item.status_bucket?.name, 
      lastContact: new Date(item.created_at).toLocaleDateString(),
      company_id: companyId
    };
  });
};

/**
 * Updates job posting metadata.
 * Explicitly exported to fix "Attempted import error" in LeadPipeline.tsx.
 */
export const updateJobInfo = async (
  supabase: SupabaseClient, 
  jobId: string, 
  updates: any
) => {
  const { data, error } = await supabase
    .from('job_postings')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', jobId)
    .select();

  if (error) throw error;
  return data;
};