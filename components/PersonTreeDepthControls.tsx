'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DepthControls } from './DepthControls'

interface PersonTreeDepthControlsProps {
  ancestorDepth: number
  descendantDepth: number
}

export function PersonTreeDepthControls({
  ancestorDepth,
  descendantDepth,
}: PersonTreeDepthControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateDepths = (nextAncestor: number, nextDescendant: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', 'tree')
    params.set('ancestorDepth', String(nextAncestor))
    params.set('descendantDepth', String(nextDescendant))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <DepthControls
      ancestorDepth={ancestorDepth}
      descendantDepth={descendantDepth}
      onAncestorChange={(v) => updateDepths(v, descendantDepth)}
      onDescendantChange={(v) => updateDepths(ancestorDepth, v)}
    />
  )
}

