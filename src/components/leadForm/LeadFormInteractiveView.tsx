"use client"

import { saveLead } from "@/app/actions/leadForm"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { QUESTION_TYPE_TO_LABEL } from "@/constants/leadFormQuestions"
import { buildFormValidationSchema } from "@/lib/leadFormValidation"
import {
  uploadFileToStorageClient,
  uploadMultipleFilesToStorageClient,
} from "@/lib/supabase/clientStorage"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"
import { Database } from "@/types/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import * as yup from "yup"
import { QuestionRenderer } from "../offerForm/QuestionRenderer"
import Heading from "../shared/typography/Heading"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["leadFormPages"]["Row"]

interface LeadFormInteractiveViewProps {
  questions: Question[]
  pages: Page[]
  isLoading?: boolean
  title?: string
  description?: string
  brandingConfig?: BrandingConfig
  profilePictureUrl?: string | null
  formId?: string
  ownerId?: string
  isPreviewMode?: boolean
}

/**
 * Reusable component that displays an interactive lead form with pagination support
 * Can be used in modals, standalone pages, or embedded views
 */
export const LeadFormInteractiveView = ({
  questions,
  pages,
  isLoading = false,
  title = "Lead Form",
  description,
  brandingConfig,
  profilePictureUrl,
  formId,
  ownerId,
  isPreviewMode = false,
}: LeadFormInteractiveViewProps) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Build validation schema
  const validationSchema = useCallback(() => {
    return buildFormValidationSchema(questions, false)
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

    const pageStructure: {
      page: Page
      questions: Question[]
    }[] = []

    sortedPages.forEach((page, index) => {
      const isFirstPage = index === 0
      const nextPage = sortedPages[index + 1]

      let pageQuestions: Question[]

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
      const currentPageQuestions = currentPage.questions.filter(
        (q) => q.type !== "submitButton",
      )
      const pageSchema = buildFormValidationSchema(currentPageQuestions, false)

      const currentPageData: Record<string, any> = {}

      currentPageQuestions.forEach((question) => {
        let value = formData[question.id]
        currentPageData[question.id] = value
      })

      await pageSchema.validate(currentPageData, { abortEarly: false })
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

        const newTouched = new Set(touchedFields)
        currentPage.questions.forEach((question) => {
          if (question.type !== "submitButton") return
          newTouched.add(question.id)
        })
        setTouchedFields(newTouched)

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
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handlePrevious = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    try {
      const schema = validationSchema()
      await schema.validate(formData, { abortEarly: false })

      if (isPreviewMode) {
        toast.success(
          "✓ Your form is working! This is a preview - your lead was not actually submitted.",
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

      if (!formId) {
        toast.error("Form ID is missing. Cannot submit lead.")
        return
      }

      toast.loading("Uploading files...", { id: "submitting-lead" })

      const tempLeadId = crypto.randomUUID()
      const processedFormData = { ...formData }

      const isFile = (value: any): value is File => {
        return value instanceof File
      }

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

        // Handle message to agent attachments
        if (
          question.type === "messageToAgent" &&
          typeof value === "object" &&
          value !== null
        ) {
          const messageData = value as any

          if (isFileArray(messageData.attachments)) {
            const urls = await uploadMultipleFilesToStorageClient(
              "lead-attachments",
              messageData.attachments,
              tempLeadId,
              "message-attachments",
            )
            processedFormData[questionId] = {
              ...messageData,
              attachmentUrls: urls,
            }
            delete (processedFormData[questionId] as any).attachments
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
              const path = `${tempLeadId}/custom-files/${questionId}/${fileName}`

              const fileUrl = await uploadFileToStorageClient(
                "lead-attachments",
                path,
                value,
              )
              processedFormData[questionId] = fileUrl
            } else if (isFileArray(value)) {
              const urls = await uploadMultipleFilesToStorageClient(
                "lead-attachments",
                value,
                tempLeadId,
                `custom-files-${questionId}`,
              )
              processedFormData[questionId] = urls
            }
          }
        }
      }

      toast.loading("Submitting your lead...", { id: "submitting-lead" })

      const result = await saveLead({
        formData: processedFormData,
        questions,
        formId,
      })

      if (result.success) {
        toast.success("Your lead has been submitted successfully!", {
          id: "submitting-lead",
        })
        setFormData({})
        setCurrentPageIndex(0)
      } else {
        toast.error(
          result.error || "Failed to submit lead. Please try again.",
          {
            id: "submitting-lead",
          },
        )
      }
    } catch (error) {
      console.error("Error submitting lead:", error)
      if (error instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {}
        error.inner.forEach((err) => {
          if (err.path) {
            newErrors[err.path] = err.message
          }
        })
        setValidationErrors(newErrors)

        const allFieldIds = questions
          .filter((q) => q.type !== "submitButton")
          .map((q) => q.id)
        setTouchedFields(new Set(allFieldIds))

        const firstErrorField = error.inner[0]?.path
        if (firstErrorField) {
          const errorElement = document.querySelector(
            `[data-field-id="${firstErrorField}"]`,
          )
          errorElement?.scrollIntoView({ behavior: "smooth", block: "center" })
        }

        toast.error("Fill all of the required fields to proceed", {
          id: "submitting-lead",
        })
      } else {
        toast.error("An error occurred. Please try again.", {
          id: "submitting-lead",
        })
      }
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

    if (validationErrors[fieldId]) {
      if (
        typeof value === "object" &&
        value !== null &&
        "countryCode" in value &&
        "number" in value
      ) {
        const phoneValue = value as { countryCode: string; number: string }
        if (
          phoneValue.countryCode &&
          phoneValue.number &&
          phoneValue.number.trim() !== ""
        ) {
          const digits = phoneValue.number.replace(/\D/g, "")
          if (digits.length >= 4) {
            setValidationErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors[fieldId]
              return newErrors
            })
          }
        }
      } else if (value !== undefined && value !== null && value !== "") {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldId]
          return newErrors
        })
      }
    }
  }

  const handleFieldBlur = async (fieldId: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldId))

    await new Promise((resolve) => setTimeout(resolve, 0))

    try {
      const schema = validationSchema() as yup.ObjectSchema<any>
      const fieldSchema = schema.fields[fieldId]
      if (fieldSchema && "validate" in fieldSchema) {
        const currentValue = formData[fieldId]
        await (fieldSchema as yup.AnySchema).validate(currentValue)
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

  const hasSubmitButton = currentPage.questions.some(
    (q) => q.type === "submitButton",
  )

  return (
    <div className="w-full">
      {/* Profile Picture and Logo */}
      {(profilePictureUrl || brandingConfig?.logo) && (
        <div className="mb-6 flex flex-col items-center gap-4">
          {profilePictureUrl && (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          )}
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
          className="gap-2 w-1/2 mx-auto"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      )}

      {/* Questions */}
      <div className="space-y-0">
        {currentPage.questions.map((question, index) => {
          if (question.type === "submitButton") {
            return null
          }

          const uiConfig = (question.uiConfig as Record<string, any>) || {}
          const setupConfig =
            (question.setupConfig as Record<string, any>) || {}

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
                  QUESTION_TYPE_TO_LABEL[question.type] ||
                  "Question"
              } else {
                label = QUESTION_TYPE_TO_LABEL[question.type] || "Question"
              }
            }
          }

          const displayLabel = label
          const isFirstQuestion = index === 0

          return (
            <div key={question.id}>
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
                  question={question as any}
                  disabled={false}
                  editingMode={false}
                  formId={question.formId}
                  ownerId={ownerId}
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
        {!isLastPage ? (
          <Button
            onClick={handleNext}
            className="gap-2 w-1/2 mx-auto"
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
            className="gap-2 w-1/2 mx-auto"
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
                  return submitUiConfig.label || "Submit Lead"
                })()
              : "Submit Lead"}
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
