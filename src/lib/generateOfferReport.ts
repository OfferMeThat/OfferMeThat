import { OFFER_STATUSES } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { OFFER_REPORT_FIELDS, OfferReportFieldKey } from "@/types/reportTypes"

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
  if (!offer.purchaserData) return "N/A"

  const data = offer.purchaserData as any

  // Single field method
  if (data.method === "single_field" && data.name) {
    return data.name
  }

  // Individual names method
  if (data.method === "individual_names" && data.nameFields) {
    const names = Object.values(data.nameFields).map((nameData: any) => {
      return [nameData.firstName, nameData.middleName, nameData.lastName]
        .filter(Boolean)
        .join(" ")
    })
    return names.join(", ")
  }

  return "N/A"
}

/**
 * Gets deposit amount from depositData
 */
const getDepositAmount = (offer: OfferWithListing): string => {
  if (!offer.depositData) return "N/A"

  const data = offer.depositData as any

  // Check for multiple instalments
  if (data.instalment_1 || data.instalment_2 || data.instalment_3) {
    return "Multiple instalments"
  }

  // Single instalment - amount
  if (data.depositType === "amount" || data.amount) {
    return formatCurrency(data.amount)
  }

  // Single instalment - percentage
  if (data.depositType === "percentage" || data.percentage) {
    return `${data.percentage}% of purchase price`
  }

  return "N/A"
}

/**
 * Gets deposit due date from depositData
 */
const getDepositDue = (offer: OfferWithListing): string => {
  if (!offer.depositData) return "N/A"

  const data = offer.depositData as any

  // Check for multiple instalments
  if (data.instalment_1 || data.instalment_2 || data.instalment_3) {
    return "See deposit details"
  }

  // Text description
  if (data.depositDueText) {
    return data.depositDueText
  }

  // Specific date
  if (data.depositDue) {
    return formatDate(data.depositDue)
  }

  // Within X days
  if (data.depositDueWithin) {
    const { number, unit } = data.depositDueWithin
    return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
  }

  return "N/A"
}

/**
 * Gets settlement date from settlementDateData
 */
const getSettlementDate = (offer: OfferWithListing): string => {
  if (!offer.settlementDateData) return "N/A"

  const data = offer.settlementDateData as any

  // Text description
  if (data.settlementDateText) {
    return data.settlementDateText
  }

  // Date and time
  if (data.settlementDateTime) {
    return formatDate(data.settlementDateTime)
  }

  // Date with optional time
  if (data.settlementDate) {
    const dateStr = formatDate(data.settlementDate)
    return data.settlementTime
      ? `${dateStr} at ${data.settlementTime}`
      : dateStr
  }

  // Within X days
  if (data.settlementDateWithin) {
    const { number, unit } = data.settlementDateWithin
    return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
  }

  return "N/A"
}

/**
 * Gets subject to loan approval status
 */
const getSubjectToLoan = (offer: OfferWithListing): string => {
  if (!offer.subjectToLoanApproval) return "N/A"

  const data = offer.subjectToLoanApproval as any
  const isSubjectToLoan =
    data.subjectToLoanApproval === "yes" || data.subjectToLoanApproval === true

  return isSubjectToLoan ? "Yes" : "No"
}

/**
 * Gets special conditions text
 */
const getSpecialConditions = (offer: OfferWithListing): string => {
  return offer.specialConditions || "N/A"
}

/**
 * Gets message to agent text
 */
const getMessageToAgent = (offer: OfferWithListing): string => {
  if (!offer.messageToAgent) return "N/A"

  // Handle string message
  if (typeof offer.messageToAgent === "string") {
    return offer.messageToAgent
  }

  // Handle object message
  const data = offer.messageToAgent as any
  return data.message || data.text || "N/A"
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
        case "offerAmount":
          return escapeCsvField(
            formatCurrency(
              offer.amount,
              (offer.customQuestionsData as any)?.currency || "USD",
            ),
          )
        case "buyerType":
          return escapeCsvField(formatBuyerType(offer.buyerType))
        case "paymentWay":
          return escapeCsvField(formatPaymentWay(offer.paymentWay))
        case "conditional":
          return escapeCsvField(formatYesNo(offer.conditional))
        case "expires":
          return escapeCsvField(formatExpiry(offer))
        case "updatedAt":
          return escapeCsvField(
            offer.updatedAt ? formatDate(offer.updatedAt) : "N/A",
          )
        case "hasPurchaseAgreement":
          // Helper to parse purchaseAgreementFileUrl (can be single URL string or JSON array)
          const parsePurchaseAgreementUrls = (
            value: string | null | undefined,
          ): string[] => {
            if (!value) return []
            try {
              const parsed = JSON.parse(value)
              if (Array.isArray(parsed)) {
                return parsed.filter((url) => typeof url === "string")
              }
            } catch {
              // Not JSON, treat as single URL string
            }
            return [value]
          }
          const purchaseAgreementUrls = parsePurchaseAgreementUrls(
            offer.purchaseAgreementFileUrl,
          )
          return escapeCsvField(
            formatYesNo(purchaseAgreementUrls.length > 0),
          )
        case "purchaserName":
          return escapeCsvField(getPurchaserNames(offer))
        case "depositAmount":
          return escapeCsvField(getDepositAmount(offer))
        case "depositDue":
          return escapeCsvField(getDepositDue(offer))
        case "settlementDate":
          return escapeCsvField(getSettlementDate(offer))
        case "subjectToLoan":
          return escapeCsvField(getSubjectToLoan(offer))
        case "specialConditions":
          return escapeCsvField(getSpecialConditions(offer))
        case "messageToAgent":
          return escapeCsvField(getMessageToAgent(offer))
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
