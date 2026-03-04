import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { TimelineEvent } from '@/lib/media-types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

function yearFromDate(date: string | null): string | null {
  if (!date) return null
  const y = new Date(date).getUTCFullYear()
  return Number.isNaN(y) ? null : String(y)
}

function personName(person: { first_name: string; last_name: string }) {
  return `${person.first_name} ${person.last_name}`
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const [personRes, relRes, childLinkRes, docsRes] = await Promise.all([
    supabase.from('people').select('*').eq('id', id).single(),
    supabase.from('relationships').select('*').or(`person1_id.eq.${id},person2_id.eq.${id}`),
    supabase.from('parent_child').select('child_id').eq('parent_id', id),
    supabase.from('person_documents').select('*').eq('person_id', id),
  ])

  if (personRes.error || !personRes.data) {
    return NextResponse.json({ error: personRes.error?.message ?? 'Person not found' }, { status: 404 })
  }

  const person = personRes.data
  const rels = relRes.data ?? []
  const childIds = (childLinkRes.data ?? []).map((r) => r.child_id)

  const childPeople = childIds.length > 0
    ? (await supabase.from('people').select('id, first_name, last_name, birth_date').in('id', childIds)).data ?? []
    : []

  const partnerIds = rels.map((r) => (r.person1_id === id ? r.person2_id : r.person1_id))
  const partnerPeople = partnerIds.length > 0
    ? (await supabase.from('people').select('id, first_name, last_name').in('id', partnerIds)).data ?? []
    : []
  const partnerMap = new Map(partnerPeople.map((p) => [p.id, p]))

  const events: TimelineEvent[] = []

  events.push({
    id: `birth-${person.id}`,
    date: person.birth_date,
    year: yearFromDate(person.birth_date),
    title: 'Birth',
    description: person.birth_place ? `Born in ${person.birth_place}` : 'Born',
    type: 'birth',
  })

  rels.forEach((rel) => {
    const partnerId = rel.person1_id === id ? rel.person2_id : rel.person1_id
    const partner = partnerMap.get(partnerId)
    events.push({
      id: `relationship-${rel.id}`,
      date: rel.start_date,
      year: yearFromDate(rel.start_date),
      title: `${rel.relationship_type[0]?.toUpperCase() ?? ''}${rel.relationship_type.slice(1)}${partner ? `: ${personName(partner)}` : ''}`,
      description: rel.start_date ? 'Relationship started' : 'Relationship recorded',
      type: 'relationship',
    })
  })

  childPeople.forEach((child) => {
    events.push({
      id: `child-${child.id}`,
      date: child.birth_date,
      year: yearFromDate(child.birth_date),
      title: `Child: ${personName(child)}`,
      description: child.birth_date ? 'Child born' : 'Child linked',
      type: 'child',
    })
  })

  ;(docsRes.data ?? []).forEach((doc) => {
    events.push({
      id: `document-${doc.id}`,
      date: doc.uploaded_at,
      year: yearFromDate(doc.uploaded_at),
      title: `Document uploaded: ${doc.title}`,
      description: doc.document_type,
      type: 'document',
    })
  })

  if (person.death_date) {
    events.push({
      id: `death-${person.id}`,
      date: person.death_date,
      year: yearFromDate(person.death_date),
      title: 'Death',
      description: 'Passed away',
      type: 'death',
    })
  }

  events.sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })

  return NextResponse.json({ events })
}
