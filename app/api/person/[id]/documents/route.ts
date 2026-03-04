import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('person_documents')
    .select('*')
    .eq('person_id', id)
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ documents: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await req.json()) as {
    title?: string
    storage_path?: string
    document_type?: string
  }

  if (!body.title?.trim() || !body.storage_path) {
    return NextResponse.json({ error: 'title and storage_path are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('person_documents')
    .insert({
      person_id: id,
      title: body.title.trim(),
      storage_path: body.storage_path,
      document_type: body.document_type ?? 'other',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ document: data }, { status: 201 })
}
