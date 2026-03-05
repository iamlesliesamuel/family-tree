import { supabase } from './supabase'

export interface ActivityItem {
  id: string
  entity_type: string
  entity_id: string
  person_id: string | null
  action: string
  field_name: string | null
  created_at: string
  edited_by: string | null
  description: string
  person_name: string | null
  friendly_description: string
}

export async function getRecentActivity(limit = 50): Promise<ActivityItem[]> {
  const { data, error } = await supabase.rpc('get_recent_activity', { limit_count: limit })
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const personIds = Array.from(new Set(rows.map((r) => r.person_id).filter((v): v is string => typeof v === 'string')))
  const peopleRes = personIds.length > 0
    ? await supabase.from('people').select('id, first_name, last_name').in('id', personIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string }> }

  const peopleMap = new Map((peopleRes.data ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]))

  return rows.map((r) => {
    const personId = typeof r.person_id === 'string' ? r.person_id : null
    const personName = personId ? peopleMap.get(personId) ?? null : null
    const desc = typeof r.description === 'string' ? r.description : 'Updated record'
    return {
      id: String(r.id),
      entity_type: String(r.entity_type ?? ''),
      entity_id: String(r.entity_id ?? ''),
      person_id: personId,
      action: String(r.action ?? ''),
      field_name: typeof r.field_name === 'string' ? r.field_name : null,
      created_at: String(r.created_at ?? ''),
      edited_by: typeof r.edited_by === 'string' ? r.edited_by : null,
      description: desc,
      person_name: personName,
      friendly_description: personName ? `${desc} for ${personName}` : desc,
    }
  })
}
