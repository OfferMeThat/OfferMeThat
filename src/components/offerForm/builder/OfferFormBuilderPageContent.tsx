"use client"

import {
  deleteQuestion,
  getFormQuestions,
  getOrCreateOfferForm,
  updateQuestionOrder,
} from "@/app/actions/offerForm"
import Heading from "@/components/shared/typography/Heading"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import QuestionCard from "./QuestionCard"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

const OfferFormBuilderPageContent = () => {
  const [formId, setFormId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const id = await getOrCreateOfferForm()
        setFormId(id)

        const fetchedQuestions = await getFormQuestions(id)
        setQuestions(fetchedQuestions)
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
    startTransition(async () => {
      try {
        await deleteQuestion(questionId)

        // Update local state and reorder
        setQuestions((prev) => {
          const filtered = prev.filter((q) => q.id !== questionId)
          return filtered.map((q, index) => ({ ...q, order: index + 1 }))
        })

        toast.success("Question deleted")
      } catch (error) {
        console.error("Error deleting question:", error)
        toast.error("Failed to delete question")
      }
    })
  }

  if (isLoading) {
    return (
      <main className="px-6 py-8">
        <div className="text-center">Loading form...</div>
      </main>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between border-b bg-white px-6 py-6">
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
          <Button variant="destructive">Reset Form</Button>
          <Button>View Form</Button>
        </div>
      </div>

      <div className="space-y-6 px-6">
        {questions.map((question, index) => (
          <div key={question.id}>
            <QuestionCard
              question={question}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              onMoveUp={() => handleMoveUp(question.id, question.order)}
              onMoveDown={() => handleMoveDown(question.id, question.order)}
              onDelete={() => handleDelete(question.id)}
            />

            {index < questions.length - 1 && (
              <div className="my-8 flex items-center justify-center gap-4">
                <Button size="sm" variant="dashed">
                  + Add New Question Here
                </Button>
                <Button size="sm" variant="dashed">
                  + Add a Page Break Here
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <p className="text-sm text-gray-600">Updating...</p>
          </div>
        </div>
      )}
    </>
  )
}

export default OfferFormBuilderPageContent
