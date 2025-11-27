"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { Check, ChevronLeft } from "lucide-react"
import { useState } from "react"

interface AddQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddQuestion: (
    questionType: QuestionType,
    config?: Record<string, string>,
  ) => void
  existingQuestionTypes: QuestionType[]
}

const AddQuestionModal = ({
  open,
  onOpenChange,
  onAddQuestion,
  existingQuestionTypes,
}: AddQuestionModalProps) => {
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null)
  const [wizardStep, setWizardStep] = useState<"selection" | "setup">(
    "selection",
  )
  const [setupConfig, setSetupConfig] = useState<Record<string, any>>({})
  const [conditions, setConditions] = useState<
    Array<{ name: string; details: string }>
  >([])

  const handleSelectType = (type: QuestionType) => {
    setSelectedType(type)
  }

  const handleNext = () => {
    if (!selectedType) return

    const definition = QUESTION_DEFINITIONS[selectedType]
    if (definition?.setupQuestions && definition.setupQuestions.length > 0) {
      setWizardStep("setup")
      setSetupConfig({}) // Reset config
      setConditions([]) // Reset conditions
    } else {
      // No setup needed, add directly
      onAddQuestion(selectedType)
      handleClose()
    }
  }

  const handleAddWithConfig = () => {
    if (selectedType) {
      // For Special Conditions, include the conditions array in setupConfig
      const finalConfig =
        selectedType === "specialConditions"
          ? { ...setupConfig, conditions }
          : setupConfig
      onAddQuestion(selectedType, finalConfig)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedType(null)
    setWizardStep("selection")
    setSetupConfig({})
    setConditions([])
    onOpenChange(false)
  }

  const handleBack = () => {
    setWizardStep("selection")
    setSetupConfig({})
    setConditions([])
  }

  const handleConfigChange = (questionId: string, value: any) => {
    setSetupConfig((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleAddCondition = () => {
    if (conditions.length < 15) {
      setConditions([...conditions, { name: "", details: "" }])
    }
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const handleConditionChange = (
    index: number,
    field: "name" | "details",
    value: string,
  ) => {
    const updated = [...conditions]
    updated[index][field] = value
    setConditions(updated)
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
          {Object.entries(QUESTION_DEFINITIONS).map(([type, details]) => {
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
        <Button onClick={handleNext} disabled={!selectedType}>
          Add Question
        </Button>
      </DialogFooter>
    </>
  )

  const renderSetupStep = () => {
    if (!selectedType) return null
    const definition = QUESTION_DEFINITIONS[selectedType]
    if (!definition?.setupQuestions) return null

    return (
      <>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">
            Question Setup: {definition.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {definition.setupQuestions.map((question) => {
              // Check dependencies
              if (question.dependsOn) {
                const dependentValue =
                  setupConfig[question.dependsOn.questionId]
                const requiredValue = question.dependsOn.value
                const isMet = Array.isArray(requiredValue)
                  ? requiredValue.includes(dependentValue)
                  : dependentValue === requiredValue

                if (!isMet) return null
              }

              return (
                <div key={question.id} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {question.label}
                  </h4>

                  {/* Radio buttons */}
                  {question.type === "radio" && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const isSelected =
                          setupConfig[question.id] === option.value
                        return (
                          <div
                            key={option.value}
                            className="flex cursor-pointer items-start gap-3"
                            onClick={() =>
                              handleConfigChange(question.id, option.value)
                            }
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-300",
                                isSelected && "border-blue-600",
                              )}
                            >
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700">
                              {option.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Select dropdown */}
                  {question.type === "select" && question.options && (
                    <select
                      value={setupConfig[question.id] || ""}
                      onChange={(e) =>
                        handleConfigChange(question.id, e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select an option</option>
                      {question.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Text input */}
                  {question.type === "text" && (
                    <input
                      type="text"
                      value={setupConfig[question.id] || ""}
                      onChange={(e) =>
                        handleConfigChange(question.id, e.target.value)
                      }
                      placeholder={question.placeholder}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  )}

                  {/* Number input */}
                  {question.type === "number" && (
                    <input
                      type="number"
                      value={setupConfig[question.id] || ""}
                      onChange={(e) =>
                        handleConfigChange(question.id, e.target.value)
                      }
                      placeholder={question.placeholder}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              )
            })}

            {/* Special handling for Special Conditions - Dynamic Condition Builder */}
            {selectedType === "specialConditions" && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Predefined Conditions
                  </h4>
                  <span className="text-xs text-gray-500">
                    {conditions.length}/15
                  </span>
                </div>

                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <h5 className="text-sm font-medium text-gray-700">
                        Condition {index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Name for Condition {index + 1} *
                      </label>
                      <input
                        type="text"
                        value={condition.name}
                        onChange={(e) =>
                          handleConditionChange(index, "name", e.target.value)
                        }
                        placeholder="e.g., Subject to Building Inspection"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Additional details (optional)
                      </label>
                      <textarea
                        value={condition.details}
                        onChange={(e) =>
                          handleConditionChange(
                            index,
                            "details",
                            e.target.value,
                          )
                        }
                        placeholder="Enter additional details (optional)"
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                {conditions.length < 15 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCondition}
                    className="w-full"
                  >
                    + Add another condition
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleAddWithConfig}>Add Question</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] min-h-[500px] w-full max-w-4xl! flex-col gap-0 p-0">
        {wizardStep === "selection" ? renderSelectionStep() : renderSetupStep()}
      </DialogContent>
    </Dialog>
  )
}

export default AddQuestionModal
