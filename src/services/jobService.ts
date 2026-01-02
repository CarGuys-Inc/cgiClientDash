import { SupabaseClient } from '@supabase/supabase-js';

// 1. Ensure the return types are defined
export interface PipelineData {
  jobs: any[];
  applicants: any[];
}

// 2. Ensure the 'export' keyword is present and the name matches exactly
export const fetchPipelineData = async (supabase: any) => {
  // Get current user session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Authentication required");

  // Get company_id from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("No company associated with this account");
  }

  const companyId = profile.company_id;

  // Fetch data scoped to the company
  const [jobsRes, appsRes] = await Promise.all([
    supabase
      .from('job_titles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('applicants')
      .select('id, job_title_id, stage')
      .eq('company_id', companyId)
  ]);

  if (jobsRes.error) throw jobsRes.error;
  if (appsRes.error) throw appsRes.error;

  return {
    jobs: jobsRes.data || [],
    applicants: appsRes.data || []
  };
};