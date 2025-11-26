"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { REQUIRED_QUESTION_TYPES } from "@/constants/offerFormQuestions"
import { Database } from "@/types/supabase"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionCardProps {
  question: Question
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

const QuestionCard = ({
  question,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: QuestionCardProps) => {
  const payload = question.payload as {
    label?: string
    description?: string
    placeholder?: string
  } | null

  const questionNumber = question.order
  const totalQuestions = 7 // TODO: Make this dynamic based on total count

  return (
    <div className="flex items-stretch gap-6">
      {/* Left: Question Info */}
      <div className="flex w-auto flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
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

      {/* Middle: Question Preview */}
      <div className="flex flex-1 flex-col justify-center space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            {payload?.description || question.type}
          </h3>
          {question.required && (
            <Badge size="xs" variant="destructiveLight" className="text-xs">
              Essential
            </Badge>
          )}
        </div>
        <p className="text-base font-medium text-gray-900">
          {payload?.label || "Question label"}
          {question.required && <span className="text-red-500"> *</span>}
        </p>
        {payload?.placeholder && (
          <input
            type="text"
            placeholder={payload.placeholder}
            disabled
            className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex w-auto flex-col justify-center gap-1">
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
