import { Database } from "./supabase"

export type Lead = Database["public"]["Tables"]["leads"]["Row"]
export type Listing = Database["public"]["Tables"]["listings"]["Row"]

export type LeadWithListing = Lead & {
  listing: Listing | null
}

