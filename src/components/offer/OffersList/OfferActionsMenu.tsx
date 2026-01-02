"use client"

import { OFFER_STATUS_OPTIONS } from "@/constants/offers"
import { OfferStatus } from "@/types/offer"
import { Ellipsis, Eye, Link2, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
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

type OfferActionsMenuProps = {
  offerId: string
  currentStatus: OfferStatus
  onDelete: (offerId: string) => Promise<void>
  onUpdateStatus?: (offerId: string, status: OfferStatus) => Promise<void>
  onAssignToListing?: (offerId: string, listingId: string) => Promise<void>
  listings: Array<{ id: string; address: string; isTest?: boolean | null }>
  buttonClassName?: string
  iconSize?: number
  showAssignToListing?: boolean
}

const OfferActionsMenu = ({
  offerId,
  currentStatus,
  onDelete,
  onUpdateStatus,
  onAssignToListing,
  listings,
  buttonClassName,
  iconSize = 16,
  showAssignToListing = false,
}: OfferActionsMenuProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [selectedStatus, setSelectedStatus] =
    useState<OfferStatus>(currentStatus)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const realListings = listings.filter((listing) => listing.isTest !== true)

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(offerId)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting offer:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssignClick = () => {
    if (!onAssignToListing) return

    if (realListings.length === 0) {
      toast.error(
        "You have no listings to assign to. Please create a listing first.",
      )
      return
    }
    setAssignDialogOpen(true)
  }

  const handleAssignConfirm = async () => {
    if (!selectedListingId || !onAssignToListing) return
    setIsAssigning(true)
    try {
      await onAssignToListing(offerId, selectedListingId)
      setAssignDialogOpen(false)
      setSelectedListingId("")
    } catch (error) {
      console.error("Error assigning offer:", error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleStatusClick = () => {
    setSelectedStatus(currentStatus)
    setStatusDialogOpen(true)
  }

  const handleStatusConfirm = async () => {
    if (!onUpdateStatus || selectedStatus === currentStatus) {
      setStatusDialogOpen(false)
      return
    }
    setIsUpdating(true)
    try {
      await onUpdateStatus(offerId, selectedStatus)
      setStatusDialogOpen(false)
    } catch (error) {
      console.error("Error updating offer status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

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
            <Link href={`/offer/${offerId}`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 p-2"
              >
                <Eye size={16} />
                View Offer
              </Button>
            </Link>
            {showAssignToListing && onAssignToListing && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 p-2"
                onClick={handleAssignClick}
              >
                <Link2 size={16} />
                Assign to Listing
              </Button>
            )}
            {onUpdateStatus && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 p-2"
                onClick={handleStatusClick}
              >
                <Pencil size={16} />
                Update Offer Status
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteClick}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete offer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be
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

      <AlertDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign to Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Select a listing to assign this offer to.
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
                {realListings.map((listing) => (
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
              onClick={handleAssignConfirm}
              disabled={isAssigning || !selectedListingId}
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Offer Status</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new status for this offer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as OfferStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a status..." />
              </SelectTrigger>
              <SelectContent>
                {OFFER_STATUS_OPTIONS.map((option) => (
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

export default OfferActionsMenu
