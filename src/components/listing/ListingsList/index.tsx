"use client"

import { deleteListings, updateListingsStatus } from "@/app/actions/listings"
import { LISTING_STATUS_OPTIONS } from "@/constants/listings"
import { ListingStatus, ListingWithOfferCounts } from "@/types/listing"
import { LayoutGrid, TableOfContents } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import SelectionActionBar from "../../shared/SelectionActionBar"
import { Button } from "../../ui/button"
import ReportGenerationModal from "../ReportGenerationModal"
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
  const [reportModalOpen, setReportModalOpen] = useState(false)

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

  const handleIndividualDelete = useCallback(
    async (listingId: string) => {
      if (listings && onListingsUpdate) {
        const updatedListings = listings.filter(
          (listing) => listing.id !== listingId,
        )
        onListingsUpdate(updatedListings.length > 0 ? updatedListings : null)
      }

      const result = await deleteListings([listingId])

      if (result.success) {
        toast.success("Successfully deleted listing")
        router.refresh()
      } else {
        if (onListingsUpdate) {
          onListingsUpdate(listings)
        }
        toast.error(result.error || "Failed to delete listing")
      }
    },
    [listings, onListingsUpdate, router],
  )

  const handleIndividualStatusUpdate = useCallback(
    async (listingId: string, status: ListingStatus) => {
      if (listings && onListingsUpdate) {
        const updatedListings = listings.map((listing) =>
          listing.id === listingId ? { ...listing, status } : listing,
        )
        onListingsUpdate(updatedListings)
      }

      const result = await updateListingsStatus([listingId], status)

      if (result.success) {
        toast.success("Successfully updated listing status")
        router.refresh()
      } else {
        if (onListingsUpdate) {
          onListingsUpdate(listings)
        }
        toast.error(result.error || "Failed to update listing status")
      }
    },
    [listings, onListingsUpdate, router],
  )

  const handleGenerateReport = useCallback(() => {
    setReportModalOpen(true)
  }, [])

  const selectedListingsData = useMemo(
    () => listings?.filter((listing) => selectedListings.has(listing.id)) || [],
    [listings, selectedListings],
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
          onDelete={handleIndividualDelete}
          onUpdateStatus={handleIndividualStatusUpdate}
        />
      ) : (
        <ListingListTileView
          listings={listings}
          selectedListings={selectedListings}
          onToggleListing={handleToggleListing}
          onDelete={handleIndividualDelete}
          onUpdateStatus={handleIndividualStatusUpdate}
        />
      )}

      <SelectionActionBar
        selectedCount={selectedListings.size}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onGenerateReport={handleGenerateReport}
        onClearSelection={() => setSelectedListings(new Set())}
        statusOptions={LISTING_STATUS_OPTIONS}
        statusLabel="Listing Status"
        itemType="listings"
        showMessageButton={false}
      />

      <ReportGenerationModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        listings={selectedListingsData}
      />
    </>
  )
}

export default ListingsList
