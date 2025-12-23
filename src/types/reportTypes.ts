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
  | "submitterRole"
  | "offerAmount"
  | "buyerType"
  | "paymentWay"
  | "conditional"
  | "expires"
  | "updatedAt"
  | "purchaseAgreement"
  | "purchaserName"
  | "deposit"
  | "settlementDate"
  | "subjectToLoan"
  | "specialConditions"
  | "messageToAgent"
  | "customQuestions"

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
  { key: "submitterRole", label: "Submitter Role" },
  { key: "offerAmount", label: "Offer Amount" },
  { key: "buyerType", label: "Buyer Type" },
  { key: "paymentWay", label: "Payment Way" },
  { key: "conditional", label: "Conditional" },
  { key: "expires", label: "Offer Expires" },
  { key: "updatedAt", label: "Last Updated" },
  { key: "purchaseAgreement", label: "Purchase Agreement" },
  { key: "purchaserName", label: "Purchaser Name(s)" },
  { key: "deposit", label: "Deposit" },
  { key: "settlementDate", label: "Settlement Date" },
  { key: "subjectToLoan", label: "Subject to Loan" },
  { key: "specialConditions", label: "Special Conditions" },
  { key: "messageToAgent", label: "Message to Agent" },
  { key: "customQuestions", label: "Custom Questions" },
]

export type OfferReportGenerationProps = {
  offers: OfferWithListing[]
  selectedFields: OfferReportFieldKey[]
}

// Lead Report Types
export type LeadReportFieldKey =
  | "received"
  | "listingAddress"
  | "submitterName"
  | "submitterEmail"
  | "submitterPhone"
  | "submitterRole"
  | "areYouInterested"
  | "financeInterest"
  | "followAllListings"
  | "opinionOfSalePrice"
  | "buyerAgentName"
  | "buyerAgentEmail"
  | "buyerAgentCompany"
  | "agentCompany"
  | "messageToAgent"
  | "customQuestions"

export type LeadReportField = {
  key: LeadReportFieldKey
  label: string
}

export const LEAD_REPORT_FIELDS: LeadReportField[] = [
  { key: "received", label: "Received" },
  { key: "listingAddress", label: "Listing" },
  { key: "submitterName", label: "Submitter Name" },
  { key: "submitterEmail", label: "Submitter Email" },
  { key: "submitterPhone", label: "Submitter Phone" },
  { key: "submitterRole", label: "Submitter Role" },
  { key: "areYouInterested", label: "Interested" },
  { key: "financeInterest", label: "Finance Interest" },
  { key: "followAllListings", label: "Follow All Listings" },
  { key: "opinionOfSalePrice", label: "Opinion of Sale Price" },
  { key: "buyerAgentName", label: "Buyer Agent Name" },
  { key: "buyerAgentEmail", label: "Buyer Agent Email" },
  { key: "buyerAgentCompany", label: "Buyer Agent Company" },
  { key: "agentCompany", label: "Agent Company" },
  { key: "messageToAgent", label: "Message to Agent" },
  { key: "customQuestions", label: "Custom Questions" },
]

export type LeadReportGenerationProps = {
  leads: import("./lead").LeadWithListing[]
  selectedFields: LeadReportFieldKey[]
}
