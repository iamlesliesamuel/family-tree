'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { PersonPhoto } from '@/lib/media-types'

interface PhotoGalleryProps {
  personId: string
}

async function readJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function PhotoGallery({ personId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PersonPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')

  const photoItems = useMemo(
    () => photos.map((p) => ({ ...p, url: supabaseBrowser.storage.from('person-photos').getPublicUrl(p.storage_path).data.publicUrl })),
    [photos]
  )

  async function loadPhotos() {
    setLoading(true)
    const res = await fetch(`/api/person/${personId}/photos`, { cache: 'no-store' })
    const json = await readJsonSafe(res)
    if (!res.ok) {
      setError((typeof json.error === 'string' && json.error) || `Failed to load photos (${res.status})`)
    } else {
      setPhotos(Array.isArray(json.photos) ? (json.photos as PersonPhoto[]) : [])
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const metaRes = await fetch(`/api/person/${personId}/photos`, {
        method: 'POST',
        body: form,
      })
      const metaJson = await readJsonSafe(metaRes)
      if (!metaRes.ok) throw new Error((typeof metaJson.error === 'string' && metaJson.error) || `Upload failed (${metaRes.status})`)

      await loadPhotos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function updateCaption(photoId: string, caption: string): Promise<PersonPhoto | null> {
    const res = await fetch(`/api/person/${personId}/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    })
    const json = await readJsonSafe(res)
    if (!res.ok) {
      setError((typeof json.error === 'string' && json.error) || `Failed to update caption (${res.status})`)
      return null
    }
    const updated = (json.photo as PersonPhoto) ?? null
    if (!updated) return null
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? updated : p)))
    return updated
  }

  async function setAsProfilePhoto(photoId: string) {
    const res = await fetch(`/api/person/${personId}/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_profile: true }),
    })
    const json = await readJsonSafe(res)
    if (!res.ok) {
      setError((typeof json.error === 'string' && json.error) || `Failed to set profile photo (${res.status})`)
      return
    }
    const updated = (json.photo as PersonPhoto) ?? null
    if (!updated) return
    setPhotos((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : { ...p, is_profile: false }))
    )
  }

  async function updatePhotoFocus(photo: PersonPhoto, next: { focus_x?: number; focus_y?: number }) {
    const res = await fetch(`/api/person/${personId}/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        focus_x: next.focus_x ?? photo.focus_x ?? 50,
        focus_y: next.focus_y ?? photo.focus_y ?? 50,
      }),
    })
    const json = await readJsonSafe(res)
    if (!res.ok) {
      setError((typeof json.error === 'string' && json.error) || `Failed to update framing (${res.status})`)
      return
    }
    const updated = (json.photo as PersonPhoto) ?? null
    if (!updated) return
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  async function deletePhoto(photoId: string) {
    const res = await fetch(`/api/person/${personId}/photos/${photoId}`, { method: 'DELETE' })
    const json = await readJsonSafe(res)
    if (!res.ok) {
      setError((typeof json.error === 'string' && json.error) || `Failed to delete photo (${res.status})`)
      return
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  function startEditCaption(photo: PersonPhoto) {
    setEditingCaptionId(photo.id)
    setCaptionDraft(photo.caption ?? '')
  }

  async function saveCaption(photoId: string) {
    const saved = await updateCaption(photoId, captionDraft)
    if (!saved) return
    setEditingCaptionId(null)
    setCaptionDraft('')
  }

  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/70 dark:bg-zinc-900/50 dark:border-zinc-700/50 p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-lg text-zinc-800 dark:text-zinc-100">Photos</h2>
        <label className="px-3 py-1.5 text-xs rounded-md border cursor-pointer border-zinc-300 dark:border-zinc-700">
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
              e.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading photos…</p>
      ) : photoItems.length === 0 ? (
        <p className="text-sm text-zinc-500">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photoItems.map((photo) => (
            <div key={photo.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50/80 dark:bg-zinc-900">
              <button type="button" className="w-full" onClick={() => setLightboxUrl(photo.url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption ?? 'Family photo'} className="w-full h-40 object-cover" />
              </button>
              <div className="p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  {photo.is_profile ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      Profile photo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void setAsProfilePhoto(photo.id)}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
                    >
                      Set as profile
                    </button>
                  )}
                </div>
                {photo.is_profile && (
                  <div className="space-y-2 rounded-md border border-zinc-200 dark:border-zinc-700 p-2">
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Photo framing</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_x: 25 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Left</button>
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_x: 50 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Center</button>
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_x: 75 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Right</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_y: 25 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Top</button>
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_y: 50 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Middle</button>
                      <button type="button" onClick={() => void updatePhotoFocus(photo, { focus_y: 75 })} className="text-[11px] px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700">Bottom</button>
                    </div>
                  </div>
                )}
                {editingCaptionId === photo.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      rows={3}
                      placeholder="Write a caption..."
                      className="w-full text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 resize-y"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void saveCaption(photo.id)}
                        className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCaptionId(null)
                          setCaptionDraft('')
                        }}
                        className="text-xs px-2 py-1 rounded border border-zinc-300/60 dark:border-zinc-700/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {photo.caption ? (
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                        {photo.caption}
                      </p>
                    ) : (
                      <p className="text-xs italic text-zinc-500">No caption yet.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditCaption(photo)}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700"
                    >
                      {photo.caption ? 'Edit caption' : 'Add caption'}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void deletePhoto(photo.id)}
                  className="text-xs text-red-600 dark:text-red-400 self-start"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <button type="button" onClick={() => setLightboxUrl(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Expanded family photo" className="max-h-[90vh] max-w-[90vw] object-contain" />
        </button>
      )}
    </section>
  )
}
