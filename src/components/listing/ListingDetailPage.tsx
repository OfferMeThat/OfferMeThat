"use client"

import { LISTING_STATUSES, LISTING_TO_BADGE_MAP } from "@/constants/listings"
import { ListingWithOfferCounts } from "@/types/listing"
import { ArrowLeft, Calendar, MapPin, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import Heading from "../shared/typography/Heading"

type ListingWithSellers = ListingWithOfferCounts & {
  sellers?: Array<{
    fullName: string
    email: string
    phone: string
    sendUpdateByEmail: boolean | null
  }>
}

const ListingDetailPage = ({
  listing,
}: {
  listing: ListingWithSellers | null
}) => {
  const router = useRouter()

  if (!listing) {
    return (
      <main className="px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Heading as="h1" size="large" weight="bold">
            Listing Not Found
          </Heading>
          <p className="text-gray-600">
            The listing you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Listings
          </Button>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(listing.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  )

  return (
    <main className="px-6 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Heading as="h1" size="large" weight="bold" className="text-teal-500">
                {listing.address}
              </Heading>
              <Badge variant={LISTING_TO_BADGE_MAP[listing.status]}>
                {LISTING_STATUSES[listing.status]}
              </Badge>
            </div>
            <p className="text-gray-600">Property Listing Details</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Information */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <Heading as="h2" size="medium" weight="bold" className="mb-4">
            Property Information
          </Heading>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-base font-semibold text-gray-900">
                  {listing.address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Date Listed
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Statistics */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <Heading as="h2" size="medium" weight="bold" className="mb-4">
            Offer Statistics
          </Heading>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {listing.totalOffers}
              </p>
              <p className="text-sm text-gray-600">Total Offers</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-teal-600">
                {listing.activeOffers}
              </p>
              <p className="text-sm text-gray-600">Active Offers</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {listing.pendingOffers}
              </p>
              <p className="text-sm text-gray-600">Pending Offers</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {listing.leads ?? 0}
              </p>
              <p className="text-sm text-gray-600">Leads</p>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        {listing.sellers && listing.sellers.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md md:col-span-2">
            <Heading as="h2" size="medium" weight="bold" className="mb-4">
              Seller Information
            </Heading>
            <div className="space-y-6">
              {listing.sellers.map((seller, index) => (
                <div key={index} className="space-y-4">
                  {listing.sellers && listing.sellers.length > 1 && (
                    <p className="text-sm font-semibold text-gray-700">
                      Seller {index + 1}
                    </p>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="mt-1 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="text-base font-semibold text-gray-900">
                          {seller.fullName}
                        </p>
                      </div>
                    </div>

                    {seller.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <a
                            href={`mailto:${seller.email}`}
                            className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            {seller.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {seller.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <a
                            href={`tel:${seller.phone}`}
                            className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            {seller.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {seller.sendUpdateByEmail !== null && (
                      <div className="flex items-start gap-3">
                        <Mail className="mt-1 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Email Updates
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {seller.sendUpdateByEmail ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {index < listing.sellers.length - 1 && (
                    <div className="h-px bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ListingDetailPage

