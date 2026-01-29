import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * SMART ID LOOKUP:
 * 1. If Admin + viewAsId exists -> Use viewAsId
 * 2. If Regular Client -> Use client_profiles table
 * 3. Fallback -> Return null (prevents crashes)
 */
const getActiveCompanyId = async (supabase: SupabaseClient, viewAsId?: string | null): Promise<string | number | null> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  // Check for Admin Override
  if (user.email === 'adamhayford@carguysinc.com') {
    if (viewAsId && viewAsId !== 'null' && viewAsId !== 'undefined') {
      return viewAsId;
    }
    return null; 
  }

  // Standard Client Lookup
  const { data: profile } = await supabase
    .from('client_profiles')
    .select('company_id')
    .eq('auth_user_id', user.id)
    .single();

  return profile?.company_id || null;
};

export const fetchPipelineData = async (
  supabase: SupabaseClient, 
  viewAsId?: string | null
): Promise<PipelineData> => {
  try {
    const activeCompanyId = await getActiveCompanyId(supabase, viewAsId);
    if (!activeCompanyId) return { jobs: [] };

    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        id, status, created_at, income_min, income_max, recruiterflow_id,
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
      .eq('company_id', activeCompanyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedJobs = (data || []).map(job => {
      const stats: Record<string, number> = {};
      const isVisibleToClient = (roles: any) => {
        const rolesStr = Array.isArray(roles) ? roles.join(',') : String(roles || '');
        return rolesStr.toLowerCase().includes('client');
      };

      const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
      const visibleBuckets = allBuckets.filter((b: any) => isVisibleToClient(b.visible_to_roles));
      
      visibleBuckets.forEach((bucket: any) => { stats[bucket.name] = 0; });

      job.applications?.forEach((app: any) => {
        const bucketName = app.status_bucket?.name;
        if (bucketName && isVisibleToClient(app.status_bucket?.visible_to_roles)) {
          stats[bucketName] = (stats[bucketName] || 0) + 1;
        }
      });

      const jobTitleObj = job.job_titles as any;
      const titleString = Array.isArray(jobTitleObj) ? jobTitleObj[0]?.title : jobTitleObj?.title;

      return {
        ...job,
        displayTitle: titleString || "Untitled Position",
        stats
      };
    });

    return { jobs: formattedJobs };
  } catch (err) {
    console.error("fetchPipelineData error:", err);
    return { jobs: [] };
  }
};

export const fetchApplicantsByBucket = async (supabase: SupabaseClient, job: any, bucketName: string) => {
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  const isVisibleToClient = (roles: any) => {
    const rolesStr = Array.isArray(roles) ? roles.join(',') : String(roles || '');
    return rolesStr.toLowerCase().includes('client');
  };

  const targetBucket = allBuckets.find((b: any) => 
    b.name === bucketName && isVisibleToClient(b.visible_to_roles)
  );

  if (!targetBucket) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id, created_at,
      applicant:applicants (id, first_name, last_name, email, mobile, resume_url, recruiterflow_id)
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

export const moveApplicantBucket = async (supabase: SupabaseClient, applicationId: string, newBucketId: string) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ status_bucket_id: newBucketId })
    .eq('id', applicationId)
    .select();
  if (error) throw error;
  return data;
};

export const updateJobInfo = async (supabase: SupabaseClient, jobId: string, updates: any) => {
  const { data, error } = await supabase
    .from('job_postings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select();
  if (error) throw error;
  return data;
};

export const fetchAllCompanyApplicants = async (supabase: SupabaseClient, viewAsId?: string | null) => {
  const activeCompanyId = await getActiveCompanyId(supabase, viewAsId);
  if (!activeCompanyId) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id, created_at,
      applicant:applicants (id, first_name, last_name, email, mobile, resume_url),
      status_bucket:applicant_pipeline_status_buckets (name, visible_to_roles)
    `)
    .eq('company_id', activeCompanyId);

  if (error) throw error;
  const isVisibleToClient = (roles: any) => {
    const rolesStr = Array.isArray(roles) ? roles.join(',') : String(roles || '');
    return rolesStr.toLowerCase().includes('client');
  };

  return (data || [])
    .filter((item: any) => isVisibleToClient(item.status_bucket?.visible_to_roles))
    .map((item: any) => ({
      id: item.applicant.id,
      name: `${item.applicant.first_name} ${item.applicant.last_name}`,
      email: item.applicant.email,
      phone: item.applicant.mobile || "N/A",
      resume_url: item.applicant.resume_url,
      status: item.status_bucket?.name,
      lastContact: new Date(item.created_at).toLocaleDateString(),
      company_id: activeCompanyId
    }));
};