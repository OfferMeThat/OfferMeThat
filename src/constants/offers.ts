import { badgeVariants } from "@/components/ui/badge"
import { OfferStatus } from "@/types/offer"
import { VariantProps } from "class-variance-authority"

export const OFFER_STATUSES: Record<OfferStatus, string> = {
  pending: "Pending",
  active: "Active",
  unverified: "Unverified",
  verified: "Verified",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
  deleted: "Deleted",
  unassigned: "Unassigned",
}

export const OFFER_STATUS_OPTIONS = Object.entries(OFFER_STATUSES)
  .filter(([value]) => value !== "unassigned")
  .map(([value, label]) => ({
    value: value as OfferStatus,
    label,
  }))

export const OFFER_TO_BADGE_MAP: Record<
  OfferStatus,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  pending: "secondary",
  active: "success",
  unverified: "outline",
  verified: "success",
  accepted: "success",
  rejected: "destructive",
  expired: "destructiveLight",
  withdrawn: "destructiveLight",
  deleted: "destructive",
  unassigned: "outline",
}
