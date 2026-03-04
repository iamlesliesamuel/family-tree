import { supabase } from './supabase'
import { getProfilePhotoPathMap } from './profile-photos'
import type { Person, Relationship } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubgraphLevel {
  /** negative = ancestor generation, positive = descendant generation */
  level: number
  people: Person[]
}

export interface SubgraphLink {
  parentId: string
  childId: string
}

export interface SubgraphPartner {
  partner: Person | null
  relationship: Relationship | null
}

export interface SubgraphResult {
  focus: Person
  /** Sorted: most-distant ancestor → most-distant descendant (level -N … -1, then +1 … +N) */
  levels: SubgraphLevel[]
  links: SubgraphLink[]
  partners: SubgraphPartner[]
}

// Row shape returned by parent_child queries
interface PCRow {
  parent_id: string
  child_id: string
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────
//
// Round-trip budget:
//   1 round  – focus person + immediate parents + immediate children + relationships
//   +1 round per additional depth level (ancestors & descendants parallelised)
//   1 round  – hydrate all collected person IDs
//
// For depth (2, 2) → 3 round trips total.

export async function fetchSubgraph(
  focusId: string,
  ancestorDepth: number,
  descendantDepth: number
): Promise<SubgraphResult | null> {
  const ancDepth = Math.min(Math.max(ancestorDepth, 0), 5)
  const descDepth = Math.min(Math.max(descendantDepth, 0), 5)

  // ── Round 1: focus + immediate family ──────────────────────────────────────
  const [personRes, asChildRes, asParentRes, relsRes] = await Promise.all([
    supabase.from('people').select('*').eq('id', focusId).single(),
    supabase.from('parent_child').select('parent_id, child_id').eq('child_id', focusId),
    supabase.from('parent_child').select('parent_id, child_id').eq('parent_id', focusId),
    supabase
      .from('relationships')
      .select('*')
      .or(`person1_id.eq.${focusId},person2_id.eq.${focusId}`),
  ])

  if (personRes.error || !personRes.data) return null

  let focus = personRes.data as Person
  const relRows = (relsRes.data ?? []) as Relationship[]

  // ── Link deduplication ─────────────────────────────────────────────────────
  const linkKeys = new Set<string>()
  const allLinks: SubgraphLink[] = []

  const addLink = (parentId: string, childId: string) => {
    const key = `${parentId}:${childId}`
    if (linkKeys.has(key)) return
    linkKeys.add(key)
    allLinks.push({ parentId, childId })
  }

  // ── Level -1: immediate parents ────────────────────────────────────────────
  // anc[i] holds the deduplicated person IDs at ancestor generation (i+1)
  const anc: string[][] = []
  if (ancDepth > 0) {
    const ids = Array.from(
      new Set((asChildRes.data ?? []).map((r: PCRow) => r.parent_id))
    )
    ids.forEach((pid) => addLink(pid, focusId))
    anc[0] = ids
  }

  // ── Level +1: immediate children ───────────────────────────────────────────
  // desc[i] holds deduplicated person IDs at descendant generation (i+1)
  const desc: string[][] = []
  if (descDepth > 0) {
    const ids = Array.from(
      new Set((asParentRes.data ?? []).map((r: PCRow) => r.child_id))
    )
    ids.forEach((cid) => addLink(focusId, cid))
    desc[0] = ids
  }

  // ── Partner IDs ────────────────────────────────────────────────────────────
  const partnerIds = relRows.map((r) =>
    r.person1_id === focusId ? r.person2_id : r.person1_id
  )

  // ── Iterative deeper levels ─────────────────────────────────────────────────
  // Loop index d represents "we already have level d, fetch level d+1"
  // We need depth-1 iterations (e.g. for depth=2, fetch once to add level 2)
  const maxDepth = Math.max(ancDepth, descDepth)

  for (let d = 1; d < maxDepth; d++) {
    const queries: Promise<{ data: PCRow[] | null }>[] = []
    const kinds: ('anc' | 'desc')[] = []

    const currentAnc = anc[d - 1] ?? []
    if (d < ancDepth && currentAnc.length > 0) {
      queries.push(
        supabase
          .from('parent_child')
          .select('parent_id, child_id')
          .in('child_id', currentAnc) as unknown as Promise<{ data: PCRow[] }>
      )
      kinds.push('anc')
    }

    const currentDesc = desc[d - 1] ?? []
    if (d < descDepth && currentDesc.length > 0) {
      queries.push(
        supabase
          .from('parent_child')
          .select('parent_id, child_id')
          .in('parent_id', currentDesc) as unknown as Promise<{ data: PCRow[] }>
      )
      kinds.push('desc')
    }

    if (queries.length === 0) break

    const results = await Promise.all(queries)

    results.forEach((res, i) => {
      const rows = (res.data ?? []) as PCRow[]
      if (kinds[i] === 'anc') {
        const ids = Array.from(new Set(rows.map((r) => r.parent_id)))
        rows.forEach((r) => addLink(r.parent_id, r.child_id))
        anc[d] = ids
      } else {
        const ids = Array.from(new Set(rows.map((r) => r.child_id)))
        rows.forEach((r) => addLink(r.parent_id, r.child_id))
        desc[d] = ids
      }
    })
  }

  // ── Hydrate all people in one query ────────────────────────────────────────
  const allIds = Array.from(new Set([...anc.flat(), ...desc.flat(), ...partnerIds]))

  const peopleRes =
    allIds.length > 0
      ? await supabase.from('people').select('*').in('id', allIds)
      : { data: [] }

  const peopleMap = new Map<string, Person>(
    ((peopleRes.data ?? []) as Person[]).map((p) => [p.id, p])
  )

  const profileMap = await getProfilePhotoPathMap([focusId, ...allIds])
  focus = { ...focus, profile_photo_path: profileMap.get(focus.id) ?? null }
  peopleMap.forEach((value, key) => {
    peopleMap.set(key, {
      ...value,
      profile_photo_path: profileMap.get(key) ?? null,
    })
  })

  // ── Build levels ───────────────────────────────────────────────────────────
  const levels: SubgraphLevel[] = []

  for (let d = 0; d < ancDepth; d++) {
    const people = (anc[d] ?? [])
      .map((id) => peopleMap.get(id))
      .filter(Boolean) as Person[]
    if (people.length > 0) levels.push({ level: -(d + 1), people })
  }

  for (let d = 0; d < descDepth; d++) {
    const people = (desc[d] ?? [])
      .map((id) => peopleMap.get(id))
      .filter(Boolean) as Person[]
    if (people.length > 0) levels.push({ level: d + 1, people })
  }

  levels.sort((a, b) => a.level - b.level)

  // ── Build partners ─────────────────────────────────────────────────────────
  const partners: SubgraphPartner[] = relRows.map((rel) => ({
    partner:
      peopleMap.get(rel.person1_id === focusId ? rel.person2_id : rel.person1_id) ??
      null,
    relationship: rel,
  }))

  return { focus, levels, links: allLinks, partners }
}
