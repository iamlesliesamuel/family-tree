import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { formatActivityDescription } from '@/lib/activity-format'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(Number.parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10) || 50, 1), 100)

  const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: limit })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const personIds = Array.from(new Set(rows.map((r) => r.person_id).filter((v): v is string => typeof v === 'string')))
  const peopleRes = personIds.length > 0
    ? await supabase.from('people').select('id, first_name, last_name').in('id', personIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string }> }

  const peopleMap = new Map((peopleRes.data ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]))

  const activity = rows.map((r) => {
    const personId = typeof r.person_id === 'string' ? r.person_id : null
    const name = personId ? peopleMap.get(personId) : null
    const oldValue = typeof r.old_value === 'string' ? r.old_value : null
    const newValue = typeof r.new_value === 'string' ? r.new_value : null
    return {
      ...r,
      person_name: name,
      old_value: oldValue,
      new_value: newValue,
      friendly_description: formatActivityDescription({ ...r, old_value: oldValue, new_value: newValue }, name ?? null),
    }
  })

  return NextResponse.json({ activity })
}
