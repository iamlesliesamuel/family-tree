'use client'

import { useEffect, useMemo, useState } from 'react'

interface NotesEditorProps {
  personId: string
}

export function NotesEditor({ personId }: NotesEditorProps) {
  const [html, setHtml] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/person/${personId}/notes`, { cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return
        if (!ok) setError(j.error ?? 'Failed to load notes')
        else {
          setHtml(j.note?.content ?? '')
          setUpdatedAt(j.note?.updated_at ?? null)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load notes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [personId])

  const formattedUpdated = useMemo(
    () => (updatedAt ? new Date(updatedAt).toLocaleString() : null),
    [updatedAt]
  )

  async function saveNotes() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/person/${personId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save notes')
      setUpdatedAt(json.note?.updated_at ?? new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/70 dark:bg-zinc-900/50 dark:border-zinc-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-zinc-800 dark:text-zinc-100">Notes</h2>
        <button
          type="button"
          onClick={() => void saveNotes()}
          disabled={saving || loading}
          className="text-xs px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {formattedUpdated && <p className="text-xs text-zinc-500 mb-2">Last updated: {formattedUpdated}</p>}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading notes…</p>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <ToolbarBtn onClick={() => execCmd('bold')}>Bold</ToolbarBtn>
            <ToolbarBtn onClick={() => execCmd('italic')}>Italic</ToolbarBtn>
            <ToolbarBtn onClick={() => execCmd('insertUnorderedList')}>Bullets</ToolbarBtn>
            <ToolbarBtn onClick={() => execCmd('insertOrderedList')}>Numbers</ToolbarBtn>
          </div>
          <div
            className="min-h-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-sm text-zinc-800 dark:text-zinc-100 prose prose-sm max-w-none"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setHtml(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: html || '<p></p>' }}
          />
        </div>
      )}
    </section>
  )
}

function execCmd(command: string) {
  document.execCommand(command)
}

function ToolbarBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
    >
      {children}
    </button>
  )
}
