'use client'

import { cn } from '@/lib/utils'

interface DepthStepperProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}

function DepthStepper({ label, value, min = 0, max = 6, onChange }: DepthStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 select-none whitespace-nowrap tracking-wide">{label}</span>
      <div className="flex items-center gap-1
        bg-zinc-100 border border-zinc-200/70
        dark:bg-zinc-900 dark:border-zinc-700/50
        rounded-lg p-0.5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-md text-sm font-bold transition-all',
            value > min
              ? 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              : 'text-zinc-300 cursor-not-allowed dark:text-zinc-700'
          )}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-5 text-center text-xs font-semibold
          text-zinc-700 dark:text-zinc-300
          tabular-nums select-none">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-md text-sm font-bold transition-all',
            value < max
              ? 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 active:scale-90 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              : 'text-zinc-300 cursor-not-allowed dark:text-zinc-700'
          )}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

interface DepthControlsProps {
  ancestorDepth: number
  descendantDepth: number
  onAncestorChange: (v: number) => void
  onDescendantChange: (v: number) => void
}

export function DepthControls({
  ancestorDepth,
  descendantDepth,
  onAncestorChange,
  onDescendantChange,
}: DepthControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <DepthStepper
        label="Ancestors"
        value={ancestorDepth}
        onChange={onAncestorChange}
      />
      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700/50 hidden sm:block" />
      <DepthStepper
        label="Descendants"
        value={descendantDepth}
        onChange={onDescendantChange}
      />
    </div>
  )
}
