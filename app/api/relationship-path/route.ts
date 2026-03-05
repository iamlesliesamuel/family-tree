import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type Edge = { to: string; label: 'parent' | 'child' }

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

  const path: Array<{ id: string; via: 'parent' | 'child' | null }> = []
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
  const readable = path
    .map((step, i) => {
      const name = nameMap.get(step.id) ?? step.id
      if (i === 0) return name
      return `${name} (${step.via})`
    })
    .join(' → ')

  return NextResponse.json({ path, readable })
}
