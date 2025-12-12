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
  updateQuestion,
  updateQuestionOrder,
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
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { FormPreview } from "../../shared/FormPreview"
import {
  QUESTION_TYPE_TO_LABEL,
  QUESTION_DEFINITIONS,
  REQUIRED_QUESTION_TYPES,
} from "@/constants/leadFormQuestions"
import { buildFormValidationSchema } from "@/lib/leadFormValidation"
import AddQuestionModal from "../../offerForm/builder/AddQuestionModal"
import PageBreak from "../../offerForm/builder/PageBreak"
import QuestionCard from "../../offerForm/builder/QuestionCard"

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

    initializeForm()
  }, [])

  const handleMoveUp = (
    questionId: string,
    currentOrder: number,
    questionType: QuestionType,
  ) => {
    if (currentOrder === 1) return

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

    // Lock "Listing Interest" in position 1 (if it exists)
    if (questionType === "listingInterest" && currentOrder === 1) return

    // Lock "Submitter Role" in position 2 - can't move up to position 1 (if it exists)
    if (
      questionType === "submitterRole" &&
      currentOrder === 2 &&
      isListingInterestAtPosition1
    )
      return

    // Prevent other questions from moving into locked positions
    const targetPosition = currentOrder - 1
    if (targetPosition === 1 && isListingInterestAtPosition1) {
      if (questionType !== "listingInterest") return
    }
    if (targetPosition === 2 && isSubmitterRoleAtPosition2) {
      if (questionType !== "submitterRole") return
    }

    startTransition(async () => {
      try {
        // Find the question above
        const questionAbove = questions.find(
          (q) => q.order === currentOrder - 1,
        )
        if (!questionAbove) return

        // Check if the question above is locked in its position
        if (
          questionAbove.type === "listingInterest" &&
          questionAbove.order === 1
        )
          return
        if (questionAbove.type === "submitterRole" && questionAbove.order === 2)
          return

        // Swap orders
        await updateQuestionOrder(questionId, currentOrder - 1)
        await updateQuestionOrder(questionAbove.id, currentOrder)

        // Update local state
        setQuestions((prev) =>
          prev
            .map((q) => {
              if (q.id === questionId) return { ...q, order: currentOrder - 1 }
              if (q.id === questionAbove.id)
                return { ...q, order: currentOrder }
              return q
            })
            .sort((a, b) => a.order - b.order),
        )

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
    if (currentOrder === questions.length) return

    // Check if "Submitter Role" exists and is at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // Lock "Listing Interest" in position 1 - can't move down
    if (questionType === "listingInterest" && currentOrder === 1) return

    // Lock "Submitter Role" in position 2 - can't move down (if it exists)
    if (questionType === "submitterRole" && currentOrder === 2) return

    // Prevent moving into position 2 if it's locked
    const targetPosition = currentOrder + 1
    if (targetPosition === 2 && isSubmitterRoleAtPosition2) {
      if (questionType !== "submitterRole") return
    }

    startTransition(async () => {
      try {
        // Find the question below
        const questionBelow = questions.find(
          (q) => q.order === currentOrder + 1,
        )
        if (!questionBelow) return

        // Check if moving would put this question into a locked position
        const targetPosition = currentOrder + 1
        if (targetPosition === 1 && questionType !== "listingInterest") return
        if (targetPosition === 2 && questionType !== "submitterRole") return

        // Swap orders
        await updateQuestionOrder(questionId, currentOrder + 1)
        await updateQuestionOrder(questionBelow.id, currentOrder)

        // Update local state
        setQuestions((prev) =>
          prev
            .map((q) => {
              if (q.id === questionId) return { ...q, order: currentOrder + 1 }
              if (q.id === questionBelow.id)
                return { ...q, order: currentOrder }
              return q
            })
            .sort((a, b) => a.order - b.order),
        )

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

    // Prevent adding questions between position 1 and 2
    if (
      afterOrder === 1 &&
      isListingInterestAtPosition1 &&
      isSubmitterRoleAtPosition2
    ) {
      toast.error(
        "Cannot add questions between 'Listing Interest' and 'Submitter Role'",
      )
      return
    }

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
      <div className="flex items-center justify-between border-b bg-white px-6 py-6">
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
              title="Your Lead Form"
              description="This is how your form will appear to visitors who access your lead link."
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
          <div className="space-y-6 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-xl">
            {questions.map((question, index) => {
              // Find if there's a page break after this question
              const pageBreakAfter = pages.find(
                (page) => page.breakIndex === question.order,
              )

              return (
                <div key={question.id}>
                  <QuestionCard
                    questionsAmount={questions.length}
                    question={question as any}
                    isFirst={index === 0}
                    isLast={index === questions.length - 1}
                    onMoveUp={() =>
                      handleMoveUp(question.id, question.order, question.type)
                    }
                    onMoveDown={() =>
                      handleMoveDown(question.id, question.order, question.type)
                    }
                    onDelete={() => handleDelete(question.id)}
                    onUpdateQuestion={handleUpdateQuestion}
                    questionDefinitions={QUESTION_DEFINITIONS}
                    questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
                    requiredQuestionTypes={REQUIRED_QUESTION_TYPES}
                  />

                  <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                    {/* Check if we can add a question here (not between position 1 and 2) */}
                    {(() => {
                      // Check if "Listing Interest" exists at position 1
                      const listingInterestQuestion = questions.find(
                        (q) => q.type === "listingInterest",
                      )
                      const isListingInterestAtPosition1 =
                        listingInterestQuestion?.order === 1

                      // Check if "Submitter Role" exists at position 2
                      const submitterRoleQuestion = questions.find(
                        (q) => q.type === "submitterRole",
                      )
                      const isSubmitterRoleAtPosition2 =
                        submitterRoleQuestion?.order === 2

                      // Hide button if adding after position 1 would place question at position 2
                      const wouldAddAtPosition2 =
                        question.order === 1 &&
                        isListingInterestAtPosition1 &&
                        isSubmitterRoleAtPosition2

                      return (
                        <Button
                          disabled={wouldAddAtPosition2}
                          size="sm"
                          variant="dashed"
                          onClick={() =>
                            handleOpenAddQuestionModal(question.order)
                          }
                        >
                          + Add New Question Here
                        </Button>
                      )
                    })()}
                    <Button
                      disabled={index === questions.length - 1}
                      size="sm"
                      variant="dashed"
                      onClick={() => handleAddPageBreak(question.order)}
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
                        const currentBreakIndex = pageBreakAfter.breakIndex || 0

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

                        // Can't move up if: at question 1, or would collide with previous break
                        const canMoveUp =
                          currentBreakIndex > 1 &&
                          (!hasBreakBefore ||
                            allBreaks
                              .filter(
                                (p) =>
                                  p.breakIndex !== null &&
                                  p.breakIndex < currentBreakIndex,
                              )
                              .every(
                                (p) =>
                                  (p.breakIndex || 0) < currentBreakIndex - 1,
                              ))

                        // Can't move down if: at last question, or would collide with next break
                        const canMoveDown =
                          currentBreakIndex < questions.length - 1 &&
                          (!hasBreakAfter ||
                            allBreaks
                              .filter(
                                (p) =>
                                  p.breakIndex !== null &&
                                  p.breakIndex > currentBreakIndex,
                              )
                              .every(
                                (p) =>
                                  (p.breakIndex || 0) > currentBreakIndex + 1,
                              ))

                        return (
                          <PageBreak
                            page={pageBreakAfter as any}
                            isFirst={!canMoveUp}
                            isLast={!canMoveDown}
                            onMoveUp={() =>
                              handleMovePageBreak(pageBreakAfter.id, "up")
                            }
                            onMoveDown={() =>
                              handleMovePageBreak(pageBreakAfter.id, "down")
                            }
                            onDelete={() =>
                              handleDeletePageBreak(pageBreakAfter.id)
                            }
                          />
                        )
                      })()}

                      {/* Add buttons after page break */}
                      <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                        {(() => {
                          // Check if "Listing Interest" exists at position 1
                          const listingInterestQuestion = questions.find(
                            (q) => q.type === "listingInterest",
                          )
                          const isListingInterestAtPosition1 =
                            listingInterestQuestion?.order === 1

                          // Check if "Submitter Role" exists at position 2
                          const submitterRoleQuestion = questions.find(
                            (q) => q.type === "submitterRole",
                          )
                          const isSubmitterRoleAtPosition2 =
                            submitterRoleQuestion?.order === 2

                          // Hide button if adding after position 1 would place question at position 2
                          const wouldAddAtPosition2 =
                            question.order === 1 &&
                            isListingInterestAtPosition1 &&
                            isSubmitterRoleAtPosition2

                          if (wouldAddAtPosition2) {
                            return null
                          }

                          return (
                            <Button
                              size="sm"
                              variant="dashed"
                              onClick={() =>
                                handleOpenAddQuestionModal(question.order)
                              }
                            >
                              + Add New Question Here
                            </Button>
                          )
                        })()}
                        <Button disabled size="sm" variant="dashed">
                          + Add a Page Break Here
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
        questionDefinitions={QUESTION_DEFINITIONS}
      />
    </>
  )
}

export default LeadFormBuilderPageContent

