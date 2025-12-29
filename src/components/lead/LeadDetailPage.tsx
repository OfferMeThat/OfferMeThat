"use client"

import {
  formatAreYouInterested,
  formatFinanceInterest,
  formatFollowAllListings,
  formatMessageToAgent,
  formatSubmitterRole,
  getRoleBadgeVariant,
} from "@/lib/formatLeadData"
import { formatFormDataField } from "@/lib/formatLeadFormData"
import { parseAllCustomQuestions } from "@/lib/parseCustomQuestionsData"
import { LeadWithListing } from "@/types/lead"
import { Database } from "@/types/supabase"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  TrendingUp,
  User,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Heading from "../shared/typography/Heading"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]

const LeadDetailPage = ({
  lead,
  questions,
}: {
  lead: LeadWithListing | null
  questions?: Question[] | null
}) => {
  const router = useRouter()

  if (!lead) {
    return (
      <main className="px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Heading as="h1" size="large" weight="bold">
            Lead Not Found
          </Heading>
          <p className="text-gray-600">
            The lead you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/leads")} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Leads
          </Button>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(lead.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const getSubmitterName = () => {
    const firstName = lead.submitterFirstName || ""
    const lastName = lead.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  const getListingAddress = () => {
    if (lead.customListingAddress) {
      return lead.customListingAddress
    }
    return lead.listing?.address || "Unassigned"
  }

  // Show listing link if listing exists and lead is not unassigned (has a listingId and listing exists)
  const hasListing =
    lead.listing !== null &&
    lead.listingId &&
    lead.customListingAddress === null

  // Parse custom questions data
  const parsedCustomQuestions = parseAllCustomQuestions(
    lead.customQuestionsData as any,
  )

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
                Lead Details
              </Heading>
            </div>
            <p className="text-gray-600">Complete lead information</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Information */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <Heading as="h2" size="medium" weight="bold" className="mb-4">
            Lead Information
          </Heading>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Property</p>
                {hasListing ? (
                  <Link
                    href={`/listing/${lead.listingId}`}
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

            {lead.areYouInterested && (
              <div className="flex items-start gap-3">
                <Heart className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Are You Interested?
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {formatAreYouInterested(lead.areYouInterested)}
                  </Badge>
                </div>
              </div>
            )}

            {lead.followAllListings && (
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Follow All Listings?
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatFollowAllListings(lead.followAllListings)}
                  </p>
                </div>
              </div>
            )}

            {lead.opinionOfSalePrice && (
              <div className="flex items-start gap-3">
                <DollarSign className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Opinion of Sale Price
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {(() => {
                      try {
                        const parsed = JSON.parse(lead.opinionOfSalePrice)
                        if (
                          typeof parsed === "object" &&
                          parsed !== null &&
                          "amount" in parsed
                        ) {
                          const amount = parsed.amount
                          const currency = parsed.currency || "USD"
                          if (
                            amount === "" ||
                            amount === null ||
                            amount === undefined
                          ) {
                            return "N/A"
                          }
                          const formattedAmount =
                            typeof amount === "number"
                              ? amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : String(amount)
                          return `${currency} ${formattedAmount}`
                        }
                      } catch {}
                      return lead.opinionOfSalePrice
                    })()}
                  </p>
                </div>
              </div>
            )}

            {lead.updatedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Last Updated
                  </p>
                  <p className="text-base text-gray-600">
                    {new Date(lead.updatedAt).toLocaleDateString("en-US", {
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

            {lead.submitterRole && (
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    What best describes you?
                  </p>
                  <Badge
                    variant={getRoleBadgeVariant(lead.submitterRole)}
                    className="mt-1"
                  >
                    {formatSubmitterRole(lead.submitterRole)}
                  </Badge>
                </div>
              </div>
            )}

            {lead.agentCompany && (
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Agent Company
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {lead.agentCompany}
                  </p>
                </div>
              </div>
            )}

            {lead.submitterEmail && (
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a
                    href={`mailto:${lead.submitterEmail}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {lead.submitterEmail}
                  </a>
                </div>
              </div>
            )}

            {lead.submitterPhone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <a
                    href={`tel:${lead.submitterPhone}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {lead.submitterPhone}
                  </a>
                </div>
              </div>
            )}

            {lead.termsAccepted !== null &&
              lead.termsAccepted !== undefined && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Terms Accepted
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {lead.termsAccepted ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Buyer Agent Information (if applicable) */}
        {(lead.buyerAgentName ||
          lead.buyerAgentEmail ||
          lead.buyerAgentCompany) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md md:col-span-2">
            <Heading as="h2" size="medium" weight="bold" className="mb-4">
              Buyer Agent Information
            </Heading>
            <div className="grid gap-4 md:grid-cols-3">
              {lead.buyerAgentName && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base font-semibold text-gray-900">
                    {lead.buyerAgentName}
                  </p>
                </div>
              )}
              {lead.buyerAgentEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a
                    href={`mailto:${lead.buyerAgentEmail}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {lead.buyerAgentEmail}
                  </a>
                </div>
              )}
              {lead.buyerAgentCompany && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-base font-semibold text-gray-900">
                    {lead.buyerAgentCompany}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Information (if applicable) */}
        {lead.financeInterest === "yes" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md md:col-span-2">
            <Heading as="h2" size="medium" weight="bold" className="mb-4">
              Finance Information
            </Heading>
            <div className="space-y-4">
              {lead.financeInterest && (
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Finance Interest
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {formatFinanceInterest(lead.financeInterest)}
                    </Badge>
                  </div>
                </div>
              )}
              {/* Finance setup info might be in customQuestionsData or formData */}
              {(lead.customQuestionsData as any)?.financeSetup && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Finance Setup
                  </p>
                  <p className="text-base font-semibold text-gray-900 capitalize">
                    {(lead.customQuestionsData as any).financeSetup
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                  </p>
                </div>
              )}
              {(lead.customQuestionsData as any)?.referralPartnerEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Referral Partner Email
                  </p>
                  <a
                    href={`mailto:${(lead.customQuestionsData as any).referralPartnerEmail}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {(lead.customQuestionsData as any).referralPartnerEmail}
                  </a>
                </div>
              )}
              {(lead.customQuestionsData as any)?.leadRecipientEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Lead Recipient Email
                  </p>
                  <a
                    href={`mailto:${(lead.customQuestionsData as any).leadRecipientEmail}`}
                    className="text-base font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {(lead.customQuestionsData as any).leadRecipientEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(lead.messageToAgent || lead.customQuestionsData || lead.formData) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md md:col-span-2">
            <Heading as="h2" size="medium" weight="bold" className="mb-4">
              Additional Information
            </Heading>
            <div className="space-y-4">
              {lead.messageToAgent &&
                (() => {
                  const formatted = formatMessageToAgent(lead.messageToAgent)
                  return formatted ? (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-500">
                          Message to Agent
                        </p>
                      </div>
                      <div className="text-base">{formatted}</div>
                    </div>
                  ) : null
                })()}

              {parsedCustomQuestions.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-500">
                    Custom Questions
                  </p>
                  <div className="space-y-4">
                    {parsedCustomQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <p className="mb-1 text-sm font-semibold text-gray-700">
                          {question.questionText}
                        </p>
                        <div className="text-base text-gray-900">
                          {typeof question.formattedValue === "string" ? (
                            // Check if it contains markdown-style links
                            question.formattedValue.includes("[") &&
                            question.formattedValue.includes("](") ? (
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

              {/* Parse and display formData fields with proper labels */}
              {lead.formData &&
                typeof lead.formData === "object" &&
                Object.keys(lead.formData as Record<string, any>).length >
                  0 && (
                  <div className="space-y-4">
                    {Object.entries(lead.formData as Record<string, any>).map(
                      ([questionId, value]) => {
                        if (
                          value === null ||
                          value === undefined ||
                          value === ""
                        ) {
                          return null
                        }

                        // Find the question to get its label
                        const question = questions?.find(
                          (q) => q.id === questionId,
                        )

                        // Skip submitterRole if it's already in the submitterRole column
                        // (it should be saved there, not in formData)
                        if (question?.type === "submitterRole") {
                          // If submitterRole is in formData but also in the column, skip formData version
                          // If it's only in formData (legacy data), we'll show it but use the column value if available
                          if (lead.submitterRole) {
                            return null // Skip - already shown in main section
                          }
                        }

                        const uiConfig = question?.uiConfig as
                          | Record<string, any>
                          | undefined
                        const questionLabel =
                          uiConfig?.questionText ||
                          uiConfig?.label ||
                          questionId
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())

                        // Format the value based on question type using the formatter
                        const formattedValue = formatFormDataField(
                          question || undefined,
                          value,
                        )

                        // Special handling for submitterRole - show as badge (only if not in column)
                        const isSubmitterRole =
                          question?.type === "submitterRole" &&
                          !lead.submitterRole

                        return (
                          <div
                            key={questionId}
                            className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                          >
                            <p className="mb-1 text-sm font-semibold text-gray-700">
                              {questionLabel}
                            </p>
                            <div className="text-base text-gray-900">
                              {isSubmitterRole ? (
                                <Badge variant={getRoleBadgeVariant(value)}>
                                  {formatSubmitterRole(value)}
                                </Badge>
                              ) : typeof formattedValue === "string" ? (
                                // Check if it contains markdown-style links (for file uploads)
                                formattedValue.includes("[") &&
                                formattedValue.includes("](") ? (
                                  <div className="whitespace-pre-wrap">
                                    {formattedValue
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
                                ) : (
                                  <p className="whitespace-pre-wrap">
                                    {formattedValue}
                                  </p>
                                )
                              ) : (
                                formattedValue
                              )}
                            </div>
                          </div>
                        )
                      },
                    )}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default LeadDetailPage
