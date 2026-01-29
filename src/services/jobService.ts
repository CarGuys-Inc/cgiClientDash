import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * Fetches the main pipeline data by joining job_postings with job_titles lookup.
 * Fixes: Array access for joined job_titles and visibility filtering.
 */
export const fetchPipelineData = async (supabase: SupabaseClient): Promise<PipelineData> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required");

  // Get the company_id associated with the logged-in user
  const { data: profile } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  const clientCompanyId = profile?.company_id;
  if (!clientCompanyId) throw new Error("No company associated with this account");

  // Query job_postings and join the job_titles table
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      id,
      status,
      created_at,
      income_min,
      income_max,
      recruiterflow_id,
      job_titles ( title ), 
      company:companies(id, name, slug),
      applications:job_applications (
        id,
        status_bucket:applicant_pipeline_status_buckets (id, name, visible_to_roles)
      ),
      applicantPipeline:applicant_pipelines(
        statusBuckets:applicant_pipeline_status_buckets(id, name, visible_to_roles)
      )
    `)
    .eq('company_id', clientCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Format the data and calculate stats
  const formattedJobs = (data || []).map(job => {
    const stats: Record<string, number> = {};
    
    const isVisibleToClient = (roles: any) => {
      if (!roles) return false;
      if (Array.isArray(roles)) {
        return roles.some(role => String(role).toLowerCase() === 'client');
      }
      return String(roles).toLowerCase().includes('client');
    };

    // 1. Initialize stats for buckets marked visible to the client
    const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
    const visibleBuckets = allBuckets.filter((b: any) => isVisibleToClient(b.visible_to_roles));
    
    visibleBuckets.forEach((bucket: any) => {
      stats[bucket.name] = 0; 
    });

    // 2. Populate applicant counts
    job.applications?.forEach((app: any) => {
      const bucketName = app.status_bucket?.name;
      const roles = app.status_bucket?.visible_to_roles;
      
      if (bucketName && isVisibleToClient(roles)) {
        stats[bucketName] = (stats[bucketName] || 0) + 1;
      }
    });

    // 3. FIX: Flatten the job_titles array into a string
    // Supabase returns joined rows as an array, so we take the first element.
    const jobTitleObj = job.job_titles as unknown as { title: string }[] | { title: string };
    const titleString = Array.isArray(jobTitleObj) 
      ? jobTitleObj[0]?.title 
      : (jobTitleObj as { title: string })?.title;

    return {
      ...job,
      displayTitle: titleString || "Untitled Position",
      stats
    };
  });

  return { jobs: formattedJobs };
};

/**
 * Fetches specific applicants for a bucket within a job pipeline. 
 */
export const fetchApplicantsByBucket = async (supabase: SupabaseClient, job: any, bucketName: string) => {
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  
  const isVisibleToClient = (roles: any) => {
    if (!roles) return false;
    if (Array.isArray(roles)) return roles.some(role => String(role).toLowerCase() === 'client');
    return String(roles).toLowerCase().includes('client');
  };

  const targetBucket = allBuckets.find((b: any) => 
    b.name === bucketName && isVisibleToClient(b.visible_to_roles)
  );

  if (!targetBucket) return [];

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
 * Updates an applicant's stage in the pipeline.
 */
export const moveApplicantBucket = async (supabase: SupabaseClient, applicationId: string, newBucketId: string) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status_bucket_id: newBucketId })
    .eq('id', applicationId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Updates metadata for a job posting.
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

/**
 * Fetches all applicants for a company, filtered by client visibility.
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
      status_bucket:applicant_pipeline_status_buckets (name, visible_to_roles)
    `)
    .eq('company_id', companyId);

  if (error) throw error;

  const isVisibleToClient = (roles: any) => {
    if (!roles) return false;
    if (Array.isArray(roles)) return roles.some(role => String(role).toLowerCase() === 'client');
    return String(roles).toLowerCase().includes('client');
  };

  return (data || [])
    .filter((item: any) => isVisibleToClient(item.status_bucket?.visible_to_roles))
    .map((item: any) => {
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