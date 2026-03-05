import { NextRequest, NextResponse } from 'next/server'
import { fetchSubgraph } from '@/lib/subgraph'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const id = searchParams.get('id')
  const ancestorDepth = Math.min(parseInt(searchParams.get('ancestorDepth') ?? '2', 10), 5)
  const descendantDepth = Math.min(parseInt(searchParams.get('descendantDepth') ?? '2', 10), 5)
  const showArchived = searchParams.get('showArchived') === '1'

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    const data = await fetchSubgraph(id, ancestorDepth, descendantDepth, showArchived)

    if (!data) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/subgraph]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
