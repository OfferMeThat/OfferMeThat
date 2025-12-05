"use client"

import { getFilteredListings } from "@/app/actions/listings"
import { ListingStatus, ListingWithOfferCounts } from "@/types/listing"
import { PlusIcon } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import Heading from "../shared/typography/Heading"
import { Button } from "../ui/button"
import { ListingsTableSkeleton, ListingsTileSkeleton } from "../ui/skeleton"
import { AddListingModal } from "./AddListingModal"
import ListingViewFilters from "./ListingViewFilters"
import ListingsList from "./ListingsList"

type SelectionFilter = { from: string | null; to: string | null }

export type Filters = {
  address: string
  status: ListingStatus | null
  dateListed: SelectionFilter
  dateSold: SelectionFilter
  pendingOffers: SelectionFilter
  activeOffers: SelectionFilter
  totalOffers: SelectionFilter
  numberOfLeads: SelectionFilter
}

const DEFAULT_FILTERS: Filters = {
  address: "",
  status: null,
  dateListed: { from: null, to: null },
  dateSold: { from: null, to: null },
  pendingOffers: { from: null, to: null },
  activeOffers: { from: null, to: null },
  totalOffers: { from: null, to: null },
  numberOfLeads: { from: null, to: null },
}

const MyListingsPageContent = ({
  initialData,
}: {
  initialData: Array<ListingWithOfferCounts> | null
}) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [listings, setListings] =
    useState<Array<ListingWithOfferCounts> | null>(initialData)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"table" | "tile">("table")

  // Fetch filtered listings when filters change
  useEffect(() => {
    startTransition(async () => {
      const filteredData = await getFilteredListings(filters)
      setListings(filteredData)
    })
  }, [filters])

  const handleListingCreated = (newListing: any) => {
    // Add the new listing to the current listings state
    setListings((prevListings) => {
      if (!prevListings) return [newListing]
      return [newListing, ...prevListings]
    })
  }

  return (
    <main className="px-6 py-8 pb-24">
      <div className="mb-4 flex flex-col gap-1">
        <Heading as="h1" size="large" weight="bold" className="text-teal-500">
          My Listings
        </Heading>
        <span className="text-md font-medium opacity-75">
          Manage your property listings
        </span>
      </div>

      <AddListingModal onListingCreated={handleListingCreated}>
        <Button variant="default" size="lg" className="mb-6">
          <PlusIcon />
          <span>Add Listings</span>
        </Button>
      </AddListingModal>

      <ListingViewFilters filters={filters} setFilters={setFilters} />

      {isPending ? (
        viewMode === "table" ? (
          <ListingsTableSkeleton />
        ) : (
          <ListingsTileSkeleton />
        )
      ) : (
        <ListingsList
          listings={listings}
          onListingsUpdate={(updatedListings) => setListings(updatedListings)}
          onViewModeChange={setViewMode}
        />
      )}
    </main>
  )
}

export default MyListingsPageContent
