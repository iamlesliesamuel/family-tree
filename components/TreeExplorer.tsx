'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ExplorerNode, type NodeSize, type ExplorerRole } from './ExplorerNode'
import { PanZoomCanvas } from './PanZoomCanvas'
import { ExplorerSearch } from './ExplorerSearch'
import { DepthControls } from './DepthControls'
import { PeopleSearch } from './SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { getDisplayName, type PersonSummary, type Person } from '@/lib/types'
import { getPersonPhotoUrl } from '@/lib/storage-url'
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

  const ancestorLevels = data.levels.filter(l => l.level < 0).sort((a, b) => a.level - b.level)

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
                <Link href="/updates" className="px-2 py-1 text-xs rounded-md border border-zinc-300/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Updates
                </Link>
                <Link href="/relationship-finder" className="px-2 py-1 text-xs rounded-md border border-zinc-300/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Finder
                </Link>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
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
              <div className="ml-auto flex-shrink-0 flex items-center gap-2">
                <Link href="/updates" className="px-2 py-1 text-xs rounded-md border border-zinc-300/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Updates
                </Link>
                <Link href="/relationship-finder" className="px-2 py-1 text-xs rounded-md border border-zinc-300/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Finder
                </Link>
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
      {activeTab === 'directory' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <PeopleSearch people={allPeopleFull} />
          </div>
        </div>
      ) : (
        <PanZoomCanvas
          resetKey={`${data.focus.id}:${data.levels.reduce((n, l) => n + l.people.length, 0)}`}
          className={cn('transition-opacity duration-200', loading && 'opacity-60')}
        >
          <div className="px-16 py-10">
            <TreeCanvas
              data={data}
              ancestorLevels={ancestorLevels}
              onFocus={refocus}
            />
          </div>
        </PanZoomCanvas>
      )}

      {/* Loading bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
          <div className="h-full bg-amber-500 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
      )}
    </div>
  )
}

// ─── Couple-based descendant tree ───────────────────────────────────────────────
//
// Every parent is shown together with their co-parent (spouse) as a couple, with
// the shared children combed beneath the pair — the way MyHeritage lays it out.
// A co-parent is inferred as "the other recorded parent of a person's children",
// so spouses appear throughout the tree even when they aren't descendants of the
// root. When a person has children with more than one partner, the person is drawn
// once and each union (partner + their children) branches out below.

const NO_PARTNER = '__no_partner__' // sentinel key for children with no recorded co-parent

interface Union {
  spouse: Person | null
  childIds: string[]
}

interface TreeContext {
  byId: Map<string, Person>
  /** personId to their unions (co-parent + shared children), computed once so each
   *  descendant is placed under exactly one parent even with messy multi-parent data. */
  layout: Map<string, Union[]>
  focusId: string
  onFocus: (id: string) => void
}

function sizeForDepth(depth: number): NodeSize {
  return depth <= 1 ? 'md' : depth === 2 ? 'sm' : 'xs'
}

// Fixed width of the marriage link between two spouse cards (see MarriageLink).
const LINK_W = 48

// Rendered card width in px — must stay in sync with ExplorerNode's `cardW`. Used
// to compute where a couple's midpoint falls so the line to their children can
// descend from exactly between them.
function nodeWidthPx(p: Person, size: NodeSize, isFocus: boolean): number {
  const hasPhoto = Boolean(getPersonPhotoUrl(p.profile_photo_path))
  if (isFocus) return hasPhoto ? 170 : 140
  if (hasPhoto) return size === 'md' ? 132 : size === 'sm' ? 96 : 72
  return size === 'md' ? 100 : size === 'sm' ? 72 : 58
}

// Width of an invisible left spacer placed before the children descent. The
// descent sits in a column centred on the blood person, so a left pad of this
// size moves the descent's centre right by half of it — landing it exactly on
// the marriage diamond (blood_centre + bloodW/2 + LINK_W/2), which is where the
// descent line joins the horizontal line between the couple.
function coupleDescentPad(blood: Person, size: NodeSize, isFocus: boolean): number {
  return nodeWidthPx(blood, size, isFocus) + LINK_W
}

