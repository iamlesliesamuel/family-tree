import { supabase } from './supabase'
import type { PersonProfile } from './types'

export interface MissingItem {
  key: string
  label: string
  tab?: 'profile' | 'photos' | 'notes' | 'documents'
}

export interface PersonInsights {
  missing: MissingItem[]
  completeness: number
}

export async function getPersonInsights(profile: PersonProfile): Promise<PersonInsights> {
  const personId = profile.person.id
  const [photoRes, docRes, noteRes] = await Promise.all([
    supabase.from('person_photos').select('id', { count: 'exact', head: true }).eq('person_id', personId).is('archived_at', null),
    supabase.from('person_documents').select('id', { count: 'exact', head: true }).eq('person_id', personId).is('archived_at', null),
    supabase.from('person_notes').select('id').eq('person_id', personId).single(),
  ])

  const hasPhoto = (photoRes.count ?? 0) > 0
  const hasDoc = (docRes.count ?? 0) > 0
  const hasNote = Boolean(noteRes.data?.id) || Boolean(profile.person.notes?.trim())
  const hasPartner = profile.partnerGroups.length > 0
  const hasParents = profile.parents.length > 0

  const checks = [
    { ok: Boolean(profile.person.first_name && profile.person.last_name), missing: { key: 'name', label: 'Name is incomplete', tab: 'profile' as const } },
    { ok: Boolean(profile.person.birth_date), missing: { key: 'birth_date', label: 'Birth date is missing', tab: 'profile' as const } },
    { ok: Boolean(profile.person.death_date), missing: { key: 'death_date', label: 'Death date is missing', tab: 'profile' as const } },
    { ok: hasParents, missing: { key: 'parents', label: 'Parents are missing', tab: 'profile' as const } },
    { ok: hasPartner, missing: { key: 'partner', label: 'Partner/relationship is missing', tab: 'profile' as const } },
    { ok: hasPhoto, missing: { key: 'photo', label: 'Profile photo is missing', tab: 'photos' as const } },
    { ok: hasDoc, missing: { key: 'documents', label: 'Documents are missing', tab: 'documents' as const } },
    { ok: hasNote, missing: { key: 'notes', label: 'Story/notes are missing', tab: 'notes' as const } },
  ]

  const present = checks.filter((c) => c.ok).length
  const completeness = Math.round((present / checks.length) * 100)
  const missing = checks.filter((c) => !c.ok).map((c) => c.missing)

  return { missing, completeness }
}
