import { Database } from "@/types/supabase"
import { transformDepositFormData } from "./transformDepositData"

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
    isTest?: boolean
  } = {
    formId,
    status: "pending",
    conditional: false,
    // paymentWay is required but not collected by any question, set default to "cash"
    paymentWay: "cash",
    isTest: isTest,
  }

  // Build formData with question type identifiers
  // This will store all form data with question types for later identification
  const formDataWithTypes: Record<string, any> = {}

  // Process each question's data
  questions.forEach((question) => {
    const value = formData[question.id]
    if (value === null || value === undefined || value === "") {
      return // Skip empty values
    }

    // Add to formData with question type identifier (except for deposit which goes to depositData)
    if (question.type !== "deposit") {
      formDataWithTypes[question.id] = {
        questionType: question.type,
        questionId: question.id,
        value: value,
      }
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
        // Handle both object format (new) and string format (legacy)
        if (
          typeof value === "object" &&
          value !== null &&
          "countryCode" in value
        ) {
          // Combine country code and number for database storage
          const phoneObj = value as { countryCode: string; number: string }
          offer.submitterPhone =
            (phoneObj.countryCode || "") + (phoneObj.number || "")
        } else {
          // Legacy string format
          offer.submitterPhone = value as string
        }
        break

      case "offerAmount":
        if (typeof value === "object" && value !== null) {
          // Handle object format { amount: number|string, currency: string }
          const amountValue = value.amount
          if (typeof amountValue === "string") {
            const parsed = parseFloat(amountValue.trim())
            offer.amount = isNaN(parsed) ? 0 : parsed
          } else if (typeof amountValue === "number") {
            offer.amount = amountValue
          } else {
            offer.amount = 0
          }
          // Store currency in customQuestionsData for easy access
          if (!offer.customQuestionsData) {
            offer.customQuestionsData = {} as any
          }
          ;(offer.customQuestionsData as any).currency = value.currency || "USD"
        } else {
          // Legacy format: number or string
          if (typeof value === "string") {
            const parsed = parseFloat(value.trim())
            offer.amount = isNaN(parsed) ? 0 : parsed
          } else if (typeof value === "number") {
            offer.amount = value
          } else {
            offer.amount = 0
          }
        }
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
        // Transform raw deposit form data into structured format
        // Extract all deposit-related fields from formData
        const depositFormData: Record<string, any> = {}

        // Collect all deposit-related fields from the original formData
        Object.keys(formData).forEach((key) => {
          if (
            key.startsWith("deposit_") ||
            key.startsWith("instalment_") ||
            key === "deposit_instalments"
          ) {
            depositFormData[key] = formData[key]
          }
        })

        // If value is an object (the main deposit question data), merge it
        if (value && typeof value === "object") {
          Object.assign(depositFormData, value)
        }

        // Transform the collected deposit form data
        if (Object.keys(depositFormData).length > 0) {
          // Check if it's already in structured format (has instalment_1, instalment_2, etc.)
          if (
            depositFormData.instalment_1 ||
            depositFormData.instalment_2 ||
            depositFormData.instalment_3 ||
            (depositFormData.instalments && depositFormData.numInstalments)
          ) {
            // Already structured, use as-is
            offer.depositData = depositFormData as any
          } else {
            // Raw form data, transform it
            const transformed = transformDepositFormData(depositFormData)
            if (transformed) {
              offer.depositData = transformed
            }
          }
        } else if (value) {
          // Fallback: store as-is (for backward compatibility)
          offer.depositData = value as any
        }
        break

      case "subjectToLoanApproval":
        // Complex loan approval data (files already uploaded, URLs in supportingDocsUrl/supportingDocsUrls)
        offer.subjectToLoanApproval = value as any
        break

      case "attachPurchaseAgreement":
        // Value can be a single File, array of Files, single URL string, or array of URL strings
        // Files should already be uploaded client-side and replaced with URLs
        if (Array.isArray(value)) {
          // Array of URLs (files already uploaded)
          const urls = value.filter((v) => typeof v === "string")
          if (urls.length > 0) {
            // Store as JSON string if multiple, plain string if single
            if (urls.length === 1) {
              offer.purchaseAgreementFileUrl = urls[0]
            } else {
              offer.purchaseAgreementFileUrl = JSON.stringify(urls)
            }
          }
        } else if (typeof value === "string") {
          // Single URL string (backward compatibility)
          offer.purchaseAgreementFileUrl = value
        } else if (value instanceof File) {
          // Single File (will be uploaded in offers.ts)
          // Store as-is for now, will be converted to URL in offers.ts
          ;(offer as any).purchaseAgreementFiles = [value]
        } else if (
          Array.isArray(value) &&
          value.some((v) => v instanceof File)
        ) {
          // Array of Files (will be uploaded in offers.ts)
          ;(offer as any).purchaseAgreementFiles = value.filter(
            (v) => v instanceof File,
          )
        }
        break

      case "specialConditions":
        // Value can be a string (legacy) or an object with selectedConditions, customCondition, and conditionAttachmentUrls
        if (typeof value === "string") {
          // Legacy format - just store as string
          offer.specialConditions = value
        } else if (typeof value === "object" && value !== null) {
          // New format - store as JSON object
          offer.specialConditions = value as any
        }
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

        // Transform value based on answer type
        let transformedValue = value
        if (answerType === "number" || answerType === "number_amount") {
          const numberType = setupConfig.number_type
          if (
            numberType === "money" &&
            typeof value === "object" &&
            value !== null
          ) {
            // Money type: { amount: string|number, currency: string }
            const amountValue = (value as any).amount
            if (typeof amountValue === "string") {
              const parsed = parseFloat(amountValue.trim())
              transformedValue = {
                ...value,
                amount: isNaN(parsed) ? 0 : parsed,
                currency: (value as any).currency || "USD",
              }
            } else if (typeof amountValue === "number") {
              transformedValue = {
                ...value,
                amount: amountValue,
                currency: (value as any).currency || "USD",
              }
            }
          } else if (typeof value === "string") {
            // Regular number type: convert string to number
            const parsed = parseFloat(value.trim())
            transformedValue = isNaN(parsed) ? null : parsed
          } else if (typeof value === "number") {
            transformedValue = value
          }
        }

        ;(offer.customQuestionsData as any)[question.id] = {
          questionText,
          answerType,
          value: transformedValue,
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

  // Store form data with question type identifiers
  // Exclude deposit-related fields since they're stored in depositData
  const cleanedFormData: Record<string, any> = {}

  Object.keys(formDataWithTypes).forEach((key) => {
    // Skip deposit-related fields - they're in depositData
    if (
      !key.startsWith("deposit_") &&
      !key.startsWith("instalment_") &&
      key !== "deposit_instalments"
    ) {
      cleanedFormData[key] = formDataWithTypes[key]
    }
  })

  // Also include any other fields from original formData that might not be in questions
  // (for backward compatibility and any custom fields)
  Object.keys(formData).forEach((key) => {
    if (
      !cleanedFormData.hasOwnProperty(key) &&
      !key.startsWith("deposit_") &&
      !key.startsWith("instalment_") &&
      key !== "deposit_instalments"
    ) {
      // Try to find the question type for this field
      const question = questions.find((q) => q.id === key)
      if (question) {
        cleanedFormData[key] = {
          questionType: question.type,
          questionId: question.id,
          value: formData[key],
        }
      } else {
        // Unknown field, store as-is with a generic identifier
        cleanedFormData[key] = {
          questionType: "unknown",
          questionId: key,
          value: formData[key],
        }
      }
    }
  })

  offer.formData = cleanedFormData as any

  // Ensure required fields are present (they should be set by processing questions)
  // Provide defaults if somehow missing (shouldn't happen in normal flow)
  if (!offer.amount && offer.amount !== 0) {
    offer.amount = 0
  }
  if (!offer.buyerType) {
    offer.buyerType = "buyer"
  }

  // If offer is unassigned or test, listingId can be null
  if (!offer.listingId && offer.status !== "unassigned" && !isTest) {
    // If no listing ID was set and it's not unassigned or test, we need at least a placeholder
    // This should not happen if specifyListing question is required (and not in test mode)
    throw new Error("Listing ID is required but was not provided")
  }

  // Now all required fields should be present
  // For unassigned offers or test offers, listingId can be null (database schema should allow this)
  // Use type assertion to allow null listingId for unassigned or test offers
  const result = {
    ...offer,
    amount: offer.amount!,
    buyerType: offer.buyerType!,
    listingId:
      offer.listingId ||
      (offer.status === "unassigned" || isTest ? null : undefined),
  } as any as Database["public"]["Tables"]["offers"]["Insert"] & {
    isTest?: boolean
  }

  return result
}
