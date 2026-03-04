'use client'

import { useEffect, useState } from 'react'
import type { TimelineEvent } from '@/lib/media-types'

interface TimelineViewProps {
  personId: string
}

export function TimelineView({ personId }: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/person/${personId}/timeline`, { cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return
        if (!ok) setError(j.error ?? 'Failed to load timeline')
        else {
          setEvents(j.events ?? [])
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load timeline')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [personId])

  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/70 dark:bg-zinc-900/50 dark:border-zinc-700/50 p-4">
      <h2 className="font-serif text-lg text-zinc-800 dark:text-zinc-100 mb-4">Timeline</h2>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading timeline…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-zinc-500">No timeline events yet.</p>
      ) : (
        <div className="space-y-0">
          {events.map((event, index) => (
            <div key={event.id} className="grid grid-cols-[72px_14px_1fr] gap-3">
              <div className="text-right text-sm text-zinc-500 pt-0.5 tabular-nums">{event.year ?? '—'}</div>
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 mt-1 rounded-full bg-amber-500/60" />
                {index < events.length - 1 && <div className="w-px flex-1 bg-zinc-300/70 dark:bg-zinc-700/60" />}
              </div>
              <div className="pb-5">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{event.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
