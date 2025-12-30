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
import LeadActionsMenu from "./LeadActionsMenu"

const LeadsListTileView = ({
  leads,
  selectedLeads,
  onToggleLead,
  onDelete,
  onAssignToListing,
  listings,
}: {
  leads: Array<LeadWithListing> | null
  selectedLeads: Set<string>
  onToggleLead: (leadId: string) => void
  onDelete: (leadId: string) => Promise<void>
  onAssignToListing: (leadId: string, listingId: string) => Promise<void>
  listings: Array<{ id: string; address: string; isTest?: boolean | null }>
}) => {
  const router = useRouter()

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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const date = new Date(lead.createdAt)
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        const isSelected = selectedLeads.has(lead.id)

        return (
          <div
            key={lead.id}
            className="col-span-1 flex cursor-pointer flex-col gap-3 rounded-lg border border-gray-100 p-4 shadow-md transition-shadow hover:shadow-lg"
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
            <div className="flex items-center justify-between">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleLead(lead.id)}
                onClick={(e) => e.stopPropagation()}
              />
              {lead.areYouInterested && (
                <Badge variant="secondary">
                  {formatAreYouInterested(lead.areYouInterested)}
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-gray-900">
                {getSubmitterName(lead)}
              </span>
              {lead.listingId ? (
                <Link
                  href={`/listing/${lead.listingId}`}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getListingAddress(lead)}
                </Link>
              ) : (
                <span className="text-sm text-gray-900">
                  {getListingAddress(lead)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {lead.submitterRole && (
                <div>
                  <span className="font-medium text-gray-700">Role: </span>
                  <Badge
                    variant={getRoleBadgeVariant(lead.submitterRole)}
                    className="text-xs"
                  >
                    {formatSubmitterRole(lead.submitterRole)}
                  </Badge>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Email: </span>
                <span className="text-gray-900">
                  {lead.submitterEmail || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone: </span>
                <span className="text-gray-900">
                  {lead.submitterPhone || "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-xs text-gray-600">
                Received: {formattedDate}
              </span>
              <LeadActionsMenu
                leadId={lead.id}
                onDelete={onDelete}
                onAssignToListing={onAssignToListing}
                listings={listings}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LeadsListTileView
