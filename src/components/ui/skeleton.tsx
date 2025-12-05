import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  )
}

export function TableSkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 py-4">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-5 w-16" />
    </div>
  )
}

export function TileSkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

export function ListingsTableSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6">
            <TableSkeletonRow />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListingsTileSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <TileSkeletonCard key={i} />
      ))}
    </div>
  )
}

export function OffersTableSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6">
            <TableSkeletonRow />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OffersTileSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <TileSkeletonCard key={i} />
      ))}
    </div>
  )
}
