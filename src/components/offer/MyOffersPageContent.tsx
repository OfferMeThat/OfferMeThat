"use client"

import { getFilteredOffers, getUnassignedOffers } from "@/app/actions/offers"
import { Listing } from "@/types/listing"
import { OfferStatus, OfferWithListing } from "@/types/offer"
import { useEffect, useState, useTransition } from "react"
import Heading from "../shared/typography/Heading"
import { OffersTableSkeleton, OffersTileSkeleton } from "../ui/skeleton"
import OffersList from "./OffersList"
import OffersViewFilters from "./OffersViewFilters"

type SelectionFilter = { from: string | null; to: string | null }

export type Filters = {
  nameSearch: string
  status: OfferStatus | null
  listingId: string | null
  minAmount: number | null
  maxAmount: number | null
  dateRange: SelectionFilter
}

const DEFAULT_FILTERS: Filters = {
  nameSearch: "",
  status: null,
  listingId: null,
  minAmount: null,
  maxAmount: null,
  dateRange: { from: null, to: null },
}

const MyOffersPageContent = ({
  initialData,
  initialUnassignedData,
  initialListings,
  isTestMode = false,
}: {
  initialData: Array<OfferWithListing> | null
  initialUnassignedData: Array<OfferWithListing> | null
  initialListings: Array<Listing> | null
  isTestMode?: boolean
}) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [offers, setOffers] = useState<Array<OfferWithListing> | null>(
    initialData,
  )
  const [unassignedOffers, setUnassignedOffers] =
    useState<Array<OfferWithListing> | null>(initialUnassignedData)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"table" | "tile">("table")

  // Fetch filtered offers when filters change
  useEffect(() => {
    startTransition(async () => {
      const filteredData = await getFilteredOffers(filters, isTestMode)
      setOffers(filteredData)
      // Also refresh unassigned offers (only for normal mode)
      if (!isTestMode) {
        const unassignedData = await getUnassignedOffers()
        setUnassignedOffers(unassignedData)
      }
    })
  }, [filters, isTestMode])

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mb-4 flex flex-col gap-1">
        <Heading
          as="h1"
          size="large"
          weight="bold"
          className={isTestMode ? "text-red-600" : "text-teal-500"}
        >
          {isTestMode ? "My Test Offers" : "Offers"}
        </Heading>
        <span className="text-md font-medium opacity-75">
          {isTestMode
            ? "These offers are for testing purposes only and will expire in 72 hours."
            : "Manage and track all incoming offers, send Counter Offers, generate Offer Reports and send Broadcast Messages to selected Buyers."}
        </span>
      </div>

      <OffersViewFilters
        filters={filters}
        setFilters={setFilters}
        listings={initialListings}
      />

      {isPending ? (
        viewMode === "table" ? (
          <OffersTableSkeleton />
        ) : (
          <OffersTileSkeleton />
        )
      ) : (
        <>
          {!isTestMode && unassignedOffers && unassignedOffers.length > 0 && (
            <div className="my-12">
              <div className="mb-4">
                <Heading
                  as="h2"
                  size="medium"
                  weight="bold"
                  className="text-gray-700"
                >
                  Unassigned Offers
                </Heading>
                <span className="text-sm font-medium text-gray-500">
                  Offers that need to be assigned to a listing
                </span>
              </div>
              <OffersList
                offers={unassignedOffers}
                onOffersUpdate={(updatedOffers) => {
                  setUnassignedOffers(updatedOffers)
                }}
                onAssignSuccess={() => {
                  // Refresh main offers list after successful assignment
                  startTransition(async () => {
                    const filteredData = await getFilteredOffers(
                      filters,
                      isTestMode,
                    )
                    setOffers(filteredData)
                  })
                }}
                onViewModeChange={setViewMode}
                listings={initialListings}
                isUnassigned={true}
              />
            </div>
          )}

          {unassignedOffers && unassignedOffers.length > 0 && (
            <Heading
              as="h2"
              size="medium"
              weight="bold"
              className="text-gray-700"
            >
              Offers
            </Heading>
          )}

          <OffersList
            offers={offers}
            onOffersUpdate={(updatedOffers) => setOffers(updatedOffers)}
            onViewModeChange={setViewMode}
            listings={initialListings}
            isTestMode={isTestMode}
          />
        </>
      )}
    </main>
  )
}

export default MyOffersPageContent
