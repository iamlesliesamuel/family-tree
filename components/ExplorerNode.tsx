'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDisplayName, getYearRange, type Person } from '@/lib/types'

export type ExplorerRole = 'focus' | 'ancestor' | 'descendant' | 'partner'
export type NodeSize = 'md' | 'sm' | 'xs'

interface ExplorerNodeProps {
  person: Person
  role?: ExplorerRole
  onFocus: (id: string) => void
  badge?: string
  className?: string
  size?: NodeSize
}

export function ExplorerNode({
  person,
  role = 'ancestor',
  onFocus,
  badge,
  className,
  size = 'md',
}: ExplorerNodeProps) {
  const initials = [person.first_name[0], person.last_name[0]].join('').toUpperCase()
  const years    = getYearRange(person)
  const isFocus  = role === 'focus'

  const cardW   = isFocus      ? 'w-[140px]'
                : size === 'md' ? 'w-[100px]'
                : size === 'sm' ? 'w-[72px]'
                :                 'w-[58px]'

  const cardPad = isFocus      ? 'px-5 py-4'
                : size === 'md' ? 'px-3 py-3'
                : size === 'sm' ? 'px-2 py-2'
                :                 'px-1.5 py-1.5'

  const cardGap = (size === 'sm' || size === 'xs') ? 'gap-1' : 'gap-2'

  const avatarSz = isFocus      ? 'w-12 h-12 text-sm'
                 : size === 'md' ? 'w-8 h-8 text-xs'
                 : size === 'sm' ? 'w-5 h-5 text-[10px]'
                 :                 'w-4 h-4 text-[9px]'

  const nameText = isFocus      ? 'text-sm font-serif'
                 : size === 'xs' ? 'text-[9px]'
                 :                 'text-[11px] font-serif'

  const showYear = size !== 'xs'

  return (
    <div className={cn('relative group/node', className)}>

      {/* ── Main card — click navigates to profile ────────────────────── */}
      <Link
        href={`/person/${person.id}`}
        className={cn(
          'flex flex-col items-center rounded-xl border transition-all duration-200',
          cardGap, cardPad, cardW,
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          'active:scale-95',
          isFocus
            ? [
                'bg-zinc-100 border-amber-500/50 dark:bg-zinc-800',
                'shadow-[0_0_28px_-8px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(212,176,70,0.08)]',
                'dark:shadow-[0_0_36px_-8px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(212,176,70,0.08)]',
                'hover:border-amber-400/70',
              ]
            : [
                'bg-white border-zinc-200/70 dark:bg-zinc-900 dark:border-zinc-700/60',
                'shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]',
                'dark:shadow-[inset_0_1px_0_rgba(212,176,70,0.04)]',
                role === 'partner'
                  ? 'hover:border-amber-500/40 hover:shadow-[0_4px_20px_-4px_rgba(201,164,50,0.12)]'
                  : 'hover:border-zinc-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] dark:hover:border-zinc-600',
                'hover:-translate-y-0.5',
              ]
        )}
      >
        {/* Avatar */}
        <div className={cn(
          'flex items-center justify-center rounded-lg font-semibold transition-colors flex-shrink-0',
          avatarSz,
          isFocus
            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300'
            : [
                'bg-zinc-100 border border-zinc-200 text-zinc-500',
                'dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400',
                'group-hover/node:border-amber-500/30 group-hover/node:text-amber-600',
                'dark:group-hover/node:text-amber-400',
              ]
        )}>
          {initials}
        </div>

        {/* Name */}
        <div className="text-center w-full overflow-hidden">
          <p className={cn(
            'leading-tight truncate w-full transition-colors font-medium',
            nameText,
            isFocus
              ? 'text-zinc-800 dark:text-zinc-100'
              : 'text-zinc-600 group-hover/node:text-zinc-800 dark:text-zinc-300 dark:group-hover/node:text-zinc-100'
          )}>
            {person.first_name}
          </p>
          <p className={cn(
            'leading-tight truncate w-full transition-colors font-medium',
            nameText,
            isFocus
              ? 'text-zinc-800 dark:text-zinc-100'
              : 'text-zinc-600 group-hover/node:text-zinc-800 dark:text-zinc-300 dark:group-hover/node:text-zinc-100'
          )}>
            {person.last_name}
          </p>
          {showYear && years && (
            <p className="text-zinc-400 dark:text-zinc-600 text-[10px] mt-0.5 tabular-nums">{years}</p>
          )}
        </div>

        {badge && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/10
            text-amber-600 dark:text-amber-500/80 border border-amber-500/20 font-medium">
            {badge}
          </span>
        )}
      </Link>

      {/* ── Refocus-tree button — appears on hover ─────────────────────── */}
      {!isFocus && size !== 'xs' && (
        <button
          onClick={(e) => { e.preventDefault(); onFocus(person.id) }}
          className={cn(
            'absolute top-1.5 right-1.5 flex items-center justify-center',
            'w-5 h-5 rounded-md',
            'bg-white/90 border border-zinc-200 text-zinc-400',
            'dark:bg-zinc-800/90 dark:border-zinc-700 dark:text-zinc-500',
            'opacity-0 group-hover/node:opacity-100',
            'hover:bg-zinc-100 hover:text-amber-600 hover:border-amber-500/30',
            'dark:hover:bg-zinc-700 dark:hover:text-amber-400 dark:hover:border-amber-500/30',
            'transition-all duration-150',
            'focus:outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-amber-500/50'
          )}
          title={`Focus tree on ${getDisplayName(person)}`}
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Unknown / placeholder node
export function UnknownExplorerNode({ label = 'Unknown' }: { label?: string }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 px-3 py-3 rounded-xl border border-dashed w-[100px] opacity-40',
      'border-zinc-300 dark:border-zinc-700/40',
    )}>
      <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-dashed
        bg-zinc-100 border-zinc-300 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-600 italic text-center leading-tight">{label}</p>
    </div>
  )
}
