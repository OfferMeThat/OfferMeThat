"use client"

import {
  formatAreYouInterested,
  formatSubmitterRole,
  getRoleBadgeVariant,
} from "@/lib/formatLeadData"
import { LeadWithListing } from "@/types/lead"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "../../ui/badge"
import { Checkbox } from "../../ui/checkbox"
import { EmptyState } from "../../ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import LeadActionsMenu from "./LeadActionsMenu"

const LeadsListTableView = ({
  leads,
  selectedLeads,
  onToggleLead,
  onToggleAll,
  onDelete,
  onAssignToListing,
  listings,
}: {
  leads: Array<LeadWithListing> | null
  selectedLeads: Set<string>
  onToggleLead: (leadId: string) => void
  onToggleAll: (checked: boolean) => void
  onDelete: (leadId: string) => Promise<void>
  onAssignToListing: (leadId: string, listingId: string) => Promise<void>
  listings: Array<{ id: string; address: string; isTest?: boolean | null }>
}) => {
  const router = useRouter()

  const allSelected =
    leads &&
    leads.length > 0 &&
    leads.every((lead) => selectedLeads.has(lead.id))

  const getSubmitterName = (lead: LeadWithListing) => {
    const firstName = lead.submitterFirstName || ""
    const lastName = lead.submitterLastName || ""
    return `${firstName} ${lastName}`.trim() || "N/A"
  }

  const getListingAddress = (lead: LeadWithListing) => {
    if (lead.customListingAddress) {
      return lead.customListingAddress
    }
    return lead.listing?.address || "N/A"
  }

  // Show empty state if no leads
  if (!leads || leads.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No leads found"
        description="No leads match your current filters. Try adjusting your search criteria."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-md">
      <Table className="overflow-x-auto">
        <TableHeader>
          <TableRow className="px-4">
            <TableHead className="min-w-12 font-medium text-gray-700">
              <Checkbox
                checked={!!allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
              />
            </TableHead>
            <TableHead className="min-w-32 font-medium text-gray-700">
              Received
            </TableHead>
            <TableHead className="min-w-48 font-medium text-gray-700">
              Listing
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Submitter Name
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Role
            </TableHead>
            <TableHead className="min-w-48 font-medium text-gray-700">
              Email
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Phone
            </TableHead>
            <TableHead className="min-w-40 font-medium text-gray-700">
              Interested
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads?.map((lead) => {
            const date = new Date(lead.createdAt)
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })

            return (
              <TableRow
                key={lead.id}
                className="cursor-pointer px-4 hover:bg-gray-50"
                onClick={(e) => {
                  // Don't navigate if clicking on checkbox or actions
                  const target = e.target as HTMLElement
                  if (
                    target.closest('input[type="checkbox"]') ||
                    target.closest("button") ||
                    target.closest("[role='dialog']") ||
                    target.closest("a")
                  ) {
                    return
                  }
                  router.push(`/lead/${lead.id}`)
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={() => onToggleLead(lead.id)}
                  />
                </TableCell>
                <TableCell>{formattedDate}</TableCell>
                <TableCell>
                  {lead.listingId ? (
                    <Link
                      href={`/listing/${lead.listingId}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getListingAddress(lead)}
                    </Link>
                  ) : (
                    <span>{getListingAddress(lead)}</span>
                  )}
                </TableCell>
                <TableCell>{getSubmitterName(lead)}</TableCell>
                <TableCell>
                  {lead.submitterRole ? (
                    <Badge variant={getRoleBadgeVariant(lead.submitterRole)}>
                      {formatSubmitterRole(lead.submitterRole)}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>{lead.submitterEmail || "N/A"}</TableCell>
                <TableCell>{lead.submitterPhone || "N/A"}</TableCell>
                <TableCell>
                  {lead.areYouInterested ? (
                    <Badge variant="secondary">
                      {formatAreYouInterested(lead.areYouInterested)}
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <LeadActionsMenu
                    leadId={lead.id}
                    onDelete={onDelete}
                    onAssignToListing={onAssignToListing}
                    listings={listings}
                    buttonClassName="mx-auto"
                    iconSize={18}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default LeadsListTableView
