"use client"

import { OFFER_STATUSES, OFFER_TO_BADGE_MAP } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { Check, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import OfferActionsMenu from "./OfferActionsMenu"

const OffersListTableView = ({
  offers,
  selectedOffers,
  onToggleOffer,
  onToggleAll,
  onDelete,
  onAssignToListing,
  listings,
  showAssignToListing,
}: {
  offers: Array<OfferWithListing> | null
  selectedOffers: Set<string>
  onToggleOffer: (offerId: string) => void
  onToggleAll: (checked: boolean) => void
  onDelete: (offerId: string) => Promise<void>
  onAssignToListing?: (offerId: string, listingId: string) => Promise<void>
  listings: Array<{ id: string; address: string; isTest?: boolean | null }>
  showAssignToListing?: boolean
}) => {
  const router = useRouter()

  const allSelected =
    offers &&
    offers.length > 0 &&
    offers.every((offer) => selectedOffers.has(offer.id))

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSubmitterName = (offer: OfferWithListing) => {
    const firstName = offer.submitterFirstName || ""
    const lastName = offer.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  const getListingAddress = (offer: OfferWithListing) => {
    if (offer.customListingAddress) {
      return offer.customListingAddress
    }
    return offer.listing?.address || "N/A"
  }

  // Show empty state if no offers
  if (!offers || offers.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No offers found"
        description="No offers match your current filters. Try adjusting your search criteria."
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
                checked={!!allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
              />
            </TableHead>
            <TableHead className="min-w-32 font-medium text-gray-700">
              Received
            </TableHead>
            <TableHead className="min-w-32 font-medium text-gray-700">
              Status
            </TableHead>
            <TableHead className="min-w-48 font-medium text-gray-700">
              Listing
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Submitter Name
            </TableHead>
            <TableHead className="min-w-48 font-medium text-gray-700">
              Submitter Email
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Submitter Phone
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Offer Amount
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers?.map((offer) => {
            const date = new Date(offer.createdAt)
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })

            const statusBadgeVariant = OFFER_TO_BADGE_MAP[offer.status]
            const statusLabel = OFFER_STATUSES[offer.status]

            return (
              <TableRow
                key={offer.id}
                className="cursor-pointer px-4 hover:bg-gray-50"
                onClick={(e) => {
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
                  router.push(`/offer/${offer.id}`)
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOffers.has(offer.id)}
                    onCheckedChange={() => onToggleOffer(offer.id)}
                  />
                </TableCell>
                <TableCell>{formattedDate}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant} className="gap-1">
                    {offer.status === "verified" && (
                      <Check size={14} className="text-green-900" />
                    )}
                    {offer.status === "unverified" && (
                      <Clock size={14} className="text-gray-600" />
                    )}
                    {statusLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  {offer.listingId ? (
                    <Link
                      href={`/listing/${offer.listingId}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getListingAddress(offer)}
                    </Link>
                  ) : (
                    <span>{getListingAddress(offer)}</span>
                  )}
                </TableCell>
                <TableCell>{getSubmitterName(offer)}</TableCell>
                <TableCell>{offer.submitterEmail || "N/A"}</TableCell>
                <TableCell>{offer.submitterPhone || "N/A"}</TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(
                    offer.amount,
                    (offer.customQuestionsData as any)?.currency || "USD",
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <OfferActionsMenu
                    offerId={offer.id}
                    onDelete={onDelete}
                    onAssignToListing={onAssignToListing}
                    listings={listings}
                    buttonClassName="mx-auto"
                    iconSize={18}
                    showAssignToListing={showAssignToListing}
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

export default OffersListTableView
