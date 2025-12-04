"use client"

import { cn } from "@/lib/utils"
import { MessageSquare, Trash2, X } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

export type SelectionActionBarProps = {
  selectedCount: number
  onDelete: () => Promise<void>
  onStatusChange?: (status: string) => Promise<void>
  onSendMessage?: () => void
  onClearSelection?: () => void
  statusOptions?: Array<{ value: string; label: string }>
  statusLabel?: string
  itemType?: "offers" | "listings"
  showMessageButton?: boolean
}

const SelectionActionBar = ({
  selectedCount,
  onDelete,
  onStatusChange,
  onSendMessage,
  onClearSelection,
  statusOptions = [],
  statusLabel = "Status",
  itemType = "offers",
  showMessageButton = false,
}: SelectionActionBarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("")

  if (selectedCount === 0) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setSelectedStatus(status)
    if (onStatusChange) {
      try {
        await onStatusChange(status)
        setSelectedStatus("")
      } catch (error) {
        console.error("Error changing status:", error)
        setSelectedStatus("")
      }
    }
  }

  const itemName = selectedCount === 1 ? itemType.slice(0, -1) : itemType

  return (
    <>
      <div
        className={cn(
          "fixed right-0 bottom-0 left-0 z-50",
          "m-4 mx-auto w-fit rounded-xl border border-gray-200 bg-white shadow-lg",
          "px-3 py-2",
        )}
      >
        <div className="flex items-center justify-between gap-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (onClearSelection) {
                onClearSelection()
              }
            }}
            className="h-6 w-6"
          >
            <X size={14} />
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedCount} {itemName} selected
              </span>

              {onStatusChange && statusOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={`Change ${statusLabel.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showMessageButton && onSendMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSendMessage}
                  className="gap-2"
                >
                  <MessageSquare size={16} />
                  Send Message
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount}{" "}
              {selectedCount === 1 ? itemName : itemType}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SelectionActionBar
