'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PersonSummary } from '@/lib/types'

interface RelationshipFinderProps {
  people: PersonSummary[]
}

export function RelationshipFinder({ people }: RelationshipFinderProps) {
  const [personA, setPersonA] = useState('')
  const [personB, setPersonB] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...people].sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)),
    [people]
  )

  useEffect(() => {
    const me = localStorage.getItem('family_tree_me')
    if (me) setPersonA(me)
  }, [])

  const saveMe = () => {
    if (!personA) return
    localStorage.setItem('family_tree_me', personA)
  }

  const findPath = async () => {
    if (!personA || !personB) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSummary(null)
    try {
      const res = await fetch(`/api/relationship-path?a=${encodeURIComponent(personA)}&b=${encodeURIComponent(personB)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not calculate relationship')
      if (!json.path) {
        setSummary(null)
        setResult('No relationship path found in current tree data.')
      } else {
        setSummary(typeof json.summary === 'string' ? json.summary : null)
        setResult(json.readable ?? 'Path found.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not calculate relationship')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 p-4 space-y-3">
      <h2 className="font-serif text-lg">How am I related?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs text-zinc-500">
          Person A
          <select value={personA} onChange={(e) => setPersonA(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm">
            <option value="">Select person...</option>
            {sorted.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Person B
          <select value={personB} onChange={(e) => setPersonB(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm">
            <option value="">Select person...</option>
            {sorted.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => void findPath()} disabled={loading || !personA || !personB} className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700 disabled:opacity-50">
          {loading ? 'Finding...' : 'Find Relationship'}
        </button>
        <button type="button" onClick={saveMe} disabled={!personA} className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-300 dark:border-zinc-700 disabled:opacity-50">
          Save A as Me
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {summary && <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{summary}</p>}
      {result && <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result}</p>}
    </div>
  )
}
