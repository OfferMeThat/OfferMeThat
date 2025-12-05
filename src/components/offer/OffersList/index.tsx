"use client"

import { deleteOffers, updateOffersStatus } from "@/app/actions/offers"
import { OFFER_STATUSES } from "@/constants/offers"
import { OfferStatus, OfferWithListing } from "@/types/offer"
import { LayoutGrid, TableOfContents } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import SelectionActionBar from "../../shared/SelectionActionBar"
import { Button } from "../../ui/button"
import OffersListTableView from "./OffersListTableView"
import OffersListTileView from "./OffersListTileView"

const OffersList = ({
  offers,
  onOffersUpdate,
  onViewModeChange,
}: {
  offers: Array<OfferWithListing> | null
  onOffersUpdate?: (offers: Array<OfferWithListing> | null) => void
  onViewModeChange?: (mode: "table" | "tile") => void
}) => {
  const router = useRouter()
  const [viewStyle, setViewStyle] = useState<"table" | "tile">("table")
  const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set())

  const handleViewChange = (mode: "table" | "tile") => {
    setViewStyle(mode)
    onViewModeChange?.(mode)
  }

  const handleToggleOffer = (offerId: string) => {
    setSelectedOffers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(offerId)) {
        newSet.delete(offerId)
      } else {
        newSet.add(offerId)
      }
      return newSet
    })
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked && offers) {
      setSelectedOffers(new Set(offers.map((offer) => offer.id)))
    } else {
      setSelectedOffers(new Set())
    }
  }

  const handleDelete = async () => {
    const offerIds = Array.from(selectedOffers)

    // Optimistic update: remove offers from UI immediately
    if (offers && onOffersUpdate) {
      const updatedOffers = offers.filter(
        (offer) => !offerIds.includes(offer.id),
      )
      onOffersUpdate(updatedOffers.length > 0 ? updatedOffers : null)
    }

    const result = await deleteOffers(offerIds)

    if (result.success) {
      toast.success(
        `Successfully deleted ${offerIds.length} offer${offerIds.length > 1 ? "s" : ""}`,
      )
      setSelectedOffers(new Set())
      router.refresh()
    } else {
      // Revert optimistic update on error
      if (onOffersUpdate) {
        onOffersUpdate(offers)
      }
      toast.error(result.error || "Failed to delete offers")
    }
  }

  const handleStatusChange = async (status: string) => {
    const offerIds = Array.from(selectedOffers)

    // Optimistic update: update status in UI immediately
    if (offers && onOffersUpdate) {
      const updatedOffers = offers.map((offer) =>
        offerIds.includes(offer.id)
          ? { ...offer, status: status as OfferStatus }
          : offer,
      )
      onOffersUpdate(updatedOffers)
    }

    const result = await updateOffersStatus(offerIds, status)

    if (result.success) {
      toast.success(
        `Successfully updated ${offerIds.length} offer${offerIds.length > 1 ? "s" : ""} status`,
      )
      setSelectedOffers(new Set())
      router.refresh()
    } else {
      // Revert optimistic update on error
      if (onOffersUpdate) {
        onOffersUpdate(offers)
      }
      toast.error(result.error || "Failed to update offer status")
    }
  }

  const handleSendMessage = () => {
    // Placeholder - no logic for now
    toast.info("Send message functionality coming soon")
  }

  const statusOptions = Object.entries(OFFER_STATUSES).map(
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
        <OffersListTableView
          offers={offers}
          selectedOffers={selectedOffers}
          onToggleOffer={handleToggleOffer}
          onToggleAll={handleToggleAll}
        />
      ) : (
        <OffersListTileView
          offers={offers}
          selectedOffers={selectedOffers}
          onToggleOffer={handleToggleOffer}
        />
      )}

      <SelectionActionBar
        selectedCount={selectedOffers.size}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onSendMessage={handleSendMessage}
        onClearSelection={() => setSelectedOffers(new Set())}
        statusOptions={statusOptions}
        statusLabel="Offer Status"
        itemType="offers"
        showMessageButton={true}
      />
    </>
  )
}

export default OffersList
