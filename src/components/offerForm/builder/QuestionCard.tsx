"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  QUESTION_DEFINITIONS,
  QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES,
} from "@/constants/offerFormQuestions"
import { Database } from "@/types/supabase"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { QuestionRenderer } from "../QuestionRenderer"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionCardProps {
  questionsAmount: number
  question: Question
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

const QuestionCard = ({
  questionsAmount,
  question,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: QuestionCardProps) => {
  // Get UI configuration from uiConfig JSONB field
  const uiConfig =
    (question.uiConfig as {
      label?: string
      placeholder?: string
    } | null) || {}

  // Get question definition for description
  const questionDefinition = QUESTION_DEFINITIONS[question.type]

  const questionNumber = question.order
  const totalQuestions = questionsAmount

  // Get setup configuration
  const setupConfig = (question.setupConfig as Record<string, any>) || {}

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
      {/* Mobile: Top row with question number and actions */}
      <div className="flex items-center justify-between gap-4 md:hidden">
        {/* Question Number (Mobile) */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2">
          <p className="text-sm font-bold text-gray-900">
            QUESTION {questionNumber} of {totalQuestions}
          </p>
        </div>

        {/* Actions (Mobile) */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            <ChevronUp size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast}
          >
            <ChevronDown size={16} />
          </Button>
          <Button
            size="icon"
            disabled={!!REQUIRED_QUESTION_TYPES.includes(question.type)}
            variant="ghostDesctructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop: Left - Question Info */}
      <div className="hidden w-auto flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 md:flex">
        <p className="text-xl font-bold text-gray-900">QUESTION</p>
        <p className="text-sm font-bold text-gray-900">
          {questionNumber} of {totalQuestions}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            checked={question.required}
            disabled={!!question.required}
          />
          <span className="text-sm text-gray-700">Required field</span>
        </div>
        <Button variant="outline" className="mt-3 w-full" size="sm">
          Edit Question
        </Button>
      </div>

      {/* Middle: Question Preview (Both Mobile and Desktop) */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            {QUESTION_TYPE_TO_LABEL[question.type]}
          </h3>
          {question.required && (
            <Badge size="xs" variant="destructiveLight" className="text-xs">
              Essential
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-base font-medium text-gray-900">
            {uiConfig.label || questionDefinition?.label || "Question label"}
            {question.required && <span className="text-red-500"> *</span>}
          </p>

          {/* Render appropriate input based on question type and setup */}
          <QuestionRenderer question={question} disabled />
        </div>

        {/* Mobile: Required field checkbox and Edit button */}
        <div className="flex items-center justify-between gap-4 md:hidden">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={question.required}
              disabled={!!question.required}
            />
            <span className="text-sm text-gray-700">Required field</span>
          </div>
          <Button variant="outline" size="sm">
            Edit Question
          </Button>
        </div>
      </div>

      {/* Desktop: Right - Actions */}
      <div className="hidden w-auto flex-col justify-center gap-1 md:flex">
        <Button
          size="xs"
          variant="ghost"
          onClick={onMoveUp}
          disabled={isFirst}
          className="justify-baseline"
        >
          <ChevronUp size={16} />
          Move Up
        </Button>
        <Button
          size="xs"
          variant="ghost"
          onClick={onMoveDown}
          disabled={isLast}
          className="justify-baseline"
        >
          <ChevronDown size={16} />
          Move Down
        </Button>
        <Button
          size="xs"
          disabled={!!REQUIRED_QUESTION_TYPES.includes(question.type)}
          variant="ghostDesctructive"
          onClick={onDelete}
          className="justify-baseline"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  )
}

export default QuestionCard
