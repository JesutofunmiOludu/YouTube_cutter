
// src/components/ui/SkeletonCard.tsx
import React from 'react'
import { cn } from '@/utils/cn'

export function Skeleton({ width, height, circle = false, className, style, ...rest }: {
  width?: string|number; height?: string|number; circle?: boolean; className?: string; style?: React.CSSProperties
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden="true"
      className={cn('skeleton bg-[var(--color-bg-secondary)]', circle ? 'rounded-full' : 'rounded-md', className)}
      style={{ width: width ?? '100%', height: height ?? '14px', ...style }} {...rest} />
  )
}

export function VideoCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('border border-[var(--color-border-tertiary)] rounded-lg overflow-hidden', className)}>
      <Skeleton height="80px" className="rounded-none" />
      <div className="p-2.5 flex flex-col gap-2">
        <Skeleton height="10px" width="50%" />
        <Skeleton height="13px" />
        <Skeleton height="13px" width="75%" />
        <Skeleton height="28px" className="rounded-md mt-1" />
      </div>
    </div>
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('bg-[var(--color-bg-secondary)] rounded-md p-4', className)}>
      <Skeleton height="10px" width="55%" className="mb-2" />
      <Skeleton height="22px" width="40%" className="mb-1" />
      <Skeleton height="10px" width="65%" />
    </div>
  )
}

export function ListItemSkeleton({ showAvatar = false, className }: { showAvatar?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3 px-3 py-2.5', className)}>
      {showAvatar && <Skeleton width="28px" height="28px" circle />}
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton height="13px" width="70%" />
        <Skeleton height="10px" width="45%" />
      </div>
    </div>
  )
}

export function VideoGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div aria-label="Loading videos…" aria-busy="true"
      className={cn('grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4', className)}>
      {Array.from({ length: count }, (_, i) => <VideoCardSkeleton key={i} />)}
    </div>
  )
}