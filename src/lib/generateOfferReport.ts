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
import { escapeCsvField, formatCurrency, formatDate } from "./reportUtils"

/**
 * Formats buyer type enum to readable string
 */
const formatBuyerType = (buyerType: string): string => {
  const buyerTypeLabels: Record<string, string> = {
    buyer: "Buyer",
    agent: "Agent",
    affiliate: "Affiliate",
    buyer_with_agent: "Buyer with Agent",
    buyer_self: "Unrepresented Buyer",
    buyers_agent: "Buyer's Agent",
    buyer_represented: "Represented Buyer",
  }
  if (buyerTypeLabels[buyerType]) {
    return buyerTypeLabels[buyerType]
  }
  return buyerType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
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
  const specialConditions = getAllSpecialConditionsInfo(offer.specialConditions)
  if (
    specialConditions &&
    specialConditions !== "N/A" &&
    specialConditions !== "No"
  ) {
    return true
  }

  const subjectToLoan = getAllSubjectToLoanInfo(offer.subjectToLoanApproval)
  if (
    subjectToLoan &&
    subjectToLoan !== "N/A" &&
    subjectToLoan.startsWith("Yes")
  ) {
    return true
  }

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
 * Generates CSV content from selected offers and fields
 */
export const generateOfferReport = (
  offers: OfferWithListing[],
  selectedFields: OfferReportFieldKey[],
): string => {
  if (offers.length === 0 || selectedFields.length === 0) {
    return ""
  }

  const selectedFieldsSet = new Set(selectedFields)

  const orderedFields = OFFER_REPORT_FIELDS.filter((field) =>
    selectedFieldsSet.has(field.key),
  )

  const headers = orderedFields.map((field) => field.label)

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
