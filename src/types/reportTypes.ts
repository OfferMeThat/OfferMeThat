import { ListingWithOfferCounts } from "./listing"
import { OfferWithListing } from "./offer"

export type ReportFieldKey =
  | "address"
  | "dateListed"
  | "status"
  | "pendingOffers"
  | "activeOffers"
  | "totalOffers"
  | "numberOfLeads"

export type ReportField = {
  key: ReportFieldKey
  label: string
}

export const REPORT_FIELDS: ReportField[] = [
  { key: "address", label: "Address" },
  { key: "dateListed", label: "Date Listed" },
  { key: "status", label: "Status" },
  { key: "pendingOffers", label: "Pending Offers" },
  { key: "activeOffers", label: "Active Offers" },
  { key: "totalOffers", label: "Total Offers" },
  { key: "numberOfLeads", label: "Number of Leads" },
]

export type ReportData = {
  address?: string
  dateListed?: string
  status?: string
  pendingOffers?: number
  activeOffers?: number
  totalOffers?: number
  numberOfLeads?: number
}

export type ReportGenerationProps = {
  listings: ListingWithOfferCounts[]
  selectedFields: ReportFieldKey[]
}

// Offer Report Types
export type OfferReportFieldKey =
  | "received"
  | "status"
  | "listingAddress"
  | "submitterName"
  | "submitterEmail"
  | "submitterPhone"
  | "offerAmount"

export type OfferReportField = {
  key: OfferReportFieldKey
  label: string
}

export const OFFER_REPORT_FIELDS: OfferReportField[] = [
  { key: "received", label: "Received" },
  { key: "status", label: "Status" },
  { key: "listingAddress", label: "Specify Listing" },
  { key: "submitterName", label: "Submitter Name" },
  { key: "submitterEmail", label: "Submitter Email" },
  { key: "submitterPhone", label: "Submitter Phone" },
  { key: "offerAmount", label: "Offer Amount" },
]

export type OfferReportGenerationProps = {
  offers: OfferWithListing[]
  selectedFields: OfferReportFieldKey[]
}
