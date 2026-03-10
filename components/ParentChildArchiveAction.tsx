'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ParentChildArchiveActionProps {
  linkId?: string
  archivedAt?: string | null
  label: string
}

export function ParentChildArchiveAction({ linkId, archivedAt, label }: ParentChildArchiveActionProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!linkId) return null

  const isArchived = Boolean(archivedAt)

  async function handleClick() {
    const confirmed = window.confirm(
      isArchived
        ? `Restore the ${label.toLowerCase()} relationship?`
        : `Remove the ${label.toLowerCase()} relationship?\n\nThis only removes the connection. It does not delete either person.`
    )
    if (!confirmed) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/parent-child/${linkId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: isArchived }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((typeof json.error === 'string' && json.error) || `Request failed (${res.status})`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update relationship')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={submitting}
        className={`px-2.5 py-1 rounded-md text-xs font-medium border disabled:opacity-60 ${
          isArchived
            ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30'
            : 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/20'
        }`}
      >
        {submitting ? (isArchived ? 'Restoring...' : 'Removing...') : (isArchived ? `Restore ${label}` : `Remove ${label}`)}
      </button>
      {error && <p className="text-right text-[11px] text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
