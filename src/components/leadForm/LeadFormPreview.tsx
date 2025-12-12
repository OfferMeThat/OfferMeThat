"use client"

import { Spinner } from "@/components/ui/spinner"
import { BrandingConfig } from "@/types/branding"
import { Database } from "@/types/supabase"
import { parseUIConfig } from "@/types/questionUIConfig"
import Heading from "../shared/typography/Heading"
import { QuestionRenderer } from "../offerForm/QuestionRenderer"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["leadFormPages"]["Row"]

interface LeadFormPreviewProps {
  questions: Question[]
  pages: Page[]
  isLoading?: boolean
  title?: string
  description?: string
  brandingConfig?: BrandingConfig
  profilePictureUrl?: string | null
}

/**
 * Simple preview component for lead forms
 * Displays the form structure without submission functionality
 */
export const LeadFormPreview = ({
  questions,
  pages,
  isLoading = false,
  title = "Lead Form",
  description,
  brandingConfig,
  profilePictureUrl,
}: LeadFormPreviewProps) => {
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
  const currentPage = pageStructure[0] // Show first page for preview

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
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Title and Description */}
      <div className="mb-6 text-center">
        <Heading
          as="h1"
          size="large"
          weight="bold"
          style={{
            color: brandingConfig?.fontColor || "#000000",
          }}
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {currentPage.questions.map((question) => {
          const uiConfig = parseUIConfig(question.uiConfig)

          // Skip submit button in preview
          if (question.type === "submitButton") {
            return (
              <div key={question.id} className="mt-6">
                <button
                  disabled
                  className="w-full rounded-lg bg-gray-200 px-4 py-3 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.buttonColor || "#14b8a6",
                    color: brandingConfig?.buttonTextColor || "#000000",
                  }}
                >
                  {uiConfig.label || "Submit"}
                </button>
              </div>
            )
          }

          return (
            <div key={question.id} className="space-y-2">
              <label
                className="block text-sm font-medium"
                style={{
                  color: brandingConfig?.fontColor || "#000000",
                }}
              >
                {uiConfig.label || question.type}
                {question.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>

              {/* Render question based on type */}
              {question.type === "listingInterest" && (
                <input
                  type="text"
                  disabled
                  placeholder={uiConfig.placeholder || "Specify the listing here..."}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {question.type === "name" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    disabled
                    placeholder="First Name"
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                    style={{
                      backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                      borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                    }}
                  />
                  <input
                    type="text"
                    disabled
                    placeholder="Last Name"
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                    style={{
                      backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                      borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                    }}
                  />
                </div>
              )}

              {question.type === "email" && (
                <input
                  type="email"
                  disabled
                  placeholder={uiConfig.placeholder || "example@email.com"}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {question.type === "tel" && (
                <input
                  type="tel"
                  disabled
                  placeholder={uiConfig.placeholder || "555-123-4567"}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {question.type === "submitterRole" && (
                <select
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                >
                  <option>Select your role</option>
                </select>
              )}

              {["areYouInterested", "followAllListings", "captureFinanceLeads"].includes(
                question.type,
              ) && (
                <select
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                >
                  <option>Please select</option>
                </select>
              )}

              {question.type === "opinionOfSalePrice" && (
                <input
                  type="text"
                  disabled
                  placeholder="Enter your opinion here..."
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {question.type === "messageToAgent" && (
                <textarea
                  disabled
                  placeholder="Type message here..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {/* For custom question types, show a generic input */}
              {![
                "listingInterest",
                "name",
                "email",
                "tel",
                "submitterRole",
                "areYouInterested",
                "followAllListings",
                "captureFinanceLeads",
                "opinionOfSalePrice",
                "messageToAgent",
                "submitButton",
              ].includes(question.type) && (
                <input
                  type="text"
                  disabled
                  placeholder={uiConfig.placeholder || "Enter your answer..."}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
                  style={{
                    backgroundColor: brandingConfig?.fieldColor || "#ffffff",
                    borderColor: brandingConfig?.fieldColor || "#e5e7eb",
                  }}
                />
              )}

              {uiConfig.description && (
                <p className="text-xs text-gray-500">{uiConfig.description}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

