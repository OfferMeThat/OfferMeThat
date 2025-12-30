import { OFFER_STATUSES } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { OfferReportFieldKey } from "@/types/reportTypes"
import { jsPDF } from "jspdf"
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

// Teal color: #14b8a6 (tailwind teal-500)
const TEAL_COLOR = [20, 184, 166]
const BLACK_COLOR = [0, 0, 0]
const WHITE_COLOR = [255, 255, 255]
const GRAY_COLOR = [107, 114, 128]

/**
 * Formats a date string to a human-readable format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Formats a date with time
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const dateStr = formatDate(dateString)
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${dateStr} at ${timeStr}`
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
const formatBuyerType = (buyerType: string | null | undefined): string => {
  if (!buyerType) return "N/A"
  
  const trimmed = buyerType.trim()
  
  // Normalize: convert camelCase to snake_case for lookup
  const normalized = trimmed
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
  
  const buyerTypeLabels: Record<string, string> = {
    buyer: "Buyer",
    agent: "Agent",
    affiliate: "Affiliate",
    buyer_with_agent: "Buyer with Agent",
    buyer_self: "Unrepresented Buyer",
    buyers_agent: "Buyer's Agent",
    buyer_represented: "Represented Buyer",
  }
  // Try normalized first, then original trimmed
  if (buyerTypeLabels[normalized]) {
    return buyerTypeLabels[normalized]
  }
  if (buyerTypeLabels[trimmed]) {
    return buyerTypeLabels[trimmed]
  }
  // Fallback: convert snake_case to Title Case
  return normalized
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
 * Gets listing address from offer
 */
const getListingAddress = (offer: OfferWithListing): string => {
  if (offer.customListingAddress) {
    return offer.customListingAddress
  }
  return offer.listing?.address || "N/A"
}

/**
 * Gets field value for an offer
 */
const getFieldValue = (
  offer: OfferWithListing,
  fieldKey: OfferReportFieldKey,
): string => {
  switch (fieldKey) {
    case "received":
      return formatDate(offer.createdAt)
    case "status":
      return OFFER_STATUSES[offer.status]
    case "listingAddress":
      return getListingAddress(offer)
    case "submitterName":
      const firstName = offer.submitterFirstName || ""
      const lastName = offer.submitterLastName || ""
      return `${firstName} ${lastName}`.trim() || "N/A"
    case "submitterEmail":
      return offer.submitterEmail || "N/A"
    case "submitterPhone":
      return offer.submitterPhone || "N/A"
    case "submitterRole":
      return getSubmitterRoleFromData(offer)
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
      return formatCurrency(offer.amount, currency)
    case "buyerType":
      return formatBuyerType(offer.buyerType)
    case "paymentWay":
      return formatPaymentWay(offer.paymentWay)
    case "conditional":
      // Check if offer has special conditions or subject to loan approval
      const specialConditions = getAllSpecialConditionsInfo(
        offer.specialConditions,
      )
      const subjectToLoan = getAllSubjectToLoanInfo(offer.subjectToLoanApproval)
      const isConditional =
        (specialConditions &&
          specialConditions !== "N/A" &&
          specialConditions !== "No") ||
        (subjectToLoan &&
          subjectToLoan !== "N/A" &&
          subjectToLoan.startsWith("Yes")) ||
        offer.conditional === true
      return formatYesNo(isConditional)
    case "expires":
      if (!offer.expires) return "N/A"
      const dateStr = formatDate(offer.expires)
      const timeStr = offer.expiryTime || ""
      return timeStr ? `${dateStr} ${timeStr}` : dateStr
    case "updatedAt":
      return offer.updatedAt ? formatDateTime(offer.updatedAt) : "N/A"
    case "purchaseAgreement":
      return getPurchaseAgreementUrls(offer)
    case "purchaserName":
      return getPurchaserNamesFromData(offer.purchaserData)
    case "deposit":
      return getAllDepositInfo(offer.depositData, offer)
    case "settlementDate":
      return getAllSettlementInfo(offer.settlementDateData)
    case "subjectToLoan":
      return getAllSubjectToLoanInfo(offer.subjectToLoanApproval)
    case "specialConditions":
      return getAllSpecialConditionsInfo(offer.specialConditions)
    case "messageToAgent":
      return getAllMessageToAgentInfo(offer.messageToAgent)
    case "customQuestions":
      const customQuestions = getCustomQuestionsFromOffer(offer)
      return formatCustomQuestions(customQuestions)
    default:
      return "N/A"
  }
}

