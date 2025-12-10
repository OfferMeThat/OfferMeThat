import { Database } from "@/types/supabase"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

/**
 * Transforms form data collected from the offer form into the database schema format
 */
export function transformFormDataToOffer(
  formData: Record<string, any>,
  questions: Question[],
  formId: string,
  isTest: boolean = false,
): Database["public"]["Tables"]["offers"]["Insert"] {
  // Helper to find question by ID
  const findQuestion = (id: string) => questions.find((q) => q.id === id)

  // Helper to get question type
  const getQuestionType = (id: string) => findQuestion(id)?.type

  // Initialize the offer object with partial type since we'll fill required fields as we process questions
  const offer: Partial<Database["public"]["Tables"]["offers"]["Insert"]> & {
    formId: string
    status: Database["public"]["Enums"]["offerStatus"]
    paymentWay: Database["public"]["Enums"]["paymentWays"]
    // These will be set as we process questions, but TypeScript needs them for the Insert type
    amount?: number
    buyerType?: Database["public"]["Enums"]["buyerType"]
    listingId?: string
  } = {
    formId,
    status: isTest ? "test" : "pending",
    conditional: false,
    // paymentWay is required but not collected by any question, set default to "cash"
    paymentWay: "cash",
  }

  // Process each question's data
  questions.forEach((question) => {
    const value = formData[question.id]
    if (value === null || value === undefined || value === "") {
      return // Skip empty values
    }

    switch (question.type) {
      case "specifyListing":
        // Can be listing ID (UUID) or custom address (string)
        if (typeof value === "string") {
          // Check if it's a UUID (listing ID) or custom address
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (uuidRegex.test(value)) {
            offer.listingId = value
          } else {
            // Custom address entered - set status to unassigned
            offer.customListingAddress = value
            offer.status = "unassigned"
          }
        }
        break

      case "submitterRole":
        // Map to buyerType enum
        if (value === "buyer_self") {
          offer.buyerType = "buyer"
        } else if (value === "buyer_with_agent") {
          offer.buyerType = "buyer"
        } else if (value === "buyers_agent") {
          offer.buyerType = "agent"
        } else {
          offer.buyerType = value as any
        }
        break

      case "submitterName":
        // Object with firstName and lastName
        if (typeof value === "object" && value !== null) {
          offer.submitterFirstName = value.firstName || ""
          offer.submitterLastName = value.lastName || ""
        }
        break

      case "submitterEmail":
        offer.submitterEmail = value as string
        break

      case "submitterPhone":
        offer.submitterPhone = value as string
        break

      case "offerAmount":
        offer.amount =
          typeof value === "number" ? value : parseFloat(value) || 0
        break

      case "nameOfPurchaser":
        // Can be string (single_field) or complex object (individual_names)
        // Files should already be uploaded client-side and replaced with URLs
        const purchaserData = value as any
        if (typeof value === "string") {
          // Single field - just a string
          offer.purchaserData = { method: "single_field", name: value }
        } else if (typeof value === "object" && value !== null) {
          // Check if it's single_field with file URL or individual_names
          if (value.name && !value.scenario) {
            // Single field with optional file URL (already uploaded)
            offer.purchaserData = {
              method: "single_field",
              name: value.name,
              idFileUrl: value.idFileUrl, // URL string, file already uploaded
            }
          } else {
            // Individual names method (idFiles already converted to idFileUrls)
            offer.purchaserData = {
              method: "individual_names",
              ...value, // Includes scenario, numPurchasers, nameFields, idFileUrls, etc.
            }
          }
        }
        break

      case "offerExpiry":
        // Object with hasExpiry, expiryDate, expiryTime
        if (typeof value === "object" && value !== null) {
          if (value.expiryDate) {
            offer.expires = new Date(value.expiryDate).toISOString()
          }
          if (value.expiryTime) {
            offer.expiryTime = value.expiryTime
          }
        }
        break

      case "deposit":
        // Complex deposit data
        offer.depositData = value as any
        break

      case "subjectToLoanApproval":
        // Complex loan approval data (files already uploaded, URLs in supportingDocsUrl/supportingDocsUrls)
        offer.subjectToLoanApproval = value as any
        break

      case "attachPurchaseAgreement":
        // Value should be a URL string (file already uploaded client-side)
        if (typeof value === "string") {
          offer.purchaseAgreementFileUrl = value
        }
        break

      case "specialConditions":
        offer.specialConditions = value as string
        break

      case "settlementDate":
        // Complex settlement date data
        offer.settlementDateData = value as any
        break

      case "messageToAgent":
        // Can be string or object with message and attachment URLs (files already uploaded)
        offer.messageToAgent = value as any
        break

      case "custom":
        // Custom questions - store in customQuestionsData
        if (!offer.customQuestionsData) {
          offer.customQuestionsData = {} as any
        }
        const setupConfig = (question.setupConfig as Record<string, any>) || {}
        const uiConfig = (question.uiConfig as Record<string, any>) || {}
        const questionText =
          setupConfig.question_text || uiConfig.label || "Custom Question"
        const answerType = setupConfig.answer_type

        ;(offer.customQuestionsData as any)[question.id] = {
          questionText,
          answerType,
          value,
        }
        break

      case "submitButton":
        // Skip submit button
        break

      default:
        // For any other question types, store in customQuestionsData
        if (!offer.customQuestionsData) {
          offer.customQuestionsData = {} as any
        }
        const defaultUiConfig = (question.uiConfig as Record<string, any>) || {}
        ;(offer.customQuestionsData as any)[question.id] = {
          questionText: defaultUiConfig.label || question.type,
          answerType: question.type,
          value,
        }
        break
    }
  })

  // Store complete form data as backup
  offer.formData = formData as any

  // Ensure required fields are present (they should be set by processing questions)
  // Provide defaults if somehow missing (shouldn't happen in normal flow)
  if (!offer.amount && offer.amount !== 0) {
    offer.amount = 0
  }
  if (!offer.buyerType) {
    offer.buyerType = "buyer"
  }

  // If offer is unassigned, listingId can be null
  if (!offer.listingId && offer.status !== "unassigned") {
    // If no listing ID was set and it's not unassigned, we need at least a placeholder
    // This should not happen if specifyListing question is required
    throw new Error("Listing ID is required but was not provided")
  }

  // Now all required fields should be present
  // For unassigned offers, listingId can be null (database schema should allow this)
  // Use type assertion to allow null listingId for unassigned offers
  const result = {
    ...offer,
    amount: offer.amount!,
    buyerType: offer.buyerType!,
    listingId:
      offer.listingId || (offer.status === "unassigned" ? null : undefined),
  } as any as Database["public"]["Tables"]["offers"]["Insert"]

  return result
}
