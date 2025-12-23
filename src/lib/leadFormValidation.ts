import { Database } from "@/types/supabase"
import * as yup from "yup"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]
type QuestionType = Question["type"]

/**
 * Builds a yup validation schema for a single lead form question
 */
export const buildQuestionValidation = (
  question: Question,
): yup.AnySchema | null => {
  const { type, required, uiConfig } = question
  const config = uiConfig as Record<string, any> | null

  // Base validation rules
  let schema: yup.AnySchema | null = null

  switch (type) {
    case "name":
      // For name fields, validate as object with firstName and lastName
      const nameSchema = yup.object().shape({
        firstName: yup
          .string()
          .max(150, "First name must be at most 150 characters")
          .required(required ? "First name is required" : undefined),
        lastName: yup
          .string()
          .max(150, "Last name must be at most 150 characters")
          .required(required ? "Last name is required" : undefined),
      })
      schema = required
        ? nameSchema.required("This field is required")
        : nameSchema.nullable().optional()
      break

    case "email":
      schema = yup
        .string()
        .max(150, "Maximum 150 characters allowed")
        .email("Please enter a valid email address")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Please enter a valid email address",
        )
      break

    case "tel":
      // Phone can be a string (legacy) or an object { countryCode: string, number: string }
      schema = yup.lazy((value) => {
        if (typeof value === "object" && value !== null && "countryCode" in value) {
          // New format: object with countryCode and number
          return yup.object().shape({
            countryCode: yup
              .string()
              .matches(/^\+[0-9]{1,3}$/, "This number is invalid")
              .required(required ? "This number is invalid" : undefined),
            number: yup
              .string()
              .matches(/^[0-9\s\-\(\)]+$/, "This number is invalid")
              .test("min-digits", "This number is invalid", (numValue) => {
                if (!numValue) return !required
                const digits = numValue.replace(/\D/g, "")
                return digits.length >= 4
              })
              .required(required ? "This number is invalid" : undefined),
          })
        }
        // Legacy format: string
        return yup
          .string()
          .max(150, "This number is invalid")
          .matches(/^\+?[0-9\s\-\(\)]+$/, "This number is invalid")
          .test("min-digits", "This number is invalid", (value) => {
            if (!value) return !required
            const digits = value.replace(/\D/g, "")
            return digits.length >= 4
          })
      }) as unknown as yup.AnySchema
      ;(schema as any)._isLazy = true
      break

    case "listingInterest":
      schema = yup.string().max(500, "Maximum 500 characters allowed")
      break

    case "submitterRole":
    case "areYouInterested":
    case "followAllListings":
    case "captureFinanceLeads":
      schema = yup.string()
      break

    case "opinionOfSalePrice":
      schema = yup.string().max(1000, "Maximum 1000 characters allowed")
      break

    case "messageToAgent":
      // messageToAgent can be a string (message only) or an object with { message: string, attachments: File[] }
      schema = yup
        .mixed()
        .test("messageToAgent", function (value) {
          // Extract message string from value
          let message = ""
          if (typeof value === "string") {
            message = value
          } else if (typeof value === "object" && value !== null) {
            message = (value as any).message || ""
          }

          // Check required
          if (required && !message.trim()) {
            return this.createError({ message: "Message is required" })
          }

          // Check max length
          if (message.length > 5000) {
            return this.createError({
              message: "Message must be at most 5000 characters",
            })
          }

          return true
        })
        .nullable()
      break

    case "shortText":
      schema = yup.string().max(500, "Maximum 500 characters allowed")
      break

    case "longText":
      schema = yup.string().max(5000, "Maximum 5000 characters allowed")
      break

    case "yesNo":
      schema = yup.boolean()
      break

    case "singleChoiceSelect":
    case "multiChoiceSelect":
      schema = yup.mixed()
      break

    case "custom":
      // Custom questions depend on their setupConfig
      const setupConfig = (question.setupConfig as Record<string, any>) || {}
      const answerType = setupConfig.answer_type

      switch (answerType) {
        case "short_text":
          schema = yup.string().max(500, "Maximum 500 characters allowed")
          break
        case "long_text":
          schema = yup.string().max(5000, "Maximum 5000 characters allowed")
          break
        case "number":
          schema = yup
            .mixed()
            .transform((val) => {
              if (val === "" || val === null || val === undefined) return null
              const num = typeof val === "string" ? parseFloat(val) : val
              return isNaN(num) ? val : num
            })
            .test("is-number", "Please enter a valid number", (val) => {
              return val === null || val === undefined || (typeof val === "number" && !isNaN(val))
            })
            .nullable()
          break
        case "yes_no":
          schema = yup.boolean()
          break
        case "single_choice":
        case "multi_choice":
          schema = yup.mixed()
          break
        case "file_upload":
          schema = yup.mixed()
          break
        case "statement":
          // Statements don't need validation
          schema = null
          break
        default:
          schema = yup.string()
      }
      break

    case "submitButton":
      // Submit buttons don't need validation
      schema = null
      break

    default:
      // Default to string validation for unknown types
      schema = yup.string().max(500, "Maximum 500 characters allowed")
  }

  // Apply required validation if schema exists and question is required
  if (schema && required) {
    // Skip required for lazy schemas (they handle it internally)
    if (!(schema as any)._isLazy) {
      schema = schema.required("This field is required")
    }
  } else if (schema && !required) {
    // Make optional
    schema = schema.nullable().optional()
  }

  return schema
}

/**
 * Builds a yup validation schema for an array of lead form questions
 */
export const buildFormValidationSchema = (
  questions: Question[],
  isTestMode: boolean = false,
): yup.AnySchema => {
  const shape: Record<string, yup.AnySchema> = {}

  questions.forEach((question) => {
    // Submit button requires T&C checkbox to be checked
    if (question.type === "submitButton") {
      shape[question.id] = yup
        .boolean()
        .required("You must agree to the terms and conditions")
        .oneOf([true], "You must agree to the terms and conditions")
      return
    }

    // In test mode, make specifyListing optional (for offer forms)
    // For lead forms, we don't have this, but keep the pattern for consistency
    const isOptionalInTestMode = false // Lead forms don't have specifyListing

    const questionSchema = buildQuestionValidation(question)

    if (questionSchema) {
      // If question is required but we're in test mode and it should be optional, make it optional
      if (isTestMode && isOptionalInTestMode && question.required) {
        shape[question.id] = questionSchema.nullable().optional()
      } else {
        shape[question.id] = questionSchema
      }
    }
  })

  return yup.object().shape(shape)
}

