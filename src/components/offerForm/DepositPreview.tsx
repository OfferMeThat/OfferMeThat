"use client"
/* eslint-disable react/prop-types */

import DatePicker from "@/components/shared/forms/DatePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface DepositQuestion {
  id: string
  question_text: string
  question_type: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  currency_field?: {
    placeholder: string
    options: Array<{ value: string; label: string }>
  }
  conditional_currency?: {
    placeholder: string
    options: Array<{ value: string; label: string }>
  }
  conditional_suffix?: string
  custom_config?: any
  config?: any
  value?: string
}

interface Question {
  id: string
  type: string
  required: boolean
  is_essential?: boolean
  question_text?: string
  sub_questions?: Record<string, any>
  deposit_questions?: DepositQuestion[]
}

interface DepositFormProps {
  question: Question
  setupAnswers?: Record<string, any>
  onChange?: (data: Record<string, any>) => void
  editingMode?: boolean
  onEditQuestion?: ((questionId: string, currentText?: string) => void) | null
  onEditPlaceholder?:
    | ((questionId: string, currentText?: string) => void)
    | null
}

const DepositForm = ({
  question,
  setupAnswers = {},
  onChange = () => {},
  editingMode = false,
  onEditQuestion = null,
  onEditPlaceholder = null,
}: DepositFormProps) => {
  const [localFormData, setLocalFormData] = useState<Record<string, any>>({})

  // CRITICAL: Re-render when question prop changes to pick up updated text
  useEffect(() => {
    // This ensures the component re-renders when question.sub_questions OR question.question_text changes
    // No state updates needed here, just dependency tracking
  }, [question.sub_questions, question.question_text])

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = {
      ...localFormData,
      [fieldId]: value,
    }
    setLocalFormData(newFormData)
    onChange(newFormData)
  }

  // Generate additional questions based on instalments selection
  const generateAdditionalQuestions = () => {
    const instalmentsValue = localFormData["deposit_instalments"]
    if (!instalmentsValue) return []

    const additionalQuestions = []

    // If user selected 1 instalment, show the standard deposit questions
    if (instalmentsValue === "1") {
      // Add deposit type question if needed
      if (setupAnswers.deposit_management === "buyer_choice") {
        additionalQuestions.push({
          id: "deposit_type",
          question_text: "What will your Deposit be?",
          question_type: "select",
          options: [
            { value: "amount", label: "A fixed amount" },
            { value: "percentage", label: "A percentage of purchase price" },
          ],
          required: true,
          placeholder: "Select deposit type",
        })
      }

      // Add deposit amount question
      additionalQuestions.push({
        id: "deposit_amount",
        question_text: "What is your Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter deposit amount",
      })

      // Add deposit due question
      additionalQuestions.push({
        id: "deposit_due",
        question_text: "When is your Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    // If user selected 2 instalments, show instalment-specific questions
    if (instalmentsValue === "2") {
      // First instalment
      additionalQuestions.push({
        id: "deposit_amount_1",
        question_text: "What is your First Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter first deposit amount",
      })

      additionalQuestions.push({
        id: "deposit_due_1",
        question_text: "When is your First Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Second instalment
      additionalQuestions.push({
        id: "deposit_amount_2",
        question_text: "What is your Second Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter second deposit amount",
      })

      additionalQuestions.push({
        id: "deposit_due_2",
        question_text: "When is your Second Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    // If user selected 3 instalments, show instalment-specific questions
    if (instalmentsValue === "3") {
      // First instalment
      additionalQuestions.push({
        id: "deposit_amount_1",
        question_text: "What is your First Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter first deposit amount",
      })

      additionalQuestions.push({
        id: "deposit_due_1",
        question_text: "When is your First Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Second instalment
      additionalQuestions.push({
        id: "deposit_amount_2",
        question_text: "What is your Second Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter second deposit amount",
      })

      additionalQuestions.push({
        id: "deposit_due_2",
        question_text: "When is your Second Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Third instalment
      additionalQuestions.push({
        id: "deposit_amount_3",
        question_text: "What is your Third Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter third deposit amount",
      })

      additionalQuestions.push({
        id: "deposit_due_3",
        question_text: "When is your Third Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    return additionalQuestions
  }

  // CRITICAL: Helper Functions for Text Management
  const getQuestionText = (
    questionId: string,
    fallbackText: string,
  ): string => {
    // First check if there's an edited version in sub_questions (flat structure)
    if (
      question.sub_questions &&
      question.sub_questions[`sub_question_text_${questionId}`]
    ) {
      return question.sub_questions[`sub_question_text_${questionId}`]
    }
    // Then check if there's a version in deposit_questions
    if (question.deposit_questions) {
      const depositQuestion = question.deposit_questions.find(
        (q: DepositQuestion) => q.id === questionId,
      )
      if (depositQuestion && depositQuestion.question_text) {
        return depositQuestion.question_text
      }
    }
    return fallbackText
  }

  const getPlaceholderText = (
    questionId: string,
    fallbackText: string,
  ): string => {
    // First check if there's an edited version in sub_questions (flat structure)
    if (
      question.sub_questions &&
      question.sub_questions[`sub_question_placeholder_${questionId}`]
    ) {
      return question.sub_questions[`sub_question_placeholder_${questionId}`]
    }
    // Then check if there's a version in deposit_questions
    if (question.deposit_questions) {
      const depositQuestion = question.deposit_questions.find(
        (q: DepositQuestion) => q.id === questionId,
      )
      if (depositQuestion && depositQuestion.placeholder) {
        return depositQuestion.placeholder
      }
    }
    return fallbackText
  }

  const getMainQuestionText = (): string => {
    return question.question_text || "Deposit Details"
  }

  // Render custom due date section for "Create Your Own" functionality
  const renderCustomDueDate = (config: any) => {
    if (!config) return null

    const { timeConstraint, number, timeUnit, action, trigger } = config

    // Helper function to format text (replace underscores with spaces and capitalize)
    const formatText = (text: string): string => {
      if (!text) return ""
      return text
        .replace(/_/g, " ") // Replace underscores with spaces
        .split(" ")
        .map(
          (word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    }

    // Helper function to render a section (static text or dropdown)
    const renderSection = (sectionData: string[]) => {
      if (!sectionData || !Array.isArray(sectionData)) return null

      if (sectionData.length === 1) {
        // Single selection - show as static text with proper formatting
        return <span className="font-medium">{formatText(sectionData[0])}</span>
      } else if (sectionData.length > 1) {
        // Multiple selections - show as dropdown
        return (
          <Select>
            <SelectTrigger className="w-auto min-w-52">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {sectionData.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {formatText(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      return null
    }

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
          {renderSection(timeConstraint)}
          {renderSection(number)}
          {renderSection(timeUnit)}
          {renderSection(action)}
          {renderSection(trigger)}
        </div>
      </div>
    )
  }

  // Render the deposit questions generated by the smart question configuration
  const renderDepositQuestions = () => {
    if (
      !question.deposit_questions ||
      question.deposit_questions.length === 0
    ) {
      return null
    }

    // Start with all original questions (don't filter them)
    const originalQuestions = question.deposit_questions

    // Generate additional questions based on instalments selection
    const additionalQuestions = generateAdditionalQuestions()

    // Combine original questions with additional questions
    const allQuestions = [...originalQuestions, ...additionalQuestions]

    return allQuestions.map(
      (depositQuestion: DepositQuestion, index: number) => {
        const { id, question_text, question_type, options, placeholder } =
          depositQuestion

        const labelClassName =
          editingMode && onEditQuestion
            ? "text-sm font-medium text-gray-700 cursor-pointer hover:text-[#08b79d] hover:underline p-2 rounded transition-colors"
            : "text-sm font-medium text-gray-700"

        // Use helper functions to get the current text (including any edits)
        const currentQuestionText = getQuestionText(id, question_text)
        const currentPlaceholder = getPlaceholderText(id, placeholder as string)

        return (
          <div key={id || index} className="space-y-2">
            <Label
              className={labelClassName}
              onClick={() => {
                if (editingMode && onEditQuestion) {
                  onEditQuestion(`sub_question_text_${id}`, currentQuestionText)
                }
              }}
              title={editingMode ? "Click to edit question text" : ""}
            >
              {currentQuestionText}
              {question.is_essential && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>

            {question_type === "text" && (
              <div className="space-y-1 pt-1.5">
                {/* Check if this question has a currency field */}
                {depositQuestion.currency_field ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder={currentPlaceholder || "Enter value"}
                        value={localFormData[id] || ""}
                        onChange={(e) => handleFieldChange(id, e.target.value)}
                        disabled={editingMode}
                        className={cn(
                          editingMode ? "cursor-not-allowed" : "",
                          "min-w-52",
                        )}
                      />
                      {editingMode && (
                        <div
                          className="absolute inset-0 cursor-pointer bg-transparent"
                          onClick={() => {
                            if (onEditPlaceholder) {
                              onEditPlaceholder(
                                `sub_question_placeholder_${id}`,
                                currentPlaceholder,
                              )
                            }
                          }}
                          title="Click to edit placeholder text"
                        />
                      )}
                    </div>
                    <Select
                      value={localFormData[`${id}_currency`] || ""}
                      onValueChange={(value) =>
                        handleFieldChange(`${id}_currency`, value)
                      }
                      disabled={false}
                    >
                      <SelectTrigger className="min-w-52">
                        <SelectValue
                          placeholder={
                            depositQuestion.currency_field.placeholder ||
                            "Currency"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {depositQuestion.currency_field.options?.map(
                          (option: { value: string; label: string }) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder={currentPlaceholder || "Enter value"}
                      value={localFormData[id] || ""}
                      onChange={(e) => handleFieldChange(id, e.target.value)}
                      disabled={editingMode}
                      className={editingMode ? "cursor-not-allowed" : ""}
                    />
                    {editingMode && (
                      <div
                        className="absolute inset-0 cursor-pointer bg-transparent"
                        onClick={() => {
                          if (onEditPlaceholder) {
                            onEditPlaceholder(
                              `sub_question_placeholder_${id}`,
                              currentPlaceholder || "",
                            )
                          }
                        }}
                        title="Click to edit placeholder text"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {question_type === "select" && (
              <div className="space-y-2 pt-1.5">
                <Select
                  value={localFormData[id] || ""}
                  onValueChange={(value) => handleFieldChange(id, value)}
                  disabled={false}
                >
                  <SelectTrigger className="min-w-52">
                    <SelectValue
                      placeholder={currentPlaceholder || "Select option"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map(
                      (option: { value: string; label: string }) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {/* Show conditional currency field if this is deposit_type and user selected 'amount' */}
                {id === "deposit_type" &&
                  localFormData[id] === "amount" &&
                  depositQuestion.conditional_currency && (
                    <div className="flex items-center gap-3">
                      <div className="relative w-1/4">
                        <Input
                          placeholder="Enter amount"
                          value={localFormData["deposit_amount"] || ""}
                          onChange={(e) =>
                            handleFieldChange("deposit_amount", e.target.value)
                          }
                          disabled={editingMode}
                          className={editingMode ? "cursor-not-allowed" : ""}
                        />
                      </div>
                      <Select
                        value={localFormData["deposit_amount_currency"] || ""}
                        onValueChange={(value) =>
                          handleFieldChange("deposit_amount_currency", value)
                        }
                        disabled={false}
                      >
                        <SelectTrigger className="w-1/4">
                          <SelectValue
                            placeholder={
                              depositQuestion.conditional_currency
                                .placeholder || "Currency"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {depositQuestion.conditional_currency.options?.map(
                            (option: { value: string; label: string }) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Show conditional suffix if this is deposit_type and user selected 'percentage' */}
                {id === "deposit_type" &&
                  localFormData[id] === "percentage" &&
                  depositQuestion.conditional_suffix && (
                    <div className="flex items-center gap-3">
                      <div className="relative w-1/4">
                        <Input
                          placeholder="Enter percentage"
                          value={localFormData["deposit_percentage"] || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "deposit_percentage",
                              e.target.value,
                            )
                          }
                          disabled={editingMode}
                          className={editingMode ? "cursor-not-allowed" : ""}
                        />
                      </div>
                      <div className="flex w-1/4 items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {depositQuestion.conditional_suffix}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {question_type === "calendar" && (
              <DatePicker disabled={editingMode} />
            )}

            {question_type === "date" && (
              <div className="space-y-1 pt-1.5">
                <div className="relative">
                  <DatePicker disabled={editingMode} />
                  {editingMode && (
                    <div
                      className="absolute inset-0 cursor-pointer bg-transparent"
                      onClick={() => {
                        if (onEditPlaceholder) {
                          onEditPlaceholder(
                            `sub_question_placeholder_${id}`,
                            currentPlaceholder,
                          )
                        }
                      }}
                      title="Click to edit placeholder text"
                    />
                  )}
                </div>
              </div>
            )}

            {question_type === "datetime" && (
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={localFormData[id] || ""}
                    onChange={(e) => handleFieldChange(id, e.target.value)}
                    disabled={editingMode}
                    className={editingMode ? "cursor-not-allowed" : ""}
                  />
                  {editingMode && (
                    <div
                      className="absolute inset-0 cursor-pointer bg-transparent"
                      onClick={() => {
                        if (onEditPlaceholder) {
                          onEditPlaceholder(
                            `sub_question_placeholder_${id}`,
                            currentPlaceholder,
                          )
                        }
                      }}
                      title="Click to edit placeholder text"
                    />
                  )}
                </div>
              </div>
            )}

            {question_type === "display" && (
              <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                {depositQuestion.value || "Display value"}
              </div>
            )}

            {question_type === "custom_due_date" && (
              <div className="space-y-2">
                {(depositQuestion.custom_config || depositQuestion.config) &&
                  renderCustomDueDate(
                    depositQuestion.custom_config || depositQuestion.config,
                  )}
              </div>
            )}
          </div>
        )
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Render the deposit questions from smart question configuration */}
      {renderDepositQuestions()}
    </div>
  )
}

export default DepositForm
