import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDisplayName, getYearRange, type Person } from '@/lib/types'

interface PersonCardProps {
  person: Person
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function PersonCard({ person, variant = 'default', className }: PersonCardProps) {
  const name     = getDisplayName(person)
  const years    = getYearRange(person)
  const initials = [person.first_name[0], person.last_name[0]].join('').toUpperCase()

  return (
    <Link href={`/person/${person.id}`} className="block group focus:outline-none">
      <div className={cn(
        'flex items-center gap-3 rounded-xl border transition-all duration-200',
        'bg-white border-zinc-200/70 dark:bg-zinc-900 dark:border-zinc-700/60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(212,176,70,0.03)]',
        'group-hover:border-amber-500/40 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/70',
        'group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_16px_-4px_rgba(201,164,50,0.12)]',
        'group-focus-visible:ring-2 group-focus-visible:ring-amber-500/50',
        variant === 'featured' && 'px-5 py-4',
        variant === 'default'  && 'px-4 py-3',
        variant === 'compact'  && 'px-3 py-2',
        className
      )}>
        {/* Avatar */}
        <div className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-lg font-semibold',
          'bg-zinc-100 border border-zinc-200 text-zinc-500',
          'dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400',
          'transition-colors group-hover:border-amber-500/30 group-hover:text-amber-600 dark:group-hover:text-amber-400',
          variant === 'featured' && 'w-11 h-11 text-sm',
          variant === 'default'  && 'w-9 h-9 text-xs',
          variant === 'compact'  && 'w-7 h-7 text-xs'
        )}>
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn(
            'font-serif font-medium truncate transition-colors',
            'text-zinc-800 group-hover:text-zinc-900 dark:text-zinc-100 dark:group-hover:text-zinc-50',
            variant === 'featured' && 'text-lg',
            variant === 'default'  && 'text-base',
            variant === 'compact'  && 'text-sm'
          )}>
            {name}
          </p>
          {years && (
            <p className={cn(
              'tabular-nums mt-0.5 text-zinc-400 dark:text-zinc-500',
              variant === 'featured' ? 'text-sm' : 'text-xs'
            )}>
              {years}
            </p>
          )}
        </div>

        <svg className="w-3.5 h-3.5 flex-shrink-0 transition-colors text-zinc-300 group-hover:text-amber-500/60 dark:text-zinc-700"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
