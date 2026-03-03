'use client'

import { useState, useMemo } from 'react'
import { PersonCard } from './PersonCard'
import { getDisplayName, type Person } from '@/lib/types'

interface PeopleSearchProps {
  people: Person[]
}

export function PeopleSearch({ people }: PeopleSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const name = getDisplayName(p).toLowerCase()
      const maiden = p.maiden_name?.toLowerCase() ?? ''
      return name.includes(q) || maiden.includes(q)
    })
  }, [query, people])

  return (
    <div className="animate-slide-up">
      {/* Search input */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <svg
            className="w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search family members…"
          className="
            w-full pl-11 pr-4 py-3 rounded-xl
            bg-white border border-zinc-200
            text-zinc-800 placeholder-zinc-400
            dark:bg-zinc-900 dark:border-zinc-800
            dark:text-zinc-100 dark:placeholder-zinc-600
            focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10
            transition-all text-sm
          "
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mb-3 px-1">
        {query.trim()
          ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query.trim()}"`
          : `${people.length} member${people.length !== 1 ? 's' : ''}`}
      </p>

      {/* Results */}
      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {filtered.map((person) => (
            <li key={person.id}>
              <PersonCard person={person} variant="default" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl
            bg-zinc-100 border border-zinc-200
            dark:bg-zinc-900 dark:border-zinc-800
            flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773z"
              />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">No results found</p>
          <p className="text-zinc-500 dark:text-zinc-600 text-xs mt-1">Try a different name</p>
        </div>
      )}
    </div>
  )
}
