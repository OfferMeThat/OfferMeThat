"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OFFER_STATUSES } from "@/constants/offers"
import { downloadCsv } from "@/lib/generateListingReport"
import {
  generateOfferReport,
  generateOfferReportFilename,
} from "@/lib/generateOfferReport"
import { OfferWithListing } from "@/types/offer"
import { OFFER_REPORT_FIELDS, OfferReportFieldKey } from "@/types/reportTypes"
import { FileDown } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type OfferReportGenerationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  offers: OfferWithListing[]
}

const OfferReportGenerationModal = ({
  open,
  onOpenChange,
  offers,
}: OfferReportGenerationModalProps) => {
  const [selectedFields, setSelectedFields] = useState<
    Set<OfferReportFieldKey>
  >(new Set(OFFER_REPORT_FIELDS.map((f) => f.key)))

  const handleToggleField = (fieldKey: OfferReportFieldKey) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey)
      } else {
        newSet.add(fieldKey)
      }
      return newSet
    })
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedFields(new Set(OFFER_REPORT_FIELDS.map((f) => f.key)))
    } else {
      setSelectedFields(new Set())
    }
  }

  const handleDownload = () => {
    if (selectedFields.size === 0) {
      toast.error("Please select at least one field to include in the report")
      return
    }

    const csvContent = generateOfferReport(offers, Array.from(selectedFields))
    const filename = generateOfferReportFilename()
    downloadCsv(csvContent, filename)

    toast.success(`Report downloaded successfully: ${filename}`)
    onOpenChange(false)
  }

  // Format date for preview
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format currency for preview
  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get submitter name
  const getSubmitterName = (offer: OfferWithListing): string => {
    const firstName = offer.submitterFirstName || ""
    const lastName = offer.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  // Get listing address
  const getListingAddress = (offer: OfferWithListing): string => {
    if (offer.customListingAddress) {
      return offer.customListingAddress
    }
    return offer.listing?.address || "N/A"
  }

  // Format buyer type
  const formatBuyerType = (buyerType: string): string => {
    const buyerTypeLabels: Record<string, string> = {
      buyer: "Buyer",
      agent: "Agent",
      affiliate: "Affiliate",
    }
    return buyerTypeLabels[buyerType] || buyerType
  }

  // Format payment way
  const formatPaymentWay = (paymentWay: string): string => {
    const paymentWayLabels: Record<string, string> = {
      cash: "Cash",
      finance: "Finance",
    }
    return paymentWayLabels[paymentWay] || paymentWay
  }

  // Format boolean to Yes/No
  const formatYesNo = (value: boolean): string => {
    return value ? "Yes" : "No"
  }

  // Format expiry
  const formatExpiry = (offer: OfferWithListing): string => {
    if (!offer.expires) {
      return "N/A"
    }
    const dateStr = formatDate(offer.expires)
    const timeStr = offer.expiryTime || ""
    return timeStr ? `${dateStr} ${timeStr}` : dateStr
  }

  // Get purchaser names
  const getPurchaserNames = (offer: OfferWithListing): string => {
    if (!offer.purchaserData) return "N/A"

    const data = offer.purchaserData as any

    if (data.method === "single_field" && data.name) {
      return data.name
    }

    if (data.method === "individual_names" && data.nameFields) {
      const names = Object.values(data.nameFields).map((nameData: any) => {
        return [nameData.firstName, nameData.middleName, nameData.lastName]
          .filter(Boolean)
          .join(" ")
      })
      return names.join(", ")
    }

    return "N/A"
  }

  // Get deposit amount
  const getDepositAmount = (offer: OfferWithListing): string => {
    if (!offer.depositData) return "N/A"

    const data = offer.depositData as any

    if (data.instalment_1 || data.instalment_2 || data.instalment_3) {
      return "Multiple instalments"
    }

    if (data.depositType === "amount" || data.amount) {
      return formatCurrency(data.amount)
    }

    if (data.depositType === "percentage" || data.percentage) {
      return `${data.percentage}% of purchase price`
    }

    return "N/A"
  }

  // Get deposit due
  const getDepositDue = (offer: OfferWithListing): string => {
    if (!offer.depositData) return "N/A"

    const data = offer.depositData as any

    if (data.instalment_1 || data.instalment_2 || data.instalment_3) {
      return "See deposit details"
    }

    if (data.depositDueText) {
      return data.depositDueText
    }

    if (data.depositDue) {
      return formatDate(data.depositDue)
    }

    if (data.depositDueWithin) {
      const { number, unit } = data.depositDueWithin
      return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
    }

    return "N/A"
  }

  // Get settlement date
  const getSettlementDate = (offer: OfferWithListing): string => {
    if (!offer.settlementDateData) return "N/A"

    const data = offer.settlementDateData as any

    if (data.settlementDateText) {
      return data.settlementDateText
    }

    if (data.settlementDateTime) {
      return formatDate(data.settlementDateTime)
    }

    if (data.settlementDate) {
      const dateStr = formatDate(data.settlementDate)
      return data.settlementTime
        ? `${dateStr} at ${data.settlementTime}`
        : dateStr
    }

    if (data.settlementDateWithin) {
      const { number, unit } = data.settlementDateWithin
      return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
    }

    return "N/A"
  }

  // Get subject to loan
  const getSubjectToLoan = (offer: OfferWithListing): string => {
    if (!offer.subjectToLoanApproval) return "N/A"

    const data = offer.subjectToLoanApproval as any
    const isSubjectToLoan =
      data.subjectToLoanApproval === "yes" ||
      data.subjectToLoanApproval === true

    return isSubjectToLoan ? "Yes" : "No"
  }

  // Get special conditions (truncated for preview)
  const getSpecialConditions = (offer: OfferWithListing): string => {
    if (!offer.specialConditions) return "N/A"
    const text = offer.specialConditions
    return text.length > 100 ? text.substring(0, 100) + "..." : text
  }

  // Get message to agent (truncated for preview)
  const getMessageToAgent = (offer: OfferWithListing): string => {
    if (!offer.messageToAgent) return "N/A"

    let text = ""
    if (typeof offer.messageToAgent === "string") {
      text = offer.messageToAgent
    } else {
      const data = offer.messageToAgent as any
      text = data.message || data.text || "N/A"
    }

    return text.length > 100 ? text.substring(0, 100) + "..." : text
  }

  // Get preview data (first 5 offers)
  const previewOffers = offers.slice(0, 5)

  const allSelected = selectedFields.size === OFFER_REPORT_FIELDS.length
  const someSelected =
    selectedFields.size > 0 && selectedFields.size < OFFER_REPORT_FIELDS.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl!">
        <DialogHeader>
          <DialogTitle>Generate Offers Report</DialogTitle>
          <DialogDescription>
            Select the fields you want to include in your report, preview the
            data, and download as CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-180px)] space-y-6 overflow-y-auto pr-2">
          {/* Field Selection */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Select Fields</h3>
            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleToggleAll}
                  className={
                    someSelected ? "data-[state=checked]:bg-gray-400" : ""
                  }
                />
                <label
                  htmlFor="select-all"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {OFFER_REPORT_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.has(field.key)}
                      onCheckedChange={() => handleToggleField(field.key)}
                    />
                    <label
                      htmlFor={field.key}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedFields.size > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Preview ({offers.length} offer{offers.length !== 1 ? "s" : ""}{" "}
                total, showing first {Math.min(5, offers.length)})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {OFFER_REPORT_FIELDS.filter((field) =>
                        selectedFields.has(field.key),
                      ).map((field) => (
                        <TableHead key={field.key} className="font-medium">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        {OFFER_REPORT_FIELDS.filter((field) =>
                          selectedFields.has(field.key),
                        ).map((field) => {
                          const fieldKey = field.key
                          let cellContent: React.ReactNode = ""

                          switch (fieldKey) {
                            case "received":
                              cellContent = formatDate(offer.createdAt)
                              break
                            case "status":
                              cellContent = OFFER_STATUSES[offer.status]
                              break
                            case "listingAddress":
                              cellContent = getListingAddress(offer)
                              break
                            case "submitterName":
                              cellContent = getSubmitterName(offer)
                              break
                            case "submitterEmail":
                              cellContent = offer.submitterEmail || "N/A"
                              break
                            case "submitterPhone":
                              cellContent = offer.submitterPhone || "N/A"
                              break
                            case "offerAmount":
                              cellContent = formatCurrency(
                                offer.amount,
                                (offer.customQuestionsData as any)?.currency ||
                                  "USD",
                              )
                              break
                            case "buyerType":
                              cellContent = formatBuyerType(offer.buyerType)
                              break
                            case "paymentWay":
                              cellContent = formatPaymentWay(offer.paymentWay)
                              break
                            case "conditional":
                              cellContent = formatYesNo(offer.conditional)
                              break
                            case "expires":
                              cellContent = formatExpiry(offer)
                              break
                            case "updatedAt":
                              cellContent = offer.updatedAt
                                ? formatDate(offer.updatedAt)
                                : "N/A"
                              break
                            case "hasPurchaseAgreement":
                              cellContent = formatYesNo(
                                !!offer.purchaseAgreementFileUrl,
                              )
                              break
                            case "purchaserName":
                              cellContent = getPurchaserNames(offer)
                              break
                            case "depositAmount":
                              cellContent = getDepositAmount(offer)
                              break
                            case "depositDue":
                              cellContent = getDepositDue(offer)
                              break
                            case "settlementDate":
                              cellContent = getSettlementDate(offer)
                              break
                            case "subjectToLoan":
                              cellContent = getSubjectToLoan(offer)
                              break
                            case "specialConditions":
                              cellContent = getSpecialConditions(offer)
                              break
                            case "messageToAgent":
                              cellContent = getMessageToAgent(offer)
                              break
                          }

                          return (
                            <TableCell key={`${offer.id}-${fieldKey}`}>
                              {cellContent}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={selectedFields.size === 0}
            className="gap-2"
          >
            <FileDown size={16} />
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OfferReportGenerationModal
