import { Database } from "@/types/supabase"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]

/**
 * Transforms form data collected from the lead form into the database schema format
 */
export function transformFormDataToLead(
  formData: Record<string, any>,
  questions: Question[],
  formId: string,
): Database["public"]["Tables"]["leads"]["Insert"] {
  // Helper to find question by ID
  const findQuestion = (id: string) => questions.find((q) => q.id === id)

  // Initialize the lead object
  const lead: Partial<Database["public"]["Tables"]["leads"]["Insert"]> & {
    formId: string
  } = {
    formId,
  }

  // Process each question's data
  questions.forEach((question) => {
    const value = formData[question.id]
    if (value === null || value === undefined || value === "") {
      return // Skip empty values
    }

    switch (question.type) {
      case "listingInterest":
        // Can be listing ID (UUID) or custom address (string)
        if (typeof value === "string") {
          // Check if it's a UUID (listing ID) or custom address
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(value)) {
            lead.listingId = value
          } else {
            // Custom address entered
            lead.customListingAddress = value
          }
        }
        break

      case "name":
        // Object with firstName and lastName
        if (typeof value === "object" && value !== null) {
          lead.submitterFirstName = value.firstName || ""
          lead.submitterLastName = value.lastName || ""
        }
        break

      case "email":
        lead.submitterEmail = value as string
        break

      case "tel":
        // Handle both object format (new) and string format (legacy)
        if (typeof value === "object" && value !== null && "countryCode" in value) {
          // Combine country code and number for database storage
          const phoneObj = value as { countryCode: string; number: string }
          lead.submitterPhone = (phoneObj.countryCode || "") + (phoneObj.number || "")
        } else {
          // Legacy string format
          lead.submitterPhone = value as string
        }
        break

      case "areYouInterested":
        lead.areYouInterested = value as Database["public"]["Enums"]["areYouInterested"]
        break

      case "followAllListings":
        lead.followAllListings = value as Database["public"]["Enums"]["followAllListings"]
        break

      case "opinionOfSalePrice":
        lead.opinionOfSalePrice = value as string
        break

      case "submitterRole":
        // Convert snake_case to camelCase to match database enum
        let roleValue = value as string
        if (roleValue === "buyer_self") {
          roleValue = "buyerSelf"
        } else if (roleValue === "buyer_with_agent") {
          roleValue = "buyerWithAgent"
        } else if (roleValue === "buyers_agent") {
          roleValue = "buyersAgent"
        }
        lead.submitterRole = roleValue as Database["public"]["Enums"]["submitterRole"]
        break

      case "captureFinanceLeads":
        lead.financeInterest = value as Database["public"]["Enums"]["financeInterest"]
        break

      case "messageToAgent":
        // Store as JSON object
        if (typeof value === "object" && value !== null) {
          lead.messageToAgent = value as any
        } else if (typeof value === "string") {
          lead.messageToAgent = { message: value }
        }
        break

      case "custom":
        // Store custom question data
        const setupConfig = (question.setupConfig as Record<string, any>) || {}
        const answerType = setupConfig.answer_type

        if (!lead.customQuestionsData) {
          lead.customQuestionsData = {}
        }

        const customData = lead.customQuestionsData as Record<string, any>
        customData[question.id] = {
          answerType,
          value,
        }
        break

      default:
        // For any other question types, store in formData JSON field
        // IMPORTANT: Never store submitterRole in formData - it has its own column
        if (question.type === "submitterRole") {
          // This should have been caught by the case above, but as a safeguard:
          // Convert snake_case to camelCase to match database enum
          let roleValue = value as string
          if (roleValue === "buyer_self") {
            roleValue = "buyerSelf"
          } else if (roleValue === "buyer_with_agent") {
            roleValue = "buyerWithAgent"
          } else if (roleValue === "buyers_agent") {
            roleValue = "buyersAgent"
          }
          lead.submitterRole = roleValue as Database["public"]["Enums"]["submitterRole"]
          break
        }
        
        if (!lead.formData) {
          lead.formData = {}
        }
        const formDataObj = lead.formData as Record<string, any>
        formDataObj[question.id] = value
        break
    }
  })

  // Return the lead with all required fields
  return lead as Database["public"]["Tables"]["leads"]["Insert"]
}

