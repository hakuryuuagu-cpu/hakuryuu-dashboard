'use client'

import type { Philosophy } from '@/lib/types'

interface Props {
  philosophy: Philosophy
}

export default function PhilosophyBanner({ philosophy }: Props) {
  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-200 px-5 py-2.5">
      <div className="flex items-stretch gap-5">

        <div className="flex items-start gap-2 flex-shrink-0 min-w-0 max-w-xs">
          <span className="text-base mt-0.5 flex-shrink-0">✨</span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Vision</p>
            <p className="text-xs font-bold text-amber-900 leading-snug">{philosophy.vision}</p>
          </div>
        </div>

        <div className="w-px self-stretch bg-amber-200 flex-shrink-0" />

        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-base mt-0.5 flex-shrink-0">🎯</span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Mission</p>
            <p className="text-xs text-amber-800 leading-relaxed">{philosophy.mission}</p>
          </div>
        </div>

        <div className="w-px self-stretch bg-amber-200 flex-shrink-0" />

        <div className="flex items-start gap-2 flex-shrink-0">
          <span className="text-base mt-0.5 flex-shrink-0">💎</span>
          <div>
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Values</p>
            <div className="flex flex-wrap gap-1">
              {philosophy.values.map(v => (
                <span key={v}
                  className="text-[9px] bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
