import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Edge = { to: string; label: 'parent' | 'child' }
type StepLabel = 'parent' | 'child'

function ancestorTitle(generations: number) {
  if (generations <= 0) return 'self'
  if (generations === 1) return 'parent'
  if (generations === 2) return 'grandparent'
  return `${'great-'.repeat(generations - 2)}grandparent`
}

function descendantTitle(generations: number) {
  if (generations <= 0) return 'self'
  if (generations === 1) return 'child'
  if (generations === 2) return 'grandchild'
  return `${'great-'.repeat(generations - 2)}grandchild`
}

function uncleAuntTitle(upCount: number) {
  if (upCount <= 1) return 'relative'
  if (upCount === 2) return 'aunt/uncle'
  return `${'great-'.repeat(upCount - 2)}aunt/uncle`
}

function nieceNephewTitle(downCount: number) {
  if (downCount <= 1) return 'relative'
  if (downCount === 2) return 'niece/nephew'
  return `${'great-'.repeat(downCount - 2)}niece/nephew`
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  if (n % 10 === 1) return `${n}st`
  if (n % 10 === 2) return `${n}nd`
  if (n % 10 === 3) return `${n}rd`
  return `${n}th`
}

function inferRelationship(stepLabels: StepLabel[]) {
  const upCount = stepLabels.filter((s) => s === 'parent').length
  const downCount = stepLabels.filter((s) => s === 'child').length

  if (upCount === 0 && downCount === 0) return 'same person'
  if (downCount === 0) return ancestorTitle(upCount)
  if (upCount === 0) return descendantTitle(downCount)
  if (upCount === 1 && downCount === 1) return 'sibling'
  if (upCount > 1 && downCount === 1) return uncleAuntTitle(upCount)
  if (upCount === 1 && downCount > 1) return nieceNephewTitle(downCount)

  const degree = Math.min(upCount, downCount) - 1
  const removed = Math.abs(upCount - downCount)
  if (degree <= 0) return 'relative'
  if (removed === 0) return `${ordinal(degree)} cousin`
  if (removed === 1) return `${ordinal(degree)} cousin once removed`
  return `${ordinal(degree)} cousin ${removed} times removed`
}

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get('a')
  const b = req.nextUrl.searchParams.get('b')
  if (!a || !b) return NextResponse.json({ error: 'a and b are required' }, { status: 400 })
  if (a === b) return NextResponse.json({ path: [{ id: a, via: null }] })

  const [edgesRes, peopleRes] = await Promise.all([
    supabase.from('parent_child').select('parent_id, child_id').is('archived_at', null),
    supabase.from('people').select('id, first_name, last_name').is('archived_at', null),
  ])

  if (edgesRes.error) return NextResponse.json({ error: edgesRes.error.message }, { status: 400 })
  if (peopleRes.error) return NextResponse.json({ error: peopleRes.error.message }, { status: 400 })

  const adjacency = new Map<string, Edge[]>()
  const add = (from: string, to: string, label: 'parent' | 'child') => {
    if (!adjacency.has(from)) adjacency.set(from, [])
    adjacency.get(from)!.push({ to, label })
  }

  ;(edgesRes.data ?? []).forEach((row) => {
    // Label indicates what the next person is relative to the current one.
    add(row.parent_id, row.child_id, 'child')
    add(row.child_id, row.parent_id, 'parent')
  })

  const queue: string[] = [a]
  const visited = new Set<string>([a])
  const prev = new Map<string, { from: string; label: 'parent' | 'child' }>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === b) break
    for (const edge of adjacency.get(current) ?? []) {
      if (visited.has(edge.to)) continue
      visited.add(edge.to)
      prev.set(edge.to, { from: current, label: edge.label })
      queue.push(edge.to)
    }
  }

  if (!visited.has(b)) return NextResponse.json({ path: null, message: 'No path found' })

  const path: Array<{ id: string; via: StepLabel | null }> = []
  let cursor: string | null = b
  while (cursor) {
    if (cursor === a) {
      path.push({ id: cursor, via: null })
      break
    }
    const step = prev.get(cursor)
    if (!step) break
    path.push({ id: cursor, via: step.label })
    cursor = step.from
  }
  path.reverse()

  const nameMap = new Map((peopleRes.data ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]))
  const stepLabels = path.slice(1).map((step) => step.via).filter((v): v is StepLabel => v !== null)
  const relationship = inferRelationship(stepLabels)

  // Use explicit directional arrows so "parent/child" cannot be misread.
  const readable = path.reduce((acc, step, i) => {
    const name = nameMap.get(step.id) ?? step.id
    if (i === 0) return name
    return `${acc} --${step.via}--> ${name}`
  }, '')

  const personAName = nameMap.get(a) ?? a
  const personBName = nameMap.get(b) ?? b

  return NextResponse.json({
    path,
    readable,
    relationship,
    summary: `${personBName} is ${relationship} to ${personAName}.`,
  })
}
