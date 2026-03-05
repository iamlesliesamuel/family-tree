import Link from 'next/link'
import type { MissingItem } from '@/lib/person-insights'

interface MissingInfoCardProps {
  personId: string
  completeness: number
  missing: MissingItem[]
}

export function MissingInfoCard({ personId, completeness, missing }: MissingInfoCardProps) {
  return (
    <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg text-zinc-900 dark:text-zinc-100">Missing Information</h3>
        <span className="text-xs px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          {completeness}% complete
        </span>
      </div>

      {missing.length === 0 ? (
        <p className="text-sm text-zinc-500">This profile looks complete.</p>
      ) : (
        <ul className="space-y-2">
          {missing.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-2">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
              <Link
                href={item.tab && item.tab !== 'profile' ? `/person/${personId}?tab=${item.tab}` : `/person/${personId}`}
                className="text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700"
              >
                Add
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
