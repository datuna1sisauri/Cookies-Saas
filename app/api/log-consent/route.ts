import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { siteId, consent_type } = body; // consent_type: 'accept' | 'decline'

    if (!siteId || !consent_type) {
      return NextResponse.json(
        { error: 'Missing siteId or consent_type' },
        { status: 400 }
      );
    }

    // 1. Фиксируем согласие в журнале логов
    await supabase.from('consent_logs').insert([
      { domain_id: siteId, consent_type, created_at: new Date().toISOString() },
    ]);

    // 2. Инкрементируем счетчик (accepts / declines)
    await supabase.rpc('increment_banner_stat', {
      p_domain_id: siteId,
      p_event_type: consent_type,
    });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}