"use client"

import {
  assignLeadsToListing,
  deleteLeads,
} from "@/app/actions/leadForm"
import { LeadWithListing } from "@/types/lead"
import { LayoutGrid, TableOfContents } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import SelectionActionBar from "../../shared/SelectionActionBar"
import { Button } from "../../ui/button"
import LeadsListTableView from "./LeadsListTableView"
import LeadsListTileView from "./LeadsListTileView"

const LeadsList = ({
  leads,
  onLeadsUpdate,
  onViewModeChange,
  listings,
  isUnassigned = false,
  onAssignSuccess,
}: {
  leads: Array<LeadWithListing> | null
  onLeadsUpdate?: (leads: Array<LeadWithListing> | null) => void
  onViewModeChange?: (mode: "table" | "tile") => void
  listings?: Array<{ id: string; address: string }> | null
  isUnassigned?: boolean
  onAssignSuccess?: () => void
}) => {
  const router = useRouter()
  const [viewStyle, setViewStyle] = useState<"table" | "tile">("table")
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  const handleViewChange = (mode: "table" | "tile") => {
    setViewStyle(mode)
    onViewModeChange?.(mode)
  }

  const handleToggleLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked && leads) {
      setSelectedLeads(new Set(leads.map((lead) => lead.id)))
    } else {
      setSelectedLeads(new Set())
    }
  }

  const handleDelete = async () => {
    const leadIds = Array.from(selectedLeads)

    // Optimistic update: remove leads from UI immediately
    if (leads && onLeadsUpdate) {
      const updatedLeads = leads.filter(
        (lead) => !leadIds.includes(lead.id),
      )
      onLeadsUpdate(updatedLeads.length > 0 ? updatedLeads : null)
    }

    const result = await deleteLeads(leadIds)

    if (result.success) {
      toast.success(
        `Successfully deleted ${leadIds.length} lead${leadIds.length > 1 ? "s" : ""}`,
      )
      setSelectedLeads(new Set())
      router.refresh()
    } else {
      // Revert optimistic update on error
      if (onLeadsUpdate) {
        onLeadsUpdate(leads)
      }
      toast.error(result.error || "Failed to delete leads")
    }
  }

  const handleAssignToListing = async (listingId: string) => {
    const leadIds = Array.from(selectedLeads)

    // Optimistic update: remove leads from unassigned list immediately
    if (leads && onLeadsUpdate && isUnassigned) {
      const updatedLeads = leads.filter(
        (lead) => !leadIds.includes(lead.id),
      )
      onLeadsUpdate(updatedLeads.length > 0 ? updatedLeads : null)
    }

    const result = await assignLeadsToListing(leadIds, listingId)

    if (result.success) {
      toast.success(
        `Successfully assigned ${leadIds.length} lead${leadIds.length > 1 ? "s" : ""} to listing`,
      )
      setSelectedLeads(new Set())
      router.refresh()
      onAssignSuccess?.()
    } else {
      // Revert optimistic update on error
      if (onLeadsUpdate && isUnassigned) {
        onLeadsUpdate(leads)
      }
      toast.error(result.error || "Failed to assign leads to listing")
    }
  }

  return (
    <>
      <div className="mb-4 flex w-fit items-center gap-1 overflow-hidden rounded-full shadow-sm">
        <Button
          variant="ghost"
          active={viewStyle === "table"}
          onClick={() => handleViewChange("table")}
        >
          <TableOfContents size={18} />
          Table View
        </Button>
        <Button
          variant="ghost"
          active={viewStyle === "tile"}
          onClick={() => handleViewChange("tile")}
        >
          <LayoutGrid size={18} />
          Tile View
        </Button>
      </div>

      {viewStyle === "table" ? (
        <LeadsListTableView
          leads={leads}
          selectedLeads={selectedLeads}
          onToggleLead={handleToggleLead}
          onToggleAll={handleToggleAll}
        />
      ) : (
        <LeadsListTileView
          leads={leads}
          selectedLeads={selectedLeads}
          onToggleLead={handleToggleLead}
        />
      )}

      <SelectionActionBar
        selectedCount={selectedLeads.size}
        onDelete={handleDelete}
        onClearSelection={() => setSelectedLeads(new Set())}
        itemType="leads"
        showMessageButton={false}
        onAssignToListing={isUnassigned ? handleAssignToListing : undefined}
        listings={listings || []}
      />
    </>
  )
}

export default LeadsList

