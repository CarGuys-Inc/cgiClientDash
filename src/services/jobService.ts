import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
  applicants: any[];
}

export const fetchPipelineData = async (supabase: SupabaseClient): Promise<PipelineData> => {
  // 1. Get current user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required");

  // 2. Get company_id from client_profiles
  const { data: profile, error: profileError } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    console.error("Profile fetch error:", profileError);
    throw new Error("No company associated with this account");
  }

  const companyId = profile.company_id;

  // 3. Fetch Jobs (with Title Join) and Applications
  const [jobsRes, appsRes] = await Promise.all([
    supabase
      .from('job_postings')
      .select(`
        *,
        job_titles (
          title
        )
      `) // Join the job_titles table to get the name
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('job_applications') 
      .select(`
        id,
        status,
        applied_at,
        applicant_id,
        job_id,
        applicants ( id, full_name, email )
      `)
      .eq('company_id', companyId) 
  ]);

  if (jobsRes.error) throw jobsRes.error;

  // 4. Map the data to flatten the title for the UI
  // This ensures job.title is always a string even if the posting table version is null
  const formattedJobs = (jobsRes.data || []).map(job => ({
    ...job,
    title: job.title || job.job_titles?.title || "Untitled Position"
  }));

  return {
    jobs: formattedJobs,
    applicants: appsRes.data || []
  };
};

/**
 * Updates job information in the job_postings table
 */
export const updateJobInfo = async (
  supabase: SupabaseClient,
  jobId: string,
  updates: { 
    title?: string; 
    status?: string; 
    income_min?: number; 
    income_max?: number;
    description?: string;
  }
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