"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QUESTION_TYPE_TO_LABEL } from "@/constants/offerFormQuestions"
import { buildFormValidationSchema } from "@/lib/offerFormValidation"
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
        const value = formData[question.id]
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
      const schema = validationSchema()
      await schema.validate(formData, { abortEarly: false })

      // In a real implementation, this would submit the form data
      console.log("Form submitted with data:", formData)
      toast.success("Form submitted successfully!")
    } catch (error) {
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

        toast.error("Fill all of the required fields to proceed")
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
      <div className="space-y-6">
        {currentPage.questions.map((question) => {
          // Skip rendering the submit button in the questions list
          if (question.type === "submitButton") {
            return null
          }

          const uiConfig = (question.uiConfig as Record<string, any>) || {}
          const setupConfig =
            (question.setupConfig as Record<string, any>) || {}

          // Get label with proper fallback order:
          // 1. User-customized label from uiConfig
          // 2. Default label from QUESTION_TYPE_TO_LABEL
          // 3. For custom questions, check setupConfig.question_text
          // 4. Fallback to "Question"
          let label = uiConfig.label
          if (!label) {
            if (question.type === "custom") {
              // For custom questions, use the question text from setupConfig
              label =
                setupConfig.question_text ||
                QUESTION_TYPE_TO_LABEL[question.type] ||
                "Question"
            } else {
              // For standard questions, use the default label from constants
              label = QUESTION_TYPE_TO_LABEL[question.type] || "Question"
            }
          }

          return (
            <div
              key={question.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <label
                className="mb-3 block text-base font-medium"
                style={{
                  color: brandingConfig?.fontColor || undefined,
                }}
              >
                {label}
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
