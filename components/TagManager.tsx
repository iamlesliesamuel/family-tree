'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Tag } from '@/lib/media-types'

interface TagManagerProps {
  personId: string
}

type PersonTagRow = { person_id: string; tag_id: string; tags?: Tag }

export function TagManager({ personId }: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [personTags, setPersonTags] = useState<PersonTagRow[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const assignedIds = useMemo(() => new Set(personTags.map((pt) => pt.tag_id)), [personTags])
  const availableTags = useMemo(() => allTags.filter((t) => !assignedIds.has(t.id)), [allTags, assignedIds])

  async function loadData() {
    setLoading(true)
    const [tagsRes, personTagsRes] = await Promise.all([
      fetch('/api/tags', { cache: 'no-store' }),
      fetch(`/api/person/${personId}/tags`, { cache: 'no-store' }),
    ])

    const tagsJson = await tagsRes.json()
    const personTagsJson = await personTagsRes.json()

    if (!tagsRes.ok) setError(tagsJson.error ?? 'Failed to load tags')
    else setAllTags(tagsJson.tags ?? [])

    if (!personTagsRes.ok) setError(personTagsJson.error ?? 'Failed to load person tags')
    else setPersonTags(personTagsJson.personTags ?? [])

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  async function createTag() {
    if (!newTagName.trim()) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim(), description: newTagDescription.trim() || null }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to create tag')
      return
    }
    setNewTagName('')
    setNewTagDescription('')
    await loadData()
  }

  async function assignTag(tagId: string) {
    const res = await fetch(`/api/person/${personId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to assign tag')
      return
    }
    await loadData()
  }

  async function removeTag(tagId: string) {
    const res = await fetch(`/api/person/${personId}/tags?tagId=${encodeURIComponent(tagId)}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to remove tag')
      return
    }
    await loadData()
  }

  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/70 dark:bg-zinc-900/50 dark:border-zinc-700/50 p-4">
      <h2 className="font-serif text-lg text-zinc-800 dark:text-zinc-100 mb-3">Tags</h2>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading tags…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {personTags.length === 0 && <p className="text-sm text-zinc-500">No tags assigned.</p>}
            {personTags.map((pt) => (
              <span key={pt.tag_id} className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
                {pt.tags?.name ?? pt.tag_id}
                <button type="button" className="opacity-70 hover:opacity-100" onClick={() => void removeTag(pt.tag_id)}>×</button>
              </span>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 mb-3">
            <p className="text-xs text-zinc-500 mb-2">Assign existing tag</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.length === 0 && <p className="text-xs text-zinc-500">No unassigned tags available.</p>}
              {availableTags.map((tag) => (
                <button key={tag.id} type="button" onClick={() => void assignTag(tag.id)} className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">
                  + {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <p className="text-xs text-zinc-500 mb-2">Create new tag</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tag name" className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm" />
              <input value={newTagDescription} onChange={(e) => setNewTagDescription(e.target.value)} placeholder="Description (optional)" className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => void createTag()} className="text-xs px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700">Create</button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
