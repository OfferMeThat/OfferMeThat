"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ADD_QUESTION_LIST } from "@/constants/offerFormQuestions"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { Check } from "lucide-react"
import { useState } from "react"

interface AddQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddQuestion: (questionType: QuestionType) => void
  existingQuestionTypes: QuestionType[]
}

const AddQuestionModal = ({
  open,
  onOpenChange,
  onAddQuestion,
  existingQuestionTypes,
}: AddQuestionModalProps) => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null)

  const handleAdd = () => {
    if (selectedType) {
      onAddQuestion(selectedType)
      setSelectedType(null)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setSelectedType(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl! flex-col gap-0 p-0">
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
            {Object.entries(ADD_QUESTION_LIST).map(([type, details]) => {
              const questionType = type as QuestionType
              const isOnForm = existingQuestionTypes.includes(questionType)
              const isSelected = selectedType === questionType

              return (
                <div
                  key={type}
                  className="flex cursor-pointer items-center justify-between gap-4 pb-2"
                  onClick={() => !isOnForm && setSelectedType(questionType)}
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
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedType}>
            Add Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddQuestionModal
