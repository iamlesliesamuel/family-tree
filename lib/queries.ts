import { supabase } from './supabase'
import type {
  Person,
  PersonSummary,
  PersonProfile,
  PartnerGroup,
  ChildEntry,
  ParentEntry,
} from './types'

// ─── People ───────────────────────────────────────────────────────────────────

export async function getAllPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) throw new Error(`getAllPeople: ${error.message}`)
  return data ?? []
}

// Compact summary list — used for explorer search (ships only what search needs)
export async function getAllPeopleSummary(): Promise<PersonSummary[]> {
  const { data, error } = await supabase
    .from('people')
    .select('id, first_name, last_name, maiden_name, birth_date')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) throw new Error(`getAllPeopleSummary: ${error.message}`)
  return (data ?? []) as PersonSummary[]
}

// Returns the first person (alphabetical fallback)
export async function getFirstPerson(): Promise<Person | null> {
  const { data } = await supabase
    .from('people')
    .select('*')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .limit(1)
    .single()

  return (data as Person) ?? null
}

// Calls the get_default_root_person() Supabase RPC to find the oldest patriarch/matriarch.
// Falls back to getFirstPerson() if the RPC isn't installed yet.
export async function getDefaultRootPerson(): Promise<Person | null> {
  const { data: rootId, error } = await supabase.rpc('get_default_root_person')
  if (error || !rootId) return getFirstPerson()

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', rootId as string)
    .single()

  return (person as Person) ?? null
}

export async function searchPeople(query: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,maiden_name.ilike.%${query}%`
    )
    .order('last_name')
    .limit(50)

  if (error) throw new Error(`searchPeople: ${error.message}`)
  return data ?? []
}

// ─── Person profile ───────────────────────────────────────────────────────────
//
// Fetches a person + all related data with minimal round-trips:
//   1. Parallel: person + parent_child (as child) + parent_child (as parent) + relationships
//   2. One batch query for other-parent links of all children
//   3. One batch query to hydrate all related people IDs
//
// No N+1 queries regardless of family size.

export async function getPersonProfile(id: string): Promise<PersonProfile | null> {
  // Step 1 — parallel core fetches
  const [personRes, asChildRes, asParentRes, relsRes] = await Promise.all([
    supabase.from('people').select('*').eq('id', id).single(),
    supabase.from('parent_child').select('*').eq('child_id', id),
    supabase.from('parent_child').select('*').eq('parent_id', id),
    supabase
      .from('relationships')
      .select('*')
      .or(`person1_id.eq.${id},person2_id.eq.${id}`),
  ])

  if (personRes.error || !personRes.data) return null

  const person = personRes.data as Person
  const asChildRows = (asChildRes.data ?? []) as Array<{
    parent_id: string
    is_adopted: boolean
  }>
  const asParentRows = (asParentRes.data ?? []) as Array<{
    child_id: string
    is_adopted: boolean
  }>
  const relRows = (relsRes.data ?? []) as Array<{
    id: string
    person1_id: string
    person2_id: string
    relationship_type: string
    start_date: string | null
    end_date: string | null
    notes: string | null
  }>

  // Step 2 — fetch other-parent links for every child
  const childIds = asParentRows.map((r) => r.child_id)
  const otherParentLinksRes =
    childIds.length > 0
      ? await supabase
          .from('parent_child')
          .select('child_id, parent_id')
          .in('child_id', childIds)
          .neq('parent_id', id)
      : { data: [] }

  const otherParentLinks = (otherParentLinksRes.data ?? []) as Array<{
    child_id: string
    parent_id: string
  }>

  // Step 3 — collect all IDs and hydrate in one query
  const parentIds = asChildRows.map((r) => r.parent_id)
  const partnerIds = relRows.map((r) =>
    r.person1_id === id ? r.person2_id : r.person1_id
  )
  const otherParentIds = otherParentLinks.map((r) => r.parent_id)

  const allIds = Array.from(
    new Set([...parentIds, ...childIds, ...partnerIds, ...otherParentIds])
  )

  const peopleRes =
    allIds.length > 0
      ? await supabase.from('people').select('*').in('id', allIds)
      : { data: [] }

  const peopleMap = new Map<string, Person>(
    ((peopleRes.data ?? []) as Person[]).map((p) => [p.id, p])
  )

  // Build parents
  const parents: ParentEntry[] = asChildRows
    .map((r) => {
      const p = peopleMap.get(r.parent_id)
      if (!p) return null
      return { person: p, is_adopted: r.is_adopted }
    })
    .filter(Boolean) as ParentEntry[]

  // Build child → other-parent mapping
  const childToOtherParent = new Map<string, string | null>(
    asParentRows.map((r) => [r.child_id, null])
  )
  otherParentLinks.forEach((r) => childToOtherParent.set(r.child_id, r.parent_id))

  const childAdoptedMap = new Map<string, boolean>(
    asParentRows.map((r) => [r.child_id, r.is_adopted])
  )

  // Group children by other parent
  const childrenByOtherParent = new Map<string, ChildEntry[]>()

  childToOtherParent.forEach((otherParentId, childId) => {
    const key = otherParentId ?? 'unknown'
    const child = peopleMap.get(childId)
    if (!child) return

    if (!childrenByOtherParent.has(key)) {
      childrenByOtherParent.set(key, [])
    }
    childrenByOtherParent.get(key)!.push({
      child,
      is_adopted: childAdoptedMap.get(childId) ?? false,
    })
  })

  // Build partner groups from registered relationships
  const usedOtherParentIds = new Set<string>()

  const partnerGroups: PartnerGroup[] = relRows.map((rel) => {
    const partnerId = rel.person1_id === id ? rel.person2_id : rel.person1_id
    const partner = peopleMap.get(partnerId) ?? null
    const children = childrenByOtherParent.get(partnerId) ?? []

    if (partner) usedOtherParentIds.add(partnerId)

    return { partner, relationship: rel, children }
  })

  // Add children whose other parent exists but wasn't a registered partner
  childrenByOtherParent.forEach((children, key) => {
    if (key === 'unknown') return
    if (usedOtherParentIds.has(key)) return

    const partner = peopleMap.get(key) ?? null
    partnerGroups.push({ partner, relationship: null, children })
    usedOtherParentIds.add(key)
  })

  // Add children with no known other parent
  const unknownChildren = childrenByOtherParent.get('unknown')
  if (unknownChildren?.length) {
    partnerGroups.push({ partner: null, relationship: null, children: unknownChildren })
  }

  return { person, parents, partnerGroups }
}
