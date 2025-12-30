"use client"

import { LISTING_STATUSES, LISTING_TO_BADGE_MAP } from "@/constants/listings"
import { ListingStatus, ListingWithOfferCounts } from "@/types/listing"
import Link from "next/link"
import { Badge } from "../../ui/badge"
import { Checkbox } from "../../ui/checkbox"
import { EmptyState } from "../../ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import ListingActionsMenu from "./ListingActionsMenu"

const ListingListTableView = ({
  listings,
  selectedListings,
  onToggleListing,
  onToggleAll,
  onDelete,
  onUpdateStatus,
}: {
  listings: Array<ListingWithOfferCounts> | null
  selectedListings: Set<string>
  onToggleListing: (listingId: string) => void
  onToggleAll: (checked: boolean) => void
  onDelete: (listingId: string) => Promise<void>
  onUpdateStatus: (listingId: string, status: ListingStatus) => Promise<void>
}) => {
  const allSelected =
    listings &&
    listings.length > 0 &&
    listings.every((listing) => selectedListings.has(listing.id))

  const handleRowClick = (listingId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or actions
    const target = e.target as HTMLElement
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest("button") ||
      target.closest("[role='dialog']") ||
      target.closest("a")
    ) {
      return
    }
    window.location.href = `/listing/${listingId}`
  }

  // Show empty state if no listings
  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No listings found"
        description="No listings match your current filters. Try adjusting your search criteria or add a new listing."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-md">
      <Table className="overflow-x-auto">
        <TableHeader>
          <TableRow className="px-4">
            <TableHead className="min-w-12 font-medium text-gray-700">
              <Checkbox
                checked={allSelected || false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
              />
            </TableHead>
            <TableHead className="min-w-72 font-medium text-gray-700">
              Listing
            </TableHead>
            <TableHead className="min-w-20 font-medium text-gray-700">
              Status
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Pending Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Active Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Total Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Leads
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings?.map((item) => {
            const date = new Date(item.createdAt)
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer px-4 hover:bg-gray-50"
                onClick={(e) => handleRowClick(item.id, e)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedListings.has(item.id)}
                    onCheckedChange={() => onToggleListing(item.id)}
                  />
                </TableCell>
                <TableCell className="flex flex-col gap-1">
                  <Link
                    href={`/listing/${item.id}`}
                    className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {item.address}
                  </Link>
                  <span className="text-xs text-gray-700">
                    Listed on {formattedDate}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={LISTING_TO_BADGE_MAP[item.status]}>
                    {LISTING_STATUSES[item.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {item.pendingOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {item.activeOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {item.totalOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {item.leads ?? 0}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ListingActionsMenu
                    listingId={item.id}
                    currentStatus={item.status}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    buttonClassName="mx-auto"
                    iconSize={18}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default ListingListTableView
