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
        if (
          typeof value === "object" &&
          value !== null &&
          "countryCode" in value
        ) {
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

    case "opinionOfSalePrice": {
      const opinionSetupConfig = question.setupConfig as
        | Record<string, any>
        | undefined
      const opinionAnswerType = opinionSetupConfig?.answerType || "text"
      if (opinionAnswerType === "number") {
        schema = yup.object({
          amount: yup.number().nullable().typeError("Amount must be a number"),
          currency: yup.string().required("Currency is required"),
        })
      } else {
        schema = yup.string().max(1000, "Maximum 1000 characters allowed")
      }
      break
    }

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
      // Custom questions validation
      const customAnswerType = (question.setupConfig as Record<string, any>)
        ?.answer_type
      if (customAnswerType === "text") {
        schema = yup.string().max(150, "Maximum 150 characters allowed")
      } else if (
        customAnswerType === "number" ||
        customAnswerType === "number_amount"
      ) {
        // Number inputs should be non-negative (>= 0, no negative values)
        // Handle both number and money types - for money, it's an object { amount, currency }
        const customSetupConfig =
          (question.setupConfig as Record<string, any>) || {}
        const numberType = customSetupConfig.number_type

        if (numberType === "money") {
          schema = yup.lazy((value) => {
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              // Check if it's a phone number object (should be transformed before validation, but handle it here as safety)
              if (
                "countryCode" in value &&
                "number" in value &&
                !("amount" in value)
              ) {
                // This is a phone number object - should have been transformed, but if not, return a schema that will fail gracefully
                // The data transformation should handle this, so this is just a safety check
                return yup
                  .mixed()
                  .test("phone-to-money", "Invalid format", () => false)
              }

              // Normal money object with amount and currency
              return yup.object().shape({
                amount: yup
                  .mixed()
                  .transform((val) => {
                    if (val === "" || val === null || val === undefined)
                      return undefined
                    if (typeof val === "string") {
                      const trimmed = val.trim()
                      if (trimmed === "") return undefined
                      const num = parseFloat(trimmed)
                      return isNaN(num) ? undefined : num
                    }
                    const num =
                      typeof val === "number" ? val : parseFloat(String(val))
                    return isNaN(num) ? undefined : num
                  })
                  .test("is-number", "Please enter a valid number", (val) => {
                    return (
                      val === undefined ||
                      (typeof val === "number" && !isNaN(val))
                    )
                  })
                  .test(
                    "is-non-negative",
                    "Number cannot be negative",
                    (val) => {
                      return (
                        val === undefined ||
                        (typeof val === "number" && val >= 0)
                      )
                    },
                  ),
                currency: yup.string().default("USD"),
              })
            }
            if ((value === undefined || value === null) && required) {
              return yup
                .object()
                .shape({
                  amount: yup
                    .mixed()
                    .transform((val) => {
                      if (val === "" || val === null || val === undefined)
                        return undefined
                      if (typeof val === "string") {
                        const trimmed = val.trim()
                        if (trimmed === "") return undefined
                        const num = parseFloat(trimmed)
                        return isNaN(num) ? undefined : num
                      }
                      const num =
                        typeof val === "number" ? val : parseFloat(String(val))
                      return isNaN(num) ? undefined : num
                    })
                    .test("is-number", "Please enter a valid number", (val) => {
                      return (
                        val === undefined ||
                        (typeof val === "number" && !isNaN(val))
                      )
                    })
                    .test(
                      "is-non-negative",
                      "Number cannot be negative",
                      (val) => {
                        return (
                          val === undefined ||
                          (typeof val === "number" && val >= 0)
                        )
                      },
                    )
                    .required("Amount is required"),
                  currency: yup
                    .string()
                    .default("USD")
                    .required("Currency is required"),
                })
                .required("This field is required")
            }
            return yup.mixed().nullable().optional()
          }) as unknown as yup.AnySchema
          ;(schema as any)._isLazy = true
        } else {
          // Regular number type
          schema = yup
            .mixed()
            .transform((val) => {
              if (val === "" || val === null || val === undefined)
                return undefined

              // Handle phone number objects that might be incorrectly passed
              if (
                typeof val === "object" &&
                val !== null &&
                "number" in val &&
                "countryCode" in val
              ) {
                // This is a phone number object, extract the number part
                const phoneObj = val as { countryCode: string; number: string }
                const numberStr = phoneObj.number?.trim() || ""
                if (numberStr === "") return undefined
                const num = parseFloat(numberStr)
                return isNaN(num) ? undefined : num
              }

              if (typeof val === "string") {
                const trimmed = val.trim()
                if (trimmed === "") return undefined
                const num = parseFloat(trimmed)
                return isNaN(num) ? undefined : num
              }
              const num =
                typeof val === "number" ? val : parseFloat(String(val))
              return isNaN(num) ? undefined : num
            })
            .test("is-number", "Please enter a valid number", (val) => {
              return (
                val === undefined || (typeof val === "number" && !isNaN(val))
              )
            })
            .test("is-non-negative", "Number cannot be negative", (val) => {
              return val === undefined || (typeof val === "number" && val >= 0)
            })
        }
      } else if (customAnswerType === "short_text") {
        schema = yup.string().max(500, "Maximum 500 characters allowed")
      } else if (customAnswerType === "long_text") {
        schema = yup.string().max(5000, "Maximum 5000 characters allowed")
      } else if (customAnswerType === "textarea") {
        schema = yup.string().max(1000, "Maximum 1000 characters allowed")
      } else if (customAnswerType === "statement") {
        // Statement questions have an optional checkbox
        const customSetupConfig =
          (question.setupConfig as Record<string, any>) || {}
        const addTickbox = customSetupConfig.add_tickbox || "no"
        const isRequired =
          addTickbox === "required" ||
          (addTickbox === "yes" &&
            customSetupConfig.tickbox_requirement === "essential")
        if (isRequired) {
          schema = yup.boolean().required("You must agree to this statement")
        } else {
          schema = yup.boolean().nullable().optional()
        }
      } else if (customAnswerType === "email") {
        schema = yup
          .string()
          .max(150, "Maximum 150 characters allowed")
          .email("Please enter a valid email address")
          .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid email address",
          )
      } else if (customAnswerType === "phone") {
        // Phone can be a string (legacy) or an object { countryCode: string, number: string }
        schema = yup.lazy((value) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "countryCode" in value
          ) {
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
                  // Count only digits (excluding formatting characters)
                  const digits = numValue.replace(/\D/g, "")
                  // Minimum 4 digits (shortest valid phone numbers globally)
                  return digits.length >= 4
                })
                .required(required ? "This number is invalid" : undefined),
            })
          }
          return yup
            .string()
            .max(150, "This number is invalid")
            .matches(/^\+?[0-9\s\-\(\)]+$/, "This number is invalid")
            .test("min-digits", "This number is invalid", (value) => {
              if (!value) return !required
              // Count only digits (excluding country code + and formatting)
              const digits = value.replace(/\D/g, "")
              // Minimum 4 digits (shortest valid phone numbers globally)
              return digits.length >= 4
            })
        }) as unknown as yup.AnySchema
        ;(schema as any)._isLazy = true
      } else if (customAnswerType === "time_date") {
        // Time/date questions - validate as mixed (can be Date object or string)
        // Validate that date is not before today
        schema = yup
          .mixed()
          .test(
            "date-not-past",
            "Date cannot be before today",
            function (value) {
              if (!value) {
                if (required) {
                  return this.createError({ message: "This field is required" })
                }
                return true
              }

              let date: Date | null = null

              if (value instanceof Date) {
                date = value
              } else if (typeof value === "string") {
                date = new Date(value)
              } else if (typeof value === "object" && value !== null) {
                const dateValue =
                  (value as any).date ||
                  (value as any).settlementDate ||
                  (value as any).expiryDate
                if (dateValue) {
                  date =
                    dateValue instanceof Date ? dateValue : new Date(dateValue)
                }
              }

              if (!date || isNaN(date.getTime())) {
                return this.createError({
                  message: "Please enter a valid date",
                })
              }

              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const selectedDate = new Date(date)
              selectedDate.setHours(0, 0, 0, 0)

              if (selectedDate < today) {
                return this.createError({
                  message: "Date cannot be before today",
                })
              }

              return true
            },
          )
      } else if (customAnswerType === "yes_no") {
        schema = yup
          .mixed()
          .transform((value) => {
            if (value === "yes" || value === true) return true
            if (value === "no" || value === false) return false
            if (value === "" || value === null || value === undefined)
              return undefined
            return value
          })
          .test("is-boolean", "Invalid value", (value) => {
            return value === undefined || value === true || value === false
          })
      } else if (
        customAnswerType === "single_select" ||
        customAnswerType === "multi_select"
      ) {
        schema = yup.mixed()
      } else if (customAnswerType === "file_upload") {
        schema = yup.mixed()
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

  const isLazySchema = (schema as any)?._isLazy === true
  const isYupSchema =
    schema && typeof schema === "object" && "validate" in schema

  if (required && schema && !isLazySchema && isYupSchema) {
    try {
      if (typeof (schema as any).required === "function") {
        schema = schema.required("This field is required")
      }
    } catch (error) {
      console.warn("Error adding required to schema:", error)
    }
  } else if (schema && !required && !isLazySchema && isYupSchema) {
    try {
      const hasNullable = typeof (schema as any).nullable === "function"
      const hasOptional = typeof (schema as any).optional === "function"

      if (hasNullable && hasOptional) {
        schema = schema.nullable().optional()
      } else if (hasNullable) {
        schema = schema.nullable()
      } else if (hasOptional) {
        schema = schema.optional()
      }
    } catch (error) {
      console.warn("Error making schema nullable/optional:", error)
    }
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
        try {
          const hasNullable =
            typeof (questionSchema as any).nullable === "function"
          const hasOptional =
            typeof (questionSchema as any).optional === "function"
          if (hasNullable && hasOptional) {
            shape[question.id] = questionSchema.nullable().optional()
          } else {
            shape[question.id] = questionSchema
          }
        } catch (error) {
          console.warn("Error making schema nullable/optional:", error)
          shape[question.id] = questionSchema
        }
      } else {
        shape[question.id] = questionSchema
      }
    }
  })

  return yup.object().shape(shape)
}
