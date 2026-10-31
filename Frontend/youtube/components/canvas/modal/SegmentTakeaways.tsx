// ============================================================
// VidMind AI — SegmentTakeaways Component
// components/canvas/modal/SegmentTakeaways.tsx
//
// Structured sub-points & relation pills for SegmentFocusModal:
//   • Bulleted action takeaways
//   • Interactive connected relationship chips
// ============================================================

import React from 'react'
import type { KnowledgeNode } from '@/types'

export interface SegmentTakeawaysProps {
  node: KnowledgeNode
  onSelectRelation?: (targetId: string) => void
}

export const SegmentTakeaways: React.FC<SegmentTakeawaysProps> = ({
  node,
  onSelectRelation,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
      {/* Sub-Points */}
      <div className="space-y-2">
        <h4 className="text-body-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
          Key Sub-Points & Action Items
        </h4>
        {node.sub_points && node.sub_points.length > 0 ? (
          <ul className="space-y-2">
            {node.sub_points.map((pt, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-tertiary)]"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: node.color || '#6366f1' }}
                />
                <span className="text-sm sm:text-body-sm text-[var(--color-text-primary)] leading-relaxed">
                  {pt}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-caption text-[var(--color-text-tertiary)]">
            No specific sub-points generated for this node.
          </p>
        )}
      </div>

      {/* Relations */}
      {node.relations && node.relations.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-[var(--color-border-tertiary)]">
          <h4 className="text-body-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
            Connected Relationships
          </h4>
          <div className="flex flex-wrap gap-2">
            {node.relations.map((rel, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectRelation?.(rel.target_id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-medium transition cursor-pointer"
              >
                <span>→ {rel.label}:</span>
                <strong className="font-semibold">{rel.target_id}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SegmentTakeaways

