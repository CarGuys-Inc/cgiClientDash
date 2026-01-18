import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
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

  const clientCompanyId = profile.company_id;

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

      if (['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => bucketName.includes(s))) {
        stats.qualified += count;
      } else if (['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => bucketName.includes(s))) {
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
 * NEW: Fetches ALL applicants across ALL jobs for the logged-in user's company
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

  // This query joins the junction table through the buckets up to the job_postings 
  // to ensure we only get applicants belonging to this dealership/company
  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      applicant:applicants (
        id,
        first_name,
        last_name,
        email,
        mobile,
        created_at
      ),
      bucket:applicant_pipeline_status_buckets (
        name,
        pipeline:applicant_pipelines (
          job:job_postings (
            company_id
          )
        )
      )
    `)
    .eq('bucket.pipeline.job.company_id', companyId);

  if (error) {
    console.error("Fetch All Applicants Error:", error);
    throw error;
  }

  // Format results for the LeadTable
  return (data || []).map((item: any) => {
    const app = item.applicant;
    const bucketName = (item.bucket?.name || "").toLowerCase();

    // Map bucket names to 'New' | 'Working' | 'Hot'
    let status: 'New' | 'Working' | 'Hot' = 'Working';
    if (['applied', 'new'].some(s => bucketName.includes(s))) status = 'New';
    else if (['interview', 'offer', 'vetted'].some(s => bucketName.includes(s))) status = 'Hot';

    return {
      id: app.id,
      name: `${app.first_name} ${app.last_name}`,
      email: app.email,
      phone: app.mobile || "N/A",
      source: "Direct Application",
      status: status,
      lastContact: new Date(app.created_at).toLocaleDateString(),
      company_id: companyId
    };
  });
};

export const fetchApplicantsByBucket = async (supabase: SupabaseClient, job: any, bucketType: string) => {
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  const targetBucketIds = allBuckets
    .filter((b: any) => {
      const name = b.name.toLowerCase();
      const isQualified = ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => name.includes(s));
      const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => name.includes(s));
      if (bucketType === 'qualified') return isQualified;
      if (bucketType === 'not-qualified') return isRejected;
      return !isQualified && !isRejected;
    })
    .map((b: any) => b.id);

  if (targetBucketIds.length === 0) return [];

  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      applicant:applicants (id, first_name, last_name, email, mobile, created_at, recruiterflow_id)
    `)
    .in('status_bucket_id', targetBucketIds);

  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item.applicant,
    full_name: `${item.applicant.first_name} ${item.applicant.last_name}`
  }));
};

export const moveApplicantBucket = async (supabase: SupabaseClient, applicantId: string, newBucketId: string) => {
  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .update({ status_bucket_id: newBucketId })
    .eq('applicant_id', applicantId)
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