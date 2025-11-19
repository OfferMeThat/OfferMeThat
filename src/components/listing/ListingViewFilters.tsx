"use client"

import { useState } from "react"
import { LISTING_STATUSES } from "../constants/listings"
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

const ListingViewFilters = () => {
  const [showMore, setShowMore] = useState(true)

  return (
    <div className="rounded-xl px-4 py-5 shadow-md">
      <Heading as="h2" size="small" weight="bold" className="mb-3">
        Filters
      </Heading>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Property</Label>
          <Input
            placeholder="Type property address here..."
            className="max-w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select>
            <SelectTrigger className="w-full max-w-64">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectGroup>
                {LISTING_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className="w-fit cursor-pointer text-sm font-medium text-green-800"
          >
            {showMore ? "Show More Filters" : "Hide More Filters"}
          </button>
        </div>

        {showMore && (
          <>
            <div className="h-px bg-black/20" />

            <div className="flex flex-col flex-wrap justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="block font-medium">Date Listed</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <DatePicker label="From" btnClassName="w-full max-w-34" />
                <DatePicker label="To" btnClassName="w-full max-w-34" />
              </div>
            </div>

            <div className="flex flex-col flex-wrap justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="block font-medium">Date Sold</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <DatePicker label="From" btnClassName="w-full max-w-34" />
                <DatePicker label="To" btnClassName="w-full max-w-34" />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Pending Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Active Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Total Offers</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) => null}
                  className="max-w-34"
                  value="1"
                />
              </div>
            </div>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="font-medium">Number of Leads</span>

              <div className="flex flex-1 gap-3 sm:justify-end">
                <NumberSelect
                  placeholder="From"
                  onValueChange={(value) => null}
                  className="w-full max-w-34"
                  value="1"
                />
                <NumberSelect
                  placeholder="To"
                  onValueChange={(value) => null}
                  className="w-full max-w-34"
                  value="1"
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
