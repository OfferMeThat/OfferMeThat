import { LISTING_STATUSES } from "@/constants/listings"
import { ListingWithOfferCounts } from "@/types/listing"
import { ReportFieldKey } from "@/types/reportTypes"
import { escapeCsvField, formatDate } from "./reportUtils"

/**
 * Generates CSV content from selected listings and fields
 */
export const generateListingReport = (
  listings: ListingWithOfferCounts[],
  selectedFields: ReportFieldKey[],
): string => {
  if (listings.length === 0 || selectedFields.length === 0) {
    return ""
  }

  const headers = selectedFields.map((fieldKey) => {
    const fieldLabels: Record<ReportFieldKey, string> = {
      address: "Address",
      dateListed: "Date Listed",
      status: "Status",
      pendingOffers: "Pending Offers",
      activeOffers: "Active Offers",
      totalOffers: "Total Offers",
      numberOfLeads: "Number of Leads",
    }
    return fieldLabels[fieldKey]
  })

  const rows = listings.map((listing) => {
    return selectedFields.map((fieldKey) => {
      switch (fieldKey) {
        case "address":
          return escapeCsvField(listing.address)
        case "dateListed":
          return escapeCsvField(formatDate(listing.createdAt))
        case "status":
          return escapeCsvField(LISTING_STATUSES[listing.status])
        case "pendingOffers":
          return escapeCsvField(listing.pendingOffers)
        case "activeOffers":
          return escapeCsvField(listing.activeOffers)
        case "totalOffers":
          return escapeCsvField(listing.totalOffers)
        case "numberOfLeads":
          return escapeCsvField(1)
        default:
          return ""
      }
    })
  })

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

  return csvContent
}

/**
 * Triggers a CSV file download in the browser
 */
export const downloadCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Generates a filename for the report with current date
 */
export const generateReportFilename = (): string => {
  const today = new Date()
  const dateString = today.toISOString().split("T")[0] // YYYY-MM-DD format
  return `listings-report-${dateString}.csv`
}
