import { OFFER_STATUSES } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { OfferReportFieldKey } from "@/types/reportTypes"

/**
 * Formats a date string to a human-readable format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Formats a number as currency
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Gets submitter name from offer
 */
const getSubmitterName = (offer: OfferWithListing): string => {
  const firstName = offer.submitterFirstName || ""
  const lastName = offer.submitterLastName || ""
  return `${firstName} ${lastName}`.trim() || "N/A"
}

/**
 * Gets listing address from offer
 */
const getListingAddress = (offer: OfferWithListing): string => {
  if (offer.customListingAddress) {
    return offer.customListingAddress
  }
  return offer.listing?.address || "N/A"
}

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
const escapeCsvField = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return ""

  const stringValue = String(value)

  // If the value contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generates CSV content from selected offers and fields
 */
export const generateOfferReport = (
  offers: OfferWithListing[],
  selectedFields: OfferReportFieldKey[],
): string => {
  if (offers.length === 0 || selectedFields.length === 0) {
    return ""
  }

  // Create header row
  const headers = selectedFields.map((fieldKey) => {
    const fieldLabels: Record<OfferReportFieldKey, string> = {
      received: "Received",
      status: "Status",
      listingAddress: "Specify Listing",
      submitterName: "Submitter Name",
      submitterEmail: "Submitter Email",
      submitterPhone: "Submitter Phone",
      offerAmount: "Offer Amount",
    }
    return fieldLabels[fieldKey]
  })

  // Create data rows
  const rows = offers.map((offer) => {
    return selectedFields.map((fieldKey) => {
      switch (fieldKey) {
        case "received":
          return escapeCsvField(formatDate(offer.createdAt))
        case "status":
          return escapeCsvField(OFFER_STATUSES[offer.status])
        case "listingAddress":
          return escapeCsvField(getListingAddress(offer))
        case "submitterName":
          return escapeCsvField(getSubmitterName(offer))
        case "submitterEmail":
          return escapeCsvField(offer.submitterEmail || "N/A")
        case "submitterPhone":
          return escapeCsvField(offer.submitterPhone || "N/A")
        case "offerAmount":
          return escapeCsvField(formatCurrency(offer.amount))
        default:
          return ""
      }
    })
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

  return csvContent
}

/**
 * Generates a filename for the offer report with current date
 */
export const generateOfferReportFilename = (): string => {
  const today = new Date()
  const dateString = today.toISOString().split("T")[0] // YYYY-MM-DD format
  return `offers-report-${dateString}.csv`
}
