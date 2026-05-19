// ============================================================
// VidMind AI — CutSegmentCard Component
// src/components/video/CutSegmentCard.tsx
//
// Individual cut segment card shown in the AI cuts list.
// Shows: cut number, title, time range, AI rationale,
// approve / edit / download action buttons.
// ============================================================

import React, { useState } from 'react'
import {
  CheckCircle,
  Pencil,
  Download,
  Sparkles,
  X,
  Check,
} from 'lucide-react'
import { cn }              from '@/utils/cn'
import Button              from '@components/ui/Button'
import { IconButton }      from '@components/ui/Button'
import { formatDuration }  from './VideoCard'
import type { VideoCut }   from '@/types'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface CutSegmentCardProps {
  cut:           VideoCut
  index:         number
  isActive?:     boolean
  onApprove?:    (cutId: string) => void
  onReject?:     (cutId: string) => void
  onEditTimes?:  (cutId: string, start: number, end: number) => void
  onDownload?:   (cutId: string) => void
  onSeek?:       (seconds: number) => void
  className?:    string
}

// ------------------------------------------------------------
// TIME EDITOR — inline start/end time adjustment
// ------------------------------------------------------------

const TimeEditor: React.FC<{
  start:    number
  end:      number
  max:      number
  onSave:   (start: number, end: number) => void
  onCancel: () => void
}> = ({ start, end, max, onSave, onCancel }) => {
  const [s, setS] = useState(start)
  const [e, setE] = useState(end)

  return (
    <div className="mt-2 p-2 bg-[var(--color-bg-secondary)] rounded-md flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-label text-[var(--color-text-secondary)] w-10">Start</label>
        <input
          type="range" min={0} max={e - 1} value={s} step={1}
          onChange={(ev) => setS(Number(ev.target.value))}
          className="flex-1 accent-primary-600"
          aria-label="Start time"
        />
        <span className="text-caption tabular-nums text-[var(--color-text-secondary)] w-12 text-right">
          {formatDuration(s)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-label text-[var(--color-text-secondary)] w-10">End</label>
        <input
          type="range" min={s + 1} max={max} value={e} step={1}
          onChange={(ev) => setE(Number(ev.target.value))}
          className="flex-1 accent-primary-600"
          aria-label="End time"
        />
        <span className="text-caption tabular-nums text-[var(--color-text-secondary)] w-12 text-right">
          {formatDuration(e)}
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary"   size="sm" onClick={() => onSave(s, e)}>Save</Button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

const CutSegmentCard: React.FC<CutSegmentCardProps> = ({
  cut,
  index,
  isActive   = false,
  onApprove,
  onReject,
  onEditTimes,
  onDownload,
  onSeek,
  className,
}) => {
  const [editing, setEditing] = useState(false)

  const segDuration = cut.end_seconds - cut.start_seconds
  const isApproved  = cut.user_approved
  const isDownloading = cut.download_status === 'processing'
  const isReady       = cut.download_status === 'ready'

  return (
    <div
      className={cn(
        'border rounded-md p-3 transition-colors duration-fast',
        isActive
          ? 'border-primary-200 bg-primary-50/30'
          : 'border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]',
        isApproved && 'border-success-200',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Cut number badge */}
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            'text-[11px] font-medium',
            isApproved
              ? 'bg-success-50 text-success-800'
              : isActive
              ? 'bg-primary-600 text-white'
              : 'bg-primary-50 text-primary-800',
          )}
          aria-hidden="true"
        >
          {isApproved ? <Check className="w-3 h-3" /> : index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">
            {cut.title ?? `Segment ${index + 1}`}
          </p>

          {/* Time range — clickable to seek */}
          <button
            onClick={() => onSeek?.(cut.start_seconds)}
            className="text-caption text-[var(--color-text-secondary)] tabular-nums hover:text-primary-600 transition-colors duration-fast focus-visible:outline-none focus-visible:underline"
            aria-label={`Seek to ${formatDuration(cut.start_seconds)}`}
          >
            {formatDuration(cut.start_seconds)} → {formatDuration(cut.end_seconds)}
            <span className="ml-1 text-[var(--color-text-tertiary)]">
              · {formatDuration(segDuration)}
            </span>
          </button>

          {/* AI rationale */}
          {cut.ai_suggested && cut.ai_rationale && !editing && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <Sparkles
                className="w-3 h-3 text-primary-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-caption text-[var(--color-text-tertiary)] italic leading-relaxed">
                {cut.ai_rationale}
              </p>
            </div>
          )}

          {/* Inline time editor */}
          {editing && (
            <TimeEditor
              start={cut.start_seconds}
              end={cut.end_seconds}
              max={9999}
              onSave={(s, e) => {
                onEditTimes?.(cut.id, s, e)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          )}

          {/* Action buttons */}
          {!editing && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {/* Approve / approved state */}
              {!isApproved ? (
                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                  onClick={() => onApprove?.(cut.id)}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  onClick={() => onReject?.(cut.id)}
                  className="text-[var(--color-text-tertiary)]"
                >
                  Unapprove
                </Button>
              )}

              {/* Edit times */}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => setEditing(true)}
              >
                Edit times
              </Button>

              {/* Download */}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                loading={isDownloading}
                onClick={() => onDownload?.(cut.id)}
                className="ml-auto"
              >
                {isReady ? 'Re-download' : 'Download'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

CutSegmentCard.displayName = 'CutSegmentCard'
export default CutSegmentCard
