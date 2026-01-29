import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Define CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // For production, replace '*' with your Admin URL
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const adminSecret = searchParams.get('secret');

  // 2. Security Check
  if (adminSecret !== process.env.ADMIN_SHARED_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" }, 
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'adamhayford@carguysinc.com', // Updated to match your actual admin email
      options: { 
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?view_as=${companyId}` 
      }
    });

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. Return response with CORS headers
    return NextResponse.json(
      { url: data.properties.action_link },
      { status: 200, headers: corsHeaders }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    } 
  });
}