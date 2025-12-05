import { FileQuestion, Inbox, Search } from "lucide-react"
import { Button } from "./button"

interface EmptyStateProps {
  icon?: "inbox" | "search" | "file"
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const IconComponent = {
    inbox: Inbox,
    search: Search,
    file: FileQuestion,
  }[icon]

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <IconComponent className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-600">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
