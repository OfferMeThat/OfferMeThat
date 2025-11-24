import { badgeVariants } from "@/components/ui/badge"
import { ListingStatus } from "@/types/listing"
import { VariantProps } from "class-variance-authority"

export const LISTING_STATUSES: Record<ListingStatus, string> = {
  forSale: "For Sale",
  sold: "Sold",
  underContract: "Under Contract",
  withdrawn: "Withdrawn",
}
export const LISTING_TO_BADGE_MAP: Record<ListingStatus, VariantProps<typeof badgeVariants>['variant']> = {
  forSale: "success",
  sold: "success",
  underContract: "secondary",
  withdrawn: "destructive",
}
