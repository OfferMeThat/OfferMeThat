"use client"

import { ListingStatus } from "@/types/listing"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import Heading from "../shared/typography/Heading"
import { Button } from "../ui/button"
import { AddListingModal } from "./AddListingModal"
import ListingViewFilters from "./ListingViewFilters"
import ListingsList from "./ListingsList"

type SelectionFilter = { from: string | null; to: string | null }

type Filters = {
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

const MyListingsPageContent = () => {
  const [data, setData] = useState<{ phoneNumber: string }>({
    phoneNumber: "",
  })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  return (
    <main className="px-6 py-8">
      <div className="mb-4 flex flex-col gap-1">
        <Heading as="h1" size="large" weight="bold" className="text-green-900">
          My Listings
        </Heading>
        <span className="text-md font-medium opacity-75">
          Manage your property listings
        </span>
      </div>

      <AddListingModal>
        <Button variant="default" size="lg" className="mb-6">
          <PlusIcon />
          <span>Add Listings</span>
        </Button>
      </AddListingModal>

      <ListingViewFilters />

      <ListingsList />
    </main>
  )
}

export default MyListingsPageContent
