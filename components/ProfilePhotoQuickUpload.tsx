'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfilePhotoQuickUploadProps {
  personId: string
  variant?: 'button' | 'tile'
  label?: string
  buttonClassName?: string
  photoUrl?: string | null
  initials?: string
}

export function ProfilePhotoQuickUpload({
  personId,
  variant = 'button',
  label,
  buttonClassName,
  photoUrl,
  initials,
}: ProfilePhotoQuickUploadProps) {
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
    <div className={variant === 'tile' ? 'space-y-2' : ''}>
      {variant === 'tile' ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-60"
          aria-label="Upload profile photo"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif text-lg text-zinc-600 dark:text-zinc-300">{initials || 'PH'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/90 text-zinc-700 text-[10px]">+</span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={buttonClassName ?? 'text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 disabled:opacity-50'}
        >
          {uploading ? 'Uploading...' : label ?? 'Upload Profile Photo'}
        </button>
      )}
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
      {variant === 'tile' && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Click photo to upload profile image</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
