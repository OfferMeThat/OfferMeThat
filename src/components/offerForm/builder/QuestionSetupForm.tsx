/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { getQuestionRequiredFromSetup } from "@/lib/questionHelpers"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { QuestionSetupConfig, QuestionUIConfig } from "@/types/questionConfig"
import { useEffect, useState } from "react"
import SmartQuestionSetup from "./SmartQuestionSetup"

interface QuestionSetupFormProps {
  questionType: QuestionType
  initialSetupConfig?: QuestionSetupConfig
  initialUIConfig?: QuestionUIConfig
  onComplete: (setupConfig: QuestionSetupConfig, uiConfig?: QuestionUIConfig, requiredOverride?: boolean) => void
  onCancel: () => void
  hideButtons?: boolean
  mode?: "add" | "edit"
}

const QuestionSetupForm = ({
  questionType,
  initialSetupConfig = {},
  initialUIConfig = {},
  onComplete,
  onCancel,
  hideButtons = false,
  mode = "add",
}: QuestionSetupFormProps) => {
  const [setupConfig, setSetupConfig] = useState<Record<string, any>>(initialSetupConfig)
  const [conditions, setConditions] = useState<Array<{ name: string; details: string }>>(
    (initialSetupConfig as any)?.conditions || []
  )

  // Update state when initial config changes (for edit mode)
  useEffect(() => {
    setSetupConfig(initialSetupConfig)
    if ((initialSetupConfig as any)?.conditions) {
      setConditions((initialSetupConfig as any).conditions)
    }
  }, [initialSetupConfig])

  // Add event listener for external save trigger
  useEffect(() => {
    const handleExternalSave = () => {
      handleComplete()
    }

    window.addEventListener("smartQuestionSave", handleExternalSave)
    return () => {
      window.removeEventListener("smartQuestionSave", handleExternalSave)
    }
  }, [setupConfig, conditions, questionType, initialUIConfig])

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

  const handleComplete = () => {
    // For Special Conditions, include the conditions array in setupConfig
    const finalConfig =
      questionType === "specialConditions"
        ? { ...setupConfig, conditions }
        : setupConfig
    
    // For custom questions (except statement type), build uiConfig with label from question_text
    // Statement type has separate fields: uiConfig.label (main label) and setupConfig.question_text (statement text)
    let finalUIConfig = initialUIConfig
    if (
      questionType === "custom" && 
      finalConfig.question_text && 
      finalConfig.answer_type !== "statement"
    ) {
      finalUIConfig = {
        ...initialUIConfig,
        label: finalConfig.question_text,
      }
    }
    
    // Check if setup config determines the required status
    const requiredFromSetup = getQuestionRequiredFromSetup(questionType, finalConfig)
    
    onComplete(finalConfig, finalUIConfig, requiredFromSetup ?? undefined)
  }

  // Special handling for deposit question using SmartQuestionSetup
  if (questionType === "deposit") {
    return (
      <SmartQuestionSetup
        questionId={questionType}
        initialSetupConfig={initialSetupConfig}
        initialUIConfig={initialUIConfig}
        onComplete={(generated, answers, requiredOverride) => {
          onComplete(answers, generated, requiredOverride)
        }}
        onCancel={onCancel}
        hideButtons={hideButtons}
        mode={mode}
      />
    )
  }

  const definition = QUESTION_DEFINITIONS[questionType]
  if (!definition?.setupQuestions) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        No setup required for this question type.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {definition.setupQuestions.map((question: any) => {
        // Check dependencies
        if (question.dependsOn) {
          const dependentValue = setupConfig[question.dependsOn.questionId]
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
                {question.options.map((option: any) => {
                  const isSelected = setupConfig[question.id] === option.value
                  return (
                    <div
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3"
                      onClick={() => handleConfigChange(question.id, option.value)}
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
              <Select
                value={setupConfig[question.id] || ""}
                onValueChange={(value) => handleConfigChange(question.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Text input */}
            {question.type === "text" && (
              <Input
                type="text"
                value={setupConfig[question.id] || ""}
                onChange={(e) => handleConfigChange(question.id, e.target.value)}
                placeholder={question.placeholder}
              />
            )}

            {/* Number input */}
            {question.type === "number" && (
              <Input
                type="number"
                value={setupConfig[question.id] || ""}
                onChange={(e) => handleConfigChange(question.id, e.target.value)}
                placeholder={question.placeholder}
              />
            )}
          </div>
        )
      })}

      {/* Special handling for Special Conditions - Dynamic Condition Builder */}
      {questionType === "specialConditions" && (
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
                <Input
                  type="text"
                  value={condition.name}
                  onChange={(e) =>
                    handleConditionChange(index, "name", e.target.value)
                  }
                  placeholder="e.g., Subject to Building Inspection"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Additional details (optional)
                </label>
                <Textarea
                  value={condition.details}
                  onChange={(e) =>
                    handleConditionChange(index, "details", e.target.value)
                  }
                  placeholder="Enter additional details (optional)"
                  rows={3}
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

      {!hideButtons && (
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            {mode === "edit" ? "Save Changes" : "Add Question"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default QuestionSetupForm