/**
 * Gets field label for display
 */
const getFieldLabel = (fieldKey: OfferReportFieldKey): string => {
  const labels: Record<OfferReportFieldKey, string> = {
    received: "Received",
    status: "Status",
    listingAddress: "Specify Listing",
    submitterName: "Submitter Name",
    submitterEmail: "Submitter Email",
    submitterPhone: "Submitter Phone",
    submitterRole: "Submitter Role",
    offerAmount: "Offer Amount",
    buyerType: "Buyer Type",
    paymentWay: "Payment Way",
    conditional: "Conditional",
    expires: "Offer Expires",
    updatedAt: "Last Updated",
    purchaseAgreement: "Purchase Agreement",
    purchaserName: "Purchaser Name(s)",
    deposit: "Deposit",
    settlementDate: "Settlement Date",
    subjectToLoan: "Subject to Loan",
    specialConditions: "Special Conditions",
    messageToAgent: "Message to Agent",
    customQuestions: "Custom Questions",
  }
  return labels[fieldKey] || fieldKey
}

/**
 * Draws a card for an offer
 */
const drawOfferCard = (
  doc: jsPDF,
  offer: OfferWithListing,
  offerNumber: number,
  x: number,
  y: number,
  width: number,
  height: number,
  selectedFields: OfferReportFieldKey[],
): void => {
  const cardPadding = 8
  const headerHeight = 20
  const contentStartY = y + headerHeight
  const contentAreaHeight = height - headerHeight

  // Draw card border (will be redrawn at the end to ensure it's on top)
  doc.setDrawColor(GRAY_COLOR[0], GRAY_COLOR[1], GRAY_COLOR[2])
  doc.setLineWidth(0.5)
  doc.rect(x, y, width, height)

  // Draw teal header
  doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
  doc.rect(x, y, width, headerHeight, "F")

  // Draw listing address in header (replacing "Offer 1", "Offer 2", etc.)
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const listingAddress = getListingAddress(offer)
  // Truncate address if too long to fit in header
  const maxAddressWidth = width - 2 * cardPadding
  const addressLines = doc.splitTextToSize(listingAddress, maxAddressWidth)
  doc.text(addressLines[0], x + cardPadding, y + headerHeight / 2 + 3)

  // Draw content background (white)
  doc.setFillColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.rect(x, contentStartY, width, height - headerHeight, "F")

  // Draw "Offer Information" heading
  doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Offer Information", x + cardPadding, contentStartY + 8)

  // Draw fields - show ALL selected fields (excluding listingAddress since it's in the header)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let currentY = contentStartY + 15

  // Show all selected fields - iterate through ALL of them (excluding listingAddress)
  const fieldsToDisplay = selectedFields.filter(
    (fieldKey) => fieldKey !== "listingAddress",
  )
  for (const fieldKey of fieldsToDisplay) {
    // Check if we're going to overflow the card before drawing
    if (currentY + 8 > y + height - cardPadding) {
      break // Stop drawing if we're out of space
    }

    const label = getFieldLabel(fieldKey)
    const value = getFieldValue(offer, fieldKey)

    // Handle text wrapping for long values
    const labelText = `${label}:`
    const labelWidth = doc.getTextWidth(labelText)
    const valueStartX = x + cardPadding + labelWidth + 2
    // Ensure we don't exceed card width - subtract padding from both sides
    // Leave at least 2mm margin on the right
    const availableWidth = Math.max(
      10,
      width - (valueStartX - x) - cardPadding - 2,
    )
    // Ensure value doesn't start outside the card
    const maxValueX = x + width - cardPadding - 2

    // Draw label - ensure it doesn't overflow
    doc.setTextColor(GRAY_COLOR[0], GRAY_COLOR[1], GRAY_COLOR[2])
    const maxLabelWidth = width - 2 * cardPadding
    const labelLines = doc.splitTextToSize(labelText, maxLabelWidth)
    doc.text(labelLines[0], x + cardPadding, currentY)

    // Draw value (bold) with text wrapping
    doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
    doc.setFont("helvetica", "bold")

    // Split long text into multiple lines if needed
    const lines = doc.splitTextToSize(value, availableWidth)
    let lineY = currentY
    for (let i = 0; i < lines.length; i++) {
      // Check bounds before drawing each line - ensure we stay within card
      if (lineY + 6 > y + height - cardPadding) {
        break // Stop if we're going to overflow vertically
      }
      // Ensure text doesn't exceed card boundaries horizontally
      const textWidth = doc.getTextWidth(lines[i])
      if (valueStartX + textWidth > maxValueX) {
        // If text is too wide, use splitTextToSize to ensure it fits
        const fittingLines = doc.splitTextToSize(lines[i], availableWidth)
        if (fittingLines.length > 0) {
          doc.text(fittingLines[0], valueStartX, lineY)
          // If there are more lines and we have space, continue
          if (
            fittingLines.length > 1 &&
            lineY + 5 <= y + height - cardPadding
          ) {
            lineY += 5
            doc.text(fittingLines[1], valueStartX, lineY)
          }
        }
        break
      } else {
        doc.text(lines[i], valueStartX, lineY)
      }
      if (i < lines.length - 1) {
        lineY += 5
      }
    }

    doc.setFont("helvetica", "normal")
    // Move to next field position (use the last line position)
    currentY = lineY + 5.5
  }
}

