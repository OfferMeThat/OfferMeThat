"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BrandingConfig } from "@/types/branding"
import { Database } from "@/types/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
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

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPageIndex((prev) => prev + 1)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevious = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = () => {
    // In a real implementation, this would submit the form data
    console.log("Form submitted with data:", formData)
    alert("Form submitted! (This is a preview)")
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
          const label = uiConfig.label || "Question"

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
