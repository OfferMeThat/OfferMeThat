"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BrandingConfig } from "@/types/branding"
import { parseUIConfig } from "@/types/questionUIConfig"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import * as yup from "yup"
import { QuestionRenderer } from "../offerForm/QuestionRenderer"
import Heading from "./typography/Heading"

// Generic question and page types
type GenericQuestion = {
  id: string
  type: string
  order: number
  required: boolean
  uiConfig: any
  setupConfig?: any
  formId: string
  pageId: string | null
}

type GenericPage = {
  id: string
  order: number
  breakIndex: number | null
  title: string
  description?: string | null
}

interface FormPreviewProps {
  questions: GenericQuestion[]
  pages: GenericPage[]
  isLoading?: boolean
  title?: string
  description?: string
  brandingConfig?: BrandingConfig
  profilePictureUrl?: string | null
  questionTypeToLabel?: Record<string, string>
  buildValidationSchema?: (
    questions: GenericQuestion[],
    isTestMode?: boolean,
  ) => yup.AnySchema
  isTestMode?: boolean
  formType?: "offer" | "lead"
}

/**
 * Reusable form preview component that displays questions with consistent styling
 * Can be used for both offer forms and lead forms
 * All inputs are functional - validation works but nothing is submitted
 */
export const FormPreview = ({
  questions,
  pages,
  isLoading = false,
  title = "Form",
  description,
  brandingConfig,
  profilePictureUrl,
  questionTypeToLabel = {},
  buildValidationSchema,
  isTestMode = false,
  formType = "offer",
}: FormPreviewProps) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Build validation schema
  const validationSchema = useCallback(() => {
    if (buildValidationSchema) {
      return buildValidationSchema(questions, isTestMode)
    }
    // Fallback: return empty schema if no validation builder provided
    return yup.object().shape({})
  }, [questions, isTestMode, buildValidationSchema])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Organize questions by pages (same logic as OfferFormInteractiveView)
  const organizeQuestionsByPages = () => {
    const sortedPages = [...pages].sort((a, b) => a.order - b.order)
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

    const pageStructure: {
      page: GenericPage
      questions: GenericQuestion[]
    }[] = []

    sortedPages.forEach((page, index) => {
      const isFirstPage = index === 0
      const nextPage = sortedPages[index + 1]

      let pageQuestions: GenericQuestion[]

      if (isFirstPage) {
        const firstBreak = sortedPages.find((p) => p.breakIndex !== null)
        if (firstBreak && firstBreak.breakIndex !== null) {
          pageQuestions = sortedQuestions.filter(
            (q) => q.order <= firstBreak.breakIndex!,
          )
        } else {
          pageQuestions = sortedQuestions
        }
      } else {
        const prevPage = sortedPages[index - 1]
        const prevBreakIndex = prevPage.breakIndex || 0
        const currentBreakIndex = nextPage?.breakIndex || sortedQuestions.length

        pageQuestions = sortedQuestions.filter(
          (q) => q.order > prevBreakIndex && q.order <= currentBreakIndex,
        )
      }

      pageStructure.push({ page, questions: pageQuestions })
    })

    return pageStructure
  }

  const pageStructure = organizeQuestionsByPages()
  const currentPage = pageStructure[currentPageIndex]
  const totalPages = pageStructure.length
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1

  const validateCurrentPage = async (): Promise<boolean> => {
    if (!currentPage || !buildValidationSchema) return true

    try {
      // Build schema ONLY for current page questions
      const currentPageQuestions = currentPage.questions.filter(
        (q) => q.type !== "submitButton",
      )
      const pageSchema = buildValidationSchema(currentPageQuestions, isTestMode)

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

      // In preview mode, show confirmation and reset form
      const formTypeLabel = formType === "offer" ? "offer" : "lead"
      toast.success(
        `✓ Your form is working! This is a preview - your ${formTypeLabel} was not actually submitted.`,
        {
          duration: 5000,
        },
      )
      setFormData({})
      setCurrentPageIndex(0)
      setValidationErrors({})
      setTouchedFields(new Set())
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = { ...validationErrors }
        error.inner.forEach((err) => {
          if (err.path) {
            // For nested phone errors (e.g., submitterPhone.countryCode, submitterPhone.number),
            // show error at the parent field level
            const pathParts = err.path.split(".")
            if (pathParts.length > 1) {
              const parentPath = pathParts[0]
              // Only set error if parent path doesn't already have an error
              // This ensures we show "This number is invalid" for phone fields
              if (!newErrors[parentPath]) {
                newErrors[parentPath] = err.message
              }
            } else {
              newErrors[err.path] = err.message
            }
          }
        })
        setValidationErrors(newErrors)

        // Mark all fields as touched
        const newTouched = new Set(touchedFields)
        questions.forEach((question) => {
          if (question.type !== "submitButton") {
            newTouched.add(question.id)
          }
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

        toast.error("Please fill all required fields correctly")
      }
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))

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

    if (!buildValidationSchema) return

    // Validate single field
    const question = questions.find((q) => q.id === fieldId)
    if (!question || question.type === "submitButton") return

    try {
      const fieldSchema = buildValidationSchema([question], isTestMode)
      const fieldData = { [fieldId]: formData[fieldId] }
      await fieldSchema.validate(fieldData, { abortEarly: false })

      // Clear error if validation passes
      if (validationErrors[fieldId]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        })
      }
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const newErrors = { ...validationErrors }
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message
          }
        })
        setValidationErrors(newErrors)
      }
    }
  }

  if (!currentPage || currentPage.questions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No questions configured yet.</p>
        <p className="mt-2 text-sm">
          Add questions in the form builder to see a preview.
        </p>
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
      </div>

      {!isFirstPage && (
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="mx-auto w-1/2 gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* Questions */}
      <div className="space-y-0">
        {currentPage.questions.map((question, index) => {
          // Skip rendering the submit button in the questions list
          if (question.type === "submitButton") {
            return null
          }

          const uiConfig = parseUIConfig(question.uiConfig)
          const setupConfig = question.setupConfig || {}

          // Get label with proper fallback order
          const isStatementQuestion =
            question.type === "custom" &&
            setupConfig.answer_type === "statement"

          let label: string
          if (isStatementQuestion) {
            label = setupConfig.question_text || "Question"
          } else {
            label = uiConfig.label
            if (!label) {
              if (question.type === "custom") {
                label =
                  setupConfig.question_text ||
                  questionTypeToLabel[question.type] ||
                  "Question"
              } else {
                label = questionTypeToLabel[question.type] || "Question"
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
                  {question.required &&
                    !(isTestMode && question.type === "specifyListing") && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                </label>
                <QuestionRenderer
                  question={question as any}
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
                  isTestMode={isTestMode}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation / Submit */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {!isLastPage ? (
          <Button
            onClick={handleNext}
            className="mx-auto w-1/2 gap-2"
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
            className="mx-auto w-1/2 gap-2"
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
                  const submitUiConfig = parseUIConfig(
                    submitButtonQuestion?.uiConfig || {},
                  )
                  return (
                    submitUiConfig.label ||
                    (formType === "offer" ? "Submit Offer" : "Submit")
                  )
                })()
              : formType === "offer"
                ? "Submit Offer"
                : "Submit"}
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
