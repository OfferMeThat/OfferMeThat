"use client"

import { getFormOwnerListings } from "@/app/actions/offerForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  QUESTION_DEFINITIONS as OFFER_QUESTION_DEFINITIONS,
  QUESTION_TYPE_TO_LABEL as OFFER_QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES as OFFER_REQUIRED_QUESTION_TYPES,
} from "@/constants/offerFormQuestions"
import { cn } from "@/lib/utils"
import {
  parseUIConfig,
  updateSubQuestionLabel,
  updateSubQuestionPlaceholder,
} from "@/types/questionUIConfig"
import { Database } from "@/types/supabase"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { QuestionRenderer } from "../QuestionRenderer"
import EditQuestionModal from "./EditQuestionModal"
import EditTextModal from "./EditTextModal"
import EssentialQuestionModal from "./EssentialQuestionModal"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionCardProps {
  questionsAmount: number
  question: Question
  questionNumber: number
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
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [listings, setListings] = useState<Array<{
    id: string
    address: string
  }> | null>(null)
  const uiConfig = parseUIConfig(question.uiConfig)

  const questionDefinition = questionDefinitions[question.type]

  const questionNumber = propQuestionNumber
  const totalQuestions = questionsAmount

  const setupConfig = (question.setupConfig as Record<string, any>) || {}

  const isCustomQuestion = question.type === "custom"
  const isStatementQuestion =
    isCustomQuestion && setupConfig.answer_type === "statement"

  let labelText = isStatementQuestion
    ? setupConfig.question_text || "Question"
    : isCustomQuestion
      ? setupConfig.question_text ||
        uiConfig.label ||
        questionDefinition?.label ||
        "Question"
      : uiConfig.label || questionDefinition?.label || "Question"

  if (question.type === "offerExpiry") {
    if (!question.required) {
      labelText = "Does your Offer have an Expiry?"
    } else {
      labelText = "Offer Expiry"
    }
  }

  const handleLabelEdit = (fieldKey?: string, currentText?: string) => {
    if (fieldKey === undefined) {
      setEditingField({
        id: "label",
        text: labelText,
        type: "label",
      })
    } else {
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
      if (editingField.id === "label") {
        if (isStatementQuestion) {
          onUpdateQuestion(question.id, {
            setupConfig: {
              ...setupConfig,
              question_text: newText,
            },
          })
        } else if (isCustomQuestion && setupConfig.question_text) {
          onUpdateQuestion(question.id, {
            setupConfig: {
              ...setupConfig,
              question_text: newText,
            },
          })
        } else {
          onUpdateQuestion(question.id, {
            uiConfig: {
              ...uiConfig,
              label: newText,
            },
          })
        }
      } else {
        let subQuestionId = editingField.id

        if (subQuestionId.startsWith("sub_question_text_")) {
          subQuestionId = subQuestionId.replace("sub_question_text_", "")
        } else if (subQuestionId.startsWith("sub_question_placeholder_")) {
          subQuestionId = subQuestionId.replace("sub_question_placeholder_", "")
        }

        const isComplexQuestion =
          question.type === "deposit" ||
          question.type === "subjectToLoanApproval" ||
          question.type === "settlementDate"

        const isPrefixedRepeatedField =
          /^(rep-\d+|other-person-\d+|other-corporation-\d+)_(firstName|middleName|lastName)(Label|Placeholder)$/.test(
            subQuestionId,
          )
        const isSubQuestionId =
          subQuestionId.startsWith("deposit_") ||
          subQuestionId.startsWith("loan_") ||
          subQuestionId.startsWith("settlement_") ||
          subQuestionId === "loanApprovalQuestionLabel" ||
          subQuestionId === "supportingDocumentsLabel" ||
          subQuestionId === "loanApprovalDueLabel" ||
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
          subQuestionId === "loanApprovalDuePlaceholder" ||
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
          isPrefixedRepeatedField ||
          (isComplexQuestion && subQuestionId.includes("_")) ||
          (question.type === "custom" &&
            (subQuestionId.endsWith("Label") ||
              subQuestionId.endsWith("Placeholder")))

        if (isSubQuestionId) {
          const updatedUIConfig = updateSubQuestionLabel(
            uiConfig,
            subQuestionId,
            newText,
          )
          onUpdateQuestion(question.id, {
            uiConfig: updatedUIConfig,
          })
        } else {
          onUpdateQuestion(question.id, {
            uiConfig: {
              ...uiConfig,
              [editingField.id]: newText,
            },
          })
        }
      }
    } else {
      let subQuestionId = editingField.id

      if (subQuestionId.startsWith("sub_question_placeholder_")) {
        subQuestionId = subQuestionId.replace("sub_question_placeholder_", "")
      }

      const isComplexQuestion =
        question.type === "deposit" ||
        question.type === "subjectToLoanApproval" ||
        question.type === "settlementDate"

      const isPrefixedRepeatedField =
        /^(rep-\d+|other-person-\d+|other-corporation-\d+)_(firstName|middleName|lastName)(Label|Placeholder)$/.test(
          subQuestionId,
        )
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
        isPrefixedRepeatedField ||
        (isComplexQuestion && subQuestionId.includes("_")) ||
        (question.type === "custom" &&
          (subQuestionId.endsWith("Label") ||
            subQuestionId.endsWith("Placeholder")))

      if (isSubQuestionId) {
        const updatedUIConfig = updateSubQuestionPlaceholder(
          uiConfig,
          subQuestionId,
          newText,
        )
        onUpdateQuestion(question.id, {
          uiConfig: updatedUIConfig,
        })
      } else {
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

  const isEssential = requiredQuestionTypes.includes(question.type)

  const isLockedInPosition =
    (question.type === "specifyListing" && question.order === 1) ||
    (question.type === "submitterRole" && question.order === 2)

  const handleRequiredToggle = () => {
    if (isEssential) {
      setEssentialQuestionModal({ isOpen: true, action: "makeOptional" })
      return
    }

    if (isStatementQuestion) {
      const newRequired = !question.required
      const currentTickboxMode = setupConfig.add_tickbox || "no"

      let newTickboxMode = currentTickboxMode
      if (newRequired && currentTickboxMode !== "required") {
        if (currentTickboxMode === "optional") {
          newTickboxMode = "required"
        }
      } else if (!newRequired && currentTickboxMode === "required") {
        newTickboxMode = "optional"
      }

      onUpdateQuestion(question.id, {
        required: newRequired,
        setupConfig: {
          ...setupConfig,
          add_tickbox: newTickboxMode,
        },
      })
    } else {
      onUpdateQuestion(question.id, {
        required: !question.required,
      })
    }
  }

  const handleDelete = () => {
    if (isEssential && question.type !== "submitterRole") {
      setEssentialQuestionModal({ isOpen: true, action: "delete" })
      return
    }
    onDelete()
  }

  const handleEditQuestion = () => {
    if (isEssential && question.type !== "offerAmount") {
      setEssentialQuestionModal({ isOpen: true, action: "edit" })
      return
    }
    setEditQuestionModalOpen(true)
  }

  const isSubmitButton = question.type === "submitButton"

  useEffect(() => {
    if (
      question.type === "specifyListing" &&
      question.formId &&
      listings === null
    ) {
      getFormOwnerListings(question.formId, false, false)
        .then((ownerListings) => {
          setListings(ownerListings)
        })
        .catch((error) => {
          console.error("Error fetching listings:", error)
          setListings([])
        })
    }
  }, [question.type, question.formId])

  const hasRealListings = listings && listings.length > 0
  const showExplanatoryText =
    question.type === "specifyListing" && !hasRealListings && listings !== null

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
        <div className="flex items-center justify-between gap-4 md:hidden">
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
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-1 flex-col gap-2">
              {!isSubmitButton && (
                <p
                  className={cn(
                    "text-base font-medium text-gray-900",
                    !isStatementQuestion &&
                      "cursor-pointer transition-colors hover:text-cyan-600",
                  )}
                  onClick={
                    !isStatementQuestion ? () => handleLabelEdit() : undefined
                  }
                  title={
                    !isStatementQuestion
                      ? "Click to edit question text"
                      : undefined
                  }
                >
                  {labelText}
                  {question.required && (
                    <span className="text-red-500"> *</span>
                  )}
                </p>
              )}
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

            {!isSubmitButton && (
              <div className="flex items-center justify-between gap-4 md:hidden">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={question.required}
                    onCheckedChange={handleRequiredToggle}
                  />
                  <span className="text-sm text-gray-700">Required field</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditQuestion}
                >
                  Edit Question
                </Button>
              </div>
            )}
          </div>
          {showExplanatoryText && (
            <p className="text-sm text-gray-500">
              If you have not added any active Listings, Buyers will specify a
              Listing using text.
            </p>
          )}
        </div>

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
      </div>

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

      <EditQuestionModal
        open={editQuestionModalOpen}
        onOpenChange={setEditQuestionModalOpen}
        question={question}
        onUpdateQuestion={onUpdateQuestion}
        questionDefinitions={questionDefinitions}
      />

      <EssentialQuestionModal
        isOpen={essentialQuestionModal.isOpen}
        onClose={() =>
          setEssentialQuestionModal({ isOpen: false, action: "delete" })
        }
        action={essentialQuestionModal.action}
        questionType={questionTypeToLabel[question.type] || question.type}
      />
    </>
  )
}

export default QuestionCard
