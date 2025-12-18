import { Database } from "@/types/supabase"
import * as yup from "yup"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]
type QuestionType = Question["type"]

/**
 * Builds a yup validation schema for a single question
 */
export const buildQuestionValidation = (
  question: Question,
): yup.AnySchema | null => {
  const { type, required, uiConfig } = question
  const config = uiConfig as Record<string, any> | null

  // Base validation rules
  let schema: yup.AnySchema | null = null

  switch (type) {
    case "submitterName":
      // For name fields, validate as object with firstName and lastName
      // Make the object itself optional if the question is not required
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

    case "submitterEmail":
      schema = yup
        .string()
        .max(150, "Maximum 150 characters allowed")
        .email("Please enter a valid email address")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Please enter a valid email address",
        )
      break

    case "submitterPhone":
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
        // Legacy format: string
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
      // Mark this as a lazy schema so we don't add .required() to it later
      ;(schema as any)._isLazy = true
      break

    case "offerAmount":
      // offerAmount can be a number (legacy) or an object { amount: number, currency: string }
      schema = yup.lazy((value) => {
        if (typeof value === "object" && value !== null) {
          const objectSchema = yup.object().shape({
            amount: yup
              .number()
              .typeError("Please enter a valid number")
              .positive("Amount must be positive")
              .required(required ? "Amount is required" : undefined),
            currency: yup
              .string()
              .default("USD") // Default to USD if not provided
              .required(required ? "Currency is required" : undefined),
          })
          // Add required to the object schema if needed
          return required
            ? objectSchema.required("This field is required")
            : objectSchema
        }
        // If value is undefined or null, and question is required, validate as object with default currency
        if (value === undefined || value === null) {
          if (required) {
            return yup
              .object()
              .shape({
                amount: yup
                  .number()
                  .typeError("Please enter a valid number")
                  .positive("Amount must be positive")
                  .required("Amount is required"),
                currency: yup
                  .string()
                  .default("USD")
                  .required("Currency is required"),
              })
              .required("This field is required")
          }
          return yup.mixed().nullable().optional()
        }
        // Legacy: number format
        const numberSchema = yup
          .number()
          .typeError("Please enter a valid number")
          .positive("Amount must be positive")
        return required
          ? numberSchema.required("This field is required")
          : numberSchema
      }) as unknown as yup.AnySchema
      // Mark this as a lazy schema so we don't add .required() to it later
      ;(schema as any)._isLazy = true
      break

    case "specifyListing":
      // Can be either a listing ID or custom address
      schema = yup.string().max(150, "Maximum 150 characters allowed")
      break

    case "nameOfPurchaser":
      // Name of purchaser can be:
      // 1. A string (for single_field method)
      // 2. An object with { name: string, idFile?: File } (for single_field with file)
      // 3. An object with { scenario, numPurchasers, nameFields, idFiles, etc. } (for individual_names method)
      const nameOfPurchaserSetup =
        (question.setupConfig as Record<string, any>) || {}
      const collectionMethod = nameOfPurchaserSetup.collection_method
      const collectIdentification = nameOfPurchaserSetup.collect_identification
      // ID is required ONLY if BOTH:
      // 1. collect_identification is exactly "mandatory" AND
      // 2. The question itself is required
      // If the question is not required (even if collect_identification is "mandatory"), ID is NOT required
      const idRequired = collectIdentification === "mandatory" && required

      if (collectionMethod === "single_field") {
        // For single field, can be string or object with name/idFile
        schema = yup
          .mixed()
          .test("nameOfPurchaser-single", function (value) {
            if (!value) {
              if (required) {
                return this.createError({ message: "Name is required" })
              }
              return true
            }

            // If it's a string, validate length
            if (typeof value === "string") {
              if (value.length > 150) {
                return this.createError({
                  message: "Maximum 150 characters allowed",
                })
              }
              return true
            }

            // If it's an object, validate the name property and idFile if required
            if (typeof value === "object" && value !== null) {
              const name = (value as any).name || ""
              if (!name && required) {
                return this.createError({ message: "Name is required" })
              }
              if (name.length > 150) {
                return this.createError({
                  message: "Maximum 150 characters allowed",
                })
              }

              // Validate ID file ONLY if BOTH collect_identification is "mandatory" AND question is required
              // If collect_identification is "optional" or "no", or if question is not required, skip this validation
              // Only require ID file if name is provided (user has filled in the name)
              if (
                collectIdentification === "mandatory" &&
                required &&
                name &&
                name.trim() &&
                !(value as any).idFile
              ) {
                return this.createError({
                  message: "ID upload is required",
                  path: `${this.path}.idFile`,
                })
              }

              return true
            }

            return true
          })
          .nullable()
          .optional()
      } else {
        // For individual_names method, validate object structure
        // Use mixed() to prevent yup from coercing to string
        schema = yup
          .mixed()
          .test("nameOfPurchaser-individual", function (value) {
            if (!value) {
              if (required) {
                return this.createError({ message: "This field is required" })
              }
              return true
            }

            // Must be an object
            if (typeof value !== "object" || Array.isArray(value)) {
              return this.createError({
                message: "Invalid format for name of purchaser",
              })
            }

            const obj = value as Record<string, any>

            // Validate scenario
            if (!obj.scenario || typeof obj.scenario !== "string") {
              return this.createError({
                message: "Please select a scenario",
              })
            }

            // Validate nameFields - at least one name must be filled
            if (required) {
              const nameFields = obj.nameFields
              if (!nameFields || typeof nameFields !== "object") {
                return this.createError({
                  message: "At least one name is required",
                })
              }

              // Check if at least one name field has firstName and lastName
              const hasValidName = Object.values(nameFields).some(
                (nameData: any) => {
                  if (!nameData || typeof nameData !== "object") return false
                  const firstName = nameData.firstName
                  const lastName = nameData.lastName
                  return (
                    typeof firstName === "string" &&
                    firstName.trim() &&
                    typeof lastName === "string" &&
                    lastName.trim()
                  )
                },
              )

              if (!hasValidName) {
                return this.createError({
                  message: "First name and last name are required",
                })
              }
            }

            // Validate ID files ONLY if BOTH collect_identification is "mandatory" AND question is required
            // If collect_identification is "optional" or "no", or if question is not required, skip this validation entirely
            if (collectIdentification === "mandatory" && required) {
              const idFiles = obj.idFiles || {}
              const nameFields = obj.nameFields || {}

              // Check that each person with a name has an ID file
              const missingIds: string[] = []
              Object.keys(nameFields).forEach((prefix) => {
                const nameData = nameFields[prefix]
                if (
                  nameData &&
                  typeof nameData === "object" &&
                  nameData.firstName &&
                  nameData.firstName.trim() &&
                  nameData.lastName &&
                  nameData.lastName.trim()
                ) {
                  // This person has a name, so they need an ID file if ID is mandatory
                  if (!idFiles[prefix] || !(idFiles[prefix] instanceof File)) {
                    missingIds.push(prefix)
                  }
                }
              })

              if (missingIds.length > 0) {
                return this.createError({
                  message: "ID upload is required for all purchasers",
                  path: `${this.path}.idFiles`,
                })
              }
            }
            // If collect_identification is "optional" or "no" or undefined, no ID validation is needed

            return true
          })
          .nullable()
          .optional()
      }
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
          if (question.required && !message.trim()) {
            return this.createError({ message: "Message is required" })
          }

          // Check max length
          if (message.length > 1000) {
            return this.createError({
              message: "Maximum 1000 characters allowed",
            })
          }

          return true
        })
        .nullable()
        .optional()
      break

    case "custom":
      const answerType = (question.setupConfig as Record<string, any>)
        ?.answer_type
      if (answerType === "text") {
        schema = yup.string().max(150, "Maximum 150 characters allowed")
      } else if (answerType === "number" || answerType === "number_amount") {
        // Number inputs should be non-negative (>= 0, no negative values)
        schema = yup
          .number()
          .typeError("Please enter a valid number")
          .min(0, "Number cannot be negative")
      } else if (answerType === "textarea") {
        schema = yup.string().max(1000, "Maximum 1000 characters allowed")
      } else if (answerType === "statement") {
        // Statement questions have an optional checkbox
        const setupConfig = (question.setupConfig as Record<string, any>) || {}
        const tickboxRequirement = setupConfig.tickbox_requirement
        if (tickboxRequirement === "essential") {
          schema = yup.boolean().required("You must agree to this statement")
        } else {
          schema = yup.boolean().nullable().optional()
        }
      } else if (answerType === "email") {
        schema = yup
          .string()
          .max(150, "Maximum 150 characters allowed")
          .email("Please enter a valid email address")
          .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid email address",
          )
      } else if (answerType === "phone") {
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
          // Legacy format: string
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
        // Mark this as a lazy schema so we don't add .required() to it later
        ;(schema as any)._isLazy = true
      } else if (answerType === "time_date") {
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
                return true // Optional field, allow empty
              }

              // Handle different date formats
              let date: Date | null = null

              if (value instanceof Date) {
                date = value
              } else if (typeof value === "string") {
                date = new Date(value)
              } else if (typeof value === "object" && value !== null) {
                // Could be an object with date property
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

              // Get today's date at midnight for comparison
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const selectedDate = new Date(date)
              selectedDate.setHours(0, 0, 0, 0)

              // Check if selected date is before today
              if (selectedDate < today) {
                return this.createError({
                  message: "Date cannot be before today",
                })
              }

              return true
            },
          )
      }
      break

    case "deposit":
      // Deposit questions are complex with nested date fields
      // Validate that all deposit due dates are not before today
      schema = yup
        .mixed()
        .test(
          "deposit-dates-not-past",
          "Deposit due dates cannot be before today",
          function (value) {
            if (!value || typeof value !== "object") {
              if (required) {
                return this.createError({ message: "This field is required" })
              }
              return true // Optional field, allow empty
            }

            const depositData = value as any
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Check deposit_due (single deposit)
            if (depositData.deposit_due) {
              const date =
                depositData.deposit_due instanceof Date
                  ? depositData.deposit_due
                  : new Date(depositData.deposit_due)

              if (!isNaN(date.getTime())) {
                const selectedDate = new Date(date)
                selectedDate.setHours(0, 0, 0, 0)
                if (selectedDate < today) {
                  return this.createError({
                    message: "Deposit due date cannot be before today",
                    path: `${this.path}.deposit_due`,
                  })
                }
              }
            }

            // Check deposit_due_1, deposit_due_2, deposit_due_3 (multiple deposits)
            for (let i = 1; i <= 3; i++) {
              const dueDateKey = `deposit_due_${i}`
              if (depositData[dueDateKey]) {
                const date =
                  depositData[dueDateKey] instanceof Date
                    ? depositData[dueDateKey]
                    : new Date(depositData[dueDateKey])

                if (!isNaN(date.getTime())) {
                  const selectedDate = new Date(date)
                  selectedDate.setHours(0, 0, 0, 0)
                  if (selectedDate < today) {
                    return this.createError({
                      message: `Deposit ${i} due date cannot be before today`,
                      path: `${this.path}.${dueDateKey}`,
                    })
                  }
                }
              }
            }

            return true
          },
        )
      break

    case "attachPurchaseAgreement":
      // Can be a File, array of Files, string (URL), or array of strings (URLs)
      schema = yup.lazy((value) => {
        // If it's a File or array of Files, that's valid (will be uploaded)
        if (value instanceof File) {
          return yup.mixed()
        }
        if (Array.isArray(value) && value.every((v) => v instanceof File)) {
          return yup.array().of(yup.mixed())
        }
        // If it's a string (URL), validate as string
        if (typeof value === "string") {
          return yup.string()
        }
        // If it's an array of strings (URLs), validate as array of strings
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          return yup.array().of(yup.string())
        }
        // If it's null/undefined and required, show error
        if (value === null || value === undefined) {
          if (required) {
            return yup.mixed().required("This field is required")
          }
          return yup.mixed().nullable().optional()
        }
        // For any other type, allow it (might be in transition state)
        return yup.mixed()
      }) as unknown as yup.AnySchema
      // Mark this as a lazy schema so we don't add .required() to it later
      ;(schema as any)._isLazy = true
      break

    case "subjectToLoanApproval":
      // Complex field with nested data including supporting documents
      const setupConfig = (question.setupConfig as Record<string, any>) || {}
      const attachments = setupConfig.attachments
      const lenderDetails = setupConfig.lender_details

      // Attachments are required if attachments === "required" AND question is required
      const attachmentsRequired = attachments === "required" && required
      // Lender details are required if lender_details === "required" AND question is required
      const lenderDetailsRequired = lenderDetails === "required" && required

      if (required) {
        // Create a schema that validates the object structure
        const baseSchema = yup.object().shape({
          subjectToLoan: yup.string().required("This field is required"),
        })

        // Add validation for attachments if required
        if (attachmentsRequired) {
          schema = baseSchema.test(
            "supporting-docs-required",
            "Supporting documents are required when 'Yes' is selected",
            function (value) {
              if (!value || value.subjectToLoan !== "yes") {
                return true // Not required if "No" is selected
              }
              // Check if supporting documents file is provided
              const loanValue = value as any
              const hasSupportingDocs =
                loanValue.supportingDocs &&
                (Array.isArray(loanValue.supportingDocs)
                  ? loanValue.supportingDocs.length > 0
                  : loanValue.supportingDocs !== null)
              if (!hasSupportingDocs) {
                return this.createError({
                  message: "Supporting documents are required",
                  path: `${this.path}.supportingDocs`,
                })
              }
              return true
            },
          )
        } else {
          schema = baseSchema
        }

        // Add validation for lender details if required
        if (lenderDetailsRequired) {
          schema = (schema as any).test(
            "lender-details-required",
            "Lender details are required when 'Yes' is selected",
            function (value: any) {
              if (!value || value.subjectToLoan !== "yes") {
                return true // Not required if "No" is selected
              }
              // Check if lender details are provided
              // Lender details can be in companyName (if lender_details === "required")
              // or contactName, contactEmail, contactPhone (if lender_details === "optional" or "required")
              const hasLenderDetails =
                (value.companyName && String(value.companyName).trim()) ||
                (value.contactName && String(value.contactName).trim())
              if (!hasLenderDetails) {
                return (this as any).createError({
                  message: "Lender details are required",
                  path: `${(this as any).path}.companyName`,
                })
              }
              return true
            },
          )
        }
      } else {
        // Question is not required, but sub-fields might still be required
        schema = yup
          .mixed()
          .test("subjectToLoanApproval-optional", function (value) {
            if (!value) {
              return true // Question is optional, so empty is fine
            }

            // If "Yes" is selected, validate required sub-fields
            const loanValue = value as any
            if (loanValue.subjectToLoan === "yes") {
              // Validate attachments if required
              if (attachmentsRequired) {
                const loanValue = value as any
                const hasSupportingDocs =
                  loanValue.supportingDocs &&
                  (Array.isArray(loanValue.supportingDocs)
                    ? loanValue.supportingDocs.length > 0
                    : loanValue.supportingDocs !== null)
                if (!hasSupportingDocs) {
                  return this.createError({
                    message: "Supporting documents are required",
                    path: `${this.path}.supportingDocs`,
                  })
                }
              }

              // Validate lender details if required
              if (lenderDetailsRequired) {
                // Check if lender details are provided
                // Lender details can be in companyName (if lender_details === "required")
                // or contactName, contactEmail, contactPhone (if lender_details === "optional" or "required")
                const loanValue = value as any
                const hasLenderDetails =
                  (loanValue.companyName &&
                    String(loanValue.companyName).trim()) ||
                  (loanValue.contactName &&
                    String(loanValue.contactName).trim())
                if (!hasLenderDetails) {
                  return (this as any).createError({
                    message: "Lender details are required",
                    path: `${(this as any).path}.companyName`,
                  })
                }
              }
            }

            return true
          })
          .nullable()
          .optional()
      }
      break

    case "offerExpiry":
      // Complex field with nested data: { hasExpiry, expiryDate, expiryTime }
      // Validate that expiryDate is not before today
      schema = yup
        .mixed()
        .test(
          "expiry-date-not-past",
          "Date cannot be before today",
          function (value) {
            if (!value || typeof value !== "object") {
              if (required) {
                return this.createError({ message: "This field is required" })
              }
              return true // Optional field, allow empty
            }

            const expiryData = value as any
            const expiryDate = expiryData.expiryDate

            // If no expiry date, check if required
            if (!expiryDate) {
              if (required && expiryData.hasExpiry !== "no") {
                return this.createError({ message: "Expiry date is required" })
              }
              return true
            }

            // Convert to Date if it's a string
            const date =
              expiryDate instanceof Date ? expiryDate : new Date(expiryDate)

            // Check if date is valid
            if (isNaN(date.getTime())) {
              return this.createError({ message: "Please enter a valid date" })
            }

            // Get today's date at midnight for comparison
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const selectedDate = new Date(date)
            selectedDate.setHours(0, 0, 0, 0)

            // Check if selected date is before today
            if (selectedDate < today) {
              return this.createError({
                message: "Date cannot be before today",
                path: `${this.path}.expiryDate`,
              })
            }

            return true
          },
        )
        .nullable()
      break

    case "settlementDate":
      // Complex field with nested data: { settlementDate, settlementTime, ... }
      // Validate that settlementDate is not before today
      schema = yup
        .mixed()
        .test(
          "settlement-date-not-past",
          "Date cannot be before today",
          function (value) {
            if (!value || typeof value !== "object") {
              if (required) {
                return this.createError({ message: "This field is required" })
              }
              return true // Optional field, allow empty
            }

            const settlementData = value as any
            const settlementDate = settlementData.settlementDate

            // If no settlement date, check if required
            if (!settlementDate) {
              if (required) {
                return this.createError({
                  message: "Settlement date is required",
                })
              }
              return true
            }

            // Convert to Date if it's a string
            const date =
              settlementDate instanceof Date
                ? settlementDate
                : new Date(settlementDate)

            // Check if date is valid
            if (isNaN(date.getTime())) {
              return this.createError({ message: "Please enter a valid date" })
            }

            // Get today's date at midnight for comparison
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const selectedDate = new Date(date)
            selectedDate.setHours(0, 0, 0, 0)

            // Check if selected date is before today
            if (selectedDate < today) {
              return this.createError({
                message: "Date cannot be before today",
                path: `${this.path}.settlementDate`,
              })
            }

            return true
          },
        )
        .nullable()
      break

    case "submitterRole":
      // Simple select field
      schema = yup.string().max(150, "Maximum 150 characters allowed")
      break

    default:
      // Default validation for unknown types
      schema = yup.string().max(150, "Maximum 150 characters allowed")
  }

  // Add required validation if needed
  // Skip adding .required() to lazy schemas as they handle it internally
  if (required && schema && !(schema as any)._isLazy) {
    schema = schema.required("This field is required")
  } else if (schema && !required && !(schema as any)._isLazy) {
    // For optional fields, allow empty strings, null, and undefined
    // Use transform to normalize empty values
    if (schema instanceof yup.StringSchema) {
      schema = schema
        .nullable()
        .optional()
        .transform((value) => {
          // Convert empty strings to undefined for optional string fields
          if (value === "" || value === null) return undefined
          return value
        })
    } else {
      schema = schema.nullable().optional()
    }
  }

  return schema
}

