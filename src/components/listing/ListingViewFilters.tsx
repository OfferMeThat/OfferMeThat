"use client"

import { Filters } from "@/components/listing/MyListingsPageContent"
import { ListingStatus } from "@/types/listing"
import { Dispatch, SetStateAction, useState } from "react"
import { LISTING_STATUSES } from "../../constants/listings"
import DatePicker from "../shared/forms/DatePicker"
import NumberSelect from "../shared/forms/NumberSelect"
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

type ListingViewFiltersProps = {
  filters: Filters
  setFilters: Dispatch<SetStateAction<Filters>>
}

const ListingViewFilters = ({
  filters,
  setFilters,
}: ListingViewFiltersProps) => {
  const [showMore, setShowMore] = useState(false)

  const handleFilterChange = (
    key: keyof Filters,
    value: string | ListingStatus | null,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleRangeFilterChange = (
    key: keyof Filters,
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
          <Label>Property</Label>
          <Input
            placeholder="Type property address here..."
            className="max-w-64"
            value={filters.address}
            onChange={(e) => handleFilterChange("address", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "status",
                value === "all" ? null : (value as ListingStatus),
              )
            }
          >
            <SelectTrigger className="w-full max-w-64">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectGroup>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(LISTING_STATUSES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className="w-fit cursor-pointer text-sm font-medium text-teal-600"
          >
            {showMore ? "Hide More Filters" : "Show More Filters"}
          </button>
        </div>

        {showMore && (
          <>
            <div className="h-px bg-black/20" />

            <div className="flex flex-col flex-wrap justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="block font-medium">Date Listed</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <DatePicker
                  label="From"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateListed.from
                      ? new Date(filters.dateListed.from)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateListed",
                      "from",
                      date?.toISOString() || null,
                    )
                  }
                />
                <DatePicker
                  label="To"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateListed.to
                      ? new Date(filters.dateListed.to)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateListed",
                      "to",
                      date?.toISOString() || null,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col flex-wrap justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="block font-medium">Date Sold</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <DatePicker
                  label="From"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateSold.from
                      ? new Date(filters.dateSold.from)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateSold",
                      "from",
                      date?.toISOString() || null,
                    )
                  }
                />
                <DatePicker
                  label="To"
                  btnClassName="w-full max-w-34"
                  value={
                    filters.dateSold.to
                      ? new Date(filters.dateSold.to)
                      : undefined
                  }
                  onChange={(date) =>
                    handleRangeFilterChange(
                      "dateSold",
                      "to",
                      date?.toISOString() || null,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Pending Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) =>
                    handleRangeFilterChange("pendingOffers", "from", value)
                  }
                  className="max-w-34"
                  value={filters.pendingOffers.from || undefined}
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) =>
                    handleRangeFilterChange("pendingOffers", "to", value)
                  }
                  className="max-w-34"
                  value={filters.pendingOffers.to || undefined}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Active Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) =>
                    handleRangeFilterChange("activeOffers", "from", value)
                  }
                  className="max-w-34"
                  value={filters.activeOffers.from || undefined}
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) =>
                    handleRangeFilterChange("activeOffers", "to", value)
                  }
                  className="max-w-34"
                  value={filters.activeOffers.to || undefined}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Total Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) =>
                    handleRangeFilterChange("totalOffers", "from", value)
                  }
                  className="max-w-34"
                  value={filters.totalOffers.from || undefined}
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) =>
                    handleRangeFilterChange("totalOffers", "to", value)
                  }
                  className="max-w-34"
                  value={filters.totalOffers.to || undefined}
                />
              </div>
            </div>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Leads</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) =>
                    handleRangeFilterChange("numberOfLeads", "from", value)
                  }
                  className="w-full max-w-34"
                  value={filters.numberOfLeads.from || undefined}
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) =>
                    handleRangeFilterChange("numberOfLeads", "to", value)
                  }
                  className="w-full max-w-34"
                  value={filters.numberOfLeads.to || undefined}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ListingViewFilters
