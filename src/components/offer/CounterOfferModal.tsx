"use client"

import { OfferWithListing } from "@/types/offer"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

interface CounterOfferModalProps {
  isOpen: boolean
  onClose: () => void
  offer: OfferWithListing | null
}

const CounterOfferModal = ({
  isOpen,
  onClose,
  offer,
}: CounterOfferModalProps) => {
  if (!offer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make a Counter Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Counter offer functionality will be implemented here.</p>
            <p className="mt-2">
              Original offer amount:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency:
                  (offer.customQuestionsData as any)?.currency || "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(offer.amount)}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>Create Counter Offer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CounterOfferModal

