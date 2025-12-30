"use client"

import { LISTING_STATUSES } from "@/constants/listings"
import { ListingStatus } from "@/types/listing"
import { Ellipsis } from "lucide-react"
import Link from "next/link"
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
} from "../../ui/alert-dialog"
import { Button } from "../../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"

type ListingActionsMenuProps = {
  listingId: string
  currentStatus: ListingStatus
  onDelete: (listingId: string) => Promise<void>
  onUpdateStatus: (listingId: string, status: ListingStatus) => Promise<void>
  buttonClassName?: string
  iconSize?: number
}

const ListingActionsMenu = ({
  listingId,
  currentStatus,
  onDelete,
  onUpdateStatus,
  buttonClassName,
  iconSize = 16,
}: ListingActionsMenuProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus>(currentStatus)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(listingId)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting listing:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusClick = () => {
    setSelectedStatus(currentStatus)
    setStatusDialogOpen(true)
  }

  const handleStatusConfirm = async () => {
    if (selectedStatus === currentStatus) {
      setStatusDialogOpen(false)
      return
    }
    setIsUpdating(true)
    try {
      await onUpdateStatus(listingId, selectedStatus)
      setStatusDialogOpen(false)
    } catch (error) {
      console.error("Error updating listing status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const statusOptions = Object.entries(LISTING_STATUSES)
    .filter(([value]) => value !== "unassigned")
    .map(([value, label]) => ({
      value: value as ListingStatus,
      label,
    }))

  return (
    <>
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size={buttonClassName ? undefined : "icon"}
            className={buttonClassName || "h-8 w-8"}
          >
            <Ellipsis size={iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="max-w-60 p-2"
          side="bottom"
          collisionPadding={64}
        >
          <div className="flex flex-col gap-1">
            <Link href={`/listing/${listingId}`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 p-2"
              >
                View Listing
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2"
              onClick={handleStatusClick}
            >
              Update Listing Status
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Listing Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new status for this listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ListingStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a status..." />
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleStatusConfirm}
              disabled={isUpdating || selectedStatus === currentStatus}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ListingActionsMenu

