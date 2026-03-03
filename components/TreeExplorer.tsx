'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ExplorerNode } from './ExplorerNode'
import { ExplorerSearch } from './ExplorerSearch'
import { DepthControls } from './DepthControls'
import { PeopleSearch } from './SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { getDisplayName, type PersonSummary, type Person } from '@/lib/types'
import type { SubgraphResult, SubgraphLevel } from '@/lib/subgraph'

interface TreeExplorerProps {
  initialData: SubgraphResult
  defaultPersonId: string
  allPeople: PersonSummary[]
  allPeopleFull: Person[]
  initialAncestorDepth?: number
  initialDescendantDepth?: number
}

// ─── TreeExplorer ──────────────────────────────────────────────────────────────

export function TreeExplorer({
  initialData,
  defaultPersonId,
  allPeople,
  allPeopleFull,
  initialAncestorDepth = 2,
  initialDescendantDepth = 2,
}: TreeExplorerProps) {
  const [focusId, setFocusId]                   = useState(initialData.focus.id)
  const [ancestorDepth, setAncestorDepth]       = useState(initialAncestorDepth)
  const [descendantDepth, setDescendantDepth]   = useState(initialDescendantDepth)
  const [data, setData]                         = useState<SubgraphResult>(initialData)
  const [loading, setLoading]                   = useState(false)
  const [activeTab, setActiveTab]               = useState<'tree' | 'directory'>('tree')

  const [history, setHistory]   = useState<string[]>([initialData.focus.id])
  const [histIdx, setHistIdx]   = useState(0)
  const isFirstMount            = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/subgraph?id=${focusId}&ancestorDepth=${ancestorDepth}&descendantDepth=${descendantDepth}`)
      .then(r => r.json())
      .then((d: SubgraphResult) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [focusId, ancestorDepth, descendantDepth])

  const refocus = useCallback((id: string) => {
    if (id === focusId) return
    const newHistory = [...history.slice(0, histIdx + 1), id]
    setHistory(newHistory)
    setHistIdx(newHistory.length - 1)
    setFocusId(id)
  }, [focusId, history, histIdx])

  const goBack    = () => { if (histIdx > 0)                  { const i = histIdx - 1; setHistIdx(i); setFocusId(history[i]) } }
  const goForward = () => { if (histIdx < history.length - 1) { const i = histIdx + 1; setHistIdx(i); setFocusId(history[i]) } }
  const reset     = () => refocus(defaultPersonId)

  const canGoBack    = histIdx > 0
  const canGoForward = histIdx < history.length - 1

  const ancestorLevels   = data.levels.filter(l => l.level < 0).sort((a, b) => a.level - b.level)
  const descendantLevels = data.levels.filter(l => l.level > 0).sort((a, b) => a.level - b.level)

  return (
    <div className="flex flex-col flex-1 h-full">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className={cn(
        'sticky top-0 z-20 backdrop-blur-md border-b',
        'bg-zinc-50/90 border-zinc-200/60',
        'dark:bg-zinc-950/85 dark:border-zinc-800/60',
      )}>
        <div className="max-w-5xl mx-auto px-4">

          {/* Row 1: branding + tabs + search + nav */}
          <div className="flex items-center gap-3 py-3">

            {/* Logo / brand */}
            <div className="flex items-center gap-2 mr-1 flex-shrink-0">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                'bg-amber-500/10 border border-amber-500/25',
                'shadow-[inset_0_1px_0_rgba(212,176,70,0.12),0_1px_3px_rgba(0,0,0,0.08)]',
              )}>
                <svg className="w-4 h-4 text-amber-600/80 dark:text-amber-400/80"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className={cn(
                'font-serif text-base font-medium tracking-wide hidden sm:block',
                'text-zinc-700 dark:text-zinc-300',
              )}>
                Family Tree
              </span>
            </div>

            {/* Tab switcher */}
            <div className={cn(
              'flex gap-0.5 p-0.5 rounded-lg flex-shrink-0 border',
              'bg-zinc-100 border-zinc-200/60',
              'dark:bg-zinc-900 dark:border-zinc-700/60',
            )}>
              {(['tree', 'directory'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all capitalize',
                    activeTab === tab
                      ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                  )}
                >
                  {tab === 'tree' ? '🌳 Tree' : '📋 Directory'}
                </button>
              ))}
            </div>

            {/* Search */}
            {activeTab === 'tree' && (
              <div className="flex-1 min-w-0">
                <ExplorerSearch people={allPeople} onSelect={refocus} />
              </div>
            )}

            {/* Nav buttons + theme toggle */}
            {activeTab === 'tree' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <NavBtn onClick={goBack} disabled={!canGoBack} title="Back">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </NavBtn>
                <NavBtn onClick={goForward} disabled={!canGoForward} title="Forward">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NavBtn>
                <NavBtn onClick={reset} title="Reset to root">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1018 0 9 9 0 00-18 0M3 12l3-3m-3 3l3 3" />
                  </svg>
                </NavBtn>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
                <ThemeToggle />
              </div>
            )}

            {/* Theme toggle in directory tab (no nav buttons there) */}
            {activeTab === 'directory' && (
              <div className="ml-auto flex-shrink-0">
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* Row 2: depth controls + focus indicator */}
          {activeTab === 'tree' && (
            <div className="flex items-center justify-between pb-2.5 gap-2 flex-wrap">
              <DepthControls
                ancestorDepth={ancestorDepth}
                descendantDepth={descendantDepth}
                onAncestorChange={setAncestorDepth}
                onDescendantChange={setDescendantDepth}
              />
              <p className={cn(
                'text-xs truncate flex items-center gap-1.5',
                'text-zinc-400 dark:text-zinc-600',
              )}>
                <Diamond className="text-amber-600/40 flex-shrink-0" size={6} />
                <span>Focused on </span>
                <span className={cn(
                  'font-serif text-sm font-medium leading-none',
                  'text-zinc-700 dark:text-zinc-300',
                )}>
                  {getDisplayName(data.focus)}
                </span>
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'directory' ? (
          <div className="max-w-2xl mx-auto px-4 py-6">
            <PeopleSearch people={allPeopleFull} />
          </div>
        ) : (
          <div className={cn(
            'w-full px-4 py-8 transition-opacity duration-200',
            loading && 'opacity-50 pointer-events-none'
          )}>
            <TreeCanvas
              data={data}
              ancestorLevels={ancestorLevels}
              descendantLevels={descendantLevels}
              onFocus={refocus}
            />
          </div>
        )}
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
          <div className="h-full bg-amber-500 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
      )}
    </div>
  )
}

// ─── DescendantBranch ──────────────────────────────────────────────────────────

function DescendantBranch({
  person,
  childMap,
  onFocus,
  depth = 1,
}: {
  person: Person
  childMap: Map<string, Person[]>
  onFocus: (id: string) => void
  depth?: number
}) {
  const children = childMap.get(person.id) ?? []
  const size: 'md' | 'sm' | 'xs' = depth === 1 ? 'md' : depth === 2 ? 'sm' : 'xs'
  const px      = size === 'md' ? 'px-3' : size === 'sm' ? 'px-2' : 'px-1.5'
  const toothH  = size === 'md' ? 'h-3'  : size === 'sm' ? 'h-2.5' : 'h-2'

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <ExplorerNode person={person} role="descendant" onFocus={onFocus} size={size} />
      {children.length > 0 && (
        <>
          <Connector size={size} />
          {children.length === 1 ? (
            /* Single child — straight stem, no comb needed */
            <DescendantBranch
              person={children[0]}
              childMap={childMap}
              onFocus={onFocus}
              depth={depth + 1}
            />
          ) : (
            /* Multiple children — horizontal comb bar via ::before on each column */
            <div className="flex flex-nowrap items-start justify-center">
              {children.map(child => (
                <div
                  key={child.id}
                  className={cn(
                    'relative flex flex-col items-center flex-shrink-0', px,
                    // Horizontal comb bar: each column draws its slice
                    "before:content-[''] before:absolute before:top-0 before:h-px",
                    'before:bg-zinc-300/70 dark:before:bg-zinc-700/50',
                    'before:left-0 before:w-full',            // middle children: full width
                    'first:before:left-[50%] first:before:w-[50%]', // first: right half
                    'last:before:w-[50%]',                    // last: left half
                  )}
                >
                  {/* Tooth: short vertical drop from bar down to child card */}
                  <div className={cn('w-px bg-zinc-300/70 dark:bg-zinc-700/50 mt-px', toothH)} />
                  <DescendantBranch
                    person={child}
                    childMap={childMap}
                    onFocus={onFocus}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── TreeCanvas ────────────────────────────────────────────────────────────────

interface TreeCanvasProps {
  data: SubgraphResult
  ancestorLevels: SubgraphLevel[]
  descendantLevels: SubgraphLevel[]
  onFocus: (id: string) => void
}

function TreeCanvas({ data, ancestorLevels, descendantLevels, onFocus }: TreeCanvasProps) {
  const hasAncestors = ancestorLevels.length > 0
  const hasPartners  = data.partners.length > 0

  const allDescendantPeople = new Map<string, Person>()
  descendantLevels.forEach(level => level.people.forEach(p => allDescendantPeople.set(p.id, p)))

  const childMap = new Map<string, Person[]>()
  data.links.forEach(({ parentId, childId }) => {
    const child = allDescendantPeople.get(childId)
    if (!child) return
    const existing = childMap.get(parentId) ?? []
    existing.push(child)
    childMap.set(parentId, existing)
  })

  childMap.forEach(children => {
    children.sort((a, b) => {
      if (!a.birth_date && !b.birth_date) return 0
      if (!a.birth_date) return 1
      if (!b.birth_date) return -1
      return a.birth_date.localeCompare(b.birth_date)
    })
  })

  const focusChildren  = childMap.get(data.focus.id) ?? []
  const hasDescendants = focusChildren.length > 0

  return (
    <div className="flex flex-col items-center gap-0 w-full animate-fade-in">

      {/* ── Ancestor levels ──────────────────────────────────────────────── */}
      {ancestorLevels.map((level, i) => (
        <div key={level.level} className="flex flex-col items-center w-full">
          <GenerationLabel level={level.level} />
          <GenerationRow people={level.people} role="ancestor" onFocus={onFocus} />
          <Connector />
          {i < ancestorLevels.length - 1 && (
            <div className="w-full max-w-xs border-t border-dashed border-zinc-200/60 dark:border-zinc-800/50 my-1" />
          )}
        </div>
      ))}

      {/* ── Ancestor → focus divider ─────────────────────────────────────── */}
      {hasAncestors && (
        <OrnamentalRule label="Focus" className="mb-4 max-w-sm" />
      )}

      {/* ── Focus person + partners ───────────────────────────────────────── */}
      <div className="flex items-start justify-center gap-3 flex-wrap py-2">
        <ExplorerNode person={data.focus} role="focus" onFocus={onFocus} />

        {hasPartners && (
          <>
            <div className="flex items-center self-center h-10">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-px bg-amber-500/25" />
                <Diamond className="text-amber-500/30" size={8} />
                <div className="w-4 h-px bg-amber-500/25" />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {data.partners.map(({ partner }) =>
                partner ? (
                  <ExplorerNode key={partner.id} person={partner} role="partner" onFocus={onFocus} />
                ) : null
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Descendants ─────────────────────────────────────────────────── */}
      {hasDescendants && (
        <>
          <OrnamentalRule label="Descendants" className="mt-5 mb-0" />
          <Connector />
          <div className="w-full overflow-x-auto">
            <div className="flex flex-nowrap items-start justify-center px-4 pb-10 min-w-min mx-auto">
              {focusChildren.length === 1 ? (
                <DescendantBranch
                  person={focusChildren[0]}
                  childMap={childMap}
                  onFocus={onFocus}
                  depth={1}
                />
              ) : (
                focusChildren.map(child => (
                  <div
                    key={child.id}
                    className={cn(
                      'relative flex flex-col items-center flex-shrink-0 px-3',
                      "before:content-[''] before:absolute before:top-0 before:h-px",
                      'before:bg-zinc-300/70 dark:before:bg-zinc-700/50',
                      'before:left-0 before:w-full',
                      'first:before:left-[50%] first:before:w-[50%]',
                      'last:before:w-[50%]',
                    )}
                  >
                    <div className="w-px h-3 mt-px bg-zinc-300/70 dark:bg-zinc-700/50" />
                    <DescendantBranch
                      person={child}
                      childMap={childMap}
                      onFocus={onFocus}
                      depth={1}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasAncestors && !hasDescendants && !hasPartners && (
        <p className="mt-8 text-sm text-zinc-400 dark:text-zinc-600 italic text-center">
          No family connections recorded for this person.
        </p>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GenerationRow({ people, role, onFocus }: {
  people: Person[]
  role: 'ancestor' | 'descendant'
  onFocus: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {people.map(p => (
        <ExplorerNode key={p.id} person={p} role={role} onFocus={onFocus} />
      ))}
    </div>
  )
}

function GenerationLabel({ level }: { level: number }) {
  const abs = Math.abs(level)
  const label =
    level < 0
      ? abs === 1 ? 'Parents' : abs === 2 ? 'Grandparents' : abs === 3 ? 'Great-grandparents' : `${abs} generations back`
      : abs === 1 ? 'Children' : abs === 2 ? 'Grandchildren' : abs === 3 ? 'Great-grandchildren' : `${abs} generations down`

  return (
    <p className="font-serif text-sm italic text-zinc-400 dark:text-zinc-500 text-center mb-1 mt-4 tracking-wide">
      {label}
    </p>
  )
}

function Connector({ size = 'md' }: { size?: 'md' | 'sm' | 'xs' }) {
  const lineH   = size === 'md' ? 'h-4' : size === 'sm' ? 'h-3' : 'h-2'
  const showGem = size !== 'xs'
  return (
    <div className="flex flex-col items-center my-0.5">
      <div className={cn('w-px bg-zinc-300/70 dark:bg-zinc-700/50', lineH)} />
      {showGem
        ? <Diamond className="text-amber-600/25" size={6} />
        : <div className="w-1 h-1 rounded-full bg-zinc-300/70 dark:bg-zinc-700/60" />
      }
      <div className={cn('w-px bg-zinc-300/70 dark:bg-zinc-700/50', lineH)} />
    </div>
  )
}

function OrnamentalRule({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 w-full', className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-zinc-300/60 dark:to-zinc-700/50" />
      <div className="flex items-center gap-2 flex-shrink-0">
        <Diamond className="text-amber-600/30" size={6} />
        <span className="font-serif text-sm tracking-wide text-zinc-400 dark:text-zinc-500 italic">{label}</span>
        <Diamond className="text-amber-600/30" size={6} />
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-zinc-300/60 dark:to-zinc-700/50" />
    </div>
  )
}

function Diamond({ size = 6, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8"
      className={cn('flex-shrink-0', className)} fill="currentColor">
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
  )
}

function NavBtn({ onClick, disabled, title, children }: {
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
        disabled
          ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 active:scale-90'
      )}
    >
      {children}
    </button>
  )
}
