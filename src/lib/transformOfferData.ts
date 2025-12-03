import { Database } from "@/types/supabase"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

/**
 * Transforms form data collected from the offer form into the database schema format
 */
export function transformFormDataToOffer(
  formData: Record<string, any>,
  questions: Question[],
  formId: string,
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
    status: "pending",
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
            offer.customListingAddress = value
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
        // For single_field: value is string OR { name: string, idFile?: File }
        // For individual_names: value is { scenario, numPurchasers, nameFields, idFiles?: Record<string, File>, etc. }
        const purchaserData = value as any
        if (typeof value === "string") {
          // Single field - just a string
          offer.purchaserData = { method: "single_field", name: value }
        } else if (typeof value === "object" && value !== null) {
          // Check if it's single_field with file or individual_names
          if (value.name && !value.scenario) {
            // Single field with optional file
            offer.purchaserData = {
              method: "single_field",
              name: value.name,
              idFile: value.idFile, // File object, will be uploaded in save function
            }
          } else {
            // Individual names method
            offer.purchaserData = {
              method: "individual_names",
              ...value, // Includes scenario, numPurchasers, nameFields, idFiles, etc.
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
        // Complex loan approval data (files will be uploaded separately)
        offer.subjectToLoanApproval = value as any
        break

      case "attachPurchaseAgreement":
        // File URL will be set after upload
        // For now, store the File object reference (will be handled in save function)
        if (value instanceof File) {
          // Store reference, will be uploaded
          ;(offer as any).__purchaseAgreementFile = value
        } else if (typeof value === "string") {
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
        // Can be string or object with message and attachments
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
  if (!offer.listingId) {
    // If no listing ID was set, we need at least a placeholder
    // This should not happen if specifyListing question is required
    throw new Error("Listing ID is required but was not provided")
  }

  // Now all required fields should be present
  return {
    ...offer,
    amount: offer.amount!,
    buyerType: offer.buyerType!,
    listingId: offer.listingId!,
  } as Database["public"]["Tables"]["offers"]["Insert"]
}