// The horizontal tie between two spouses. `descend` continues a vertical stem
// down from the marriage diamond to the bottom of the cards, so the line to the
// couple's children joins the marriage line instead of floating beneath it.
function MarriageLink({ descend = false }: { descend?: boolean }) {
  return (
    <div className="flex flex-col items-center self-stretch flex-shrink-0" style={{ width: LINK_W }}>
      <div className="flex-1" />
      <div className="flex items-center w-full">
        <div className="h-px flex-1 bg-amber-500/25" />
        <Diamond className="text-amber-500/40 mx-0.5 flex-shrink-0" size={7} />
        <div className="h-px flex-1 bg-amber-500/25" />
      </div>
      <div className={cn('flex-1 w-px', descend && 'bg-zinc-300/70 dark:bg-zinc-700/50')} />
    </div>
  )
}

function buildTreeContext(data: SubgraphResult, onFocus: (id: string) => void): TreeContext {
  const byId = new Map<string, Person>(data.allNodes.map((p) => [p.id, p]))

  const childrenByParent = new Map<string, string[]>()
  const parentsByChild   = new Map<string, string[]>()
  data.links.forEach(({ parentId, childId }) => {
    const kids = childrenByParent.get(parentId) ?? []
    if (!kids.includes(childId)) kids.push(childId)
    childrenByParent.set(parentId, kids)

    const parents = parentsByChild.get(childId) ?? []
    if (!parents.includes(parentId)) parents.push(parentId)
    parentsByChild.set(childId, parents)
  })

  const birth = (id: string) => byId.get(id)?.birth_date ?? null
  const sortByBirth = (a: string, b: string) => {
    const ba = birth(a), bb = birth(b)
    if (!ba && !bb) return 0
    if (!ba) return 1
    if (!bb) return -1
    return ba.localeCompare(bb)
  }
  childrenByParent.forEach((kids) => kids.sort(sortByBirth))

  // Only *explicit* relationship partners are force-shown when childless. Co-parent
  // partners inferred from shared children already appear via the child grouping;
  // surfacing them here would resurrect spouses inferred from archived children.
  const focusPartnerIds = data.partners
    .filter((p) => p.relationship)
    .map((p) => p.partner?.id)
    .filter((id): id is string => Boolean(id))

  // Choose the most plausible co-parent for a child that lists several parents:
  // prefer a matching surname, then the parent shared by the most siblings, then a
  // stable id. This keeps dirty multi-parent records from spawning phantom spouses
  // (e.g. a grandchild mistakenly listed as a parent of their uncle).
  const pickCoParent = (childId: string, primaryId: string, freq: Map<string, number>): string => {
    const child = byId.get(childId)
    const others = (parentsByChild.get(childId) ?? []).filter((p) => p !== primaryId && byId.has(p))
    if (others.length === 0) return NO_PARTNER
    others.sort((a, b) => {
      const pa = byId.get(a)!, pb = byId.get(b)!
      const ma = child && pa.last_name === child.last_name ? 1 : 0
      const mb = child && pb.last_name === child.last_name ? 1 : 0
      if (ma !== mb) return mb - ma
      const fa = freq.get(a) ?? 0, fb = freq.get(b) ?? 0
      if (fa !== fb) return fb - fa
      return a.localeCompare(b)
    })
    return others[0]
  }

  // Breadth-first from the focus so nearer generations claim each person first; a
  // person is placed as a child under exactly one parent (no duplicates/cycles).
  const layout = new Map<string, Union[]>()
  const claimed = new Set<string>([data.focus.id])
  const queue: string[] = [data.focus.id]

  while (queue.length > 0) {
    const pid = queue.shift()!
    const kids = (childrenByParent.get(pid) ?? []).filter((c) => byId.has(c) && !claimed.has(c))
    kids.forEach((c) => claimed.add(c))

    // Frequency of each candidate co-parent across this person's children.
    const freq = new Map<string, number>()
    for (const c of kids) {
      for (const pp of parentsByChild.get(c) ?? []) {
        if (pp !== pid && byId.has(pp)) freq.set(pp, (freq.get(pp) ?? 0) + 1)
      }
    }

    const groups = new Map<string, string[]>()
    for (const c of kids) {
      const co = pickCoParent(c, pid, freq)
      const arr = groups.get(co) ?? []
      arr.push(c)
      groups.set(co, arr)
    }

    // The focus keeps its recorded spouses visible even when they share no children.
    if (pid === data.focus.id) {
      for (const sp of focusPartnerIds) {
        if (byId.has(sp) && !groups.has(sp)) groups.set(sp, [])
      }
    }

    layout.set(pid, Array.from(groups.entries()).map(([co, kk]) => ({
      spouse: co === NO_PARTNER ? null : byId.get(co) ?? null,
      childIds: kk,
    })))

    kids.forEach((c) => queue.push(c))
  }

  return { byId, layout, focusId: data.focus.id, onFocus }
}

