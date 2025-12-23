import { OFFER_STATUSES } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { OFFER_REPORT_FIELDS, OfferReportFieldKey } from "@/types/reportTypes"
import {
  formatCustomQuestions,
  getAllDepositInfo,
  getAllMessageToAgentInfo,
  getAllSettlementInfo,
  getAllSpecialConditionsInfo,
  getAllSubjectToLoanInfo,
  getCustomQuestionsFromOffer,
  getPurchaseAgreementUrls,
  getPurchaserNamesFromData,
  getSubmitterRoleFromData,
} from "./parseOfferDataForReports"

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
const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats buyer type enum to readable string
 */
const formatBuyerType = (buyerType: string): string => {
  const buyerTypeLabels: Record<string, string> = {
    buyer: "Buyer",
    agent: "Agent",
    affiliate: "Affiliate",
  }
  return buyerTypeLabels[buyerType] || buyerType
}

/**
 * Formats payment way enum to readable string
 */
const formatPaymentWay = (paymentWay: string): string => {
  const paymentWayLabels: Record<string, string> = {
    cash: "Cash",
    finance: "Finance",
  }
  return paymentWayLabels[paymentWay] || paymentWay
}

/**
 * Formats boolean to Yes/No
 */
const formatYesNo = (value: boolean): string => {
  return value ? "Yes" : "No"
}

/**
 * Determines if offer is conditional based on special conditions or subject to loan approval
 */
const isConditional = (offer: OfferWithListing): boolean => {
  // Check if offer has special conditions
  const specialConditions = getAllSpecialConditionsInfo(offer.specialConditions)
  if (
    specialConditions &&
    specialConditions !== "N/A" &&
    specialConditions !== "No"
  ) {
    return true
  }

  // Check if offer is subject to loan approval
  const subjectToLoan = getAllSubjectToLoanInfo(offer.subjectToLoanApproval)
  if (
    subjectToLoan &&
    subjectToLoan !== "N/A" &&
    subjectToLoan.startsWith("Yes")
  ) {
    return true
  }

  // Fallback to direct conditional field
  return offer.conditional === true
}

/**
 * Formats expiry date and time
 */
const formatExpiry = (offer: OfferWithListing): string => {
  if (!offer.expires) {
    return "N/A"
  }
  const dateStr = formatDate(offer.expires)
  const timeStr = offer.expiryTime || ""
  return timeStr ? `${dateStr} ${timeStr}` : dateStr
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
 * Gets purchaser names from purchaserData
 */
const getPurchaserNames = (offer: OfferWithListing): string => {
  return getPurchaserNamesFromData(offer.purchaserData)
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

  // Convert selectedFields array to Set for O(1) lookup
  const selectedFieldsSet = new Set(selectedFields)

  // Filter and order fields based on OFFER_REPORT_FIELDS order
  const orderedFields = OFFER_REPORT_FIELDS.filter((field) =>
    selectedFieldsSet.has(field.key),
  )

  // Create header row
  const headers = orderedFields.map((field) => field.label)

  // Create data rows
  const rows = offers.map((offer) => {
    return orderedFields.map((field) => {
      const fieldKey = field.key
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
        case "submitterRole":
          return escapeCsvField(getSubmitterRoleFromData(offer))
        case "offerAmount":
          // Parse customQuestionsData if it's a JSON string
          let customQuestionsData = offer.customQuestionsData
          if (typeof customQuestionsData === "string") {
            try {
              customQuestionsData = JSON.parse(customQuestionsData)
            } catch {
              customQuestionsData = null
            }
          }
          const currency = (customQuestionsData as any)?.currency || "USD"
          return escapeCsvField(formatCurrency(offer.amount, currency))
        case "buyerType":
          return escapeCsvField(formatBuyerType(offer.buyerType))
        case "paymentWay":
          return escapeCsvField(formatPaymentWay(offer.paymentWay))
        case "conditional":
          return escapeCsvField(formatYesNo(isConditional(offer)))
        case "expires":
          return escapeCsvField(formatExpiry(offer))
        case "updatedAt":
          return escapeCsvField(
            offer.updatedAt ? formatDate(offer.updatedAt) : "N/A",
          )
        case "purchaseAgreement":
          return escapeCsvField(getPurchaseAgreementUrls(offer))
        case "purchaserName":
          return escapeCsvField(getPurchaserNames(offer))
        case "deposit":
          return escapeCsvField(getAllDepositInfo(offer.depositData, offer))
        case "settlementDate":
          return escapeCsvField(getAllSettlementInfo(offer.settlementDateData))
        case "subjectToLoan":
          return escapeCsvField(
            getAllSubjectToLoanInfo(offer.subjectToLoanApproval),
          )
        case "specialConditions":
          return escapeCsvField(
            getAllSpecialConditionsInfo(offer.specialConditions),
          )
        case "messageToAgent":
          return escapeCsvField(getAllMessageToAgentInfo(offer.messageToAgent))
        case "customQuestions":
          const customQuestions = getCustomQuestionsFromOffer(offer)
          return escapeCsvField(formatCustomQuestions(customQuestions))
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
