import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });
  }

  const { data: rpcSettings, error: rpcError } = await supabase.rpc(
    'get_banner_settings',
    { p_domain_id: siteId }
  );

  let settings = rpcError ? null : rpcSettings;

  if (!settings) {
    const { data: domain } = await supabase
      .from('domains')
      .select('id, settings')
      .eq('id', siteId)
      .single();

    settings = domain?.settings ?? null;
  }

  if (!settings) {
    return NextResponse.json(
      { error: 'Invalid site ID' },
      { status: 404, headers: corsHeaders }
    );
  }

  await supabase.rpc('increment_banner_stat', {
    p_domain_id: siteId,
    p_event_type: 'impression',
  });

  return NextResponse.json({ settings }, { headers: corsHeaders });
}