function FamilyUnit({ id, ctx, depth }: {
  id: string
  ctx: TreeContext
  depth: number
}) {
  const person = ctx.byId.get(id)
  if (!person) return null

  const isFocus = id === ctx.focusId
  const size: NodeSize = isFocus ? 'md' : sizeForDepth(depth)
  const role: ExplorerRole = isFocus ? 'focus' : 'descendant'
  const childSize = sizeForDepth(depth + 1)

  const unions = ctx.layout.get(id) ?? []

  const card = <ExplorerNode person={person} role={role} onFocus={ctx.onFocus} size={size} />
  const renderChild = (cid: string) => (
    <FamilyUnit key={cid} id={cid} ctx={ctx} depth={depth + 1} />
  )

  // No partner and no children → just the person.
  if (unions.length === 0) {
    return <div className="flex flex-col items-center flex-shrink-0">{card}</div>
  }

  // One union → couple side by side; children descend from the couple's MIDPOINT.
  // The blood person stays centered under the connector coming down from their
  // parents; the line down to their own children leaves from between the pair, so
  // it's clear the children belong to both — exactly like MyHeritage.
  if (unions.length === 1) {
    const u = unions[0]
    const hasKids = u.childIds.length > 0
    const pad = u.spouse ? coupleDescentPad(person, size, isFocus) : 0
    return (
      <div className="flex flex-col items-center flex-shrink-0">
        <CoupleRow
          primary={card} spouse={u.spouse} spouseSize={size}
          onFocus={ctx.onFocus} descend={hasKids}
        />
        {hasKids && (
          <ChildrenDescent
            childIds={u.childIds} size={size} childSize={childSize}
            renderChild={renderChild} padLeft={pad}
          />
        )}
      </div>
    )
  }

  // Multiple partners → render each marriage as its own couple block, side by side.
  // The person is shown paired with each partner (never above them, so partners
  // never read as children), children descend from each couple's midpoint, and the
  // blocks pack together with no wide empty gap. Repeating the person per marriage
  // keeps every child's two parents adjacent and unambiguous.
  return (
    <div className="flex items-start justify-center flex-shrink-0">
      {unions.map((u, i) => {
        const hasKids = u.childIds.length > 0
        const pad = u.spouse ? coupleDescentPad(person, size, isFocus) : 0
        return (
          <div key={u.spouse?.id ?? `union-${i}`} className="flex flex-col items-center flex-shrink-0 px-3">
            <CoupleRow
              primary={<ExplorerNode person={person} role={role} onFocus={ctx.onFocus} size={size} />}
              spouse={u.spouse} spouseSize={size} onFocus={ctx.onFocus} descend={hasKids}
            />
            {hasKids && (
              <ChildrenDescent
                childIds={u.childIds} size={size} childSize={childSize}
                renderChild={renderChild} padLeft={pad}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// The connector + comb that drops from a couple to their children. `padLeft`
// reserves invisible space on the left so the descent shifts right to the
// couple's midpoint (the descent column is otherwise centered on the blood person).
function ChildrenDescent({ childIds, size, childSize, renderChild, padLeft = 0 }: {
  childIds: string[]
  size: NodeSize
  childSize: NodeSize
  renderChild: (id: string) => React.ReactNode
  padLeft?: number
}) {
  return (
    <div className="flex items-start">
      {padLeft > 0 && <div aria-hidden="true" className="flex-shrink-0" style={{ width: padLeft }} />}
      <div className="flex flex-col items-center">
        <Connector size={size} />
        <ChildrenComb childIds={childIds} size={childSize} renderChild={renderChild} />
      </div>
    </div>
  )
}

// A blood person shown beside their married-in spouse. The blood person stays
// horizontally centered (an invisible mirror of the spouse side reserves equal
// width on the left), so the connector coming down from the parents lands on the
// blood person — never on the spouse. The spouse hangs off to the side via the
// marriage link. This tells a viewer "Leslie is the child; Marguerite married
// in", not "they're siblings".
function CoupleRow({ primary, spouse, spouseSize, onFocus, descend = false }: {
  primary: React.ReactNode
  spouse: Person | null
  spouseSize: NodeSize
  onFocus: (id: string) => void
  descend?: boolean
}) {
  if (!spouse) return <>{primary}</>

  const spouseCard = <ExplorerNode person={spouse} role="partner" onFocus={onFocus} size={spouseSize} />

  return (
    <div className="flex items-start justify-center">
      {/* Invisible mirror of the spouse side → keeps `primary` centered. */}
      <div className="flex items-start invisible" aria-hidden="true">
        <MarriageLink />
        {spouseCard}
      </div>
      {primary}
      <MarriageLink descend={descend} />
      {spouseCard}
    </div>
  )
}

// A single column of the horizontal "comb" that fans a parent out to its children
// (or a person out to their several unions). Each column paints its own slice of
// the connecting bar via a ::before pseudo-element.
function CombColumn({ children, size }: { children: React.ReactNode; size: NodeSize }) {
  const px     = size === 'md' ? 'px-3' : size === 'sm' ? 'px-2' : 'px-1.5'
  const toothH = size === 'md' ? 'h-3'  : size === 'sm' ? 'h-2.5' : 'h-2'
  return (
    <div className={cn(
      'relative flex flex-col items-center flex-shrink-0', px,
      "before:content-[''] before:absolute before:top-0 before:h-px",
      'before:bg-zinc-300/70 dark:before:bg-zinc-700/50',
      'before:left-0 before:w-full',
      'first:before:left-[50%] first:before:w-[50%]',
      'last:before:w-[50%]',
    )}>
      <div className={cn('w-px bg-zinc-300/70 dark:bg-zinc-700/50 mt-px', toothH)} />
      {children}
    </div>
  )
}

function ChildrenComb({ childIds, size, renderChild }: {
  childIds: string[]
  size: NodeSize
  renderChild: (id: string) => React.ReactNode
}) {
  if (childIds.length === 1) {
    return <div className="flex justify-center">{renderChild(childIds[0])}</div>
  }
  return (
    <div className="flex flex-nowrap items-start justify-center">
      {childIds.map((cid) => (
        <CombColumn key={cid} size={size}>{renderChild(cid)}</CombColumn>
      ))}
    </div>
  )
}

// ─── TreeCanvas ────────────────────────────────────────────────────────────────

interface TreeCanvasProps {
  data: SubgraphResult
  ancestorLevels: SubgraphLevel[]
  onFocus: (id: string) => void
}

function TreeCanvas({ data, ancestorLevels, onFocus }: TreeCanvasProps) {
  const hasAncestors = ancestorLevels.length > 0
  const ctx = buildTreeContext(data, onFocus)

  const focusUnions    = ctx.layout.get(data.focus.id) ?? []
  const hasDescendants = focusUnions.some((u) => u.childIds.length > 0)
  const hasPartners    = focusUnions.some((u) => u.spouse)

  return (
    <div className="inline-flex flex-col items-center gap-0 animate-fade-in">

      {/* ── Ancestor levels ──────────────────────────────────────────────── */}
      {ancestorLevels.map((level) => (
        <div key={level.level} className="flex flex-col items-center w-full">
          <GenerationLabel level={level.level} />
          <GenerationRow people={level.people} role="ancestor" onFocus={onFocus} />
          <Connector />
        </div>
      ))}

      {/* ── Focus + descendants, rendered as couples ─────────────────────── */}
      <div className="flex flex-col items-center w-full py-3">
        <FamilyUnit id={data.focus.id} ctx={ctx} depth={0} />
      </div>

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
  if (people.length === 2) {
    return (
      <div className="flex flex-nowrap justify-center items-center gap-2">
        <ExplorerNode person={people[0]} role={role} onFocus={onFocus} />
        <div className="relative flex items-center gap-1.5 self-stretch">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-zinc-300/70 dark:bg-zinc-700/60" />
          <div className="w-4 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
          <Diamond className="text-amber-500/35" size={8} />
          <div className="w-4 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
        </div>
        <ExplorerNode person={people[1]} role={role} onFocus={onFocus} />
      </div>
    )
  }
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
