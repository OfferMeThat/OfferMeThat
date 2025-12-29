import { LeadWithListing } from "@/types/lead"
import { LeadReportFieldKey } from "@/types/reportTypes"
import { jsPDF } from "jspdf"
import {
  formatCustomQuestions,
  getAllMessageToAgentInfo,
  getCustomQuestionsFromLead,
  getListingAddress,
  getSubmitterName,
} from "./parseLeadDataForReports"
// Note: formatLeadData.tsx contains React components, so we'll define formatting functions here
const formatSubmitterRole = (role: string | null | undefined): string => {
  if (!role) return "N/A"
  if (role === "buyerSelf") return "Lead"
  if (role === "buyerWithAgent") return "Lead & Agent"
  if (role === "buyersAgent") return "Agent"
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

const formatAreYouInterested = (
  interested: string | null | undefined,
): string => {
  if (!interested) return "N/A"
  if (interested === "yesVeryInterested") return "Yes, very interested"
  if (interested === "yes") return "Yes"
  if (interested === "no") return "No"
  if (interested === "maybe") return "Maybe"
  return interested
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const formatFollowAllListings = (follow: string | null | undefined): string => {
  if (!follow) return "N/A"
  if (follow === "thisAndFuture")
    return "Yes, follow this listing and all future listings"
  if (follow === "thisOnly") return "Yes, follow this listing only"
  return follow
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const formatFinanceInterest = (interest: string | null | undefined): string => {
  if (!interest) return "N/A"
  return interest.charAt(0).toUpperCase() + interest.slice(1)
}

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
 * Gets field value for a lead
 */
const getFieldValue = (
  lead: LeadWithListing,
  fieldKey: LeadReportFieldKey,
): string => {
  switch (fieldKey) {
    case "received":
      return formatDate(lead.createdAt)
    case "listingAddress":
      return getListingAddress(lead)
    case "submitterName":
      return getSubmitterName(lead)
    case "submitterEmail":
      return lead.submitterEmail || "N/A"
    case "submitterPhone":
      return lead.submitterPhone || "N/A"
    case "submitterRole":
      return formatSubmitterRole(lead.submitterRole)
    case "areYouInterested":
      return formatAreYouInterested(lead.areYouInterested)
    case "financeInterest":
      return formatFinanceInterest(lead.financeInterest)
    case "followAllListings":
      return formatFollowAllListings(lead.followAllListings)
    case "opinionOfSalePrice":
      if (!lead.opinionOfSalePrice) return "N/A"
      try {
        const parsed = JSON.parse(lead.opinionOfSalePrice)
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "amount" in parsed
        ) {
          const amount = parsed.amount
          const currency = parsed.currency || "USD"
          if (amount === "" || amount === null || amount === undefined) {
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
    case "buyerAgentName":
      return lead.buyerAgentName || "N/A"
    case "buyerAgentEmail":
      return lead.buyerAgentEmail || "N/A"
    case "buyerAgentCompany":
      return lead.buyerAgentCompany || "N/A"
    case "agentCompany":
      return lead.agentCompany || "N/A"
    case "messageToAgent":
      return getAllMessageToAgentInfo(lead.messageToAgent)
    case "customQuestions":
      const customQuestions = getCustomQuestionsFromLead(lead)
      return formatCustomQuestions(customQuestions)
    default:
      return "N/A"
  }
}

/**
 * Gets field label for display
 */
const getFieldLabel = (fieldKey: LeadReportFieldKey): string => {
  const labels: Record<LeadReportFieldKey, string> = {
    received: "Received",
    listingAddress: "Listing",
    submitterName: "Submitter Name",
    submitterEmail: "Submitter Email",
    submitterPhone: "Submitter Phone",
    submitterRole: "Submitter Role",
    areYouInterested: "Interested",
    financeInterest: "Finance Interest",
    followAllListings: "Follow All Listings",
    opinionOfSalePrice: "Opinion of Sale Price",
    buyerAgentName: "Buyer Agent Name",
    buyerAgentEmail: "Buyer Agent Email",
    buyerAgentCompany: "Buyer Agent Company",
    agentCompany: "Agent Company",
    messageToAgent: "Message to Agent",
    customQuestions: "Custom Questions",
  }
  return labels[fieldKey] || fieldKey
}

/**
 * Draws a card for a lead
 */
const drawLeadCard = (
  doc: jsPDF,
  lead: LeadWithListing,
  leadNumber: number,
  x: number,
  y: number,
  width: number,
  height: number,
  selectedFields: LeadReportFieldKey[],
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

  // Draw lead number in header
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`Lead ${leadNumber}`, x + cardPadding, y + headerHeight / 2 + 3)

  // Draw content background (white)
  doc.setFillColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.rect(x, contentStartY, width, height - headerHeight, "F")

  // Draw "Lead Information" heading
  doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Lead Information", x + cardPadding, contentStartY + 8)

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
    const value = getFieldValue(lead, fieldKey)

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
 * Generates PDF report from selected leads
 */
export const generateLeadReportPDF = (
  leads: LeadWithListing[],
  selectedFields: LeadReportFieldKey[],
  userName?: string,
): void => {
  if (leads.length === 0 || selectedFields.length === 0) {
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
  // If there are many fields, use full page per lead (1 card per page)
  // Otherwise, use multiple cards per page
  const hasManyFields = selectedFields.length > 15

  let cardHeight: number
  let cardsPerRow: number
  let cardWidth: number
  const cardSpacing = 5

  if (hasManyFields) {
    // Full page per lead - use almost entire page height
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

  // Generate header text
  let headerText = "Lead Report"
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

  // Draw lead cards
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const leadNumber = i + 1

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
    drawLeadCard(
      doc,
      lead,
      leadNumber,
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
  const filename = `leads-report-${dateString}.pdf`
  doc.save(filename)
}
