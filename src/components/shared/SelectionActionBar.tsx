"use client"

import { cn } from "@/lib/utils"
import { FileSpreadsheet, Link2, MessageSquare, Trash2, X } from "lucide-react"
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
  onGenerateReport?: () => void
  onClearSelection?: () => void
  statusOptions?: Array<{ value: string; label: string }>
  statusLabel?: string
  itemType?: "offers" | "listings"
  showMessageButton?: boolean
  onAssignToListing?: (listingId: string) => Promise<void>
  listings?: Array<{ id: string; address: string }>
}

const SelectionActionBar = ({
  selectedCount,
  onDelete,
  onStatusChange,
  onSendMessage,
  onGenerateReport,
  onClearSelection,
  statusOptions = [],
  statusLabel = "Status",
  itemType = "offers",
  showMessageButton = false,
  onAssignToListing,
  listings = [],
}: SelectionActionBarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedListingId, setSelectedListingId] = useState<string>("")

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

  const handleAssignToListing = async () => {
    if (!selectedListingId || !onAssignToListing) return

    setIsAssigning(true)
    try {
      await onAssignToListing(selectedListingId)
      setShowAssignDialog(false)
      setSelectedListingId("")
    } catch (error) {
      console.error("Error assigning to listing:", error)
    } finally {
      setIsAssigning(false)
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
        <div className="flex items-center justify-around gap-4 lg:justify-between flex-wrap">
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

          <div className="flex items-center gap-4 flex-wrap">
            <span className="hidden text-sm font-medium text-gray-700 lg:inline">
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

            {onGenerateReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateReport}
                className="gap-2"
              >
                <FileSpreadsheet size={16} />
                <span className="hidden lg:inline">Generate Report</span>
              </Button>
            )}

            {showMessageButton && onSendMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendMessage}
                className="gap-2"
              >
                <MessageSquare size={16} />
                <span className="hidden lg:inline">Message</span>
              </Button>
            )}

            {onAssignToListing && listings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignDialog(true)}
                className="gap-2"
              >
                <Link2 size={16} />
                <span className="hidden lg:inline">Assign to Listing</span>
              </Button>
            )}
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 size={16} />
            <span className="hidden lg:inline">Delete</span>
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

      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign to Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Select a listing to assign {selectedCount}{" "}
              {selectedCount === 1 ? "offer" : "offers"} to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedListingId}
              onValueChange={setSelectedListingId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a listing..." />
              </SelectTrigger>
              <SelectContent>
                {listings.map((listing) => (
                  <SelectItem key={listing.id} value={listing.id}>
                    {listing.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>

            <Button
              onClick={handleAssignToListing}
              disabled={isAssigning || !selectedListingId}
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SelectionActionBar
