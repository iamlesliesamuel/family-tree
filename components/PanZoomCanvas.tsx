'use client'

import { useRef, useState, useCallback, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ─── PanZoomCanvas ──────────────────────────────────────────────────────────────
//
// A MyHeritage-style infinite canvas. The whole tree lives inside a single
// transformed layer (translate + scale) so it always moves and zooms as one
// cohesive unit — sections can never slide out from under their connectors.
//
//   • Drag anywhere to pan (clicks on cards still navigate — pan needs movement).
//   • Trackpad two-finger scroll pans; pinch / ⌘·Ctrl + wheel zooms toward cursor.
//   • On-screen controls: zoom in / out / fit-to-view.
//
// The content recentres whenever `resetKey` changes (e.g. a new focus person).

const MIN_SCALE = 0.25
const MAX_SCALE = 2.5
const ZOOM_STEP = 1.2
const DRAG_THRESHOLD = 4 // px of movement before a press becomes a pan

interface Transform {
  x: number
  y: number
  scale: number
}

interface PanZoomCanvasProps {
  children: ReactNode
  /** Changes when the tree's identity/size changes → triggers a recentre. */
  resetKey?: string | number
  className?: string
}

export function PanZoomCanvas({ children, resetKey, className }: PanZoomCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const [isPanning, setIsPanning] = useState(false)

  // ── Fit / centre content in the viewport ──────────────────────────────────
  const fitToView = useCallback((mode: 'center' | 'fit' = 'center') => {
    const vp = viewportRef.current
    const ct = contentRef.current
    if (!vp || !ct) return

    const vpW = vp.clientWidth
    const vpH = vp.clientHeight
    const ctW = ct.scrollWidth
    const ctH = ct.scrollHeight
    if (ctW === 0 || ctH === 0) return

    // "fit" scales the whole tree to be visible; "center" keeps 1:1 (or shrinks
    // only if the tree is wider than the viewport) and centres it.
    const fitScale = Math.min(vpW / ctW, vpH / ctH) * 0.92
    const scale =
      mode === 'fit'
        ? Math.min(Math.max(fitScale, MIN_SCALE), MAX_SCALE)
        : Math.min(1, Math.max(vpW / ctW, MIN_SCALE))

    const x = (vpW - ctW * scale) / 2
    const y = mode === 'fit' ? (vpH - ctH * scale) / 2 : 28

    setTransform({ x, y, scale })
  }, [])

  // Recentre on first paint and whenever the tree identity changes.
  useLayoutEffect(() => {
    fitToView('center')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // Recentre on viewport resize.
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp || typeof ResizeObserver === 'undefined') return
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) { first = false; return } // initial fire handled by layout effect
      fitToView('center')
    })
    ro.observe(vp)
    return () => ro.disconnect()
  }, [fitToView])

  // ── Zoom (toward a viewport-relative anchor point) ────────────────────────
  const zoomTo = useCallback((factor: number, anchorX?: number, anchorY?: number) => {
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    const ax = anchorX ?? rect.width / 2
    const ay = anchorY ?? rect.height / 2

    setTransform((t) => {
      const scale = Math.min(Math.max(t.scale * factor, MIN_SCALE), MAX_SCALE)
      if (scale === t.scale) return t
      // Keep the point under the anchor fixed on screen.
      const cx = (ax - t.x) / t.scale
      const cy = (ay - t.y) / t.scale
      return { x: ax - cx * scale, y: ay - cy * scale, scale }
    })
  }, [])

  // ── Wheel: pan by default, zoom with ⌘/Ctrl or pinch ──────────────────────
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = vp.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        // Pinch-zoom (trackpad pinch arrives as ctrlKey wheel) or ⌘/Ctrl-scroll.
        const factor = Math.exp(-e.deltaY * 0.01)
        zoomTo(factor, e.clientX - rect.left, e.clientY - rect.top)
      } else {
        // Two-finger / wheel scroll pans the canvas.
        setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }))
      }
    }

    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
  }, [zoomTo])

  // ── Drag to pan ───────────────────────────────────────────────────────────
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transformRef.current.x,
      origY: transformRef.current.y,
      moved: false,
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setIsPanning(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    setTransform((t) => ({ ...t, x: d.origX + dx, y: d.origY + dy }))
  }, [])

  const endDrag = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (d?.moved) {
      setIsPanning(false)
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
    }
  }, [])

  // Suppress the click that follows a pan so cards don't navigate after a drag.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (isPanning) { e.preventDefault(); e.stopPropagation() }
  }, [isPanning])

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      className={cn(
        'relative flex-1 overflow-hidden touch-none select-none',
        isPanning ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      {/* Transformed tree layer */}
      <div
        ref={contentRef}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0 w-max will-change-transform"
      >
        {children}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        <CanvasBtn label="Zoom in"  onClick={() => zoomTo(ZOOM_STEP)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </CanvasBtn>
        <CanvasBtn label="Zoom out" onClick={() => zoomTo(1 / ZOOM_STEP)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </CanvasBtn>
        <CanvasBtn label="Fit tree to view" onClick={() => fitToView('fit')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
          </svg>
        </CanvasBtn>
      </div>
    </div>
  )
}

function CanvasBtn({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-lg border backdrop-blur-md transition-all',
        'bg-white/80 border-zinc-200/70 text-zinc-500 shadow-sm',
        'hover:text-amber-600 hover:border-amber-500/30',
        'dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-400 dark:hover:text-amber-400',
        'active:scale-90',
      )}
    >
      {children}
    </button>
  )
}
