'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface PersonArchiveActionProps {
  personId: string
  displayName: string
  archivedAt?: string | null
}

export function PersonArchiveAction({ personId, displayName, archivedAt }: PersonArchiveActionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isArchived = Boolean(archivedAt)

  async function handleClick() {
    const confirmed = window.confirm(
      isArchived
        ? `Restore ${displayName} to the family tree?`
        : `Remove ${displayName} from the family tree?\n\nThis archives the person so they are hidden by default and can still be restored.`
    )

    if (!confirmed) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restore: isArchived,
          archived_reason: isArchived ? null : 'Removed from tree',
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((typeof json.error === 'string' && json.error) || `Request failed (${res.status})`)
      }

      const next = new URLSearchParams(searchParams.toString())
      if (isArchived) next.delete('showArchived')
      else next.set('showArchived', '1')
      next.delete('edit')

      const query = next.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this person')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={submitting}
        className={`px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-60 ${
          isArchived
            ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/30'
            : 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/20'
        }`}
      >
        {submitting ? (isArchived ? 'Restoring...' : 'Removing...') : (isArchived ? 'Restore Person' : 'Remove from Tree')}
      </button>
      {error && <p className="max-w-52 text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
