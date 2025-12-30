"use client"

import { Ellipsis } from "lucide-react"
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

type LeadActionsMenuProps = {
  leadId: string
  onDelete: (leadId: string) => Promise<void>
  onAssignToListing: (leadId: string, listingId: string) => Promise<void>
  listings: Array<{ id: string; address: string; isTest?: boolean | null }>
  buttonClassName?: string
  iconSize?: number
}

const LeadActionsMenu = ({
  leadId,
  onDelete,
  onAssignToListing,
  listings,
  buttonClassName,
  iconSize = 16,
}: LeadActionsMenuProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const realListings = listings.filter((listing) => listing.isTest !== true)

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(leadId)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting lead:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssignClick = () => {
    if (realListings.length === 0) {
      toast.error(
        "You have no listings to assign to. Please create a listing first.",
      )
      return
    }
    setAssignDialogOpen(true)
  }

  const handleAssignConfirm = async () => {
    if (!selectedListingId) return
    setIsAssigning(true)
    try {
      await onAssignToListing(leadId, selectedListingId)
      setAssignDialogOpen(false)
      setSelectedListingId("")
    } catch (error) {
      console.error("Error assigning lead:", error)
    } finally {
      setIsAssigning(false)
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
            <Link href={`/lead/${leadId}`}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 p-2"
              >
                View Lead
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2"
              onClick={handleAssignClick}
            >
              Assign to Listing
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
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be
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
              Select a listing to assign this lead to.
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
    </>
  )
}

export default LeadActionsMenu

