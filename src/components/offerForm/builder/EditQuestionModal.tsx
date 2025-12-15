/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QUESTION_DEFINITIONS as OFFER_QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { QuestionSetupConfig, QuestionUIConfig } from "@/types/questionConfig"
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"
import { useState } from "react"
import QuestionSetupForm from "./QuestionSetupForm"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface EditQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: Question | null
  onUpdateQuestion: (questionId: string, updates: any) => void
  questionDefinitions?: Partial<Record<QuestionType, any>>
}

const EditQuestionModal = ({
  open,
  onOpenChange,
  question,
  onUpdateQuestion,
  questionDefinitions = OFFER_QUESTION_DEFINITIONS,
}: EditQuestionModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!question) return null

  const definition = questionDefinitions[question.type]
  const hasSetup =
    definition?.setupQuestions && definition.setupQuestions.length > 0

  const handleComplete = async (
    setupConfig: QuestionSetupConfig,
    uiConfig?: QuestionUIConfig,
    requiredOverride?: boolean,
  ) => {
    setIsUpdating(true)
    try {
      const updates: any = {
        setupConfig: setupConfig,
      }

      // Update uiConfig if provided
      // For custom questions, this will include the updated label from question_text
      if (uiConfig) {
        // Merge with existing uiConfig to preserve any fields not in the new uiConfig
        updates.uiConfig = {
          ...(question.uiConfig as Record<string, any>),
          ...uiConfig,
        }
      }

      // Update required field if it's determined by setup config
      if (requiredOverride !== undefined) {
        updates.required = requiredOverride
      }

      await onUpdateQuestion(question.id, updates)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating question:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false)
    }
  }

  const renderContent = () => {
    if (!hasSetup) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">
            This question type does not have configurable setup options.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            You can edit the question label and other text by clicking on them
            in the question card.
          </p>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <QuestionSetupForm
          questionType={question.type}
          questionDefinitions={questionDefinitions}
          initialSetupConfig={(() => {
            const config = (question.setupConfig as QuestionSetupConfig) || {}
            // Ensure offerAmount has default currency_mode and fixed_currency
            if (question.type === "offerAmount") {
              const offerAmountConfig = config as Record<string, any>
              return {
                currency_mode: offerAmountConfig.currency_mode || "any",
                fixed_currency: offerAmountConfig.fixed_currency || "USD",
                ...offerAmountConfig,
              }
            }
            return config
          })()}
          initialUIConfig={(question.uiConfig as QuestionUIConfig) || {}}
          onComplete={handleComplete}
          onCancel={handleClose}
          hideButtons={true}
          mode="edit"
        />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] min-h-[400px] w-full max-w-4xl! flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Edit Question: {definition?.label || question.type}
          </DialogTitle>
          <p className="mt-1 text-sm text-gray-500">
            Update the configuration for this question.
          </p>
        </DialogHeader>

        {renderContent()}

        {hasSetup && (
          <DialogFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Trigger the save
                const event = new CustomEvent("smartQuestionSave")
                window.dispatchEvent(event)
              }}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        )}

        {!hasSetup && (
          <DialogFooter className="border-t px-6 py-4">
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EditQuestionModal
