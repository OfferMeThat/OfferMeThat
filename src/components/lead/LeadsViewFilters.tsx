"use client"

import { Filters } from "@/components/lead/MyLeadsPageContent"
import { Listing } from "@/types/listing"
import { Dispatch, SetStateAction, useState } from "react"
import DatePicker from "../shared/forms/DatePicker"
import Heading from "../shared/typography/Heading"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { ChevronUp } from "lucide-react"

type LeadsViewFiltersProps = {
  filters: Filters
  setFilters: Dispatch<SetStateAction<Filters>>
  listings: Listing[] | null
}

const LeadsViewFilters = ({
  filters,
  setFilters,
  listings,
}: LeadsViewFiltersProps) => {
  const [showMore, setShowMore] = useState(false)

  const handleFilterChange = (
    key: keyof Filters,
    value: string | null,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRangeFilterChange = (
    key: "dateRange",
    rangeKey: "from" | "to",
    value: string | null,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] as { from: string | null; to: string | null }),
        [rangeKey]: value,
      },
    }))
  }

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 px-4 py-5 shadow-md">
      <Heading as="h2" size="small" weight="bold" className="mb-3">
        Filters
      </Heading>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Search by Name, Email, or Listing</Label>
          <Input
            placeholder="Search by name, email, or listing address..."
            className="max-w-64"
            value={filters.nameSearch || ""}
            onChange={(e) => handleFilterChange("nameSearch", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>All Properties</Label>
          <Select
            value={filters.listingId || "all"}
            onValueChange={(value) =>
              handleFilterChange("listingId", value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-full max-w-64">
              <SelectValue placeholder="Select property..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectGroup>
                <SelectItem value="all">All Properties</SelectItem>
                {listings?.map((listing) => (
                  <SelectItem key={listing.id} value={listing.id}>
                    {listing.address}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className="flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-teal-500"
          >
            {showMore ? (
              <>
                <ChevronUp size={16} className="rotate-180" />
                Hide More Filters
              </>
            ) : (
              <>
                <ChevronUp size={16} />
                Show More Filters
              </>
            )}
          </button>
        </div>

        {showMore && (
          <>
            <div className="h-px bg-black/20" />

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="flex items-center gap-2">
                <DatePicker
                  label="From"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateRange.from
                      ? new Date(filters.dateRange.from)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateRange",
                      "from",
                      date?.toISOString() || null,
                    )
                  }
                  disablePastDates={false}
                />
                <DatePicker
                  label="To"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateRange.to
                      ? new Date(filters.dateRange.to)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateRange",
                      "to",
                      date?.toISOString() || null,
                    )
                  }
                  disablePastDates={false}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LeadsViewFilters

