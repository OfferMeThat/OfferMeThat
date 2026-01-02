"use client"

import {
  addQuestion,
  createPageBreak,
  deletePageBreak,
  deleteQuestion,
  getBrandingConfig,
  getFormOwnerProfilePicture,
  getFormPages,
  getFormQuestions,
  getOrCreateLeadForm,
  movePageBreak,
  resetFormToDefault,
  swapQuestionOrders,
  updateQuestion,
} from "@/app/actions/leadForm"
import Heading from "@/components/shared/typography/Heading"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  LEAD_FORM_ADD_QUESTION_DEFINITIONS,
  QUESTION_DEFINITIONS,
  QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES,
} from "@/constants/leadFormQuestions"
import { buildFormValidationSchema } from "@/lib/leadFormValidation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import AddQuestionModal from "../../offerForm/builder/AddQuestionModal"
import PageBreak from "../../offerForm/builder/PageBreak"
import QuestionCard from "../../offerForm/builder/QuestionCard"
import RestrictionModal from "../../offerForm/builder/RestrictionModal"
import { FormPreview } from "../../shared/FormPreview"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["leadFormPages"]["Row"]

const LeadFormBuilderPageContent = () => {
  const [formId, setFormId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [addQuestionAfterOrder, setAddQuestionAfterOrder] = useState<
    number | null
  >(null)
  const [viewMode, setViewMode] = useState<"builder" | "preview">("builder")
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    DEFAULT_BRANDING_CONFIG,
  )
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  )
  const [profileName, setProfileName] = useState<string | null>(null)
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const id = await getOrCreateLeadForm()
        setFormId(id)

        const [
          fetchedQuestions,
          fetchedPages,
          fetchedBranding,
          fetchedProfilePicture,
        ] = await Promise.all([
          getFormQuestions(id),
          getFormPages(id),
          getBrandingConfig(id),
          getFormOwnerProfilePicture(id),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
        setBrandingConfig(fetchedBranding)
        setProfilePictureUrl(fetchedProfilePicture)
      } catch (error) {
        console.error("Error initializing form:", error)
        toast.error("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("fullName")
          .eq("id", user.id)
          .single()

        if (profile?.fullName) {
          setProfileName(profile.fullName)
        }
      }
    }

    initializeForm()
    fetchUserProfile()
  }, [])

  const handleMoveUp = (
    questionId: string,
    currentOrder: number,
    questionType: QuestionType,
  ) => {
    // Prevent moving submit button
    if (questionType === "submitButton") {
      return
    }
    // Check if "Listing Interest" exists and is at position 1
    const listingInterestQuestion = questions.find(
      (q) => q.type === "listingInterest",
    )
    const isListingInterestAtPosition1 = listingInterestQuestion?.order === 1

    // Check if "Submitter Role" exists and is at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // First question can never move up
    if (currentOrder === 1) {
      setShowRestrictionModal(true)
      return
    }

    // Prevent other questions from moving into position 1 (locked by listingInterest)
    // If submitterRole is deleted, position 1 is still locked, but position 2 is free
    const targetPosition = currentOrder - 1
    if (targetPosition === 1 && isListingInterestAtPosition1) {
      if (questionType !== "listingInterest") {
        setShowRestrictionModal(true)
        return
      }
    }
    // If submitterRole is NOT at position 2 (deleted), position 2 is free to move into

    startTransition(async () => {
      try {
        // Get all questions sorted by order, excluding submit button
        const sortedQuestions = questions
          .filter((q) => q.type !== "submitButton")
          .sort((a, b) => a.order - b.order)

        // Find current question index
        const currentIndex = sortedQuestions.findIndex(
          (q) => q.id === questionId,
        )
        if (currentIndex === -1 || currentIndex === 0) return

        // Find the question above (previous in sorted array)
        const questionAbove = sortedQuestions[currentIndex - 1]
        if (!questionAbove) return

        // Check if the question above is locked in its position (only position 1)
        if (
          questionAbove.type === "listingInterest" &&
          questionAbove.order === 1
        ) {
          setShowRestrictionModal(true)
          return
        }

        // Swap orders
        await swapQuestionOrders(
          questionId,
          questionAbove.order,
          questionAbove.id,
          currentOrder,
        )

        // Fetch fresh data to ensure consistency
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId!),
          getFormPages(formId!),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Question moved up")
      } catch (error) {
        console.error("Error moving question:", error)
        toast.error("Failed to move question")
      }
    })
  }

  const handleMoveDown = (
    questionId: string,
    currentOrder: number,
    questionType: QuestionType,
  ) => {
    // Prevent moving submit button
    if (questionType === "submitButton") {
      return
    }
    if (currentOrder === questions.length) return

    // Check if "Submitter Role" exists and is at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // First question can never move down
    if (currentOrder === 1) {
      setShowRestrictionModal(true)
      return
    }

    startTransition(async () => {
      try {
        // Get all questions sorted by order, excluding submit button
        const sortedQuestions = questions
          .filter((q) => q.type !== "submitButton")
          .sort((a, b) => a.order - b.order)

        // Find current question index
        const currentIndex = sortedQuestions.findIndex(
          (q) => q.id === questionId,
        )
        if (currentIndex === -1 || currentIndex === sortedQuestions.length - 1)
          return

        // Find the question below (next in sorted array)
        const questionBelow = sortedQuestions[currentIndex + 1]
        if (!questionBelow) return

        // Swap orders
        await swapQuestionOrders(
          questionId,
          questionBelow.order,
          questionBelow.id,
          currentOrder,
        )

        // Fetch fresh data to ensure consistency
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId!),
          getFormPages(formId!),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Question moved down")
      } catch (error) {
        console.error("Error moving question:", error)
        toast.error("Failed to move question")
      }
    })
  }

  const handleDelete = (questionId: string) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await deleteQuestion(questionId)

        // Fetch fresh data from database to ensure consistency
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Question deleted")
      } catch (error) {
        console.error("Error deleting question:", error)
        toast.error("Failed to delete question")
      }
    })
  }

  const handleResetForm = () => {
    if (!formId) return

    startTransition(async () => {
      try {
        await resetFormToDefault(formId)

        // Fetch fresh data from database (both questions and pages)
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        setShowResetDialog(false)
        toast.success("Form reset to default successfully")
      } catch (error) {
        console.error("Error resetting form:", error)
        toast.error("Failed to reset form")
      }
    })
  }

  const handleAddPageBreak = (afterQuestionOrder: number) => {
    if (!formId) return

    // Check if "Listing Interest" exists at position 1
    const listingInterestQuestion = questions.find(
      (q) => q.type === "listingInterest",
    )
    const isListingInterestAtPosition1 = listingInterestQuestion?.order === 1

    // Check if "Submitter Role" exists at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // Prevent adding page break at position 1 (only position 1 is locked)
    if (afterQuestionOrder === 1) {
      setShowRestrictionModal(true)
      return
    }

    startTransition(async () => {
      try {
        await createPageBreak(formId, afterQuestionOrder)

        // Fetch fresh data from database
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Page break added")
      } catch (error) {
        console.error("Error adding page break:", error)
        toast.error("Failed to add page break")
      }
    })
  }

  const handleDeletePageBreak = (pageId: string) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await deletePageBreak(pageId, formId)

        // Fetch fresh data
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Page break deleted")
      } catch (error) {
        console.error("Error deleting page break:", error)
        toast.error("Failed to delete page break")
      }
    })
  }

  const handleMovePageBreak = (pageId: string, direction: "up" | "down") => {
    if (!formId) return

    startTransition(async () => {
      try {
        await movePageBreak(pageId, formId, direction)

        // Fetch fresh data (both questions and pages)
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success(`Page break moved ${direction}`)
      } catch (error) {
        console.error("Error moving page break:", error)
        toast.error("Failed to move page break")
      }
    })
  }

  const handleOpenAddQuestionModal = (afterOrder: number) => {
    setAddQuestionAfterOrder(afterOrder)
    setShowAddQuestionModal(true)
  }

  const handleAddQuestion = async (
    questionType: QuestionType,
    config?: Record<string, any>,
    uiConfig?: Record<string, any>,
  ) => {
    if (!formId || addQuestionAfterOrder === null) return

    startTransition(async () => {
      try {
        // Extract requiredOverride if it exists in config
        const requiredOverride = config?.__requiredOverride
        const cleanConfig = config ? { ...config } : undefined
        if (cleanConfig && "__requiredOverride" in cleanConfig) {
          delete cleanConfig.__requiredOverride
        }

        await addQuestion(
          formId,
          questionType,
          addQuestionAfterOrder,
          cleanConfig,
          uiConfig,
        )

        // If we have a requiredOverride, we need to update the question after creation
        if (requiredOverride !== undefined) {
          // Get the newly added question
          const updatedQuestions = await getFormQuestions(formId)
          const newQuestion = updatedQuestions.find(
            (q) =>
              q.type === questionType && q.order === addQuestionAfterOrder + 1,
          )

          if (newQuestion) {
            await updateQuestion(newQuestion.id, { required: requiredOverride })
          }
        }

        // Fetch fresh data
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
        setShowAddQuestionModal(false)
        setAddQuestionAfterOrder(null)

        toast.success("Question added successfully")
      } catch (error) {
        console.error("Error adding question:", error)
        toast.error("Failed to add question")
      }
    })
  }

  const handleUpdateQuestion = (questionId: string, updates: any) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await updateQuestion(questionId, updates)

        // Fetch fresh data
        const [fetchedQuestions] = await Promise.all([getFormQuestions(formId)])

        setQuestions(fetchedQuestions)
        toast.success("Question updated")
      } catch (error) {
        console.error("Error updating question:", error)
        toast.error("Failed to update question")
      }
    })
  }

  if (isLoading) {
    return (
      <main className="px-6 py-8">
        <div className="flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </main>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-6 border-b bg-white px-6 pt-14 pb-6 lg:py-6">
        <div>
          <Heading as="h1" size="large" weight="bold">
            {viewMode === "builder" ? "Customize Lead Form" : "Form Preview"}
          </Heading>
          <p className="mt-1 text-sm text-gray-600">
            {viewMode === "builder" ? (
              <>
                Add, remove and edit questions to build your Lead Form. <br />
                <Link
                  href="#"
                  className="font-medium text-teal-500 hover:text-teal-700"
                >
                  Learn more by clicking here.
                </Link>
              </>
            ) : (
              "This is how your lead form will appear to visitors."
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {viewMode === "builder" && (
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
            >
              Reset Form
            </Button>
          )}
          <Button
            onClick={() =>
              setViewMode(viewMode === "builder" ? "preview" : "builder")
            }
          >
            {viewMode === "builder" ? "View Form" : "Customize Form"}
          </Button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <div
          className="min-h-[600px] rounded-2xl"
          style={{
            backgroundColor: brandingConfig.backgroundColor,
            backgroundImage: brandingConfig.backgroundImage
              ? `url(${brandingConfig.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            padding: "2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* White form card - fixed width, centered */}
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <FormPreview
              questions={questions}
              pages={pages}
              isLoading={false}
              title={
                profileName
                  ? `Submit a Lead to ${profileName}`
                  : "Submit a Lead"
              }
              description="Please provide your information"
              brandingConfig={brandingConfig}
              profilePictureUrl={profilePictureUrl}
              questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
              buildValidationSchema={buildFormValidationSchema as any}
              formType="lead"
            />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mx-auto max-w-7xl space-y-6">
            {(() => {
              // Separate submit button from regular questions
              const regularQuestions = questions
                .sort((a, b) => a.order - b.order)
                .filter((q) => q.type !== "submitButton")
              const submitButtonQuestion = questions.find(
                (q) => q.type === "submitButton",
              )

              // Calculate total pages (1 + number of page breaks)
              const totalPages =
                1 + pages.filter((p) => p.breakIndex !== null).length
              const hasPageBreaks = totalPages > 1

              // Helper function to calculate which page a question belongs to
              const getPageNumber = (questionOrder: number): number => {
                const allBreaks = pages
                  .filter((p) => p.breakIndex !== null)
                  .sort((a, b) => (a.breakIndex || 0) - (b.breakIndex || 0))

                // Count how many breaks come before this question
                const breaksBefore = allBreaks.filter(
                  (p) => p.breakIndex !== null && p.breakIndex < questionOrder,
                ).length

                // Page number is 1 + number of breaks before
                return breaksBefore + 1
              }

              // Helper function to calculate which page content after a break belongs to
              const getPageNumberAfterBreak = (breakIndex: number): number => {
                const allBreaks = pages
                  .filter((p) => p.breakIndex !== null)
                  .sort((a, b) => (a.breakIndex || 0) - (b.breakIndex || 0))

                // Count how many breaks come before or at this break
                const breaksBeforeOrAt = allBreaks.filter(
                  (p) => p.breakIndex !== null && p.breakIndex <= breakIndex,
                ).length

                // Page number after break is 1 + number of breaks before or at
                return breaksBeforeOrAt + 1
              }

              // Group questions by page
              const questionsByPage: Record<number, typeof regularQuestions> =
                {}
              regularQuestions.forEach((question) => {
                const pageNum = getPageNumber(question.order)
                if (!questionsByPage[pageNum]) {
                  questionsByPage[pageNum] = []
                }
                questionsByPage[pageNum].push(question)
              })

              return (
                <>
                  {Object.entries(questionsByPage)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([pageNumStr, pageQuestions], pageIndex) => {
                      const pageNum = Number(pageNumStr)
                      const isFirstPage = pageNum === 1

                      return (
                        <div key={`page-${pageNum}`}>
                          {/* Page label - positioned above the container, between pages */}
                          {hasPageBreaks && (
                            <div className="mb-2">
                              <span className="text-sm font-bold text-gray-700">
                                Page {pageNum} of {totalPages}
                              </span>
                            </div>
                          )}

                          {/* Page container */}
                          <div
                            className={cn(
                              "rounded-lg border-2 border-gray-200 bg-gray-50 p-6",
                              hasPageBreaks && pageIndex > 0 && "mt-0",
                            )}
                          >
                            {/* Questions for this page */}
                            {pageQuestions.map((question, index) => {
                              const globalIndex =
                                regularQuestions.indexOf(question)
                              // Find if there's a page break after this question
                              const pageBreakAfter = pages.find(
                                (page) => page.breakIndex === question.order,
                              )

                              return (
                                <div key={question.id}>
                                  <QuestionCard
                                    questionsAmount={regularQuestions.length}
                                    question={question as any}
                                    questionNumber={globalIndex + 1}
                                    isFirst={globalIndex === 0}
                                    isLast={
                                      globalIndex ===
                                      regularQuestions.length - 1
                                    }
                                    onMoveUp={() =>
                                      handleMoveUp(
                                        question.id,
                                        question.order,
                                        question.type,
                                      )
                                    }
                                    onMoveDown={() =>
                                      handleMoveDown(
                                        question.id,
                                        question.order,
                                        question.type,
                                      )
                                    }
                                    onDelete={() => handleDelete(question.id)}
                                    onUpdateQuestion={handleUpdateQuestion}
                                    questionDefinitions={QUESTION_DEFINITIONS}
                                    questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
                                    requiredQuestionTypes={
                                      REQUIRED_QUESTION_TYPES
                                    }
                                  />

                                  <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                                    <Button
                                      size="sm"
                                      variant="dashed"
                                      onClick={() =>
                                        handleOpenAddQuestionModal(question.order)
                                      }
                                    >
                                      + Add New Question Here
                                    </Button>
                                    <Button
                                      disabled={
                                        globalIndex ===
                                        regularQuestions.length - 1
                                      }
                                      size="sm"
                                      variant="dashed"
                                      onClick={() =>
                                        handleAddPageBreak(question.order)
                                      }
                                    >
                                      + Add a Page Break Here
                                    </Button>
                                  </div>

                                  {/* Show page break if one exists after this question */}
                                  {pageBreakAfter && (
                                    <div className="my-8">
                                      {(() => {
                                        // Find if there are adjacent breaks
                                        const allBreaks = pages.filter(
                                          (p) => p.breakIndex !== null,
                                        )
                                        const currentBreakIndex =
                                          pageBreakAfter.breakIndex || 0

                                        // Check if there's a break before this one
                                        const hasBreakBefore = allBreaks.some(
                                          (p) =>
                                            p.breakIndex !== null &&
                                            p.breakIndex < currentBreakIndex,
                                        )

                                        // Check if there's a break after this one
                                        const hasBreakAfter = allBreaks.some(
                                          (p) =>
                                            p.breakIndex !== null &&
                                            p.breakIndex > currentBreakIndex,
                                        )

                                        // Can move up if: not at question 1, and either no break before or enough space
                                        const canMoveUp =
                                          currentBreakIndex > 1 &&
                                          (!hasBreakBefore ||
                                            allBreaks
                                              .filter(
                                                (p) =>
                                                  p.breakIndex !== null &&
                                                  p.breakIndex <
                                                    currentBreakIndex,
                                              )
                                              .every(
                                                (p) =>
                                                  (p.breakIndex || 0) <
                                                  currentBreakIndex - 1,
                                              ))

                                        // Can move down if: not at last question, and either no break after or enough space
                                        // Ensure at least one question remains after the break (excluding submit button)
                                        // Compare breakIndex (order value) against max order value, not count
                                        const maxRegularOrder =
                                          regularQuestions.length > 0
                                            ? Math.max(
                                                ...regularQuestions.map(
                                                  (q) => q.order,
                                                ),
                                              )
                                            : 0
                                        const canMoveDown =
                                          currentBreakIndex <
                                            maxRegularOrder - 1 &&
                                          (!hasBreakAfter ||
                                            allBreaks
                                              .filter(
                                                (p) =>
                                                  p.breakIndex !== null &&
                                                  p.breakIndex >
                                                    currentBreakIndex,
                                              )
                                              .every(
                                                (p) =>
                                                  (p.breakIndex || 0) >
                                                  currentBreakIndex + 1,
                                              ))

                                        return (
                                          <PageBreak
                                            page={pageBreakAfter as any}
                                            isFirst={!canMoveUp}
                                            isLast={!canMoveDown}
                                            onMoveUp={() =>
                                              handleMovePageBreak(
                                                pageBreakAfter.id,
                                                "up",
                                              )
                                            }
                                            onMoveDown={() =>
                                              handleMovePageBreak(
                                                pageBreakAfter.id,
                                                "down",
                                              )
                                            }
                                            onDelete={() =>
                                              handleDeletePageBreak(
                                                pageBreakAfter.id,
                                              )
                                            }
                                          />
                                        )
                                      })()}

                                      {/* Add buttons after page break */}
                                      <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                                        <Button
                                          size="sm"
                                          variant="dashed"
                                          onClick={() =>
                                            handleOpenAddQuestionModal(
                                              question.order,
                                            )
                                          }
                                        >
                                          + Add New Question Here
                                        </Button>
                                        <Button
                                          disabled
                                          size="sm"
                                          variant="dashed"
                                        >
                                          + Add a Page Break Here
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {/* Submit Button - Always at the bottom of the last page, cannot be moved */}
                            {submitButtonQuestion && pageNum === totalPages && (
                              <div className="my-8">
                                <QuestionCard
                                  questionsAmount={regularQuestions.length}
                                  question={submitButtonQuestion as any}
                                  questionNumber={0} // Not counted as a question
                                  isFirst={false}
                                  isLast={true}
                                  onMoveUp={() => {}} // Disabled - cannot move
                                  onMoveDown={() => {}} // Disabled - cannot move
                                  onDelete={() => {}} // Disabled - cannot delete
                                  onUpdateQuestion={handleUpdateQuestion}
                                  questionDefinitions={QUESTION_DEFINITIONS}
                                  questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
                                  requiredQuestionTypes={
                                    REQUIRED_QUESTION_TYPES
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
            <Spinner />
            <p className="text-sm font-medium text-gray-900">Updating...</p>
          </div>
        </div>
      )}

      {/* Reset Form Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Form to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete all your custom questions and restore the
              form to its default state with the essential questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetForm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddQuestionModal
        open={showAddQuestionModal}
        onOpenChange={setShowAddQuestionModal}
        onAddQuestion={handleAddQuestion}
        existingQuestionTypes={questions.map((q) => q.type as QuestionType)}
        questionDefinitions={LEAD_FORM_ADD_QUESTION_DEFINITIONS}
      />

      <RestrictionModal
        isOpen={showRestrictionModal}
        onClose={() => setShowRestrictionModal(false)}
      />
    </>
  )
}

export default LeadFormBuilderPageContent