/**
 * Generates PDF report from selected offers
 */
export const generateOfferReportPDF = (
  offers: OfferWithListing[],
  selectedFields: OfferReportFieldKey[],
  userName?: string,
  listingAddress?: string,
): void => {
  if (offers.length === 0 || selectedFields.length === 0) {
    return
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - 2 * margin
  const contentStartY = 20

  // Calculate card dimensions
  // If there are many fields, use full page per offer (1 card per page)
  // Otherwise, use multiple cards per page
  const hasManyFields = selectedFields.length > 15

  let cardHeight: number
  let cardsPerRow: number
  let cardWidth: number
  const cardSpacing = 5

  if (hasManyFields) {
    // Full page per offer - use almost entire page height
    cardHeight = pageHeight - contentStartY - margin - 10
    cardsPerRow = 1
    cardWidth = contentWidth
  } else {
    // Adjust card height based on number of fields
    const baseCardHeight = 70
    const heightPerField = 5
    const estimatedCardHeight =
      baseCardHeight + selectedFields.length * heightPerField
    // Cap at reasonable maximum but allow more space
    cardHeight = Math.min(estimatedCardHeight, 150)

    // Use fewer cards per row if there are many fields
    cardsPerRow = selectedFields.length > 10 ? 2 : 3
    cardWidth = (contentWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow
  }

  let currentY = contentStartY
  let currentRow = 0
  let cardsInCurrentRow = 0

  // Generate header text (listing address removed since it's shown in each card header)
  let headerText = "Offer Report"
  if (userName) {
    headerText += ` - ${userName}`
  }

  // Draw header banner
  doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
  doc.rect(0, 0, pageWidth, 15, "F")
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(headerText, margin, 10)

  // Draw offer cards
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i]
    const offerNumber = i + 1

    // Check if we need a new page
    if (currentY + cardHeight > pageHeight - margin) {
      doc.addPage()
      // Redraw header on new page
      doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
      doc.rect(0, 0, pageWidth, 15, "F")
      doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(headerText, margin, 10)
      currentY = contentStartY
      currentRow = 0
      cardsInCurrentRow = 0
    }

    // Calculate card position
    const cardX = margin + cardsInCurrentRow * (cardWidth + cardSpacing)
    const cardY = currentY

    // Draw the card
    drawOfferCard(
      doc,
      offer,
      offerNumber,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      selectedFields,
    )

    // Move to next position
    cardsInCurrentRow++
    if (cardsInCurrentRow >= cardsPerRow) {
      cardsInCurrentRow = 0
      currentRow++
      currentY += cardHeight + cardSpacing
    }
  }

  // Save the PDF
  const today = new Date()
  const dateString = today.toISOString().split("T")[0]
  const filename = `offers-report-${dateString}.pdf`
  doc.save(filename)
}
