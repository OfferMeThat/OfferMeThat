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
import {
  formatAreYouInterested,
  formatFinanceInterest,
  formatFollowAllListings,
  formatSubmitterRole,
} from "@/lib/formatLeadData"
import { generateLeadReportPDF } from "@/lib/generateLeadReportPDF"
import {
  getAllMessageToAgentInfo,
  getOpinionOfSalePrice,
  getSubmitterName,
} from "@/lib/parseLeadDataForReports"
import { createClient } from "@/lib/supabase/client"
import { LeadWithListing } from "@/types/lead"
import { LEAD_REPORT_FIELDS, LeadReportFieldKey } from "@/types/reportTypes"
import { FileDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type LeadReportGenerationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leads: LeadWithListing[]
}

const LeadReportGenerationModal = ({
  open,
  onOpenChange,
  leads,
}: LeadReportGenerationModalProps) => {
  const [selectedFields, setSelectedFields] = useState<Set<LeadReportFieldKey>>(
    new Set(LEAD_REPORT_FIELDS.map((f) => f.key)),
  ) // All fields selected by default
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [isLoadingUser, setIsLoadingUser] = useState(false)

  const handleToggleField = (fieldKey: LeadReportFieldKey) => {
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
      setSelectedFields(new Set(LEAD_REPORT_FIELDS.map((f) => f.key)))
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

    generateLeadReportPDF(leads, Array.from(selectedFields), userName)

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

  // Get preview data (first 5 leads)
  const previewLeads = leads.slice(0, 5)

  const allSelected = selectedFields.size === LEAD_REPORT_FIELDS.length
  const someSelected =
    selectedFields.size > 0 && selectedFields.size < LEAD_REPORT_FIELDS.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl!">
        <DialogHeader>
          <DialogTitle>Generate Leads Report</DialogTitle>
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
                {LEAD_REPORT_FIELDS.map((field) => (
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
                Preview ({leads.length} lead{leads.length !== 1 ? "s" : ""}{" "}
                total, showing first {Math.min(5, leads.length)})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {LEAD_REPORT_FIELDS.filter(
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
                    {previewLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        {LEAD_REPORT_FIELDS.filter(
                          (field) =>
                            selectedFields.has(field.key) &&
                            field.key !== "customQuestions",
                        ).map((field) => {
                          const fieldKey = field.key
                          let cellContent: React.ReactNode = ""

                          switch (fieldKey) {
                            case "received":
                              cellContent = formatDate(lead.createdAt)
                              break
                            case "submitterName":
                              cellContent = getSubmitterName(lead)
                              break
                            case "submitterEmail":
                              cellContent = lead.submitterEmail || "N/A"
                              break
                            case "submitterPhone":
                              cellContent = lead.submitterPhone || "N/A"
                              break
                            case "submitterRole":
                              cellContent = formatSubmitterRole(
                                lead.submitterRole,
                              )
                              break
                            case "areYouInterested":
                              cellContent = formatAreYouInterested(
                                lead.areYouInterested,
                              )
                              break
                            case "financeInterest":
                              cellContent = formatFinanceInterest(
                                lead.financeInterest,
                              )
                              break
                            case "followAllListings":
                              cellContent = formatFollowAllListings(
                                lead.followAllListings,
                              )
                              break
                            case "opinionOfSalePrice":
                              cellContent = getOpinionOfSalePrice(
                                lead.opinionOfSalePrice,
                              )
                              break
                            case "messageToAgent":
                              cellContent = getAllMessageToAgentInfo(
                                lead.messageToAgent,
                              )
                              break
                            case "customQuestions":
                              // Skip customQuestions in preview
                              cellContent = ""
                              break
                            default:
                              cellContent = "N/A"
                          }

                          return (
                            <TableCell key={field.key} className="max-w-48">
                              <div className="truncate">{cellContent}</div>
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
          <Button onClick={handleDownload} disabled={isLoadingUser}>
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeadReportGenerationModal
