import { OFFER_STATUSES } from "@/constants/offers"
import { OfferWithListing } from "@/types/offer"
import { OfferReportFieldKey } from "@/types/reportTypes"
import { jsPDF } from "jspdf"

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
    case "offerAmount":
      return formatCurrency(
        offer.amount,
        (offer.customQuestionsData as any)?.currency || "USD",
      )
    case "buyerType":
      return formatBuyerType(offer.buyerType)
    case "paymentWay":
      return formatPaymentWay(offer.paymentWay)
    case "conditional":
      return formatYesNo(offer.conditional)
    case "expires":
      if (!offer.expires) return "N/A"
      const dateStr = formatDate(offer.expires)
      const timeStr = offer.expiryTime || ""
      return timeStr ? `${dateStr} ${timeStr}` : dateStr
    case "updatedAt":
      return offer.updatedAt ? formatDateTime(offer.updatedAt) : "N/A"
    case "hasPurchaseAgreement":
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
      return formatYesNo(purchaseAgreementUrls.length > 0)
    case "purchaserName":
      if (!offer.purchaserData) return "N/A"
      const data = offer.purchaserData as any
      if (data.method === "single_field" && data.name) {
        return data.name
      }
      if (data.method === "individual_names" && data.nameFields) {
        const names = Object.values(data.nameFields).map((nameData: any) => {
          return [nameData.firstName, nameData.middleName, nameData.lastName]
            .filter(Boolean)
            .join(" ")
        })
        return names.join(", ")
      }
      return "N/A"
    case "depositAmount":
      if (!offer.depositData) return "N/A"
      const depositData = offer.depositData as any

      // Check for multiple instalments in structured format
      if (
        depositData.instalment_1 ||
        depositData.instalment_2 ||
        depositData.instalment_3
      ) {
        return "Multiple instalments"
      }

      // Check for multiple instalments in raw form data format
      if (
        depositData.deposit_amount_1 ||
        depositData.deposit_amount_2 ||
        depositData.deposit_amount_3 ||
        depositData.deposit_percentage_1 ||
        depositData.deposit_percentage_2 ||
        depositData.deposit_percentage_3
      ) {
        // Count how many instalments have data
        let instalmentCount = 0
        for (let i = 1; i <= 3; i++) {
          if (
            depositData[`deposit_amount_${i}`] ||
            depositData[`deposit_percentage_${i}`] ||
            depositData[`deposit_type_instalment_${i}`]
          ) {
            instalmentCount++
          }
        }
        if (instalmentCount > 1) {
          return "Multiple instalments"
        }
      }

      // Single instalment - structured format
      if (depositData.depositType === "amount" || depositData.amount) {
        return formatCurrency(depositData.amount, depositData.currency || "USD")
      }
      if (depositData.depositType === "percentage" || depositData.percentage) {
        return `${depositData.percentage}% of purchase price`
      }

      // Single instalment - raw form data format
      const amount = depositData.deposit_amount || depositData.deposit_amount_1
      const percentage =
        depositData.deposit_percentage || depositData.deposit_percentage_1
      const currency =
        depositData.deposit_amount_currency ||
        depositData.deposit_amount_1_currency ||
        "USD"

      if (amount !== undefined && amount !== null && amount !== "") {
        const parsedAmount =
          typeof amount === "number" ? amount : parseFloat(String(amount))
        if (!isNaN(parsedAmount)) {
          return formatCurrency(parsedAmount, currency)
        }
      }

      if (
        percentage !== undefined &&
        percentage !== null &&
        percentage !== ""
      ) {
        const parsedPercentage =
          typeof percentage === "number"
            ? percentage
            : parseFloat(String(percentage))
        if (!isNaN(parsedPercentage)) {
          return `${parsedPercentage}% of purchase price`
        }
      }

      return "N/A"
    case "depositDue":
      if (!offer.depositData) return "N/A"
      const depositDueData = offer.depositData as any

      // Check for multiple instalments in structured format
      if (
        depositDueData.instalment_1 ||
        depositDueData.instalment_2 ||
        depositDueData.instalment_3
      ) {
        return "See deposit details"
      }

      // Check for multiple instalments in raw form data format
      if (
        depositDueData.deposit_due_1 ||
        depositDueData.deposit_due_2 ||
        depositDueData.deposit_due_3 ||
        depositDueData.deposit_due_instalment_1 ||
        depositDueData.deposit_due_instalment_2 ||
        depositDueData.deposit_due_instalment_3
      ) {
        return "See deposit details"
      }

      // Single instalment - structured format
      if (depositDueData.depositDueText) {
        return depositDueData.depositDueText
      }
      if (depositDueData.depositDue) {
        return formatDate(depositDueData.depositDue)
      }
      if (depositDueData.depositDueWithin) {
        const { number, unit } = depositDueData.depositDueWithin
        return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
      }

      // Single instalment - raw form data format
      const due = depositDueData.deposit_due || depositDueData.deposit_due_1
      if (due) {
        if (typeof due === "string" && due.trim() !== "") {
          // Try to parse as date
          const date = new Date(due)
          if (!isNaN(date.getTime())) {
            return formatDate(due)
          }
          // Otherwise return as text
          return due
        }
      }

      // Check for "within X days" format in raw form data
      const dueNumber =
        depositDueData.deposit_due || depositDueData.deposit_due_1
      const dueUnit =
        depositDueData.deposit_due_unit || depositDueData.deposit_due_1_unit
      if (dueNumber && dueUnit) {
        const parsedNumber =
          typeof dueNumber === "number"
            ? dueNumber
            : parseFloat(String(dueNumber))
        if (!isNaN(parsedNumber)) {
          return `Within ${parsedNumber} ${dueUnit.replace(/_/g, " ")} of offer acceptance`
        }
      }

      return "N/A"
    case "settlementDate":
      if (!offer.settlementDateData) return "N/A"
      const settlementData = offer.settlementDateData as any
      if (settlementData.settlementDateText) {
        return settlementData.settlementDateText
      }
      if (settlementData.settlementDateTime) {
        return formatDate(settlementData.settlementDateTime)
      }
      if (settlementData.settlementDate) {
        const dateStr = formatDate(settlementData.settlementDate)
        return settlementData.settlementTime
          ? `${dateStr} at ${settlementData.settlementTime}`
          : dateStr
      }
      if (settlementData.settlementDateWithin) {
        const { number, unit } = settlementData.settlementDateWithin
        return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
      }
      return "N/A"
    case "subjectToLoan":
      if (!offer.subjectToLoanApproval) return "N/A"
      const loanData = offer.subjectToLoanApproval as any
      const isSubjectToLoan =
        loanData.subjectToLoanApproval === "yes" ||
        loanData.subjectToLoanApproval === true
      return isSubjectToLoan ? "Yes" : "No"
    case "specialConditions":
      if (!offer.specialConditions) return "N/A"
      // Check if specialConditions has any content (could be string or object)
      if (typeof offer.specialConditions === "string") {
        return offer.specialConditions.trim() ? "Yes" : "N/A"
      }
      // If it's an object, check if it has any meaningful data
      const conditionsData = offer.specialConditions as any
      if (
        (conditionsData.selectedConditions &&
          conditionsData.selectedConditions.length > 0) ||
        (conditionsData.conditionAttachmentUrls &&
          Object.keys(conditionsData.conditionAttachmentUrls).length > 0) ||
        (conditionsData.text && conditionsData.text.trim())
      ) {
        return "Yes"
      }
      return "N/A"
    case "messageToAgent":
      if (!offer.messageToAgent) return "N/A"
      if (typeof offer.messageToAgent === "string") {
        return offer.messageToAgent
      }
      const messageData = offer.messageToAgent as any
      return messageData.message || messageData.text || "N/A"
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
    offerAmount: "Offer Amount",
    buyerType: "Buyer Type",
    paymentWay: "Payment Way",
    conditional: "Conditional",
    expires: "Offer Expires",
    updatedAt: "Last Updated",
    hasPurchaseAgreement: "Purchase Agreement",
    purchaserName: "Purchaser Name(s)",
    depositAmount: "Deposit Amount",
    depositDue: "Deposit Due",
    settlementDate: "Settlement Date",
    subjectToLoan: "Subject to Loan",
    specialConditions: "Special Conditions",
    messageToAgent: "Message to Agent",
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

  // Draw offer number in header
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`Offer ${offerNumber}`, x + cardPadding, y + headerHeight / 2 + 3)

  // Draw content background (white)
  doc.setFillColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.rect(x, contentStartY, width, height - headerHeight, "F")

  // Draw "Offer Information" heading
  doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Offer Information", x + cardPadding, contentStartY + 8)

  // Draw fields - show ALL selected fields
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let currentY = contentStartY + 15

  // Show all selected fields - iterate through ALL of them
  for (const fieldKey of selectedFields) {
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
  // Adjust card height based on number of fields (minimum 70mm, add 5mm per field)
  const baseCardHeight = 70
  const heightPerField = 5
  const estimatedCardHeight =
    baseCardHeight + selectedFields.length * heightPerField
  // Cap at reasonable maximum to ensure cards fit on page, but allow more space
  const cardHeight = Math.min(estimatedCardHeight, 120)

  // Use fewer cards per row if there are many fields to give each card more space
  const cardsPerRow = selectedFields.length > 10 ? 2 : 3
  const cardSpacing = 5
  const cardWidth =
    (contentWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow

  let currentY = contentStartY
  let currentRow = 0
  let cardsInCurrentRow = 0

  // Generate header text
  let headerText = "Offer Report"
  if (userName) {
    headerText += ` - ${userName}`
  }
  if (listingAddress) {
    headerText += ` - ${listingAddress}`
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
