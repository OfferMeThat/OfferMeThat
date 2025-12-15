import { parseCustomQuestion } from "./parseCustomQuestionsData"
import {
  formatAreYouInterested,
  formatFollowAllListings,
  formatSubmitterRole,
} from "./formatLeadData"
import { Database } from "@/types/supabase"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]

/**
 * Formats a formData field value based on the question type
 * Returns a string representation (for display in formData section)
 */
export function formatFormDataField(
  question: Question | undefined,
  value: any,
): string {
  if (!question) {
    // If no question found, try to format based on value type
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  // Handle based on question type
  switch (question.type) {
    case "submitterRole":
      return formatSubmitterRole(value)

    case "areYouInterested":
      return formatAreYouInterested(value)

    case "followAllListings":
      return formatFollowAllListings(value)

    case "listingInterest":
      // This should already be handled, but just in case
      return String(value)

    case "name":
      if (typeof value === "object" && value !== null) {
        const firstName = value.firstName || ""
        const lastName = value.lastName || ""
        return `${firstName} ${lastName}`.trim() || "N/A"
      }
      return String(value)

    case "email":
      return String(value)

    case "tel":
      if (typeof value === "object" && value !== null && "countryCode" in value) {
        const phoneObj = value as { countryCode: string; number: string }
        return (phoneObj.countryCode || "") + (phoneObj.number || "")
      }
      return String(value)

    case "opinionOfSalePrice":
      return String(value)

    case "captureFinanceLeads":
      // This is stored as financeInterest enum
      return String(value)

    case "messageToAgent":
      if (typeof value === "object" && value !== null) {
        return value.message || ""
      }
      return String(value)

    case "custom":
      // Use parseCustomQuestion to format custom questions
      const setupConfig = (question.setupConfig as Record<string, any>) || {}
      const answerType = setupConfig.answer_type
      const uiConfig = (question.uiConfig as Record<string, any>) || {}
      const questionText = uiConfig.questionText || uiConfig.label || "Custom Question"

      const parsed = parseCustomQuestion(question.id, {
        questionText,
        answerType,
        value,
      })

      if (parsed) {
        return parsed.formattedValue
      }
      return String(value)

    default:
      // For unknown types, try to format nicely
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
  }
}

