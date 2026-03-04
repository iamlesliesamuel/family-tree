'use client'

import { useState } from 'react'

interface RelationshipNotesProps {
  relationshipId: string
}

export function RelationshipNotes({ relationshipId }: RelationshipNotesProps) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (loaded || loading) return
    setLoading(true)
    const res = await fetch(`/api/relationships/${relationshipId}/notes`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Could not load relationship notes')
    else {
      setContent(json.note?.content ?? '')
      setUpdatedAt(json.note?.updated_at ?? null)
      setLoaded(true)
      setError(null)
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/relationships/${relationshipId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error ?? 'Could not save relationship notes')
    else setUpdatedAt(json.note?.updated_at ?? new Date().toISOString())
    setSaving(false)
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) void load()
        }}
        className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {open ? 'Hide notes' : 'Show notes'}
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-zinc-200 dark:border-zinc-700 p-2 bg-white/70 dark:bg-zinc-900/50">
          {updatedAt && <p className="text-[10px] text-zinc-500 mb-1">Updated {new Date(updatedAt).toLocaleString()}</p>}
          {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Relationship context (how they met, migration, history...)"
            className="w-full min-h-20 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-2 text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save relationship notes'}
          </button>
        </div>
      )}
    </div>
  )
}
