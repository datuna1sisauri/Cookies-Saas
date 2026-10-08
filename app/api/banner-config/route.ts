import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ error: 'Missing siteId' }, { status: 400 });
  }

  const { data: domain, error } = await supabase
    .from('domains')
    .select('id, settings')
    .eq('id', siteId)
    .single();

  if (error || !domain) {
    return NextResponse.json({ error: 'Invalid site ID' }, { status: 404 });
  }

  // Засчитываем показ баннера в статистике
  await supabase.rpc('increment_banner_stat', {
    p_domain_id: siteId,
    p_event_type: 'impression',
  });

  return NextResponse.json(
    { settings: domain.settings },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    }
  );
}