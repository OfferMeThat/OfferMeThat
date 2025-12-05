import { ListingWithOfferCounts } from "./listing"

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
