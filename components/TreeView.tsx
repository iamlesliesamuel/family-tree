import { TreeNode, UnknownNode } from './TreeNode'
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
          <div className="flex flex-wrap justify-center gap-3 pb-0">
            {parents.map(({ person: parent, is_adopted }) => (
              <TreeNode
                key={parent.id}
                person={parent}
                role="parent"
                badge={is_adopted ? 'Adoptive' : undefined}
              />
            ))}
          </div>

          {/* Connector line down — with diamond node */}
          <div className="flex flex-col items-center">
            <div className="w-px h-5 bg-zinc-300/70 dark:bg-zinc-700/60" />
            <ConnectorDiamond />
            <div className="w-px h-4 bg-zinc-300/70 dark:bg-zinc-700/60" />
          </div>
        </>
      )}

      {/* ── TIER 2: Subject person ───────────────────────────────────── */}
      <div className="flex flex-col items-center">
        <TreeNode person={person} role="self" />

        {/* Connector line down to partners — with diamond node */}
        {hasPartners && (
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-zinc-300/70 dark:bg-zinc-700/60" />
            <ConnectorDiamond />
            <div className="w-px h-5 bg-zinc-300/70 dark:bg-zinc-700/60" />
          </div>
        )}
      </div>

      {/* ── TIER 3: Partner groups ───────────────────────────────────── */}
      {hasPartners && (
        <div className="flex flex-col items-center gap-8 w-full">
          {partnerGroups.map((group, i) => {
            const { partner, children } = group
            const hasChildren = children.length > 0

            return (
              <div key={i} className="flex flex-col items-center w-full gap-0">
                {/* Partner row */}
                <div className="flex flex-wrap justify-center items-start gap-4">
                  {/* Anchor diamond representing the subject person */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                    <ConnectorDiamond className="text-amber-500/40 flex-shrink-0" />
                    <div className="w-3 h-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                  </div>

                  {partner ? (
                    <TreeNode person={partner} role="partner" />
                  ) : (
                    <UnknownNode label="Unknown parent" />
                  )}
                </div>

                {/* Children row */}
                {hasChildren && (
                  <>
                    {/* Connector — with diamond */}
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                      <ConnectorDiamond />
                      <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                    </div>

                    {/* Child nodes */}
                    <div className="relative">
                      {/* Horizontal connecting bar */}
                      {children.length > 1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2
                          h-px bg-zinc-300/60 dark:bg-zinc-700/50 w-[calc(100%-80px)]" />
                      )}
                      <div className="flex flex-wrap justify-center gap-3 pt-3">
                        {children.map(({ child, is_adopted }) => (
                          <div key={child.id} className="flex flex-col items-center gap-0">
                            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                            <TreeNode
                              person={child}
                              role="child"
                              badge={is_adopted ? 'Adopted' : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Divider between partner groups */}
                {i < partnerGroups.length - 1 && (
                  <div className="mt-6 w-full max-w-xs flex items-center gap-3">
                    <div className="flex-1 h-px border-t border-dashed border-zinc-300/60 dark:border-zinc-700/40" />
                    <ConnectorDiamond className="text-zinc-400/60 dark:text-zinc-700/60 flex-shrink-0" />
                    <div className="flex-1 h-px border-t border-dashed border-zinc-300/60 dark:border-zinc-700/40" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
