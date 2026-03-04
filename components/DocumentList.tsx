'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { PersonDocument } from '@/lib/media-types'

const DOCUMENT_TYPES = ['funeral_program', 'birth_certificate', 'marriage_certificate', 'obituary', 'other'] as const

type DocType = (typeof DOCUMENT_TYPES)[number]

interface DocumentListProps {
  personId: string
}

export function DocumentList({ personId }: DocumentListProps) {
  const [docs, setDocs] = useState<PersonDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [canUpload, setCanUpload] = useState(false)

  async function loadDocuments() {
    setLoading(true)
    const res = await fetch(`/api/person/${personId}/documents`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Failed to load documents')
    else {
      setDocs(json.documents ?? [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setCanUpload(Boolean(data.user)))
    void loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  async function uploadDocument(file: File, title: string, documentType: DocType) {
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop() || 'pdf'
      const docId = crypto.randomUUID()
      const storagePath = `${personId}/${docId}.${ext}`

      const upload = await supabaseBrowser.storage.from('family-documents').upload(storagePath, file)
      if (upload.error) throw new Error(upload.error.message)

      const save = await fetch(`/api/person/${personId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, storage_path: storagePath, document_type: documentType }),
      })
      const json = await save.json()
      if (!save.ok) throw new Error(json.error ?? 'Failed to save document metadata')

      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function deleteDocument(documentId: string) {
    const res = await fetch(`/api/person/${personId}/documents/${documentId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to delete document')
      return
    }
    setDocs((prev) => prev.filter((d) => d.id !== documentId))
  }

  async function downloadDocument(documentId: string) {
    const res = await fetch(`/api/person/${personId}/documents/${documentId}/signed-url`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json.url) {
      setError(json.error ?? 'Could not generate download URL')
      return
    }
    window.open(json.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/70 dark:bg-zinc-900/50 dark:border-zinc-700/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-zinc-800 dark:text-zinc-100">Documents</h2>
      </div>

      {canUpload ? (
        <DocumentUploadForm uploading={uploading} onSubmit={uploadDocument} />
      ) : (
        <p className="text-xs text-zinc-500 mb-3">Sign in is required to upload or delete documents.</p>
      )}

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading documents…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-zinc-500">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-900/70">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{doc.title}</p>
                <p className="text-xs text-zinc-500">{doc.document_type} · {new Date(doc.uploaded_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void downloadDocument(doc.id)} className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Download</button>
                <button type="button" disabled={!canUpload} onClick={() => void deleteDocument(doc.id)} className="text-xs px-2 py-1 rounded text-red-600 dark:text-red-400 disabled:opacity-40">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DocumentUploadForm({
  uploading,
  onSubmit,
}: {
  uploading: boolean
  onSubmit: (file: File, title: string, type: DocType) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<DocType>('other')

  return (
    <form
      className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 mb-4 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement
        const file = input?.files?.[0]
        if (!file || !title.trim()) return
        void onSubmit(file, title.trim(), type).then(() => {
          setTitle('')
          input.value = ''
        })
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm" required />
      <select value={type} onChange={(e) => setType(e.target.value as DocType)} className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm">
        {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input name="file" type="file" accept=".pdf,image/*" className="text-sm" required />
      <button type="submit" disabled={uploading} className="self-start text-xs px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 disabled:opacity-50">
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}
