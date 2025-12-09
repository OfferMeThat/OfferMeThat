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

interface EssentialQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  action: "delete" | "edit" | "makeOptional"
  questionType: string
}

const EssentialQuestionModal = ({
  isOpen,
  onClose,
  action,
  questionType,
}: EssentialQuestionModalProps) => {
  const getActionText = () => {
    switch (action) {
      case "delete":
        return "delete"
      case "edit":
        return "edit"
      case "makeOptional":
        return "make optional"
      default:
        return "modify"
    }
  }

  const getExplanation = () => {
    switch (action) {
      case "delete":
        return "Essential questions are required for all offer forms and cannot be deleted. These questions ensure that all offers contain the necessary information to be processed."
      case "edit":
        return "Essential questions are standardized across all offer forms and cannot be edited. This ensures consistency and that all offers contain the required information."
      case "makeOptional":
        return "Essential questions must remain required for all offer forms. Making them optional would prevent the system from collecting critical information needed to process offers."
      default:
        return "Essential questions cannot be modified as they are required for all offer forms."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Cannot {getActionText()} Essential Question
              </DialogTitle>
              <DialogDescription className="mt-1">
                {questionType}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {getExplanation()}
          </p>
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

export default EssentialQuestionModal

