import { jsPDF } from "jspdf"
import { LISTING_STATUSES } from "@/constants/listings"
import { ListingWithOfferCounts } from "@/types/listing"
import { ReportFieldKey } from "@/types/reportTypes"
import { formatDateLong } from "./reportUtils"

// Teal color: #14b8a6 (tailwind teal-500)
const TEAL_COLOR = [20, 184, 166]
const BLACK_COLOR = [0, 0, 0]
const WHITE_COLOR = [255, 255, 255]
const GRAY_COLOR = [107, 114, 128]

const formatDate = formatDateLong

/**
 * Gets field value for a listing
 */
const getFieldValue = (
  listing: ListingWithOfferCounts,
  fieldKey: ReportFieldKey,
): string => {
  switch (fieldKey) {
    case "address":
      return listing.address
    case "dateListed":
      return formatDate(listing.createdAt)
    case "status":
      return LISTING_STATUSES[listing.status]
    case "pendingOffers":
      return String(listing.pendingOffers)
    case "activeOffers":
      return String(listing.activeOffers)
    case "totalOffers":
      return String(listing.totalOffers)
    case "numberOfLeads":
      return "1"
    default:
      return "N/A"
  }
}

/**
 * Gets field label for display
 */
const getFieldLabel = (fieldKey: ReportFieldKey): string => {
  const labels: Record<ReportFieldKey, string> = {
    address: "Address",
    dateListed: "Date Listed",
    status: "Status",
    pendingOffers: "Pending Offers",
    activeOffers: "Active Offers",
    totalOffers: "Total Offers",
    numberOfLeads: "Number of Leads",
  }
  return labels[fieldKey] || fieldKey
}

/**
 * Draws a card for a listing
 */
const drawListingCard = (
  doc: jsPDF,
  listing: ListingWithOfferCounts,
  listingNumber: number,
  x: number,
  y: number,
  width: number,
  height: number,
  selectedFields: ReportFieldKey[],
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
  doc.text(
    `Listing ${listingNumber}`,
    x + cardPadding,
    y + headerHeight / 2 + 3,
  )

  doc.setFillColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.rect(x, contentStartY, width, height - headerHeight, "F")

  doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Listing Information", x + cardPadding, contentStartY + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  let currentY = contentStartY + 15

  for (const fieldKey of selectedFields) {
    if (currentY + 8 > y + height - cardPadding) break // Don't overflow card

    const label = getFieldLabel(fieldKey)
    const value = getFieldValue(listing, fieldKey)

    const labelText = `${label}:`
    const labelWidth = doc.getTextWidth(labelText)
    const valueStartX = x + cardPadding + labelWidth + 2
    const availableWidth = width - (valueStartX - x) - cardPadding

    doc.setTextColor(GRAY_COLOR[0], GRAY_COLOR[1], GRAY_COLOR[2])
    doc.text(labelText, x + cardPadding, currentY)

    doc.setTextColor(BLACK_COLOR[0], BLACK_COLOR[1], BLACK_COLOR[2])
    doc.setFont("helvetica", "bold")
    
    const lines = doc.splitTextToSize(value, availableWidth)
    for (let i = 0; i < lines.length; i++) {
      if (currentY + 8 > y + height - cardPadding) break
      doc.text(lines[i], valueStartX, currentY)
      if (i < lines.length - 1) {
        currentY += 5
      }
    }

    doc.setFont("helvetica", "normal")
    currentY += 5.5
  }
}

/**
 * Generates PDF report from selected listings
 */
export const generateListingReportPDF = (
  listings: ListingWithOfferCounts[],
  selectedFields: ReportFieldKey[],
  userName?: string,
): void => {
  if (listings.length === 0 || selectedFields.length === 0) {
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

  const baseCardHeight = 70
  const heightPerField = 5
  const estimatedCardHeight = baseCardHeight + selectedFields.length * heightPerField
  const cardHeight = Math.min(estimatedCardHeight, 120)

  const cardsPerRow = selectedFields.length > 7 ? 2 : 3
  const cardSpacing = 5
  const cardWidth = (contentWidth - (cardsPerRow - 1) * cardSpacing) / cardsPerRow

  let currentY = contentStartY
  let currentRow = 0
  let cardsInCurrentRow = 0

  let headerText = "Listing Report"
  if (userName) {
    headerText += ` - ${userName}`
  }

  doc.setFillColor(TEAL_COLOR[0], TEAL_COLOR[1], TEAL_COLOR[2])
  doc.rect(0, 0, pageWidth, 15, "F")
  doc.setTextColor(WHITE_COLOR[0], WHITE_COLOR[1], WHITE_COLOR[2])
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(headerText, margin, 10)

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i]
    const listingNumber = i + 1

    if (currentY + cardHeight > pageHeight - margin) {
      doc.addPage()
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

    const cardX = margin + cardsInCurrentRow * (cardWidth + cardSpacing)
    const cardY = currentY

    drawListingCard(
      doc,
      listing,
      listingNumber,
      cardX,
      cardY,
      cardWidth,
      cardHeight,
      selectedFields,
    )

    cardsInCurrentRow++
    if (cardsInCurrentRow >= cardsPerRow) {
      cardsInCurrentRow = 0
      currentRow++
      currentY += cardHeight + cardSpacing
    }
  }

  const today = new Date()
  const dateString = today.toISOString().split("T")[0]
  const filename = `listings-report-${dateString}.pdf`
  doc.save(filename)
}

