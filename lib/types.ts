export interface Person {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  maiden_name: string | null
  birth_date: string | null
  death_date: string | null
  birth_place: string | null
  gender: string | null
  notes: string | null
}

export interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  relationship_type: string
  start_date: string | null
  end_date: string | null
  notes: string | null
}

export interface ParentChild {
  id: string
  parent_id: string
  child_id: string
  is_adopted: boolean
}

export interface ChildEntry {
  child: Person
  is_adopted: boolean
}

export interface ParentEntry {
  person: Person
  is_adopted: boolean
}

export interface PartnerGroup {
  partner: Person | null
  relationship: Relationship | null
  children: ChildEntry[]
}

export interface PersonProfile {
  person: Person
  parents: ParentEntry[]
  partnerGroups: PartnerGroup[]
}

// Lightweight summary used by search / explorer (avoids shipping full Person objects)
export interface PersonSummary {
  id: string
  first_name: string
  last_name: string
  maiden_name: string | null
  birth_date: string | null
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getDisplayName(person: Person): string {
  const parts = [person.first_name]
  if (person.middle_name) parts.push(person.middle_name)
  parts.push(person.last_name)
  return parts.join(' ')
}

export function getYear(dateStr: string | null): string | null {
  if (!dateStr) return null
  const y = new Date(dateStr).getUTCFullYear()
  return isNaN(y) ? null : String(y)
}

export function getYearRange(person: Person): string {
  const birth = getYear(person.birth_date)
  const death = getYear(person.death_date)
  if (!birth && !death) return ''
  if (birth && !death) return birth
  if (!birth && death) return `d. ${death}`
  return `${birth} – ${death}`
}

export function formatRelationshipType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
