import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDisplayName, getYearRange, type Person } from '@/lib/types'
import { getPersonPhotoUrl } from '@/lib/storage-url'

interface TreeNodeProps {
  person: Person
  role?: 'self' | 'parent' | 'partner' | 'child'
  className?: string
  badge?: string
}

export function TreeNode({ person, role = 'self', badge, className }: TreeNodeProps) {
  const name = getDisplayName(person)
  const years = getYearRange(person)
  const initials = [person.first_name[0], person.last_name[0]].join('').toUpperCase()
  const photoUrl = getPersonPhotoUrl(person.profile_photo_path)

  return (
    <Link
      href={`/person/${person.id}`}
      className={cn(
        'group block focus:outline-none',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200',
          'w-[120px]',
          'group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-amber-500/50',
          role === 'self' && [
            'bg-zinc-100 border-amber-500/40 dark:bg-zinc-800',
            'shadow-[0_0_24px_-4px_rgba(245,158,11,0.18),inset_0_1px_0_rgba(212,176,70,0.08)]',
            'hover:border-amber-400/60',
          ],
          role === 'parent' && 'bg-white border-zinc-200/70 group-hover:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-700/60 dark:group-hover:border-zinc-600',
          role === 'partner' && 'bg-white border-zinc-200/70 group-hover:border-amber-500/30 dark:bg-zinc-900 dark:border-zinc-700/60 dark:group-hover:border-amber-500/30',
          role === 'child' && 'bg-white/80 border-zinc-200/50 group-hover:border-zinc-400 dark:bg-zinc-900/60 dark:border-zinc-700/40 dark:group-hover:border-zinc-600',
        )}
      >
        {/* Avatar — rounded-lg is more formal */}
        <div
          className={cn(
            'flex items-center justify-center font-semibold transition-colors overflow-hidden',
            photoUrl ? 'rounded-full' : 'rounded-lg',
            role === 'self'
              ? 'w-16 h-16 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
              : role === 'child'
                ? 'w-11 h-11 text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                : 'w-12 h-12 text-xs bg-zinc-100 border border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400',
            'group-hover:border-amber-500/30 group-hover:text-amber-600 dark:group-hover:text-amber-400'
          )}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={`${name} profile`} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Name — Cormorant Garamond via font-serif */}
        <div className="text-center w-full">
          <p className={cn(
            'font-serif font-medium leading-tight truncate w-full text-center transition-colors',
            role === 'self'
              ? 'text-zinc-900 text-sm group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-300'
              : 'text-zinc-600 text-xs group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100',
          )}>
            {person.first_name}
          </p>
          <p className={cn(
            'font-serif font-medium leading-tight truncate w-full text-center transition-colors',
            role === 'self'
              ? 'text-zinc-900 text-sm group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-300'
              : 'text-zinc-600 text-xs group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100',
          )}>
            {person.last_name}
          </p>
          {years && (
            <p className="text-zinc-500 dark:text-zinc-600 text-xs mt-1 tabular-nums">{years}</p>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <span className="text-xs px-1.5 py-0.5 rounded-md
            bg-amber-500/10 text-amber-500/80 border border-amber-500/20 font-medium">
            {badge}
          </span>
        )}
      </div>
    </Link>
  )
}

// Placeholder node for unknown parent
export function UnknownNode({ label = 'Unknown' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed
      border-zinc-300/60 dark:border-zinc-700/40
      w-[120px] opacity-40">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg
        bg-zinc-50 border border-dashed border-zinc-300 text-zinc-400
        dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p className="font-serif text-xs text-zinc-500 dark:text-zinc-600 italic text-center">{label}</p>
    </div>
  )
}
