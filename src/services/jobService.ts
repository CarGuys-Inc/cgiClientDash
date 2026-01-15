import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
  applicants: any[];
}

export const fetchPipelineData = async (supabase: SupabaseClient): Promise<PipelineData> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required");

  const { data: profile, error: profileError } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("No company associated with this account");
  }

  const companyId = profile.company_id;

  const [jobsRes, appsRes] = await Promise.all([
    supabase
      .from('job_postings')
      .select('*')
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

  return {
    jobs: jobsRes.data || [],
    applicants: appsRes.data || []
  };
};

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