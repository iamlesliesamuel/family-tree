import { TreeNode, UnknownNode } from './TreeNode'
import { cn } from '@/lib/utils'
import { type PersonProfile } from '@/lib/types'

interface TreeViewProps {
  profile: PersonProfile
}

// ── Ornamental connector diamond ──────────────────────────────────────────────
function ConnectorDiamond({ className }: { className?: string }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
      className={className ?? 'text-zinc-400 dark:text-zinc-700 flex-shrink-0'}>
      <polygon points="4,0 8,4 4,8 0,4" />
    </svg>
  )
}

export function TreeView({ profile }: TreeViewProps) {
  const { person, parents, partnerGroups } = profile
  const hasParents = parents.length > 0
  const hasPartners = partnerGroups.length > 0

  return (
    <div className="flex flex-col items-center gap-0 animate-fade-in w-full">

      {/* ── TIER 1: Parents ─────────────────────────────────────────── */}
      {hasParents && (
        <>
          {parents.length === 2 ? (
            /* Two parents — show as a couple with horizontal connector */
            <div className="flex flex-nowrap items-center gap-2">
              <TreeNode person={parents[0].person} role="parent" badge={parents[0].is_adopted ? 'Adoptive' : undefined} />
              {/*
               * self-stretch makes this column span the full row height.
               * The absolute inset-y-0 line runs top-to-bottom of that column,
               * so the vertical stems above/below connect to it at the row edges
               * rather than floating ~half-card-height away from the diamond.
               */}
              <div className="relative flex items-center gap-0.5 self-stretch">
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                <ConnectorDiamond className="text-amber-500/40 flex-shrink-0" />
                <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
              </div>
              <TreeNode person={parents[1].person} role="parent" badge={parents[1].is_adopted ? 'Adoptive' : undefined} />
            </div>
          ) : (
            /* 1 or 3+ parents — centered row */
            <div className="flex flex-wrap justify-center gap-3">
              {parents.map(({ person: parent, is_adopted }) => (
                <TreeNode key={parent.id} person={parent} role="parent" badge={is_adopted ? 'Adoptive' : undefined} />
              ))}
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="w-px h-5 bg-zinc-300/70 dark:bg-zinc-700/60" />
            <ConnectorDiamond />
            <div className="w-px h-4 bg-zinc-300/70 dark:bg-zinc-700/60" />
          </div>
        </>
      )}

      {/* ── TIER 2+: Person + partner groups ────────────────────────── */}
      {hasPartners ? (
        <div className="flex flex-col items-center gap-0 w-full">
          {partnerGroups.map((group, i) => {
            const { partner, children } = group
            const hasChildren = children.length > 0

            return (
              <div key={i} className="flex flex-col items-center w-full gap-0">

                {/* Divider between partner groups */}
                {i > 0 && (
                  <div className="my-6 w-full max-w-xs flex items-center gap-3">
                    <div className="flex-1 h-px border-t border-dashed border-zinc-300/60 dark:border-zinc-700/40" />
                    <ConnectorDiamond className="text-zinc-400/60 dark:text-zinc-700/60 flex-shrink-0" />
                    <div className="flex-1 h-px border-t border-dashed border-zinc-300/60 dark:border-zinc-700/40" />
                  </div>
                )}

                {/* Couple row: person (first group) + horizontal connector + partner */}
                <div className="flex flex-nowrap items-center gap-2">
                  {i === 0 ? (
                    <TreeNode person={person} role="self" />
                  ) : (
                    // Subsequent groups: small anchor representing same person
                    <ConnectorDiamond className="text-amber-500/30 flex-shrink-0" />
                  )}

                  {/* Horizontal connector — same self-stretch technique */}
                  <div className="relative flex items-center gap-0.5 self-stretch">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                    <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                    <ConnectorDiamond className="text-amber-500/40 flex-shrink-0" />
                    <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                  </div>

                  {/* Partner */}
                  {partner ? (
                    <TreeNode person={partner} role="partner" />
                  ) : (
                    <UnknownNode label="Unknown parent" />
                  )}
                </div>

                {/* Vertical connector + children */}
                {hasChildren && (
                  <>
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                      <ConnectorDiamond />
                      <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                    </div>

                    <div className="w-full overflow-x-auto">
                      <div className="flex flex-nowrap items-start justify-center min-w-min">
                        {children.length === 1 ? (
                          /* Single child — straight drop, no comb */
                          <div className="flex flex-col items-center">
                            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                            <TreeNode
                              person={children[0].child}
                              role="child"
                              badge={children[0].is_adopted ? 'Adopted' : undefined}
                            />
                          </div>
                        ) : (
                          /* Multiple children — horizontal comb bar */
                          children.map(({ child, is_adopted }) => (
                            <div
                              key={child.id}
                              className={cn(
                                'relative flex flex-col items-center flex-shrink-0 px-3',
                                "before:content-[''] before:absolute before:top-0 before:h-px",
                                'before:bg-zinc-300/60 dark:before:bg-zinc-700/50',
                                'before:left-0 before:w-full',
                                'first:before:left-[50%] first:before:w-[50%]',
                                'last:before:w-[50%]',
                              )}
                            >
                              <div className="w-px h-3 mt-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                              <TreeNode
                                person={child}
                                role="child"
                                badge={is_adopted ? 'Adopted' : undefined}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* No partners — person alone */
        <TreeNode person={person} role="self" />
      )}

      {/* Empty state */}
      {!hasParents && !hasPartners && (
        <div className="mt-8 flex flex-col items-center justify-center py-10 text-center
          rounded-xl border border-dashed border-zinc-300/60 dark:border-zinc-700/40 w-full max-w-sm">
          <p className="font-serif text-base italic text-zinc-500 dark:text-zinc-600">No family connections recorded</p>
        </div>
      )}
    </div>
  )
}
