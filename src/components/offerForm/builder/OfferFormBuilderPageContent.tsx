"use client"

import {
  addQuestion,
  createPageBreak,
  deletePageBreak,
  deleteQuestion,
  getFormPages,
  getFormQuestions,
  getOrCreateOfferForm,
  movePageBreak,
  resetFormToDefault,
  updateQuestionOrder,
} from "@/app/actions/offerForm"
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
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import AddQuestionModal from "./AddQuestionModal"
import PageBreak from "./PageBreak"
import QuestionCard from "./QuestionCard"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["offerFormPages"]["Row"]

const OfferFormBuilderPageContent = () => {
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

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const id = await getOrCreateOfferForm()
        setFormId(id)

        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(id),
          getFormPages(id),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
      } catch (error) {
        console.error("Error initializing form:", error)
        toast.error("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }

    initializeForm()
  }, [])

  const handleMoveUp = (questionId: string, currentOrder: number) => {
    if (currentOrder === 1) return

    startTransition(async () => {
      try {
        // Find the question above
        const questionAbove = questions.find(
          (q) => q.order === currentOrder - 1,
        )
        if (!questionAbove) return

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

  const handleMoveDown = (questionId: string, currentOrder: number) => {
    if (currentOrder === questions.length) return

    startTransition(async () => {
      try {
        // Find the question below
        const questionBelow = questions.find(
          (q) => q.order === currentOrder + 1,
        )
        if (!questionBelow) return

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
        await addQuestion(
          formId,
          questionType,
          addQuestionAfterOrder,
          config,
          uiConfig,
        )

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
            Customize Offer Form
          </Heading>
          <p className="mt-1 text-sm text-gray-600">
            Add, remove and edit questions to build your Offer Form. <br />
            <Link
              href="#"
              className="font-medium text-teal-500 hover:text-teal-700"
            >
              Learn more by clicking here.
            </Link>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
          >
            Reset Form
          </Button>
          <Button>View Form</Button>
        </div>
      </div>

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
                  question={question}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  onMoveUp={() => handleMoveUp(question.id, question.order)}
                  onMoveDown={() => handleMoveDown(question.id, question.order)}
                  onDelete={() => handleDelete(question.id)}
                />

                <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                  <Button
                    size="sm"
                    variant="dashed"
                    onClick={() => handleOpenAddQuestionModal(question.order)}
                  >
                    + Add New Question Here
                  </Button>
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
                          page={pageBreakAfter}
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
                      <Button
                        size="sm"
                        variant="dashed"
                        onClick={() =>
                          handleOpenAddQuestionModal(question.order)
                        }
                      >
                        + Add New Question Here
                      </Button>
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
              form to its default state with the 7 essential questions.
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
      />
    </>
  )
}

export default OfferFormBuilderPageContent
