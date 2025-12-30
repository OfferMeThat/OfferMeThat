"use client"

import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { LISTING_STATUSES, LISTING_TO_BADGE_MAP } from "@/constants/listings"
import { ListingStatus, ListingWithOfferCounts } from "@/types/listing"
import ListingActionsMenu from "./ListingActionsMenu"

const ListingListTileView = ({
  listings,
  selectedListings,
  onToggleListing,
  onDelete,
  onUpdateStatus,
}: {
  listings: Array<ListingWithOfferCounts> | null
  selectedListings: Set<string>
  onToggleListing: (listingId: string) => void
  onDelete: (listingId: string) => Promise<void>
  onUpdateStatus: (listingId: string, status: ListingStatus) => Promise<void>
}) => {
  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No listings found"
        description="No listings match your current filters. Try adjusting your search criteria or add a new listing."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        const date = new Date(listing.createdAt)
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        return (
          <div
            key={listing.id}
            className="col-span-1 flex flex-col gap-2 rounded-lg border border-gray-100 p-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <Badge variant={LISTING_TO_BADGE_MAP[listing.status]}>
                {LISTING_STATUSES[listing.status]}
              </Badge>
              <ListingActionsMenu
                listingId={listing.id}
                currentStatus={listing.status}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
              />
            </div>

            <span className="text-xl font-bold">{listing.address}</span>

            <div className="my-4 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">
                  {listing.pendingOffers}
                </span>
                <span className="text-center text-sm text-gray-700">
                  Pending Offer{listing.pendingOffers !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">
                  {listing.activeOffers}
                </span>
                <span className="text-center text-sm text-gray-700">
                  Active Offer{listing.activeOffers !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">{listing.totalOffers}</span>
                <span className="text-center text-sm text-gray-700">
                  Total Offer{listing.totalOffers !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">
                  {listing.leads ?? 0}
                </span>
                <span className="text-center text-sm text-gray-700">Leads</span>
              </div>
            </div>

            <span className="text-sm font-medium text-gray-700">
              Listed: {formattedDate}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default ListingListTileView
