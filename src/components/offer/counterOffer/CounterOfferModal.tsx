"use client"

import { getOfferWithQuestions } from "@/app/actions/offers"
import { OfferWithListing } from "@/types/offer"
import { Database } from "@/types/supabase"
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Spinner } from "../../ui/spinner"
import { Step1 } from "./steps/Step1"
import { Step2 } from "./steps/Step2"
import { Step3 } from "./steps/Step3"
import { Step4 } from "./steps/Step4"
import { Step5 } from "./steps/Step5"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface CounterOfferModalProps {
  isOpen: boolean
  onClose: () => void
  offer: OfferWithListing | null
}

type FormValues = Record<string, any>

const CounterOfferModal = ({
  isOpen,
  onClose,
  offer,
}: CounterOfferModalProps) => {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [originalOffer, setOriginalOffer] = useState<OfferWithListing | null>(
    null,
  )
  const [originalFormValues, setOriginalFormValues] = useState<FormValues>({})
  const [counterFormValues, setCounterFormValues] = useState<FormValues>({})
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  useEffect(() => {
    if (isOpen && offer) {
      fetchOfferData()
    }
  }, [isOpen, offer])

  const fetchOfferData = async () => {
    if (!offer) return

    setLoading(true)
    try {
      const result = await getOfferWithQuestions(offer.id)
      if (result.offer && result.questions) {
        setOriginalOffer(result.offer)
        setQuestions(result.questions)
        const formValues = transformOfferToFormValues(result.offer)
        setOriginalFormValues(formValues)
        setCounterFormValues({})
      }
    } catch (error) {
      console.error("Error fetching offer data:", error)
    } finally {
      setLoading(false)
    }
  }

  const transformOfferToFormValues = (offer: OfferWithListing): FormValues => {
    const values: FormValues = {}

    values.listingAddress =
      offer.customListingAddress || offer.listing?.address || ""

    values.submitterRole = offer.buyerType || ""

    values.submitterName = {
      firstName: offer.submitterFirstName || "",
      lastName: offer.submitterLastName || "",
    }

    values.submitterEmail = offer.submitterEmail || ""

    values.submitterPhone = offer.submitterPhone || ""

    if (offer.purchaseAgreementFileUrl) {
      values.purchaseAgreementFile = offer.purchaseAgreementFileUrl
    }

    const currency = (offer.customQuestionsData as any)?.currency || "USD"
    values.offerAmount = {
      amount: offer.amount || 0,
      currency: currency,
    }

    if (offer.depositData) {
      values.deposit = offer.depositData
    }

    values.paymentWay = offer.paymentWay || "cash"

    if (offer.expires) {
      values.offerExpiry = {
        date: offer.expires,
        time: offer.expiryTime || "",
      }
    }

    if (offer.messageToAgent) {
      values.messageToAgent = offer.messageToAgent
    }

    return values
  }

  const handleCopyValue = (fieldKey: string) => {
    setCounterFormValues((prev) => ({
      ...prev,
      [fieldKey]: originalFormValues[fieldKey],
    }))
  }

  const handleRemoveValue = (fieldKey: string) => {
    setCounterFormValues((prev) => {
      const newValues = { ...prev }
      delete newValues[fieldKey]
      return newValues
    })
  }

  const handleValueChange = (fieldKey: string, value: any) => {
    setCounterFormValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
  }

  const renderField = (
    label: string,
    fieldKey: string,
    renderInput: (
      value: any,
      onChange: (value: any) => void,
    ) => React.ReactElement,
    renderDisplay: (value: any) => string,
    originalValue: any,
    counterValue: any,
  ) => {
    const displayValue = renderDisplay(originalValue)

    return (
      <div className="space-y-1.5 pb-6 md:space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
          <Input
            value={displayValue}
            disabled
            className="w-full bg-gray-50 text-gray-700"
          />
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rotate-90 p-0 md:rotate-0"
              onClick={() => handleCopyValue(fieldKey)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {renderInput(
                counterValue ?? (fieldKey === "submitterName" ? {} : ""),
                (value) => handleValueChange(fieldKey, value),
              )}
            </div>
            {counterValue !== undefined && counterValue !== null && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 shrink-0 px-2 text-red-600 hover:text-red-700"
                onClick={() => handleRemoveValue(fieldKey)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    const stepProps = {
      originalFormValues,
      counterFormValues,
      renderField,
      handleCopyValue,
      handleRemoveValue,
      handleValueChange,
    }

    if (currentStep === 1) {
      return <Step1 {...stepProps} />
    }

    if (currentStep === 2) {
      return <Step2 {...stepProps} />
    }

    if (currentStep === 3) {
      return <Step3 {...stepProps} />
    }

    if (currentStep === 4) {
      return <Step4 {...stepProps} />
    }

    if (currentStep === 5) {
      return <Step5 {...stepProps} />
    }

    return <div>Step {currentStep} content</div>
  }

  if (!offer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[90vw]! overflow-y-auto lg:max-w-5xl!">
        <DialogHeader className="text-left">
          <DialogTitle className="text-left">
            Counter Offer (Step {currentStep} of {totalSteps})
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Compare the original offer with your new counter offer. Edit the
            fields on the right. All fields must be completed or removed.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-1 gap-4 border-b pb-3 md:grid md:grid-cols-[1fr_auto_1fr]">
              <div className="text-xs font-bold text-black">Original Offer</div>
              <div></div>
              <div className="text-xs font-bold text-black">Counter Offer</div>
            </div>
            <div className="space-y-4 py-4 md:space-y-6">
              {renderStepContent()}
            </div>

            <div className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button onClick={() => setCurrentStep((prev) => prev + 1)}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={onClose}>Create Counter Offer</Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CounterOfferModal
