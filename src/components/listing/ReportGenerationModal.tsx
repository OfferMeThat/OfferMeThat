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
import { LISTING_STATUSES } from "@/constants/listings"
import { generateListingReportPDF } from "@/lib/generateListingReportPDF"
import { ListingWithOfferCounts } from "@/types/listing"
import { REPORT_FIELDS, ReportFieldKey } from "@/types/reportTypes"
import { createClient } from "@/lib/supabase/client"
import { FileDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type ReportGenerationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  listings: ListingWithOfferCounts[]
}

const ReportGenerationModal = ({
  open,
  onOpenChange,
  listings,
}: ReportGenerationModalProps) => {
  const [selectedFields, setSelectedFields] = useState<Set<ReportFieldKey>>(
    new Set(REPORT_FIELDS.map((f) => f.key)),
  )
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  const handleToggleField = (fieldKey: ReportFieldKey) => {
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
      setSelectedFields(new Set(REPORT_FIELDS.map((f) => f.key)))
    } else {
      setSelectedFields(new Set())
    }
  }

  // Fetch user name when modal opens
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

    generateListingReportPDF(listings, Array.from(selectedFields), userName)

    toast.success("PDF report downloaded successfully")
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

  // Get preview data (first 5 listings)
  const previewListings = listings.slice(0, 5)

  const allSelected = selectedFields.size === REPORT_FIELDS.length
  const someSelected =
    selectedFields.size > 0 && selectedFields.size < REPORT_FIELDS.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl!">
        <DialogHeader>
          <DialogTitle>Generate Listings Report</DialogTitle>
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
                {REPORT_FIELDS.map((field) => (
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
                Preview ({listings.length} listing
                {listings.length !== 1 ? "s" : ""} total, showing first{" "}
                {Math.min(5, listings.length)})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Array.from(selectedFields).map((fieldKey) => {
                        const field = REPORT_FIELDS.find(
                          (f) => f.key === fieldKey,
                        )
                        return (
                          <TableHead key={fieldKey} className="font-medium">
                            {field?.label}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewListings.map((listing) => (
                      <TableRow key={listing.id}>
                        {Array.from(selectedFields).map((fieldKey) => {
                          let cellContent: React.ReactNode = ""

                          switch (fieldKey) {
                            case "address":
                              cellContent = listing.address
                              break
                            case "dateListed":
                              cellContent = formatDate(listing.createdAt)
                              break
                            case "status":
                              cellContent = LISTING_STATUSES[listing.status]
                              break
                            case "pendingOffers":
                              cellContent = listing.pendingOffers
                              break
                            case "activeOffers":
                              cellContent = listing.activeOffers
                              break
                            case "totalOffers":
                              cellContent = listing.totalOffers
                              break
                            case "numberOfLeads":
                              cellContent = 1
                              break
                          }

                          return (
                            <TableCell key={`${listing.id}-${fieldKey}`}>
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

export default ReportGenerationModal
