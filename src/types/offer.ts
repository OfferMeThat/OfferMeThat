import { Database } from "./supabase"

export type OfferStatus = Database["public"]["Enums"]["offerStatus"]
export type Offer = Database["public"]["Tables"]["offers"]["Row"]
export type Listing = Database["public"]["Tables"]["listings"]["Row"]

export type OfferWithListing = Offer & {
  listing: Listing | null
}

