"use client"

import { getFilteredOffers } from "@/app/actions/offers"
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
  initialListings,
}: {
  initialData: Array<OfferWithListing> | null
  initialListings: Array<Listing> | null
}) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [offers, setOffers] = useState<Array<OfferWithListing> | null>(
    initialData,
  )
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"table" | "tile">("table")

  // Fetch filtered offers when filters change
  useEffect(() => {
    startTransition(async () => {
      const filteredData = await getFilteredOffers(filters)
      setOffers(filteredData)
    })
  }, [filters])

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mb-4 flex flex-col gap-1">
        <Heading as="h1" size="large" weight="bold" className="text-teal-500">
          Offers
        </Heading>
        <span className="text-md font-medium opacity-75">
          Manage and track all incoming offers, send Counter Offers, generate
          Offer Reports and send Broadcast Messages to selected Buyers.
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
        <OffersList
          offers={offers}
          onOffersUpdate={(updatedOffers) => setOffers(updatedOffers)}
          onViewModeChange={setViewMode}
        />
      )}
    </main>
  )
}

export default MyOffersPageContent