/**
 * Builds a complete validation schema for all questions in a form
 */
export const buildFormValidationSchema = (
  questions: Question[],
  isTestMode?: boolean,
): yup.ObjectSchema<Record<string, any>> => {
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

    // In test mode, make specifyListing optional
    const isRequired =
      isTestMode && question.type === "specifyListing"
        ? false
        : question.required

    const schema = buildQuestionValidation({
      ...question,
      required: isRequired,
    })
    if (schema) {
      // Use question ID as the key
      shape[question.id] = schema
    }
  })

  return yup.object().shape(shape)
}

/**
 * Validates file size (max 10MB)
 */
export const validateFileSize = (file: File | null): string | null => {
  if (!file) return null
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return "File size must be less than 10MB"
  }
  return null
}

/**
 * Validates multiple files for upload
 * @param files - Array of File objects
 * @param maxFiles - Maximum number of files allowed (default: 3)
 * @param maxTotalSize - Maximum total size in bytes (default: 10MB)
 * @returns Error message if validation fails, null if valid
 */
export const validateMultipleFiles = (
  files: File[],
  maxFiles: number = 3,
  maxTotalSize: number = 10 * 1024 * 1024, // 10MB
): string | null => {
  if (files.length === 0) return null

  // Check max number of files
  if (files.length > maxFiles) {
    return `Maximum ${maxFiles} files allowed`
  }

  // Check individual file sizes
  for (const file of files) {
    const fileError = validateFileSize(file)
    if (fileError) {
      return fileError
    }
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalSize) {
    const maxSizeMB = (maxTotalSize / (1024 * 1024)).toFixed(0)
    return `Total file size must be less than ${maxSizeMB}MB`
  }

  return null
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9\s\-\(\)\+]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8
}
