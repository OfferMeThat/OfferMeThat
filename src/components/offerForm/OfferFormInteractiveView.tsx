"use client"

import { saveOffer } from "@/app/actions/offers"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QUESTION_TYPE_TO_LABEL } from "@/constants/offerFormQuestions"
import { buildFormValidationSchema } from "@/lib/offerFormValidation"
import {
  uploadFileToStorageClient,
  uploadMultipleFilesToStorageClient,
} from "@/lib/supabase/clientStorage"
import { BrandingConfig } from "@/types/branding"
import { Database } from "@/types/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import * as yup from "yup"
import Heading from "../shared/typography/Heading"
import { QuestionRenderer } from "./QuestionRenderer"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["offerFormPages"]["Row"]

interface OfferFormInteractiveViewProps {
  questions: Question[]
  pages: Page[]
  isLoading?: boolean
  title?: string
  description?: string
  brandingConfig?: BrandingConfig
  profilePictureUrl?: string | null
  formId?: string // Add formId to identify which form is being submitted
  isPreviewMode?: boolean
  isTestMode?: boolean
}

/**
 * Reusable component that displays an interactive offer form with pagination support
 * Can be used in modals, standalone pages, or embedded views
 */
export const OfferFormInteractiveView = ({
  questions,
  pages,
  isLoading = false,
  title = "Offer Form",
  description,
  brandingConfig,
  profilePictureUrl,
  formId,
  isPreviewMode = false,
  isTestMode = false,
}: OfferFormInteractiveViewProps) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Build validation schema
  const validationSchema = useCallback(() => {
    return buildFormValidationSchema(questions)
  }, [questions])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Organize questions by pages
  const organizeQuestionsByPages = () => {
    const sortedPages = [...pages].sort((a, b) => a.order - b.order)
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

    // Create page structure
    const pageStructure: {
      page: Page
      questions: Question[]
    }[] = []

    sortedPages.forEach((page, index) => {
      const isFirstPage = index === 0
      const nextPage = sortedPages[index + 1]

      let pageQuestions: Question[]

      if (isFirstPage) {
        // First page: questions from start until first breakIndex
        const firstBreak = sortedPages.find((p) => p.breakIndex !== null)
        if (firstBreak && firstBreak.breakIndex !== null) {
          pageQuestions = sortedQuestions.filter(
            (q) => q.order <= firstBreak.breakIndex!,
          )
        } else {
          // No breaks, all questions on first page
          pageQuestions = sortedQuestions
        }
      } else {
        // Subsequent pages: questions after this page's breakIndex until next breakIndex
        const currentBreakIndex = page.breakIndex!
        const nextBreakIndex = nextPage?.breakIndex

        pageQuestions = sortedQuestions.filter((q) => {
          if (nextBreakIndex !== null && nextBreakIndex !== undefined) {
            return q.order > currentBreakIndex && q.order <= nextBreakIndex
          } else {
            return q.order > currentBreakIndex
          }
        })
      }

      pageStructure.push({
        page,
        questions: pageQuestions,
      })
    })

    return pageStructure
  }

  const pageStructure = organizeQuestionsByPages()
  const currentPage = pageStructure[currentPageIndex]
  const totalPages = pageStructure.length
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1

  const validateCurrentPage = async (): Promise<boolean> => {
    if (!currentPage) return true

    try {
      // Build schema ONLY for current page questions
      const currentPageQuestions = currentPage.questions.filter(
        (q) => q.type !== "submitButton",
      )
      const pageSchema = buildFormValidationSchema(currentPageQuestions)

      const currentPageData: Record<string, any> = {}

      // Collect data for current page questions
      currentPageQuestions.forEach((question) => {
        let value = formData[question.id]

        // For offerAmount questions, ensure currency is set if amount is present
        if (
          question.type === "offerAmount" &&
          value &&
          typeof value === "object"
        ) {
          if (
            value.amount !== undefined &&
            value.amount !== "" &&
            !value.currency
          ) {
            value = { ...value, currency: "USD" }
          }
        }

        // Preserve the actual value - don't convert to null/undefined
        // Empty strings should be preserved so validation can work correctly
        currentPageData[question.id] = value
      })

      // Validate current page
      await pageSchema.validate(currentPageData, { abortEarly: false })

      // Clear errors for current page
      const newErrors = { ...validationErrors }
      currentPage.questions.forEach((question) => {
        if (question.type === "submitButton") return
        delete newErrors[question.id]
      })
      setValidationErrors(newErrors)

      return true
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        console.log(
          "Validation errors:",
          error.inner.map((e) => ({
            path: e.path,
            message: e.message,
            value: e.value,
          })),
        )

        const newErrors: Record<string, string> = { ...validationErrors }
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message
          }
        })
        setValidationErrors(newErrors)

        // Mark all fields on current page as touched
        const newTouched = new Set(touchedFields)
        currentPage.questions.forEach((question) => {
          if (question.type === "submitButton") return
          newTouched.add(question.id)
        })
        setTouchedFields(newTouched)

        // Scroll to first error
        const firstErrorField = error.inner[0]?.path
        if (firstErrorField) {
          const errorElement = document.querySelector(
            `[data-field-id="${firstErrorField}"]`,
          )
          errorElement?.scrollIntoView({ behavior: "smooth", block: "center" })
        }

        toast.error("Fill all of the required fields to proceed")
        return false
      }
      return false
    }
  }

  const handleNext = async () => {
    if (!isLastPage) {
      const isValid = await validateCurrentPage()
      if (isValid) {
        setCurrentPageIndex((prev) => prev + 1)
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handlePrevious = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    try {
      // Ensure offerAmount questions have currency set before validation
      const validationData = { ...formData }
      questions.forEach((question) => {
        if (question.type === "offerAmount" && validationData[question.id]) {
          const value = validationData[question.id]
          if (typeof value === "object" && value !== null) {
            if (
              value.amount !== undefined &&
              value.amount !== "" &&
              !value.currency
            ) {
              validationData[question.id] = { ...value, currency: "USD" }
            }
          }
        }
      })

      const schema = validationSchema()
      await schema.validate(validationData, { abortEarly: false })

      // If in preview mode, show confirmation and reset form
      if (isPreviewMode) {
        toast.success(
          "✓ Your form is working! This is a preview - your offer was not actually submitted.",
          {
            duration: 5000,
          },
        )
        setFormData({})
        setCurrentPageIndex(0)
        setValidationErrors({})
        setTouchedFields(new Set())
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      // Check if formId is available
      if (!formId) {
        toast.error("Form ID is missing. Cannot submit offer.")
        return
      }

      // Show loading state
      toast.loading("Uploading files...", { id: "submitting-offer" })

      // Generate a temporary offer ID for file organization
      const tempOfferId = crypto.randomUUID()

      // Upload files to Supabase Storage first (client-side)
      // This prevents sending large File objects through server actions
      const processedFormData = { ...formData }

      // Helper to check if value is a File
      const isFile = (value: any): value is File => {
        return value instanceof File
      }

      // Helper to check if value is an array of Files
      const isFileArray = (value: any): value is File[] => {
        return (
          Array.isArray(value) && value.length > 0 && value[0] instanceof File
        )
      }

      // Process form data and upload files
      for (const [questionId, value] of Object.entries(processedFormData)) {
        if (!value) continue

        const question = questions.find((q) => q.id === questionId)
        if (!question) continue

        // Handle purchase agreement
        if (question.type === "attachPurchaseAgreement" && isFile(value)) {
          const timestamp = Date.now()
          const fileExtension = value.name.split(".").pop() || "file"
          const fileName = `${timestamp}-${value.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
          const path = `${tempOfferId}/purchase-agreement/${fileName}`

          const fileUrl = await uploadFileToStorageClient(
            "offer-documents",
            path,
            value,
          )
          processedFormData[questionId] = fileUrl
        }

        // Handle name of purchaser ID files
        if (
          question.type === "nameOfPurchaser" &&
          typeof value === "object" &&
          value !== null
        ) {
          const purchaserData = value as any

          // Check if it's single_field (has name but no scenario) or individual_names (has scenario)
          const isSingleField = purchaserData.name && !purchaserData.scenario
          const isIndividualNames = purchaserData.scenario

          // Single field method - single ID file
          if (isSingleField && isFile(purchaserData.idFile)) {
            const timestamp = Date.now()
            const fileExtension =
              purchaserData.idFile.name.split(".").pop() || "file"
            const fileName = `${timestamp}-${purchaserData.idFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
            const path = `${tempOfferId}/purchaser-ids/${fileName}`

            const fileUrl = await uploadFileToStorageClient(
              "offer-ids",
              path,
              purchaserData.idFile,
            )
            processedFormData[questionId] = {
              method: "single_field",
              name: purchaserData.name,
              idFileUrl: fileUrl,
            }
          } else if (isSingleField && !isFile(purchaserData.idFile)) {
            // Single field without file - just preserve the structure
            processedFormData[questionId] = {
              method: "single_field",
              name: purchaserData.name || value,
            }
          }

          // Individual names method - multiple ID files
          if (
            isIndividualNames &&
            purchaserData.idFiles &&
            typeof purchaserData.idFiles === "object"
          ) {
            const idFiles = purchaserData.idFiles as Record<string, File>
            const uploadedUrls: Record<string, string> = {}

            for (const [key, file] of Object.entries(idFiles)) {
              if (isFile(file)) {
                const timestamp = Date.now()
                const fileExtension = file.name.split(".").pop() || "file"
                const fileName = `${timestamp}-${key}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
                const path = `${tempOfferId}/purchaser-ids/${fileName}`

                const fileUrl = await uploadFileToStorageClient(
                  "offer-ids",
                  path,
                  file,
                )
                uploadedUrls[key] = fileUrl
              }
            }

            processedFormData[questionId] = {
              method: "individual_names",
              ...purchaserData,
              idFileUrls: uploadedUrls,
            }
            delete processedFormData[questionId].idFiles
          } else if (isIndividualNames && !purchaserData.idFiles) {
            // Individual names without files - just preserve the structure
            processedFormData[questionId] = {
              method: "individual_names",
              ...purchaserData,
            }
          }
        }

        // Handle subject to loan approval supporting documents
        if (
          question.type === "subjectToLoanApproval" &&
          typeof value === "object" &&
          value !== null
        ) {
          const loanData = value as any

          if (isFile(loanData.supportingDocs)) {
            const timestamp = Date.now()
            const fileExtension =
              loanData.supportingDocs.name.split(".").pop() || "file"
            const fileName = `${timestamp}-${loanData.supportingDocs.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
            const path = `${tempOfferId}/loan-documents/${fileName}`

            const fileUrl = await uploadFileToStorageClient(
              "offer-documents",
              path,
              loanData.supportingDocs,
            )
            processedFormData[questionId] = {
              ...loanData,
              supportingDocsUrl: fileUrl,
            }
            delete processedFormData[questionId].supportingDocs
          } else if (isFileArray(loanData.supportingDocs)) {
            const urls = await uploadMultipleFilesToStorageClient(
              "offer-documents",
              loanData.supportingDocs,
              tempOfferId,
              "loan-documents",
            )
            processedFormData[questionId] = {
              ...loanData,
              supportingDocsUrls: urls,
            }
            delete processedFormData[questionId].supportingDocs
          }
        }

        // Handle message to agent attachments
        if (
          question.type === "messageToAgent" &&
          typeof value === "object" &&
          value !== null
        ) {
          const messageData = value as any

          if (isFileArray(messageData.attachments)) {
            const urls = await uploadMultipleFilesToStorageClient(
              "offer-attachments",
              messageData.attachments,
              tempOfferId,
              "message-attachments",
            )
            processedFormData[questionId] = {
              ...messageData,
              attachmentUrls: urls,
            }
            delete processedFormData[questionId].attachments
          }
        }

        // Handle custom question file uploads
        if (
          question.type === "custom" &&
          typeof value !== "string" &&
          typeof value !== "number" &&
          typeof value !== "boolean"
        ) {
          const setupConfig =
            (question.setupConfig as Record<string, any>) || {}
          const answerType = setupConfig.answer_type

          if (answerType === "file_upload") {
            if (isFile(value)) {
              const timestamp = Date.now()
              const fileExtension = value.name.split(".").pop() || "file"
              const fileName = `${timestamp}-${value.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
              const path = `${tempOfferId}/custom-files/${questionId}/${fileName}`

              const fileUrl = await uploadFileToStorageClient(
                "offer-attachments",
                path,
                value,
              )
              processedFormData[questionId] = fileUrl
            } else if (isFileArray(value)) {
              const urls = await uploadMultipleFilesToStorageClient(
                "offer-attachments",
                value,
                tempOfferId,
                `custom-files-${questionId}`,
              )
              processedFormData[questionId] = urls
            }
          }
        }
      }

      toast.loading("Submitting your offer...", { id: "submitting-offer" })

      // Save offer to database (now with URLs instead of File objects)
      const result = await saveOffer({
        formData: processedFormData,
        questions,
        formId,
        isTest: isTestMode,
      })

      if (result.success) {
        toast.success("Your offer has been submitted successfully!", {
          id: "submitting-offer",
        })
        // Optionally reset form or redirect
        setFormData({})
        setCurrentPageIndex(0)
      } else {
        toast.error(
          result.error || "Failed to submit offer. Please try again.",
          {
            id: "submitting-offer",
          },
        )
      }
    } catch (error) {
      console.error("Error submitting offer:", error)
      if (error instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {}
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message
          }
        })
        setValidationErrors(newErrors)

        // Mark all fields as touched
        const allFieldIds = questions
          .filter((q) => q.type !== "submitButton")
          .map((q) => q.id)
        setTouchedFields(new Set(allFieldIds))

        // Scroll to first error
        const firstErrorField = error.inner[0]?.path
        if (firstErrorField) {
          const errorElement = document.querySelector(
            `[data-field-id="${firstErrorField}"]`,
          )
          errorElement?.scrollIntoView({ behavior: "smooth", block: "center" })
        }

        toast.error("Fill all of the required fields to proceed", {
          id: "submitting-offer",
        })
      } else {
        toast.error("An error occurred. Please try again.", {
          id: "submitting-offer",
        })
      }
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

    // Clear error for this field when user starts typing
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const handleFieldBlur = async (fieldId: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldId))

    // Validate single field
    try {
      const schema = validationSchema() as yup.ObjectSchema<any>
      const fieldSchema = schema.fields[fieldId]
      if (fieldSchema && "validate" in fieldSchema) {
        await (fieldSchema as yup.AnySchema).validate(formData[fieldId])
        // Clear error if validation passes
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        })
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldId]: error.message,
        }))
      }
    }
  }

  if (!currentPage) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">No questions available</p>
      </div>
    )
  }

  // Check if submit button is on current page
  const hasSubmitButton = currentPage.questions.some(
    (q) => q.type === "submitButton",
  )

  return (
    <div className="w-full">
      {/* Profile Picture and Logo */}
      {(profilePictureUrl || brandingConfig?.logo) && (
        <div className="mb-6 flex flex-col items-center gap-4">
          {/* Profile Picture - Round, above logo */}
          {profilePictureUrl && (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {/* Logo - Below profile picture */}
          {brandingConfig?.logo && (
            <div className="relative h-16 w-auto">
              <img
                src={brandingConfig.logo}
                alt="Logo"
                className="h-full w-auto object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Heading
          as="h2"
          size="large"
          weight="bold"
          style={{
            color: brandingConfig?.fontColor || undefined,
          }}
          className="text-center"
        >
          {title}
        </Heading>
        {description && (
          <p
            className="mt-2 mb-10 text-center text-sm opacity-80"
            style={{
              color: brandingConfig?.fontColor || undefined,
            }}
          >
            {description}
          </p>
        )}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <div className="flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{
                    width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-0">
        {currentPage.questions.map((question, index) => {
          // Skip rendering the submit button in the questions list
          if (question.type === "submitButton") {
            return null
          }

          const uiConfig = (question.uiConfig as Record<string, any>) || {}
          const setupConfig =
            (question.setupConfig as Record<string, any>) || {}

          // Get label with proper fallback order:
          // 1. For statement questions, always use setupConfig.question_text
          // 2. User-customized label from uiConfig
          // 3. For custom questions, check setupConfig.question_text
          // 4. Default label from QUESTION_TYPE_TO_LABEL
          // 5. Fallback to "Question"
          const isStatementQuestion =
            question.type === "custom" &&
            setupConfig.answer_type === "statement"

          let label: string
          if (isStatementQuestion) {
            // For statement questions, use the question text from setupConfig
            label = setupConfig.question_text || "Question"
          } else {
            label = uiConfig.label
            if (!label) {
              if (question.type === "custom") {
                // For other custom questions, use the question text from setupConfig
                label =
                  setupConfig.question_text ||
                  QUESTION_TYPE_TO_LABEL[question.type] ||
                  "Question"
              } else {
                // For standard questions, use the default label from constants
                label = QUESTION_TYPE_TO_LABEL[question.type] || "Question"
              }
            }
          }

          const displayLabel = label

          // Check if this is the first question
          const isFirstQuestion = index === 0

          return (
            <div key={question.id}>
              {/* Decorative divider (not shown for first question) */}
              {!isFirstQuestion && (
                <div className="my-4 border-t border-gray-200" />
              )}

              <div className="py-4">
                <label
                  className="mb-3 block text-base font-medium"
                  style={{
                    color: brandingConfig?.fontColor || undefined,
                  }}
                >
                  {displayLabel}
                  {question.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                <QuestionRenderer
                  question={question}
                  disabled={false}
                  editingMode={false}
                  formId={question.formId}
                  brandingConfig={brandingConfig}
                  value={formData[question.id]}
                  onChange={(value) => handleFieldChange(question.id, value)}
                  onBlur={() => handleFieldBlur(question.id)}
                  error={
                    touchedFields.has(question.id)
                      ? validationErrors[question.id]
                      : undefined
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation / Submit */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstPage}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {!isLastPage ? (
          <Button
            onClick={handleNext}
            className="gap-2"
            style={{
              backgroundColor: brandingConfig?.buttonColor || undefined,
              color: brandingConfig?.buttonTextColor || undefined,
            }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleSubmit}
            className="gap-2"
            style={{
              backgroundColor: brandingConfig?.buttonColor || undefined,
              color: brandingConfig?.buttonTextColor || undefined,
            }}
          >
            {hasSubmitButton
              ? (() => {
                  const submitButtonQuestion = currentPage.questions.find(
                    (q) => q.type === "submitButton",
                  )
                  const submitUiConfig =
                    (submitButtonQuestion?.uiConfig as Record<string, any>) ||
                    {}
                  return submitUiConfig.label || "Submit Offer"
                })()
              : "Submit Offer"}
          </Button>
        )}
      </div>

      {/* Page indicator for mobile */}
      {totalPages > 1 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Page {currentPageIndex + 1} of {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}
