import { SupabaseClient } from '@supabase/supabase-js';

export interface PipelineData {
  jobs: any[];
}

/**
 * Fetches the main pipeline data including nested bucket counts
 */
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

  const clientCompanyId = profile.company_id;

  // 3. Fetch Jobs with the nested count logic
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

  if (error) {
    console.error("Supabase Query Error:", error);
    throw error;
  }

  // 4. Map the data to flatten counts and handle Title joins
  const formattedJobs = (data || []).map(job => {
    const buckets = job.applicantPipeline?.[0]?.statusBuckets || [];
    
    // Aggregate counts into dashboard categories
    const stats = {
      applied: 0,
      qualified: 0,
      notQualified: 0
    };

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

    // Fix: job_titles is returned as an array; take the first element
    const joinedTitle = Array.isArray(job.job_titles) 
      ? job.job_titles[0]?.title 
      : (job.job_titles as any)?.title;

    return {
      ...job,
      title: job.title || joinedTitle || "Untitled Position",
      stats
    };
  });

  return {
    jobs: formattedJobs
  };
};

/**
 * Fetches specific applicants FROM THE APPLICANTS TABLE for a job based on the bucket label clicked in the UI.
 * Uses the join table: applicant_status_bucket_applicant
 */
export const fetchApplicantsByBucket = async (
  supabase: SupabaseClient,
  job: any, // Expects the full job object from the state
  bucketType: string
) => {
  // 1. Identify which bucket IDs match the UI category (Applied, Qualified, Not Qualified)
  const allBuckets = job.applicantPipeline?.[0]?.statusBuckets || [];
  
  const targetBucketIds = allBuckets
    .filter((b: any) => {
      const name = b.name.toLowerCase();
      const isQualified = ['interview', 'qualified', 'technical', 'offer', 'hired', 'shortlist', 'vetted'].some(s => name.includes(s));
      const isRejected = ['rejected', 'not qualified', 'archived', 'not interested', 'disqualified', 'declined'].some(s => name.includes(s));

      if (bucketType === 'qualified') return isQualified;
      if (bucketType === 'not-qualified') return isRejected;
      // Default to 'applied' for anything else
      return !isQualified && !isRejected;
    })
    .map((b: any) => b.id);

  if (targetBucketIds.length === 0) return [];

  // 2. Query the join table using the identified bucket IDs
  const { data, error } = await supabase
    .from('applicant_status_bucket_applicant')
    .select(`
      applicant:applicants (
        id,
        first_name,
        last_name,
        email,
        mobile,
        created_at,
        recruiterflow_id
      )
    `)
    .in('status_bucket_id', targetBucketIds);

  if (error) {
    console.error("Join Table Query Error:", error);
    throw error;
  }

  // 3. Format response for the UI
  return (data || []).map((item: any) => ({
    ...item.applicant,
    full_name: `${item.applicant.first_name} ${item.applicant.last_name}`
  }));
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