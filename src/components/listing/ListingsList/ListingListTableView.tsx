import { LISTING_STATUSES, LISTING_TO_BADGE_MAP } from "@/constants/listings"
import { ListingWithOfferCounts } from "@/types/listing"
import {
  ArrowRight,
  ChartColumn,
  Ellipsis,
  MessageSquare,
  Pencil,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Checkbox } from "../../ui/checkbox"
import { EmptyState } from "../../ui/empty-state"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"

const ListingListTableView = ({
  listings,
  selectedListings,
  onToggleListing,
  onToggleAll,
}: {
  listings: Array<ListingWithOfferCounts> | null
  selectedListings: Set<string>
  onToggleListing: (listingId: string) => void
  onToggleAll: (checked: boolean) => void
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
                  {item.activeOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {item.pendingOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {item.totalOffers ?? 0}
                </TableCell>
                <TableCell className="text-center">1</TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="mx-auto">
                        <Ellipsis size={18} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="max-w-60 p-2"
                      side="bottom"
                      collisionPadding={64}
                    >
                      <div className="flex flex-col gap-1">
                        <Link href={`/listing/${item.id}`}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 p-2"
                          >
                            <ArrowRight size={18} />
                            <span className="text-sm">Go to Listing</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className="hover: flex items-center justify-start gap-2 p-2"
                        >
                          <MessageSquare size={18} />
                          <span className="text-sm"> Message Seller</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="hover: flex items-center justify-start gap-2 p-2"
                        >
                          <ChartColumn size={18} />
                          <span className="text-sm">
                            Generate Report for Seller
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex items-center justify-start gap-2 p-2"
                        >
                          <Pencil size={18} />
                          <span className="text-sm">
                            {" "}
                            Update Listing Status
                          </span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
