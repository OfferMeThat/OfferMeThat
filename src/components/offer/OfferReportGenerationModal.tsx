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
import { generateOfferReportPDF } from "@/lib/generateOfferReportPDF"
import {
  getAllDepositInfo,
  getAllMessageToAgentInfo,
  getAllSettlementInfo,
  getAllSpecialConditionsInfo,
  getAllSubjectToLoanInfo,
  getPurchaseAgreementUrls,
  getPurchaserNamesFromData,
  getSubmitterRoleFromData,
} from "@/lib/parseOfferDataForReports"
import { createClient } from "@/lib/supabase/client"
import { OfferWithListing } from "@/types/offer"
import { OFFER_REPORT_FIELDS, OfferReportFieldKey } from "@/types/reportTypes"
import { FileDown } from "lucide-react"
import { useEffect, useState } from "react"
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
  >(new Set(OFFER_REPORT_FIELDS.map((f) => f.key))) // All fields selected by default
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

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

  useEffect(() => {
    if (open) {
      const fetchUserName = async () => {
        setIsLoadingUser(true)
        try {
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", user.id)
              .single()
            if (profile?.username) {
              setUserName(profile.username)
            }
          }
        } catch (error) {
          console.error("Error fetching user name:", error)
        } finally {
          setIsLoadingUser(false)
        }
      }
      fetchUserName()
    }
  }, [open])

  const handleDownload = () => {
    if (selectedFields.size === 0) {
      toast.error("Please select at least one field to include in the report")
      return
    }

    let listingAddress: string | undefined = undefined
    if (offers.length > 0) {
      const firstListingAddress =
        offers[0].listing?.address || offers[0].customListingAddress
      if (
        firstListingAddress &&
        offers.every((offer) => {
          const addr = offer.listing?.address || offer.customListingAddress
          return addr === firstListingAddress
        })
      ) {
        listingAddress = firstListingAddress
      }
    }

    generateOfferReportPDF(
      offers,
      Array.from(selectedFields),
      userName,
      listingAddress,
    )

    toast.success("PDF report downloaded successfully")
    onOpenChange(false)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSubmitterName = (offer: OfferWithListing): string => {
    const firstName = offer.submitterFirstName || ""
    const lastName = offer.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  const getListingAddress = (offer: OfferWithListing): string => {
    if (offer.customListingAddress) {
      return offer.customListingAddress
    }
    return offer.listing?.address || "N/A"
  }

  const formatBuyerType = (buyerType: string): string => {
    const buyerTypeLabels: Record<string, string> = {
      buyer: "Buyer",
      agent: "Agent",
      affiliate: "Affiliate",
      buyer_with_agent: "Buyer with Agent",
      buyer_self: "Unrepresented Buyer",
      buyers_agent: "Buyer's Agent",
      buyer_represented: "Represented Buyer",
    }
    if (buyerTypeLabels[buyerType]) {
      return buyerTypeLabels[buyerType]
    }
    return buyerType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const formatPaymentWay = (paymentWay: string): string => {
    const paymentWayLabels: Record<string, string> = {
      cash: "Cash",
      finance: "Finance",
    }
    return paymentWayLabels[paymentWay] || paymentWay
  }

  const formatYesNo = (value: boolean): string => {
    return value ? "Yes" : "No"
  }

  const formatExpiry = (offer: OfferWithListing): string => {
    if (!offer.expires) {
      return "N/A"
    }
    const dateStr = formatDate(offer.expires)
    const timeStr = offer.expiryTime || ""
    return timeStr ? `${dateStr} ${timeStr}` : dateStr
  }

  const getPurchaserNames = (offer: OfferWithListing): string => {
    return getPurchaserNamesFromData(offer.purchaserData)
  }

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
            data, and download as PDF.
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
                      {OFFER_REPORT_FIELDS.filter(
                        (field) =>
                          selectedFields.has(field.key) &&
                          field.key !== "customQuestions",
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
                        {OFFER_REPORT_FIELDS.filter(
                          (field) =>
                            selectedFields.has(field.key) &&
                            field.key !== "customQuestions",
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
                              // Parse customQuestionsData if it's a JSON string
                              let customQuestionsData =
                                offer.customQuestionsData
                              if (typeof customQuestionsData === "string") {
                                try {
                                  customQuestionsData =
                                    JSON.parse(customQuestionsData)
                                } catch {
                                  customQuestionsData = null
                                }
                              }
                              const currency =
                                (customQuestionsData as any)?.currency || "USD"
                              cellContent = formatCurrency(
                                offer.amount,
                                currency,
                              )
                              break
                            case "buyerType":
                              cellContent = formatBuyerType(offer.buyerType)
                              break
                            case "paymentWay":
                              cellContent = formatPaymentWay(offer.paymentWay)
                              break
                            case "conditional":
                              const specialConditionsInfo =
                                getAllSpecialConditionsInfo(
                                  offer.specialConditions,
                                )
                              const subjectToLoanInfo = getAllSubjectToLoanInfo(
                                offer.subjectToLoanApproval,
                              )
                              const isConditional =
                                (specialConditionsInfo &&
                                  specialConditionsInfo !== "N/A" &&
                                  specialConditionsInfo !== "No") ||
                                (subjectToLoanInfo &&
                                  subjectToLoanInfo !== "N/A" &&
                                  subjectToLoanInfo.startsWith("Yes")) ||
                                offer.conditional === true
                              cellContent = formatYesNo(isConditional)
                              break
                            case "expires":
                              cellContent = formatExpiry(offer)
                              break
                            case "updatedAt":
                              cellContent = offer.updatedAt
                                ? formatDate(offer.updatedAt)
                                : "N/A"
                              break
                            case "submitterRole":
                              cellContent = getSubmitterRoleFromData(offer)
                              break
                            case "purchaseAgreement":
                              cellContent = getPurchaseAgreementUrls(offer)
                              break
                            case "purchaserName":
                              cellContent = getPurchaserNames(offer)
                              break
                            case "deposit":
                              cellContent = getAllDepositInfo(
                                offer.depositData,
                                offer,
                              )
                              break
                            case "settlementDate":
                              cellContent = getAllSettlementInfo(
                                offer.settlementDateData,
                              )
                              break
                            case "subjectToLoan":
                              cellContent = getAllSubjectToLoanInfo(
                                offer.subjectToLoanApproval,
                              )
                              break
                            case "specialConditions":
                              cellContent = getAllSpecialConditionsInfo(
                                offer.specialConditions,
                              )
                              break
                            case "messageToAgent":
                              cellContent = getAllMessageToAgentInfo(
                                offer.messageToAgent,
                              )
                              break
                            case "customQuestions":
                              cellContent = ""
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
            disabled={selectedFields.size === 0 || isLoadingUser}
            className="gap-2"
          >
            <FileDown size={16} />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OfferReportGenerationModal
