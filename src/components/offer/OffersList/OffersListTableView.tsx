"use client"

import { OFFER_STATUSES, OFFER_TO_BADGE_MAP } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { Check, Clock, Ellipsis } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Checkbox } from "../../ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"

const OffersListTableView = ({
  offers,
  selectedOffers,
  onToggleOffer,
  onToggleAll,
}: {
  offers: Array<OfferWithListing> | null
  selectedOffers: Set<string>
  onToggleOffer: (offerId: string) => void
  onToggleAll: (checked: boolean) => void
}) => {
  const router = useRouter()

  const allSelected =
    offers && offers.length > 0 && offers.every((offer) => selectedOffers.has(offer.id))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-md">
      <Table className="overflow-x-auto">
        <TableHeader>
          <TableRow className="px-4">
            <TableHead className="min-w-12 font-medium text-gray-700">
              <Checkbox
                checked={allSelected}
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
              Specify Listing
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
                className="px-4 cursor-pointer hover:bg-gray-50"
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
                  <Link
                    href={`/offer/${offer.id}`}
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getListingAddress(offer)}
                  </Link>
                </TableCell>
                <TableCell>{getSubmitterName(offer)}</TableCell>
                <TableCell>{offer.submitterEmail || "N/A"}</TableCell>
                <TableCell>{offer.submitterPhone || "N/A"}</TableCell>
                <TableCell className="font-bold">
                  {formatCurrency(offer.amount)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <Link href={`/offer/${offer.id}`}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 p-2"
                          >
                            View Offer
                          </Button>
                        </Link>
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

export default OffersListTableView

