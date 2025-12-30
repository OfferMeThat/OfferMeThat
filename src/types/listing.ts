import { Database } from "./supabase"

export type ListingStatus = Database["public"]["Enums"]["listingStatus"]
export type Listing = Database["public"]["Tables"]["listings"]["Row"]
export type Offer = Database["public"]["Tables"]["offers"]["Row"]

export type ListingWithOfferCounts = Listing & {
  activeOffers: number
  pendingOffers: number
  totalOffers: number
  leads: number
}
