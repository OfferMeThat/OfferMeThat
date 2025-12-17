"use client"

import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

type Page = Database["public"]["Tables"]["offerFormPages"]["Row"]

interface PageBreakProps {
  page: Page
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

const PageBreak = ({
  page,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: PageBreakProps) => {
  return (
    <div className="flex items-stretch gap-6">
      {/* Left: Label Section */}
      <div className="flex w-auto flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xl font-bold text-gray-900">BUTTON</p>
      </div>

      {/* Middle: Page Break Preview */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            PAGE BREAK
          </h3>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-lg border border-gray-200 bg-white p-4">
          <Button disabled className="w-full" size="lg">
            Next
          </Button>
        </div>
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

export default PageBreak
