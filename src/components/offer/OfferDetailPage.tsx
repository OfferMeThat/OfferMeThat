"use client"

import { OFFER_STATUSES, OFFER_TO_BADGE_MAP } from "@/constants/offers"
import {
  formatDepositData,
  formatMessageToAgent,
  formatPurchaserData,
  formatSettlementDateData,
  formatSpecialConditions,
  formatSubjectToLoanApproval,
} from "@/lib/formatOfferData"
import { parseAllCustomQuestions } from "@/lib/parseCustomQuestionsData"
import { extractFileName, truncateFileName } from "@/lib/fileHelpers"
import { OfferWithListing } from "@/types/offer"
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Tag,
  User,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Heading from "../shared/typography/Heading"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

const OfferDetailPage = ({ offer }: { offer: OfferWithListing | null }) => {
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

  const formattedDate = new Date(offer.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

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

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Show listing link if listing exists and offer is not "unassigned" (has a listingId and listing exists)
  const hasListing =
    offer.listing !== null &&
    offer.listingId &&
    offer.customListingAddress === null
  const statusBadgeVariant = OFFER_TO_BADGE_MAP[offer.status]
  const statusLabel = OFFER_STATUSES[offer.status]

  // Helper to parse JSON strings if needed
  const parseJsonField = (field: any): any => {
    if (!field) return null
    if (typeof field === "string") {
      try {
        return JSON.parse(field)
      } catch {
        return field
      }
    }
    return field
  }

  // Parse and normalize data fields (handle JSON strings)
  const purchaserData = parseJsonField(offer.purchaserData)
  const depositData = parseJsonField(offer.depositData)
  const settlementDateData = parseJsonField(offer.settlementDateData)
  const messageToAgent = parseJsonField(offer.messageToAgent)
  const subjectToLoanApproval = parseJsonField(offer.subjectToLoanApproval)
  const specialConditions = parseJsonField(offer.specialConditions)
  const customQuestionsData = parseJsonField(offer.customQuestionsData)

  // Parse custom questions data
  const parsedCustomQuestions = parseAllCustomQuestions(customQuestionsData)

  return (
    <main className="px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Heading
                as="h1"
                size="large"
                weight="bold"
                className="text-teal-500"
              >
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
                <p className="text-sm font-medium text-gray-500">
                  Offer Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    offer.amount,
                    (offer.customQuestionsData as any)?.currency || "USD",
                  )}
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
              <CreditCard className="mt-1 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Payment Method
                </p>
                <p className="text-base font-semibold text-gray-900 capitalize">
                  {offer.paymentWay}
                </p>
              </div>
            </div>

            {offer.conditional !== undefined && (
              <div className="flex items-start gap-3">
                <Tag className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Conditional
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {offer.conditional ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}

            {(offer.expires || offer.expiryTime) && (
              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Offer Expires
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {offer.expires &&
                      new Date(offer.expires).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    {offer.expiryTime && ` at ${offer.expiryTime}`}
                  </p>
                </div>
              </div>
            )}

            {offer.updatedAt && (
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Last Updated
                  </p>
                  <p className="text-base text-gray-600">
                    {new Date(offer.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

            {offer.buyerType && (
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Buyer Type
                  </p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {offer.buyerType}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {(() => {
          // Check if there's any actual content to display
          const hasSpecialConditions = !!specialConditions
          // Helper to parse purchaseAgreementFileUrl (can be single URL string or JSON array)
          const parsePurchaseAgreementUrls = (
            value: string | null | undefined,
          ): string[] => {
            if (!value) return []
            try {
              // Try to parse as JSON array
              const parsed = JSON.parse(value)
              if (Array.isArray(parsed)) {
                return parsed.filter((url) => typeof url === "string")
              }
            } catch {
              // Not JSON, treat as single URL string
            }
            // Single URL string (backward compatibility)
            return [value]
          }
          const purchaseAgreementUrls = parsePurchaseAgreementUrls(
            offer.purchaseAgreementFileUrl,
          )
          const hasPurchaseAgreement = purchaseAgreementUrls.length > 0
          const hasMessageToAgent =
            messageToAgent && formatMessageToAgent(messageToAgent as any)
          const hasPurchaserData =
            purchaserData && formatPurchaserData(purchaserData as any)
          const hasDepositData =
            depositData && formatDepositData(depositData as any)
          const hasSettlementDateData =
            settlementDateData &&
            formatSettlementDateData(settlementDateData as any)
          const hasSubjectToLoanApproval =
            subjectToLoanApproval &&
            formatSubjectToLoanApproval(subjectToLoanApproval as any)
          const hasCustomQuestions = parsedCustomQuestions.length > 0

          const hasAnyContent =
            hasSpecialConditions ||
            hasPurchaseAgreement ||
            hasMessageToAgent ||
            hasPurchaserData ||
            hasDepositData ||
            hasSettlementDateData ||
            hasSubjectToLoanApproval ||
            hasCustomQuestions

          if (!hasAnyContent) return null

          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md md:col-span-2">
              <Heading as="h2" size="medium" weight="bold" className="mb-6">
                Additional Information
              </Heading>
              <div className="space-y-6">
                {specialConditions && (
                  <div className="space-y-3">
                    <p className="text-base font-semibold text-gray-900">
                      Special Conditions
                    </p>
                    <div className="pl-4">
                      {(() => {
                        const setupConfig = (offer as any)
                          .specialConditionsSetupConfig

                        return formatSpecialConditions(
                          specialConditions,
                          setupConfig,
                        )
                      })()}
                    </div>
                  </div>
                )}

                {purchaseAgreementUrls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-base font-semibold text-gray-900">
                      Purchase Agreement
                    </p>
                    <div className="flex flex-col gap-1 pl-4">
                      {purchaseAgreementUrls.map((url, index) => {
                        const fileName = extractFileName(url)
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                            title={fileName}
                          >
                            <FileText size={16} />
                            {truncateFileName(fileName)}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {messageToAgent &&
                  (() => {
                    const formatted = formatMessageToAgent(
                      messageToAgent as any,
                    )
                    return formatted ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-gray-900">
                          Message to Agent
                        </p>
                        <div className="pl-4 text-base">{formatted}</div>
                      </div>
                    ) : null
                  })()}

                {purchaserData &&
                  (() => {
                    const formatted = formatPurchaserData(purchaserData as any)
                    return formatted ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-gray-900">
                          Purchaser Information
                        </p>
                        <div className="pl-4 text-base">{formatted}</div>
                      </div>
                    ) : null
                  })()}

                {depositData &&
                  (() => {
                    const formatted = formatDepositData(depositData as any)
                    return formatted ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-gray-900">
                          Deposit Information
                        </p>
                        <div className="pl-4 text-base">{formatted}</div>
                      </div>
                    ) : null
                  })()}

                {settlementDateData &&
                  (() => {
                    const formatted = formatSettlementDateData(
                      settlementDateData as any,
                    )
                    return formatted ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-gray-900">
                          Settlement Date
                        </p>
                        <div className="pl-4 text-base">{formatted}</div>
                      </div>
                    ) : null
                  })()}

                {subjectToLoanApproval &&
                  (() => {
                    const formatted = formatSubjectToLoanApproval(
                      subjectToLoanApproval as any,
                    )
                    return formatted ? (
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-gray-900">
                          Subject to Loan Approval
                        </p>
                        <div className="pl-4 text-base">{formatted}</div>
                      </div>
                    ) : null
                  })()}

                {parsedCustomQuestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-base font-semibold text-gray-900">
                      Custom Questions
                    </p>
                    <div className="space-y-4 pl-4">
                      {parsedCustomQuestions.map((question, index) => (
                        <div key={index} className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">
                            {question.questionText}
                          </p>
                          <div className="text-base text-gray-900">
                            {typeof question.formattedValue === "string" ? (
                              // Check if it contains markdown-style links
                              question.formattedValue.includes("[") &&
                              question.formattedValue.includes("](") ? (
                                question.answerType === "file_upload" ||
                                question.answerType === "uploadFiles" ? (
                                  <div className="flex flex-col gap-1">
                                    {question.formattedValue
                                      .split(/,\s*/)
                                      .map((linkStr, i) => {
                                        const linkMatch = linkStr.match(
                                          /\[(.*?)\]\((.*?)\)/,
                                        )
                                        if (linkMatch) {
                                          const [, text, url] = linkMatch
                                          return (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                                            >
                                              <FileText size={14} />
                                              {text}
                                            </a>
                                          )
                                        }
                                        return null
                                      })
                                      .filter(Boolean)}
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap">
                                    {question.formattedValue
                                      .split(/(\[.*?\]\(.*?\))/g)
                                      .map((part, i) => {
                                        const linkMatch =
                                          part.match(/\[(.*?)\]\((.*?)\)/)
                                        if (linkMatch) {
                                          const [, text, url] = linkMatch
                                          return (
                                            <a
                                              key={i}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                                            >
                                              <FileText size={14} />
                                              {text}
                                            </a>
                                          )
                                        }
                                        return <span key={i}>{part}</span>
                                      })}
                                  </div>
                                )
                              ) : (
                                <p className="whitespace-pre-wrap">
                                  {question.formattedValue}
                                </p>
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
          )
        })()}
      </div>
    </main>
  )
}

export default OfferDetailPage
