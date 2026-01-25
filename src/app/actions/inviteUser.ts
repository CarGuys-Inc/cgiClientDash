'use server'

import { createClient } from '@supabase/supabase-js'

export async function inviteClientUser(formData: {
  email: string, 
  companyId: number, 
  firstName: string, 
  lastName: string 
}) {
  // Initialize Admin Client (Bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(formData.email, {
    data: { 
      company_id: formData.companyId,
      first_name: formData.firstName,
      last_name: formData.lastName
    },
    // This is where they go after clicking the email link
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
  })

  if (error) {
    console.error("Invite Error:", error.message);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}