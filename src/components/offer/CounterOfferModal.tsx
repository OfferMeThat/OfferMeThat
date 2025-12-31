"use client"

import { getOfferWithQuestions } from "@/app/actions/offers"
import {
  formatDepositAmount,
  normalizeDepositData,
} from "@/lib/depositDataHelpers"
import { OfferWithListing } from "@/types/offer"
import { Database } from "@/types/supabase"
import { ArrowLeft, ArrowRight, Copy, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"

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
        setCounterFormValues({ ...formValues })
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
    const isNA = displayValue === "N/A" || !originalValue

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">
              Original Offer
            </div>
            <Input
              value={displayValue}
              disabled
              className="bg-gray-50 text-gray-700"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500">
                Counter Offer
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => handleCopyValue(fieldKey)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {counterValue !== undefined && counterValue !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveValue(fieldKey)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {counterValue !== undefined && counterValue !== null ? (
              renderInput(counterValue, (value) =>
                handleValueChange(fieldKey, value),
              )
            ) : (
              <div className="rounded border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-400">
                Field removed
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          {renderField(
            "Property Address",
            "listingAddress",
            (value, onChange) => (
              <Input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter property address"
              />
            ),
            (value) => value || "N/A",
            originalFormValues.listingAddress,
            counterFormValues.listingAddress,
          )}

          {renderField(
            "What best describes you?",
            "submitterRole",
            (value, onChange) => (
              <Input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter role"
              />
            ),
            (value) => value || "N/A",
            originalFormValues.submitterRole,
            counterFormValues.submitterRole,
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Your Name
            </Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500">
                  Original Offer
                </div>
                <Input
                  value={
                    originalFormValues.submitterName
                      ? `${originalFormValues.submitterName.firstName || ""} ${originalFormValues.submitterName.lastName || ""}`.trim() ||
                        "N/A"
                      : "N/A"
                  }
                  disabled
                  className="bg-gray-50 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-500">
                    Counter Offer
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleCopyValue("submitterName")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {counterFormValues.submitterName !== undefined &&
                      counterFormValues.submitterName !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveValue("submitterName")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                  </div>
                </div>
                {counterFormValues.submitterName !== undefined &&
                counterFormValues.submitterName !== null ? (
                  <div className="space-y-2">
                    <Input
                      value={counterFormValues.submitterName?.firstName || ""}
                      onChange={(e) =>
                        handleValueChange("submitterName", {
                          ...counterFormValues.submitterName,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="First Name"
                    />
                    <Input
                      value={counterFormValues.submitterName?.lastName || ""}
                      onChange={(e) =>
                        handleValueChange("submitterName", {
                          ...counterFormValues.submitterName,
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-400">
                    Field removed
                  </div>
                )}
              </div>
            </div>
          </div>

          {renderField(
            "Your Email",
            "submitterEmail",
            (value, onChange) => (
              <Input
                type="email"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter email"
              />
            ),
            (value) => value || "N/A",
            originalFormValues.submitterEmail,
            counterFormValues.submitterEmail,
          )}

          {renderField(
            "Your Mobile Number",
            "submitterPhone",
            (value, onChange) => (
              <Input
                type="tel"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter phone number"
              />
            ),
            (value) => value || "N/A",
            originalFormValues.submitterPhone,
            counterFormValues.submitterPhone,
          )}
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          {renderField(
            "PDF Attachment",
            "purchaseAgreementFile",
            (value, onChange) => (
              <Input
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="File URL"
                disabled
              />
            ),
            (value) => {
              if (!value) return "N/A"
              if (typeof value === "string") {
                return value
              }
              return "N/A"
            },
            originalFormValues.purchaseAgreementFile,
            counterFormValues.purchaseAgreementFile,
          )}

          {renderField(
            "Offer Amount",
            "offerAmount",
            (value, onChange) => (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={value?.amount || 0}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
                <Input
                  value={value?.currency || "USD"}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      currency: e.target.value,
                    })
                  }
                  placeholder="USD"
                />
              </div>
            ),
            (value) => {
              if (!value) return "N/A"
              const amount = value.amount || 0
              const currency = value.currency || "USD"
              return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(amount)
            },
            originalFormValues.offerAmount,
            counterFormValues.offerAmount,
          )}
        </div>
      )
    }

    if (currentStep === 3) {
      const getDepositDisplay = (depositData: any) => {
        if (!depositData) return "N/A"
        try {
          const normalized = normalizeDepositData(depositData)
          if (normalized && normalized.instalments.length > 0) {
            if (normalized.numInstalments === 1) {
              return formatDepositAmount(normalized.instalments[0])
            }
            return `${normalized.numInstalments} instalments`
          }
        } catch (e) {
          // fall through
        }
        return JSON.stringify(depositData)
      }

      return (
        <div className="space-y-6">
          {renderField(
            "Total Deposit Amount",
            "deposit",
            (value, onChange) => (
              <Textarea
                value={JSON.stringify(value || {}, null, 2)}
                onChange={(e) => {
                  try {
                    onChange(JSON.parse(e.target.value))
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="Deposit data (JSON)"
                className="font-mono text-xs"
                rows={6}
              />
            ),
            getDepositDisplay,
            originalFormValues.deposit,
            counterFormValues.deposit,
          )}
        </div>
      )
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          {renderField(
            "Payment Way",
            "paymentWay",
            (value, onChange) => (
              <Select value={value || "cash"} onValueChange={onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            ),
            (value) => {
              if (!value) return "N/A"
              return value === "cash" ? "Cash" : "Finance"
            },
            originalFormValues.paymentWay,
            counterFormValues.paymentWay,
          )}

          {renderField(
            "Offer Expires",
            "offerExpiry",
            (value, onChange) => (
              <div className="space-y-2">
                <Input
                  type="date"
                  value={value?.date || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      date: e.target.value,
                    })
                  }
                  placeholder="Date"
                />
                <Input
                  type="time"
                  value={value?.time || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      time: e.target.value,
                    })
                  }
                  placeholder="Time"
                />
              </div>
            ),
            (value) => {
              if (!value || !value.date) return "N/A"
              const date = new Date(value.date)
              const dateStr = date.toLocaleDateString()
              const timeStr = value.time || ""
              return timeStr ? `${dateStr} ${timeStr}` : dateStr
            },
            originalFormValues.offerExpiry,
            counterFormValues.offerExpiry,
          )}
        </div>
      )
    }

    if (currentStep === 5) {
      const getMessageDisplay = (messageData: any) => {
        if (!messageData) return "N/A"
        if (typeof messageData === "string") return messageData
        if (typeof messageData === "object" && messageData.message) {
          return messageData.message
        }
        return JSON.stringify(messageData)
      }

      return (
        <div className="space-y-6">
          {renderField(
            "Message to Agent",
            "messageToAgent",
            (value, onChange) => (
              <Textarea
                value={typeof value === "string" ? value : value?.message || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter message to agent"
                rows={6}
              />
            ),
            getMessageDisplay,
            originalFormValues.messageToAgent,
            counterFormValues.messageToAgent,
          )}
        </div>
      )
    }

    return <div>Step {currentStep} content</div>
  }

  if (!offer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
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
            <div className="space-y-6 py-4">{renderStepContent()}</div>

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
                    Looks Good
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
