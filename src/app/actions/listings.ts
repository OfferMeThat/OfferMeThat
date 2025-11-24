"use server"

import { Filters } from "@/components/listing/MyListingsPageContent"
import { createClient } from "@/lib/supabase/server"
import { ListingWithOfferCounts } from "@/types/listing"

export async function getFilteredListings(
  filters: Filters,
): Promise<ListingWithOfferCounts[] | null> {
  const supabase = await createClient()

  // Start building the query
  let query = supabase.from("listings").select("*, offers(*)")

  // Apply address filter
  if (filters.address) {
    query = query.ilike("address", `%${filters.address}%`)
  }

  // Apply status filter (only if not null)
  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  // Apply date listed filter
  if (filters.dateListed.from) {
    query = query.gte("createdAt", filters.dateListed.from)
  }
  if (filters.dateListed.to) {
    query = query.lte("createdAt", filters.dateListed.to)
  }

  // Execute the query
  const { data: listings, error } = await query

  if (!listings || error) {
    console.error("Error fetching filtered listings:", error)
    return null
  }

  // Calculate offer counts and apply offer filters
  let filteredListings = listings.map((listing) => {
    const offers = listing.offers || []

    return {
      ...listing,
      activeOffers: offers.filter((offer) => offer.status === "verified")
        .length,
      pendingOffers: offers.filter((offer) => offer.status === "unverified")
        .length,
      totalOffers: offers.length,
      offers: undefined,
    }
  }) as ListingWithOfferCounts[]

  // Apply client-side offer count filters (can't be done in SQL easily)
  filteredListings = filteredListings.filter((listing) => {
    // Filter by pending offers
    if (filters.pendingOffers.from || filters.pendingOffers.to) {
      if (
        filters.pendingOffers.from &&
        listing.pendingOffers < parseInt(filters.pendingOffers.from)
      ) {
        return false
      }
      if (
        filters.pendingOffers.to &&
        listing.pendingOffers > parseInt(filters.pendingOffers.to)
      ) {
        return false
      }
    }

    // Filter by active offers
    if (filters.activeOffers.from || filters.activeOffers.to) {
      if (
        filters.activeOffers.from &&
        listing.activeOffers < parseInt(filters.activeOffers.from)
      ) {
        return false
      }
      if (
        filters.activeOffers.to &&
        listing.activeOffers > parseInt(filters.activeOffers.to)
      ) {
        return false
      }
    }

    // Filter by total offers
    if (filters.totalOffers.from || filters.totalOffers.to) {
      if (
        filters.totalOffers.from &&
        listing.totalOffers < parseInt(filters.totalOffers.from)
      ) {
        return false
      }
      if (
        filters.totalOffers.to &&
        listing.totalOffers > parseInt(filters.totalOffers.to)
      ) {
        return false
      }
    }

    return true
  })

  return filteredListings
}
