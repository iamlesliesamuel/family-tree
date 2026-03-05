'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfilePhotoQuickUploadProps {
  personId: string
}

export function ProfilePhotoQuickUpload({ personId }: ProfilePhotoQuickUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function onFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch(`/api/person/${personId}/photos`, { method: 'POST', body: form })
      const uploadJson = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok || !uploadJson.photo?.id) {
        throw new Error(uploadJson.error ?? `Upload failed (${uploadRes.status})`)
      }

      const setProfileRes = await fetch(`/api/person/${personId}/photos/${uploadJson.photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_profile: true }),
      })
      const setProfileJson = await setProfileRes.json().catch(() => ({}))
      if (!setProfileRes.ok) {
        throw new Error(setProfileJson.error ?? `Failed to set profile photo (${setProfileRes.status})`)
      }

      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload profile photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Profile Photo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onFile(file)
          e.currentTarget.value = ''
        }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
