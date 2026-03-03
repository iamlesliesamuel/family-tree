'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { getYear, type PersonSummary } from '@/lib/types'

interface ExplorerSearchProps {
  people: PersonSummary[]
  onSelect: (id: string) => void
}

export function ExplorerSearch({ people, onSelect }: ExplorerSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return people
      .filter((p) => {
        const full = `${p.first_name} ${p.last_name}`.toLowerCase()
        const maiden = p.maiden_name?.toLowerCase() ?? ''
        return full.includes(q) || maiden.includes(q)
      })
      .slice(0, 8)
  }, [query, people])

  useEffect(() => {
    setOpen(results.length > 0)
  }, [results])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (id: string) => {
    setQuery('')
    setOpen(false)
    onSelect(id)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      {/* Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search family…"
          autoComplete="off"
          spellCheck={false}
          className="
            w-full pl-9 pr-3 py-2 rounded-xl text-sm
            bg-white border border-zinc-300
            text-zinc-800 placeholder-zinc-400
            dark:bg-zinc-900 dark:border-zinc-700/50
            dark:text-zinc-100 dark:placeholder-zinc-600
            focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10
            transition-all
          "
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
          bg-white border border-zinc-200
          dark:bg-zinc-900 dark:border-zinc-700/50
          rounded-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)]
          dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]
          overflow-hidden">
          {results.map((p) => {
            const year = getYear(p.birth_date)
            return (
              <button
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p.id) }}
                className="w-full flex items-center gap-3 px-3 py-2.5
                  text-left
                  hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70
                  transition-colors
                  border-b border-zinc-200/50 dark:border-zinc-700/30
                  last:border-0"
              >
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md
                  bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-500
                  dark:bg-zinc-800 dark:border-zinc-700">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                    {p.first_name} {p.last_name}
                    {p.maiden_name && (
                      <span className="text-zinc-500 font-normal italic"> née {p.maiden_name}</span>
                    )}
                  </p>
                  {year && <p className="text-xs text-zinc-500 dark:text-zinc-600 tabular-nums">{year}</p>}
                </div>
                <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
