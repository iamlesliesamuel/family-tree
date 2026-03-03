import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDisplayName, getYearRange, type ChildEntry } from '@/lib/types'

interface ChildListProps {
  children: ChildEntry[]
  className?: string
}

export function ChildList({ children, className }: ChildListProps) {
  if (children.length === 0) return null

  return (
    <ul className={cn('flex flex-col gap-1.5', className)}>
      {children.map(({ child, is_adopted }) => {
        const name = getDisplayName(child)
        const years = getYearRange(child)
        const initials = [child.first_name[0], child.last_name[0]].join('').toUpperCase()

        return (
          <li key={child.id}>
            <Link
              href={`/person/${child.id}`}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent
                hover:border-zinc-200/80 hover:bg-zinc-100/80
                dark:hover:border-zinc-700/60 dark:hover:bg-zinc-800/50
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            >
              {/* Avatar */}
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md
                bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-500
                dark:bg-zinc-800 dark:border-zinc-700
                group-hover:border-amber-500/30 group-hover:text-amber-600
                dark:group-hover:text-amber-400 transition-colors">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <span className="font-serif text-sm font-medium
                  text-zinc-700 group-hover:text-zinc-900
                  dark:text-zinc-200 dark:group-hover:text-zinc-100
                  transition-colors truncate block">
                  {name}
                </span>
                {years && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-600 tabular-nums">{years}</span>
                )}
              </div>

              {/* Adopted badge */}
              {is_adopted && (
                <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md
                  bg-amber-500/10 text-amber-500/80 border border-amber-500/20 font-medium">
                  Adoptive
                </span>
              )}

              <svg
                className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 flex-shrink-0
                  group-hover:text-zinc-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
