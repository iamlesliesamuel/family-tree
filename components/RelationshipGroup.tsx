import Link from 'next/link'
import { ChildList } from './ChildList'
import { RelationshipNotes } from './RelationshipNotes'
import {
  getDisplayName,
  getYearRange,
  formatRelationshipType,
  formatDate,
  type PartnerGroup,
} from '@/lib/types'

interface RelationshipGroupProps {
  group: PartnerGroup
  index: number
}

export function RelationshipGroup({ group, index }: RelationshipGroupProps) {
  const { partner, relationship, children } = group
  const hasChildren = children.length > 0

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white/80 overflow-hidden animate-slide-up
      dark:border-zinc-700/50 dark:bg-zinc-900/50"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}>

      {/* Partner header */}
      {partner && (
        <div className="px-4 py-3 border-b border-zinc-200/50 bg-zinc-50
          dark:border-zinc-700/30 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg
              bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-500
              dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
              {[partner.first_name[0], partner.last_name[0]].join('').toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/person/${partner.id}`}
                  className="font-serif text-base font-semibold
                    text-zinc-900 hover:text-amber-600
                    dark:text-zinc-100 dark:hover:text-amber-400
                    transition-colors focus:outline-none focus-visible:underline"
                >
                  {getDisplayName(partner)}
                </Link>

                {relationship && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md
                    bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium
                    dark:text-amber-400">
                    {formatRelationshipType(relationship.relationship_type)}
                  </span>
                )}
                {Boolean((relationship as unknown as { archived_at?: string | null })?.archived_at) && (
                  <span className="text-xs px-1.5 py-0.5 rounded-md
                    bg-zinc-200/70 text-zinc-600 border border-zinc-300/70 font-medium
                    dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                    Archived
                  </span>
                )}
              </div>

              {/* Years / relationship dates */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {getYearRange(partner) && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-600 tabular-nums">
                    {getYearRange(partner)}
                  </span>
                )}
                {relationship?.start_date && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-600">
                    Married {formatDate(relationship.start_date)}
                    {relationship.end_date && ` – ${formatDate(relationship.end_date)}`}
                  </span>
                )}
              </div>

              {relationship && (
                <RelationshipNotes relationshipId={relationship.id} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Children */}
      {hasChildren ? (
        <div className="px-3 py-3">
          <p className="font-serif text-xs italic text-zinc-500 dark:text-zinc-600 tracking-wide mb-2 px-1">
            {children.length} {children.length === 1 ? 'child' : 'children'}
          </p>
          <ChildList children={children} />
        </div>
      ) : (
        <div className="px-4 py-3">
          <p className="font-serif text-xs text-zinc-400 dark:text-zinc-700 italic">No children recorded</p>
        </div>
      )}
    </div>
  )
}
