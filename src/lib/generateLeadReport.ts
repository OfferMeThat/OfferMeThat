import { LeadWithListing } from "@/types/lead"
import { LEAD_REPORT_FIELDS, LeadReportFieldKey } from "@/types/reportTypes"
import {
  formatAreYouInterested,
  formatFinanceInterest,
  formatFollowAllListings,
  formatSubmitterRole,
} from "./formatLeadData"
import {
  formatCustomQuestions,
  getAllMessageToAgentInfo,
  getCustomQuestionsFromLead,
  getOpinionOfSalePrice,
  getSubmitterName,
} from "./parseLeadDataForReports"
import { escapeCsvField, formatDate } from "./reportUtils"

export const generateLeadReport = (
  leads: LeadWithListing[],
  selectedFields: LeadReportFieldKey[],
): string => {
  if (leads.length === 0 || selectedFields.length === 0) {
    return ""
  }

  const selectedFieldsSet = new Set(selectedFields)

  const orderedFields = LEAD_REPORT_FIELDS.filter((field) =>
    selectedFieldsSet.has(field.key),
  )

  const headers = orderedFields.map((field) => field.label)

  const rows = leads.map((lead) => {
    return orderedFields.map((field) => {
      const fieldKey = field.key
      switch (fieldKey) {
        case "received":
          return escapeCsvField(formatDate(lead.createdAt))
        case "submitterName":
          return escapeCsvField(getSubmitterName(lead))
        case "submitterEmail":
          return escapeCsvField(lead.submitterEmail || "N/A")
        case "submitterPhone":
          return escapeCsvField(lead.submitterPhone || "N/A")
        case "submitterRole":
          return escapeCsvField(formatSubmitterRole(lead.submitterRole))
        case "areYouInterested":
          return escapeCsvField(formatAreYouInterested(lead.areYouInterested))
        case "financeInterest":
          return escapeCsvField(formatFinanceInterest(lead.financeInterest))
        case "followAllListings":
          return escapeCsvField(formatFollowAllListings(lead.followAllListings))
        case "opinionOfSalePrice":
          return escapeCsvField(getOpinionOfSalePrice(lead.opinionOfSalePrice))
        case "messageToAgent":
          return escapeCsvField(getAllMessageToAgentInfo(lead.messageToAgent))
        case "customQuestions":
          const customQuestions = getCustomQuestionsFromLead(lead)
          return escapeCsvField(formatCustomQuestions(customQuestions))
        default:
          return ""
      }
    })
  })

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

  return csvContent
}

export const generateLeadReportFilename = (): string => {
  const today = new Date()
  const dateString = today.toISOString().split("T")[0]
  return `leads-report-${dateString}.csv`
}
