"use client"

import { deleteListings, updateListingsStatus } from "@/app/actions/listings"
import { LISTING_STATUSES } from "@/constants/listings"
import { ListingStatus, ListingWithOfferCounts } from "@/types/listing"
import { LayoutGrid, TableOfContents } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import SelectionActionBar from "../../shared/SelectionActionBar"
import { Button } from "../../ui/button"
import ListingListTableView from "./ListingListTableView"
import ListingListTileView from "./ListingListTileView"

const ListingsList = ({
  listings,
  onListingsUpdate,
  onViewModeChange,
}: {
  listings: Array<ListingWithOfferCounts> | null
  onListingsUpdate?: (listings: Array<ListingWithOfferCounts> | null) => void
  onViewModeChange?: (mode: "table" | "tile") => void
}) => {
  const router = useRouter()
  const [viewStyle, setViewStyle] = useState<"table" | "tile">("table")
  const [selectedListings, setSelectedListings] = useState<Set<string>>(
    new Set(),
  )

  const handleViewChange = (mode: "table" | "tile") => {
    setViewStyle(mode)
    onViewModeChange?.(mode)
  }

  const handleToggleListing = (listingId: string) => {
    setSelectedListings((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(listingId)) {
        newSet.delete(listingId)
      } else {
        newSet.add(listingId)
      }
      return newSet
    })
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked && listings) {
      setSelectedListings(new Set(listings.map((listing) => listing.id)))
    } else {
      setSelectedListings(new Set())
    }
  }

  const handleDelete = async () => {
    const listingIds = Array.from(selectedListings)

    // Optimistic update: remove listings from UI immediately
    if (listings && onListingsUpdate) {
      const updatedListings = listings.filter(
        (listing) => !listingIds.includes(listing.id),
      )
      onListingsUpdate(updatedListings.length > 0 ? updatedListings : null)
    }

    const result = await deleteListings(listingIds)

    if (result.success) {
      toast.success(
        `Successfully deleted ${listingIds.length} listing${listingIds.length > 1 ? "s" : ""}`,
      )
      setSelectedListings(new Set())
      router.refresh()
    } else {
      // Revert optimistic update on error
      if (onListingsUpdate) {
        onListingsUpdate(listings)
      }
      toast.error(result.error || "Failed to delete listings")
    }
  }

  const handleStatusChange = async (status: string) => {
    const listingIds = Array.from(selectedListings)

    // Optimistic update: update status in UI immediately
    if (listings && onListingsUpdate) {
      const updatedListings = listings.map((listing) =>
        listingIds.includes(listing.id)
          ? { ...listing, status: status as ListingStatus }
          : listing,
      )
      onListingsUpdate(updatedListings)
    }

    const result = await updateListingsStatus(listingIds, status)

    if (result.success) {
      toast.success(
        `Successfully updated ${listingIds.length} listing${listingIds.length > 1 ? "s" : ""} status`,
      )
      setSelectedListings(new Set())
      router.refresh()
    } else {
      // Revert optimistic update on error
      if (onListingsUpdate) {
        onListingsUpdate(listings)
      }
      toast.error(result.error || "Failed to update listing status")
    }
  }

  const statusOptions = Object.entries(LISTING_STATUSES).map(
    ([value, label]) => ({
      value,
      label,
    }),
  )

  return (
    <>
      <div className="mb-4 flex w-fit items-center gap-1 overflow-hidden rounded-full shadow-sm">
        <Button
          variant="ghost"
          active={viewStyle === "table"}
          onClick={() => handleViewChange("table")}
        >
          <TableOfContents size={18} />
          Table View
        </Button>
        <Button
          variant="ghost"
          active={viewStyle === "tile"}
          onClick={() => handleViewChange("tile")}
        >
          <LayoutGrid size={18} />
          Tile View
        </Button>
      </div>

      {viewStyle === "table" ? (
        <ListingListTableView
          listings={listings}
          selectedListings={selectedListings}
          onToggleListing={handleToggleListing}
          onToggleAll={handleToggleAll}
        />
      ) : (
        <ListingListTileView listings={listings} />
      )}

      <SelectionActionBar
        selectedCount={selectedListings.size}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onClearSelection={() => setSelectedListings(new Set())}
        statusOptions={statusOptions}
        statusLabel="Listing Status"
        itemType="listings"
        showMessageButton={false}
      />
    </>
  )
}

export default ListingsList
