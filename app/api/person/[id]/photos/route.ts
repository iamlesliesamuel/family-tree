import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('person_photos')
    .select('*')
    .eq('person_id', id)
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photos: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const body = (await req.json()) as { storage_path?: string; caption?: string }
  if (!body.storage_path) {
    return NextResponse.json({ error: 'storage_path is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('person_photos')
    .insert({
      person_id: id,
      storage_path: body.storage_path,
      caption: body.caption?.trim() || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photo: data }, { status: 201 })
}
