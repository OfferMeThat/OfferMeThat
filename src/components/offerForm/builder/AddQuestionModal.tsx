"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QUESTION_DEFINITIONS as OFFER_QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { Check, ChevronLeft } from "lucide-react"
import { useState } from "react"
import QuestionSetupForm from "./QuestionSetupForm"

interface AddQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddQuestion: (
    questionType: QuestionType,
    config?: Record<string, any>,
    uiConfig?: Record<string, any>,
  ) => void
  existingQuestionTypes: QuestionType[]
  questionDefinitions?: Partial<Record<QuestionType, any>>
}

const AddQuestionModal = ({
  open,
  onOpenChange,
  onAddQuestion,
  existingQuestionTypes,
  questionDefinitions = OFFER_QUESTION_DEFINITIONS,
}: AddQuestionModalProps) => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null)
  const [wizardStep, setWizardStep] = useState<"selection" | "setup">(
    "selection",
  )

  const handleSelectType = (type: QuestionType) => {
    setSelectedType(type)
  }

  const handleNext = () => {
    if (!selectedType) return

    const definition = questionDefinitions[selectedType]
    if (definition?.setupQuestions && definition.setupQuestions.length > 0) {
      setWizardStep("setup")
    } else {
      // No setup needed, add directly
      onAddQuestion(selectedType)
      handleClose()
    }
  }

  const handleAddWithConfig = (
    config: Record<string, any>,
    uiConfig?: Record<string, any>,
    requiredOverride?: boolean,
  ) => {
    if (selectedType) {
      // If requiredOverride is provided, we need to pass it somehow
      // Since onAddQuestion doesn't have a required parameter, we'll need to update it
      // For now, let's add it to the config object
      const finalConfig =
        requiredOverride !== undefined
          ? { ...config, __requiredOverride: requiredOverride }
          : config

      onAddQuestion(selectedType, finalConfig, uiConfig)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedType(null)
    setWizardStep("selection")
    onOpenChange(false)
  }

  const handleBack = () => {
    setWizardStep("selection")
  }

  const renderSelectionStep = () => (
    <>
      <DialogHeader className="px-6 pt-6 pb-4">
        <DialogTitle className="text-xl font-semibold">
          Select a Question (or Create Your Own)
        </DialogTitle>
      </DialogHeader>

      <div className="flex items-center justify-between border-b bg-white px-6 py-2">
        <p className="text-sm font-medium text-gray-700">Question Details</p>
        <p className="text-sm font-medium text-gray-700">Already on Form?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-2 divide-y divide-gray-200 py-2">
          {Object.entries(questionDefinitions)
            .filter(([type]) => type !== "offerAmount") // Remove offerAmount from the list
            .map(([type, details]) => {
            const questionType = type as QuestionType
            // Allow unlimited custom questions, but only one of each other type
            const isOnForm =
              questionType === "custom"
                ? false
                : existingQuestionTypes.includes(questionType)
            const isSelected = selectedType === questionType

            return (
              <div
                key={type}
                className="flex cursor-pointer items-center justify-between gap-4 pb-2"
                onClick={() => !isOnForm && handleSelectType(questionType)}
              >
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected && "border-blue-500 bg-blue-500",
                    )}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {details.label}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      {details.description}
                    </p>
                  </div>
                </div>

                <div className="flex w-8 items-center justify-center">
                  {isOnForm && <Check className="h-5 w-5 text-green-600" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <DialogFooter className="border-t px-6 py-4">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="default" onClick={handleNext} disabled={!selectedType}>
          Add Question
        </Button>
      </DialogFooter>
    </>
  )

  const renderSetupStep = () => {
    if (!selectedType) return null

    const definition = questionDefinitions[selectedType]
    if (!definition?.setupQuestions) return null

    return (
      <>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Question Setup: {definition.label}
          </DialogTitle>
          {definition.setupDescription && (
            <p className="mt-2 text-sm font-medium">
              {definition.setupDescription}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <QuestionSetupForm
            questionType={selectedType}
            onComplete={handleAddWithConfig}
            onCancel={handleBack}
            hideButtons={true}
            mode="add"
            questionDefinitions={questionDefinitions}
          />
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="default"
            onClick={() => {
              // Trigger the save from QuestionSetupForm
              const event = new CustomEvent("smartQuestionSave")
              window.dispatchEvent(event)
            }}
          >
            Add Question
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] min-h-[500px] w-full max-w-4xl! flex-col gap-0 p-0">
        {wizardStep === "selection" ? renderSelectionStep() : renderSetupStep()}
      </DialogContent>
    </Dialog>
  )
}

export default AddQuestionModal
