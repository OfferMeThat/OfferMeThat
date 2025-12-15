"use client"

import {
  getFilteredLeads,
  getUnassignedLeads,
  LeadFilters,
} from "@/app/actions/leadForm"
import { Listing } from "@/types/listing"
import { LeadWithListing } from "@/types/lead"
import { useEffect, useState, useTransition } from "react"
import Heading from "../shared/typography/Heading"
import { OffersTableSkeleton, OffersTileSkeleton } from "../ui/skeleton"
import LeadsList from "./LeadsList"
import LeadsViewFilters from "./LeadsViewFilters"

type SelectionFilter = { from: string | null; to: string | null }

export type Filters = {
  nameSearch: string
  listingId: string | null
  dateRange: SelectionFilter
}

const DEFAULT_FILTERS: Filters = {
  nameSearch: "",
  listingId: null,
  dateRange: { from: null, to: null },
}

const MyLeadsPageContent = ({
  initialData,
  initialUnassignedData,
  initialListings,
}: {
  initialData: Array<LeadWithListing> | null
  initialUnassignedData: Array<LeadWithListing> | null
  initialListings: Array<Listing> | null
}) => {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [leads, setLeads] = useState<Array<LeadWithListing> | null>(
    initialData,
  )
  const [unassignedLeads, setUnassignedLeads] =
    useState<Array<LeadWithListing> | null>(initialUnassignedData)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"table" | "tile">("table")

  // Fetch filtered leads when filters change
  useEffect(() => {
    startTransition(async () => {
      const filterParams: LeadFilters = {
        nameSearch: filters.nameSearch,
        listingId: filters.listingId,
        dateRange: filters.dateRange,
      }
      const filteredData = await getFilteredLeads(filterParams)
      setLeads(filteredData)
      // Also refresh unassigned leads
      const unassignedData = await getUnassignedLeads()
      setUnassignedLeads(unassignedData)
    })
  }, [filters])

  return (
    <main className="px-6 py-8 pb-24">
      {unassignedLeads && unassignedLeads.length > 0 && (
        <div className="mb-12">
          <div className="mb-4">
            <Heading
              as="h2"
              size="medium"
              weight="bold"
              className="text-gray-700"
            >
              Unassigned Leads
            </Heading>
            <span className="text-sm font-medium text-gray-500">
              Leads that need to be assigned to a listing
            </span>
          </div>
          <LeadsList
            leads={unassignedLeads}
            onLeadsUpdate={(updatedLeads) => {
              setUnassignedLeads(updatedLeads)
            }}
            onAssignSuccess={() => {
              // Refresh main leads list after successful assignment
              startTransition(async () => {
                const filterParams: LeadFilters = {
                  nameSearch: filters.nameSearch,
                  listingId: filters.listingId,
                  dateRange: filters.dateRange,
                }
                const filteredData = await getFilteredLeads(filterParams)
                setLeads(filteredData)
              })
            }}
            onViewModeChange={setViewMode}
            listings={initialListings}
            isUnassigned={true}
          />
        </div>
      )}
      <div className="mb-4 flex flex-col gap-1">
        <Heading
          as="h1"
          size="large"
          weight="bold"
          className="text-teal-500"
        >
          Leads
        </Heading>
        <span className="text-md font-medium opacity-75">
          Manage and track all incoming leads from your lead form submissions.
        </span>
      </div>

      <LeadsViewFilters
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
          <LeadsList
            leads={leads}
            onLeadsUpdate={(updatedLeads) => setLeads(updatedLeads)}
            onViewModeChange={setViewMode}
            listings={initialListings}
          />
        </>
      )}
    </main>
  )
}

export default MyLeadsPageContent

