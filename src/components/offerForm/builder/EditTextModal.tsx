"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface EditTextModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  currentText: string
  onSave: (newText: string) => void
  fieldType: "label" | "placeholder"
}

const EditTextModal = ({
  isOpen,
  onClose,
  title,
  currentText,
  onSave,
  fieldType,
}: EditTextModalProps) => {
  const [text, setText] = useState(currentText)

  // Reset text when modal opens with new content
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setText(currentText)
    } else {
      onClose()
    }
  }

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim())
      onClose()
    }
  }

  const description =
    fieldType === "label"
      ? "Make changes to the question text and click save when you're done."
      : "Make changes to the sub-question placeholder and click save when you're done."

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-500">{description}</p>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full"
            placeholder="Enter text..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSave()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditTextModal
