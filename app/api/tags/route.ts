import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ tags: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string; description?: string }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: body.name.trim(), description: body.description?.trim() || null })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ tag: data }, { status: 201 })
}
