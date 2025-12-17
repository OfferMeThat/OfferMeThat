"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface RestrictionModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

const RestrictionModal = ({
  isOpen,
  onClose,
  message = "To maintain functionality of the platform there are some restrictions regarding the order of questions. This action can't be taken.",
}: RestrictionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Action Restricted
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="default">
            Understood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RestrictionModal

