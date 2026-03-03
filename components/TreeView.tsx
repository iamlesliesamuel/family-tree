import { TreeNode, UnknownNode } from './TreeNode'
import { cn } from '@/lib/utils'
import { type PersonProfile, type Person } from '@/lib/types'
import { type SubgraphResult } from '@/lib/subgraph'

interface TreeViewProps {
  profile: PersonProfile
  subgraph?: SubgraphResult | null
  ancestorDepth?: number
  descendantDepth?: number
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

function GenerationLabel({ level }: { level: number }) {
  const abs = Math.abs(level)
  const label =
    level < 0
      ? abs === 1
        ? 'Parents'
        : abs === 2
          ? 'Grandparents'
          : abs === 3
            ? 'Great-grandparents'
            : `${abs} generations back`
      : abs === 1
        ? 'Children'
        : abs === 2
          ? 'Grandchildren'
          : abs === 3
            ? 'Great-grandchildren'
            : `${abs} generations down`

  return (
    <p className="font-serif text-sm italic text-zinc-400 dark:text-zinc-500 text-center mb-2 mt-4 tracking-wide">
      {label}
    </p>
  )
}

function DescendantBranch({
  person,
  childMap,
  depth,
  maxDepth,
  badge,
}: {
  person: Person
  childMap: Map<string, Person[]>
  depth: number
  maxDepth: number
  badge?: string
}) {
  const children = childMap.get(person.id) ?? []
  const canExpand = depth < maxDepth

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <TreeNode person={person} role="child" badge={badge} />
      {canExpand && children.length > 0 && (
        <>
          <div className="flex flex-col items-center mt-1">
            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
            <ConnectorDiamond />
            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
          </div>

          <div className="w-full overflow-x-auto">
            <div className="flex flex-nowrap items-start justify-center min-w-min">
              {children.length === 1 ? (
                <DescendantBranch
                  person={children[0]}
                  childMap={childMap}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ) : (
                children.map((child) => (
                  <div
                    key={child.id}
                    className={cn(
                      'relative flex flex-col items-center flex-shrink-0 px-3',
                      "before:content-[''] before:absolute before:top-0 before:h-px",
                      'before:bg-zinc-300/60 dark:before:bg-zinc-700/50',
                      'before:left-0 before:w-full',
                      'first:before:left-[50%] first:before:w-[50%]',
                      'last:before:w-[50%]'
                    )}
                  >
                    <div className="w-px h-3 mt-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                    <DescendantBranch
                      person={child}
                      childMap={childMap}
                      depth={depth + 1}
                      maxDepth={maxDepth}
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
}

export function TreeView({ profile, subgraph, ancestorDepth = 1, descendantDepth = 1 }: TreeViewProps) {
  const { person, parents, partnerGroups } = profile
  const hasParents = parents.length > 0
  const hasPartners = partnerGroups.length > 0
  const showParents = ancestorDepth > 0
  const showDescendants = descendantDepth > 0

  const ancestorLevels = (subgraph?.levels ?? [])
    .filter((level) => level.level < -1)
    .sort((a, b) => a.level - b.level)

  const descendantPeople = new Map<string, Person>()
  ;(subgraph?.levels ?? [])
    .filter((level) => level.level > 0)
    .forEach((level) => level.people.forEach((p) => descendantPeople.set(p.id, p)))

  const childMap = new Map<string, Person[]>()
  ;(subgraph?.links ?? []).forEach(({ parentId, childId }) => {
    const child = descendantPeople.get(childId)
    if (!child) return
    const existing = childMap.get(parentId) ?? []
    existing.push(child)
    childMap.set(parentId, existing)
  })

  childMap.forEach((children) => {
    children.sort((a, b) => {
      if (!a.birth_date && !b.birth_date) return 0
      if (!a.birth_date) return 1
      if (!b.birth_date) return -1
      return a.birth_date.localeCompare(b.birth_date)
    })
  })

  return (
    <div className="flex flex-col items-center gap-0 animate-fade-in w-full">
      {/* ── Higher ancestors (if depth > 1) ───────────────────────────── */}
      {showParents && ancestorDepth > 1 && ancestorLevels.map((level) => (
        <div key={level.level} className="flex flex-col items-center w-full">
          <GenerationLabel level={level.level} />
          <div className="flex flex-wrap justify-center gap-3">
            {level.people.map((p) => (
              <TreeNode key={p.id} person={p} role="parent" />
            ))}
          </div>
          <div className="flex flex-col items-center mt-1">
            <div className="w-px h-4 bg-zinc-300/70 dark:bg-zinc-700/60" />
            <ConnectorDiamond />
            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
          </div>
        </div>
      ))}

      {/* ── TIER 1: Parents ─────────────────────────────────────────── */}
      {showParents && hasParents && (
        <>
          {parents.length === 2 ? (
            /* Two parents — horizontal couple connector only */
            <div className="flex flex-nowrap items-center gap-2">
              <TreeNode person={parents[0].person} role="parent" badge={parents[0].is_adopted ? 'Adoptive' : undefined} />
              <div className="flex items-center gap-0.5">
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
            const hasChildren = showDescendants && children.length > 0

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
                    <ConnectorDiamond className="text-amber-500/30 flex-shrink-0" />
                  )}

                  <div className="flex items-center gap-0.5">
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
                          <div className="flex flex-col items-center">
                            <div className="w-px h-3 bg-zinc-300/70 dark:bg-zinc-700/60" />
                            <DescendantBranch
                              person={children[0].child}
                              childMap={childMap}
                              depth={1}
                              maxDepth={Math.max(1, descendantDepth)}
                              badge={children[0].is_adopted ? 'Adopted' : undefined}
                            />
                          </div>
                        ) : (
                          children.map(({ child, is_adopted }) => (
                            <div
                              key={child.id}
                              className={cn(
                                'relative flex flex-col items-center flex-shrink-0 px-3',
                                "before:content-[''] before:absolute before:top-0 before:h-px",
                                'before:bg-zinc-300/60 dark:before:bg-zinc-700/50',
                                'before:left-0 before:w-full',
                                'first:before:left-[50%] first:before:w-[50%]',
                                'last:before:w-[50%]'
                              )}
                            >
                              <div className="w-px h-3 mt-px bg-zinc-300/70 dark:bg-zinc-700/60" />
                              <DescendantBranch
                                person={child}
                                childMap={childMap}
                                depth={1}
                                maxDepth={Math.max(1, descendantDepth)}
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
      {!((showParents && hasParents) || hasPartners) && (
        <div className="mt-8 flex flex-col items-center justify-center py-10 text-center
          rounded-xl border border-dashed border-zinc-300/60 dark:border-zinc-700/40 w-full max-w-sm">
          <p className="font-serif text-base italic text-zinc-500 dark:text-zinc-600">No family connections recorded</p>
        </div>
      )}
    </div>
  )
}
