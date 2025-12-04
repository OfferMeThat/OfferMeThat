"use client"

import { OFFER_STATUSES, OFFER_TO_BADGE_MAP } from "@/constants/offers"
import { parseAllCustomQuestions } from "@/lib/parseCustomQuestionsData"
import { OfferWithListing } from "@/types/offer"
import { ArrowLeft, Calendar, Check, Clock, DollarSign, FileText, Mail, MapPin, Phone, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import Heading from "../shared/typography/Heading"

const OfferDetailPage = ({
  offer,
}: {
  offer: OfferWithListing | null
}) => {
  const router = useRouter()

  if (!offer) {
    return (
      <main className="px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Heading as="h1" size="large" weight="bold">
            Offer Not Found
          </Heading>
          <p className="text-gray-600">
            The offer you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/offers")} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Offers
          </Button>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(offer.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  )

  const getSubmitterName = () => {
    const firstName = offer.submitterFirstName || ""
    const lastName = offer.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  const getListingAddress = () => {
    if (offer.customListingAddress) {
      return offer.customListingAddress
    }
    return offer.listing?.address || "Unassigned"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Show listing link if listing exists and offer is not "unassigned" (has a listingId and listing exists)
  const hasListing = offer.listing !== null && offer.listingId && offer.customListingAddress === null
  const statusBadgeVariant = OFFER_TO_BADGE_MAP[offer.status]
  const statusLabel = OFFER_STATUSES[offer.status]

  // Parse custom questions data
  const parsedCustomQuestions = parseAllCustomQuestions(offer.customQuestionsData as any)

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
                Offer Details
              </Heading>
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
            <p className="text-gray-600">Complete offer information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Offer Information */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <Heading as="h2" size="medium" weight="bold" className="mb-4">
            Offer Information
          </Heading>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Offer Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(offer.amount)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Property</p>
                {hasListing ? (
                  <Link
                    href={`/listing/${offer.listingId}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {getListingAddress()}
                  </Link>
                ) : (
                  <p className="text-base font-semibold text-gray-900">
                    {getListingAddress()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Received</p>
                <p className="text-base font-semibold text-gray-900">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="text-base font-semibold text-gray-900 capitalize">
                  {offer.paymentWay}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Buyer Type</p>
                <p className="text-base font-semibold text-gray-900 capitalize">
                  {offer.buyerType}
                </p>
              </div>
            </div>

            {offer.conditional !== undefined && (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Conditional</p>
                  <p className="text-base font-semibold text-gray-900">
                    {offer.conditional ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submitter Information */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <Heading as="h2" size="medium" weight="bold" className="mb-4">
            Submitter Information
          </Heading>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {getSubmitterName()}
                </p>
              </div>
            </div>

            {offer.submitterEmail && (
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a
                    href={`mailto:${offer.submitterEmail}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {offer.submitterEmail}
                  </a>
                </div>
              </div>
            )}

            {offer.submitterPhone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <a
                    href={`tel:${offer.submitterPhone}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {offer.submitterPhone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {(offer.specialConditions ||
          offer.messageToAgent ||
          offer.purchaserData ||
          offer.depositData ||
          offer.settlementDateData ||
          offer.subjectToLoanApproval ||
          offer.customQuestionsData) && (
          <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
            <Heading as="h2" size="medium" weight="bold" className="mb-4">
              Additional Information
            </Heading>
            <div className="space-y-4">
              {offer.specialConditions && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Special Conditions
                  </p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">
                    {offer.specialConditions}
                  </p>
                </div>
              )}

              {offer.messageToAgent && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Message to Agent
                  </p>
                  <div className="text-base text-gray-900">
                    {typeof offer.messageToAgent === "object" ? (
                      <pre className="whitespace-pre-wrap font-sans">
                        {JSON.stringify(offer.messageToAgent, null, 2)}
                      </pre>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {String(offer.messageToAgent)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {offer.purchaserData && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Purchaser Data
                  </p>
                  <div className="text-base text-gray-900">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(offer.purchaserData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {offer.depositData && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Deposit Information
                  </p>
                  <div className="text-base text-gray-900">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(offer.depositData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {offer.settlementDateData && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Settlement Date Information
                  </p>
                  <div className="text-base text-gray-900">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(offer.settlementDateData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {offer.subjectToLoanApproval && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Subject to Loan Approval
                  </p>
                  <div className="text-base text-gray-900">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(offer.subjectToLoanApproval, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {parsedCustomQuestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">
                    Custom Questions
                  </p>
                  <div className="space-y-4">
                    {parsedCustomQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {question.questionText}
                        </p>
                        <div className="text-base text-gray-900">
                          {typeof question.formattedValue === "string" ? (
                            // Check if it contains markdown-style links
                            question.formattedValue.includes("[") &&
                            question.formattedValue.includes("](") ? (
                              <div className="whitespace-pre-wrap">
                                {question.formattedValue.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                  const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
                                  if (linkMatch) {
                                    const [, text, url] = linkMatch
                                    return (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
                                      >
                                        <FileText size={14} />
                                        {text}
                                      </a>
                                    )
                                  }
                                  return <span key={i}>{part}</span>
                                })}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{question.formattedValue}</p>
                            )
                          ) : (
                            <div>{question.formattedValue}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default OfferDetailPage

