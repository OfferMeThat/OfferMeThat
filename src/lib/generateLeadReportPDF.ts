import { LeadWithListing } from "@/types/lead"
import { LeadReportFieldKey } from "@/types/reportTypes"
import { jsPDF } from "jspdf"
import {
  formatCustomQuestions,
  getAllMessageToAgentInfo,
  getCustomQuestionsFromLead,
  getListingAddress,
  getOpinionOfSalePrice,
  getSubmitterName,
} from "./parseLeadDataForReports"
import { formatDateLong } from "./reportUtils"

const TEAL_COLOR = [20, 184, 166]
const BLACK_COLOR = [0, 0, 0]
const WHITE_COLOR = [255, 255, 255]
const GRAY_COLOR = [107, 114, 128]

const formatDate = formatDateLong

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

const getFieldValue = (
  lead: LeadWithListing,
  fieldKey: LeadReportFieldKey,
): string => {
  switch (fieldKey) {
    case "received":
      return formatDate(lead.createdAt)
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
      return getOpinionOfSalePrice(lead.opinionOfSalePrice)
    case "messageToAgent":
      return getAllMessageToAgentInfo(lead.messageToAgent)
    case "customQuestions":
      const customQuestions = getCustomQuestionsFromLead(lead)
      return formatCustomQuestions(customQuestions)
    default:
      return "N/A"
  }
}

const getFieldLabel = (fieldKey: LeadReportFieldKey): string => {
  const labels: Record<LeadReportFieldKey, string> = {
    received: "Received",
    submitterName: "Submitter Name",
    submitterEmail: "Submitter Email",
    submitterPhone: "Submitter Phone",
    submitterRole: "Submitter Role",
    areYouInterested: "Interested",
    financeInterest: "Finance Interest",
    followAllListings: "Follow All Listings",
    opinionOfSalePrice: "Opinion of Sale Price",
    messageToAgent: "Message to Agent",
    customQuestions: "Custom Questions",
  }
  return labels[fieldKey] || fieldKey
}

const drawLeadCard = (
  doc: jsPDF,
  lead: LeadWithListing,
  x: number,
  y: number,
  width: number,
  height: number,
  selectedFields: LeadReportFieldKey[],
): void => {
  const cardPadding = 8
  const headerHeight = 20
  const contentStartY = y + headerHeight

  doc.setDrawColor(GRAY_COLOR[0], GRAY_COLOR[1], GRAY_COLOR[2])
  doc.setLineWidth(0.5)
  doc.rect(x, y, width, height)

  doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
  doc.rect(x, y, width, headerHeight, "F")

  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const listingAddress = getListingAddress(lead)
  const maxAddressWidth = width - 2 * cardPadding
  const addressLines = doc.splitTextToSize(listingAddress, maxAddressWidth)
  doc.text(addressLines[0], x + cardPadding, y + headerHeight / 2 + 3)

  doc.setFillColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.rect(x, contentStartY, width, height - headerHeight, "F")

  doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Lead Information", x + cardPadding, contentStartY + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let currentY = contentStartY + 15

  for (const fieldKey of selectedFields) {
    if (currentY + 8 > y + height - cardPadding) {
      break
    }

    const label = getFieldLabel(fieldKey)
    const value = getFieldValue(lead, fieldKey)

    const labelText = `${label}:`
    const labelWidth = doc.getTextWidth(labelText)
    const valueStartX = x + cardPadding + labelWidth + 2
    const availableWidth = Math.max(
      10,
      width - (valueStartX - x) - cardPadding - 2,
    )
    const maxValueX = x + width - cardPadding - 2

    doc.setTextColor(GRAY_COLOR[0], GRAY_COLOR[1], GRAY_COLOR[2])
    const maxLabelWidth = width - 2 * cardPadding
    const labelLines = doc.splitTextToSize(labelText, maxLabelWidth)
    doc.text(labelLines[0], x + cardPadding, currentY)

    doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
    doc.setFont("helvetica", "bold")

    const lines = doc.splitTextToSize(value, availableWidth)
    let lineY = currentY
    for (let i = 0; i < lines.length; i++) {
      if (lineY + 6 > y + height - cardPadding) {
        break
      }
      const textWidth = doc.getTextWidth(lines[i])
      if (valueStartX + textWidth > maxValueX) {
        const fittingLines = doc.splitTextToSize(lines[i], availableWidth)
        if (fittingLines.length > 0) {
          doc.text(fittingLines[0], valueStartX, lineY)
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
    currentY = lineY + 5.5
  }
}

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

  const cardsPerRow = 2
  const cardSpacing = 5
  const cardWidth =
    (contentWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow

  const availableHeight = pageHeight - contentStartY - margin
  const baseCardHeight = 70
  const heightPerField = 5
  const estimatedCardHeight =
    baseCardHeight + selectedFields.length * heightPerField
  const cardHeight = Math.min(estimatedCardHeight, availableHeight)

  let currentY = contentStartY
  let cardsInCurrentRow = 0

  let headerText = "Lead Report"
  if (userName) {
    headerText += ` - ${userName}`
  }

  doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
  doc.rect(0, 0, pageWidth, 15, "F")
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(headerText, margin, 10)

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]

    if (currentY + cardHeight > pageHeight - margin) {
      doc.addPage()
      doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
      doc.rect(0, 0, pageWidth, 15, "F")
      doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(headerText, margin, 10)
      currentY = contentStartY
      cardsInCurrentRow = 0
    }

    const cardX = margin + cardsInCurrentRow * (cardWidth + cardSpacing)
    const cardY = currentY

    drawLeadCard(doc, lead, cardX, cardY, cardWidth, cardHeight, selectedFields)

    cardsInCurrentRow++
    if (cardsInCurrentRow >= cardsPerRow) {
      cardsInCurrentRow = 0
      currentY += cardHeight + cardSpacing
    }
  }

  const today = new Date()
  const dateString = today.toISOString().split("T")[0]
  const filename = `leads-report-${dateString}.pdf`
  doc.save(filename)
}
