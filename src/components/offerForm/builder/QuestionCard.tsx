"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  QUESTION_DEFINITIONS as OFFER_QUESTION_DEFINITIONS,
  QUESTION_TYPE_TO_LABEL as OFFER_QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES as OFFER_REQUIRED_QUESTION_TYPES,
} from "@/constants/offerFormQuestions"
import {
  parseUIConfig,
  updateSubQuestionLabel,
  updateSubQuestionPlaceholder,
} from "@/types/questionUIConfig"
import { Database } from "@/types/supabase"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useState } from "react"
import { QuestionRenderer } from "../QuestionRenderer"
import EditQuestionModal from "./EditQuestionModal"
import EditTextModal from "./EditTextModal"
import EssentialQuestionModal from "./EssentialQuestionModal"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionCardProps {
  questionsAmount: number
  question: Question
  questionNumber: number // Pass the calculated question number based on position
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onUpdateQuestion: (questionId: string, updates: any) => void
  questionDefinitions?: Partial<Record<string, any>>
  questionTypeToLabel?: Record<string, string>
  requiredQuestionTypes?: string[]
}

const QuestionCard = ({
  questionsAmount,
  question,
  questionNumber: propQuestionNumber,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateQuestion,
  questionDefinitions = OFFER_QUESTION_DEFINITIONS,
  questionTypeToLabel = OFFER_QUESTION_TYPE_TO_LABEL,
  requiredQuestionTypes = OFFER_REQUIRED_QUESTION_TYPES,
}: QuestionCardProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editQuestionModalOpen, setEditQuestionModalOpen] = useState(false)
  const [essentialQuestionModal, setEssentialQuestionModal] = useState<{
    isOpen: boolean
    action: "delete" | "edit" | "makeOptional"
  }>({ isOpen: false, action: "delete" })
  const [editingField, setEditingField] = useState<{
    id: string
    text: string
    type: "label" | "placeholder"
  } | null>(null)
  // Local state to track form field values for interactive preview
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  // Get UI configuration from uiConfig JSONB field - use standardized type
  const uiConfig = parseUIConfig(question.uiConfig)

  // Get question definition for description
  const questionDefinition = questionDefinitions[question.type]

  // Use the passed question number (based on position) instead of question.order
  const questionNumber = propQuestionNumber
  const totalQuestions = questionsAmount

  // Get setup configuration
  const setupConfig = (question.setupConfig as Record<string, any>) || {}

  // For custom questions, especially statement questions, use setupConfig.question_text as the label
  const isCustomQuestion = question.type === "custom"
  const isStatementQuestion =
    isCustomQuestion && setupConfig.answer_type === "statement"

  const labelText = isStatementQuestion
    ? setupConfig.question_text || "Question"
    : isCustomQuestion
      ? setupConfig.question_text ||
        uiConfig.label ||
        questionDefinition?.label ||
        "Question"
      : uiConfig.label || questionDefinition?.label || "Question"

  const handleLabelEdit = (fieldKey?: string, currentText?: string) => {
    // If called without parameters, it's the main label
    if (fieldKey === undefined) {
      // Allow editing labels even for essential questions
      // Only "Edit Question" button and required checkbox are blocked
      setEditingField({
        id: "label",
        text: labelText,
        type: "label",
      })
    } else {
      // Called with parameters for sub-question labels
      setEditingField({
        id: fieldKey,
        text: currentText || "",
        type: "label",
      })
    }
    setEditModalOpen(true)
  }

  const handlePlaceholderEdit = (fieldKey: string, currentText?: string) => {
    setEditingField({
      id: fieldKey,
      text: currentText || "",
      type: "placeholder",
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = (newText: string) => {
    if (!editingField) return

    if (editingField.type === "label") {
      // Check if it's the main label or a sub-question label
      if (editingField.id === "label") {
        // For Statement questions, save to setupConfig.question_text
        // For other custom questions, also save to setupConfig.question_text
        // For standard questions, save to uiConfig.label
        if (
          isStatementQuestion ||
          (isCustomQuestion && setupConfig.question_text)
        ) {
          // Update setupConfig.question_text for custom/statement questions
          onUpdateQuestion(question.id, {
            setupConfig: {
              ...setupConfig,
              question_text: newText,
            },
          })
        } else {
          // Update main label (stored in uiConfig.label) for standard questions
          onUpdateQuestion(question.id, {
            uiConfig: {
              ...uiConfig,
              label: newText,
            },
          })
        }
      } else {
        // Sub-question label - check if it's a sub-question ID (format: "deposit_amount", "deposit_due", etc.)
        // or a legacy format ("sub_question_text_deposit_amount")
        let subQuestionId = editingField.id

        // Handle legacy format: "sub_question_text_deposit_amount" -> "deposit_amount"
        if (subQuestionId.startsWith("sub_question_text_")) {
          subQuestionId = subQuestionId.replace("sub_question_text_", "")
        } else if (subQuestionId.startsWith("sub_question_placeholder_")) {
          subQuestionId = subQuestionId.replace("sub_question_placeholder_", "")
        }

        // Check if this is a sub-question for complex question types
        // Complex questions have sub-questions: deposit, subjectToLoanApproval, settlementDate
        const isComplexQuestion =
          question.type === "deposit" ||
          question.type === "subjectToLoanApproval" ||
          question.type === "settlementDate"

        // Known sub-question ID patterns for complex questions and other question types
        // These are fields that should be saved to subQuestions, not direct uiConfig
        const isSubQuestionId =
          subQuestionId.startsWith("deposit_") ||
          subQuestionId.startsWith("loan_") ||
          subQuestionId.startsWith("settlement_") ||
          subQuestionId === "loanAmountLabel" ||
          subQuestionId === "companyNameLabel" ||
          subQuestionId === "contactNameLabel" ||
          subQuestionId === "contactPhoneLabel" ||
          subQuestionId === "contactEmailLabel" ||
          subQuestionId === "customConditionLabel" ||
          subQuestionId === "settlementLocationLabel" ||
          subQuestionId === "firstNameLabel" ||
          subQuestionId === "middleNameLabel" ||
          subQuestionId === "lastNameLabel" ||
          subQuestionId === "idUploadLabel" ||
          subQuestionId === "corporationNameLabel" ||
          subQuestionId === "corporationRepresentativeLabel" ||
          subQuestionId === "loanAmountPlaceholder" ||
          subQuestionId === "companyNamePlaceholder" ||
          subQuestionId === "contactNamePlaceholder" ||
          subQuestionId === "contactPhonePlaceholder" ||
          subQuestionId === "contactEmailPlaceholder" ||
          subQuestionId === "customConditionPlaceholder" ||
          subQuestionId === "locationPlaceholder" ||
          subQuestionId === "daysPlaceholder" ||
          subQuestionId === "firstNamePlaceholder" ||
          subQuestionId === "middleNamePlaceholder" ||
          subQuestionId === "lastNamePlaceholder" ||
          subQuestionId === "corporationNamePlaceholder" ||
          (isComplexQuestion && subQuestionId.includes("_")) ||
          // For custom questions, check if it's a sub-field (ends with Label or Placeholder)
          (question.type === "custom" &&
            (subQuestionId.endsWith("Label") ||
              subQuestionId.endsWith("Placeholder")))

        // Save to subQuestions if it's a known sub-question ID, regardless of question type
        if (isSubQuestionId) {
          // Save to uiConfig.subQuestions using standardized structure
          const updatedUIConfig = updateSubQuestionLabel(
            uiConfig,
            subQuestionId,
            newText,
          )
          onUpdateQuestion(question.id, {
            uiConfig: updatedUIConfig,
          })
        } else {
          // Regular sub-field label (e.g., firstNameLabel, lastNameLabel) - save directly to uiConfig
          onUpdateQuestion(question.id, {
            uiConfig: {
              ...uiConfig,
              [editingField.id]: newText,
            },
          })
        }
      }
    } else {
      // Update placeholder
      let subQuestionId = editingField.id

      // Handle legacy format
      if (subQuestionId.startsWith("sub_question_placeholder_")) {
        subQuestionId = subQuestionId.replace("sub_question_placeholder_", "")
      }

      // Check if this is a sub-question for complex question types
      const isComplexQuestion =
        question.type === "deposit" ||
        question.type === "subjectToLoanApproval" ||
        question.type === "settlementDate"

      // Known sub-question ID patterns for complex questions and other question types
      // These are fields that should be saved to subQuestions, not direct uiConfig
      const isSubQuestionId =
        subQuestionId.startsWith("deposit_") ||
        subQuestionId.startsWith("loan_") ||
        subQuestionId.startsWith("settlement_") ||
        subQuestionId === "loanAmountLabel" ||
        subQuestionId === "companyNameLabel" ||
        subQuestionId === "contactNameLabel" ||
        subQuestionId === "contactPhoneLabel" ||
        subQuestionId === "contactEmailLabel" ||
        subQuestionId === "customConditionLabel" ||
        subQuestionId === "settlementLocationLabel" ||
        subQuestionId === "firstNameLabel" ||
        subQuestionId === "middleNameLabel" ||
        subQuestionId === "lastNameLabel" ||
        subQuestionId === "idUploadLabel" ||
        subQuestionId === "corporationNameLabel" ||
        subQuestionId === "corporationRepresentativeLabel" ||
        subQuestionId === "loanAmountPlaceholder" ||
        subQuestionId === "companyNamePlaceholder" ||
        subQuestionId === "contactNamePlaceholder" ||
        subQuestionId === "contactPhonePlaceholder" ||
        subQuestionId === "contactEmailPlaceholder" ||
        subQuestionId === "customConditionPlaceholder" ||
        subQuestionId === "locationPlaceholder" ||
        subQuestionId === "daysPlaceholder" ||
        subQuestionId === "firstNamePlaceholder" ||
        subQuestionId === "middleNamePlaceholder" ||
        subQuestionId === "lastNamePlaceholder" ||
        subQuestionId === "corporationNamePlaceholder" ||
        (isComplexQuestion && subQuestionId.includes("_")) ||
        // For custom questions, check if it's a sub-field (ends with Label or Placeholder)
        (question.type === "custom" &&
          (subQuestionId.endsWith("Label") ||
            subQuestionId.endsWith("Placeholder")))

      // Save to subQuestions if it's a known sub-question ID, regardless of question type
      if (isSubQuestionId) {
        // Save to uiConfig.subQuestions using standardized structure
        const updatedUIConfig = updateSubQuestionPlaceholder(
          uiConfig,
          subQuestionId,
          newText,
        )
        onUpdateQuestion(question.id, {
          uiConfig: updatedUIConfig,
        })
      } else {
        // Regular placeholder - save directly to uiConfig
        onUpdateQuestion(question.id, {
          uiConfig: {
            ...uiConfig,
            [editingField.id]: newText,
          },
        })
      }
    }
    setEditModalOpen(false)
    setEditingField(null)
  }

  // Determine if this is an essential question (cannot be modified)
  const isEssential = requiredQuestionTypes.includes(question.type)

  // Determine if this question is locked in position
  const isLockedInPosition =
    (question.type === "specifyListing" && question.order === 1) ||
    (question.type === "submitterRole" && question.order === 2)

  // Buttons are no longer disabled - they will show a modal if the action is restricted
  // The parent component handles showing the restriction modal

  const handleRequiredToggle = () => {
    if (isEssential) {
      setEssentialQuestionModal({ isOpen: true, action: "makeOptional" })
      return
    }
    onUpdateQuestion(question.id, {
      required: !question.required,
    })
  }

  const handleDelete = () => {
    // Allow submitterRole to be deleted even though it's essential
    if (isEssential && question.type !== "submitterRole") {
      setEssentialQuestionModal({ isOpen: true, action: "delete" })
      return
    }
    onDelete()
  }

  const handleEditQuestion = () => {
    // Allow editing for offerAmount even if it's essential
    if (isEssential && question.type !== "offerAmount") {
      setEssentialQuestionModal({ isOpen: true, action: "edit" })
      return
    }
    setEditQuestionModalOpen(true)
  }

  // Check if this is a submit button
  const isSubmitButton = question.type === "submitButton"

  return (
    <>
      {/* Decorative divider (not shown for first question) */}
      {!isFirst && <div className="my-4 border-t border-gray-200" />}

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
        {/* Mobile: Top row with question number and actions */}
        <div className="flex items-center justify-between gap-4 md:hidden">
          {/* Question Number (Mobile) */}
          <div className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2">
            {isSubmitButton ? (
              <>
                <p className="text-sm font-bold text-gray-900">BUTTON</p>
                <p className="text-xs font-bold text-gray-900">(SUBMIT)</p>
              </>
            ) : (
              <p className="text-sm font-bold text-gray-900">
                QUESTION {questionNumber} of {totalQuestions}
              </p>
            )}
          </div>

          {/* Actions (Mobile) - Disabled for submit button */}
          {!isSubmitButton && (
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={onMoveUp}>
                <ChevronUp size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onMoveDown}>
                <ChevronDown size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghostDesctructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Desktop: Left - Question Info */}
        <div className="hidden w-auto flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 md:flex">
          {isSubmitButton ? (
            <>
              <p className="text-xl font-bold text-gray-900">BUTTON</p>
              <p className="text-xs font-bold text-gray-900">(SUBMIT)</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-900">QUESTION</p>
              <p className="text-sm font-bold text-gray-900">
                {questionNumber} of {totalQuestions}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  checked={question.required}
                  onCheckedChange={handleRequiredToggle}
                />
                <span className="text-sm text-gray-700">Required field</span>
              </div>
              <Button
                variant="outline"
                className="mt-3 w-full"
                size="sm"
                onClick={handleEditQuestion}
              >
                Edit Question
              </Button>
            </>
          )}
        </div>

        {/* Middle: Question Preview (Both Mobile and Desktop) */}
        <div className="flex flex-1 flex-col gap-3">
          {!isSubmitButton && (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                {questionTypeToLabel[question.type]}
              </h3>
              {isEssential && (
                <Badge size="xs" variant="destructiveLight" className="text-xs">
                  Essential
                </Badge>
              )}
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 py-4">
            {!isSubmitButton && (
              <p
                className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-cyan-600"
                onClick={() => handleLabelEdit()}
                title="Click to edit question text"
              >
                {labelText}
                {question.required && <span className="text-red-500"> *</span>}
              </p>
            )}

            {/* Render appropriate input based on question type and setup */}
            <QuestionRenderer
              question={question}
              disabled={false}
              editingMode={true}
              value={formValues[question.id]}
              onChange={(value) => {
                setFormValues((prev) => ({
                  ...prev,
                  [question.id]: value,
                }))
              }}
              onUpdateQuestion={onUpdateQuestion}
              onEditPlaceholder={handlePlaceholderEdit}
              onEditLabel={handleLabelEdit}
              formId={question.formId}
            />
          </div>

          {/* Mobile: Required field checkbox and Edit button - Hidden for submit button */}
          {!isSubmitButton && (
            <div className="flex items-center justify-between gap-4 md:hidden">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={question.required}
                  onCheckedChange={handleRequiredToggle}
                />
                <span className="text-sm text-gray-700">Required field</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleEditQuestion}>
                Edit Question
              </Button>
            </div>
          )}
        </div>

        {/* Desktop: Right - Actions - Hidden for submit button */}
        {!isSubmitButton && (
          <div className="hidden w-auto flex-col justify-center gap-1 md:flex">
            <Button
              size="xs"
              variant="ghost"
              onClick={onMoveUp}
              className="justify-baseline"
            >
              <ChevronUp size={16} />
              Move Up
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={onMoveDown}
              className="justify-baseline"
            >
              <ChevronDown size={16} />
              Move Down
            </Button>
            <Button
              size="xs"
              variant="ghostDesctructive"
              onClick={handleDelete}
              className="justify-baseline"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}

        {/* Edit Text Modal */}
        {editingField && (
          <EditTextModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false)
              setEditingField(null)
            }}
            title={
              editingField.type === "label"
                ? "Edit Question Text"
                : "Edit Placeholder"
            }
            currentText={editingField.text}
            onSave={handleSaveEdit}
            fieldType={editingField.type}
          />
        )}

        {/* Edit Question Setup Modal */}
        <EditQuestionModal
          open={editQuestionModalOpen}
          onOpenChange={setEditQuestionModalOpen}
          question={question}
          onUpdateQuestion={onUpdateQuestion}
          questionDefinitions={questionDefinitions}
        />

        {/* Essential Question Modal */}
        <EssentialQuestionModal
          isOpen={essentialQuestionModal.isOpen}
          onClose={() =>
            setEssentialQuestionModal({ isOpen: false, action: "delete" })
          }
          action={essentialQuestionModal.action}
          questionType={questionTypeToLabel[question.type] || question.type}
        />
      </div>
    </>
  )
}

export default QuestionCard
