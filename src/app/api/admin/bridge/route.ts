import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const adminSecret = searchParams.get('secret');

  // 1. Security Check: Ensure only your Admin Dashboard can call this
  if (adminSecret !== process.env.ADMIN_SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Setup Admin Supabase (Using Service Role Key)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Generate a one-time "Magic Link" for your admin email
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'admin@carguysinc.com',
    options: { 
      // Redirect straight to the dashboard with the view_as param
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?view_as=${companyId}` 
    }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 4. Return the "Auto-Login" URL to the Admin Dashboard
  return NextResponse.json({ url: data.properties.action_link });
}