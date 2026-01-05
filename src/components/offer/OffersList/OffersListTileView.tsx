"use client"

import { OFFER_STATUSES, OFFER_TO_BADGE_MAP } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { Check, Clock, Ellipsis } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Checkbox } from "../../ui/checkbox"
import { EmptyState } from "../../ui/empty-state"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import CounterOfferModal from "../counterOffer/CounterOfferModal"

const OffersListTileView = ({
  offers,
  selectedOffers,
  onToggleOffer,
}: {
  offers: Array<OfferWithListing> | null
  selectedOffers: Set<string>
  onToggleOffer: (offerId: string) => void
}) => {
  const router = useRouter()
  const [counterOfferModalOpen, setCounterOfferModalOpen] = useState(false)
  const [selectedOfferForCounter, setSelectedOfferForCounter] =
    useState<OfferWithListing | null>(null)

  const formatCurrency = (amount: number, currency: string = "USD") => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch (e) {
      // Fallback for invalid currency codes
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => {
        const date = new Date(offer.createdAt)
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        const statusBadgeVariant = OFFER_TO_BADGE_MAP[offer.status]
        const statusLabel = OFFER_STATUSES[offer.status]
        const isSelected = selectedOffers.has(offer.id)

        return (
          <div
            key={offer.id}
            className="col-span-1 flex cursor-pointer flex-col gap-3 rounded-lg border border-gray-100 p-4 shadow-md transition-shadow hover:shadow-lg"
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
            <div className="flex items-center justify-between">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleOffer(offer.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <Badge variant={statusBadgeVariant} className="gap-1">
                {offer.status === "verified" && (
                  <Check size={14} className="text-green-900" />
                )}
                {offer.status === "unverified" && (
                  <Clock size={14} className="text-gray-600" />
                )}
                {statusLabel}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  offer.amount,
                  (offer.customQuestionsData as any)?.currency || "USD",
                )}
              </span>
              {offer.listingId ? (
                <Link
                  href={`/listing/${offer.listingId}`}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getListingAddress(offer)}
                </Link>
              ) : (
                <span className="text-sm text-gray-900">
                  {getListingAddress(offer)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Submitter: </span>
                <span className="text-gray-900">{getSubmitterName(offer)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email: </span>
                <span className="text-gray-900">
                  {offer.submitterEmail || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone: </span>
                <span className="text-gray-900">
                  {offer.submitterPhone || "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-xs text-gray-600">
                Received: {formattedDate}
              </span>
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Ellipsis size={16} />
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
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 p-2"
                      onClick={() => {
                        setSelectedOfferForCounter(offer)
                        setCounterOfferModalOpen(true)
                      }}
                    >
                      Make a Counter Offer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )
      })}
      <CounterOfferModal
        isOpen={counterOfferModalOpen}
        onClose={() => {
          setCounterOfferModalOpen(false)
          setSelectedOfferForCounter(null)
        }}
        offer={selectedOfferForCounter}
      />
    </div>
  )
}

export default OffersListTileView
