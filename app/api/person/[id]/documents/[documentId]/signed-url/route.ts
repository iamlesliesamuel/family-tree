import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id, documentId } = await context.params

  const { data: doc, error } = await supabase
    .from('person_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('person_id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: error?.message ?? 'Document not found' }, { status: 404 })
  }

  try {
    const admin = getSupabaseAdmin()
    const signed = await admin.storage.from('family-documents').createSignedUrl(doc.storage_path, 60 * 10)
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json({ error: signed.error?.message ?? 'Failed to sign URL' }, { status: 400 })
    }
    return NextResponse.json({ url: signed.data.signedUrl })
  } catch {
    const signed = await supabase.storage.from('family-documents').createSignedUrl(doc.storage_path, 60 * 10)
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json({ error: signed.error?.message ?? 'Failed to sign URL' }, { status: 400 })
    }
    return NextResponse.json({ url: signed.data.signedUrl })
  }
}
