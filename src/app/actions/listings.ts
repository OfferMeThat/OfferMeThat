"use server"

import { Filters } from "@/components/listing/MyListingsPageContent"
import { createClient } from "@/lib/supabase/server"
import { ListingWithOfferCounts } from "@/types/listing"

export async function getFilteredListings(
  filters: Filters,
): Promise<ListingWithOfferCounts[] | null> {
  const supabase = await createClient()

  // Get the current user to filter by createdBy
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Start building the query - filter by current user's listings only
  let query = supabase
    .from("listings")
    .select("*, offers(*), leads(*)")
    .eq("createdBy", user.id)
    .or("isTest.is.null,isTest.eq.false") // Exclude test listings

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
    const leads = listing.leads || []

    return {
      ...listing,
      activeOffers: offers.filter((offer) => offer.status === "verified")
        .length,
      pendingOffers: offers.filter((offer) => offer.status === "unverified")
        .length,
      totalOffers: offers.length,
      leads: leads.length,
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

export async function deleteListings(
  listingIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user to ensure we only delete their listings
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    if (!listingIds || listingIds.length === 0) {
      return {
        success: false,
        error: "No listings selected",
      }
    }

    // First, fetch the listings to get their addresses before deletion
    const { data: listingsToDelete, error: fetchError } = await supabase
      .from("listings")
      .select("id, address")
      .in("id", listingIds)
      .eq("createdBy", user.id)

    if (fetchError) {
      console.error("Error fetching listings:", fetchError)
      return {
        success: false,
        error: fetchError.message || "Failed to fetch listings",
      }
    }

    if (!listingsToDelete || listingsToDelete.length === 0) {
      return {
        success: false,
        error:
          "No listings were found. Please ensure you own the selected listings.",
      }
    }

    // Create a map of listing ID to address for quick lookup
    const listingAddressMap = new Map<string, string>()
    listingsToDelete.forEach((listing) => {
      listingAddressMap.set(listing.id, listing.address)
    })

    // For each listing being deleted, update all offers that reference it
    // Set listingId to null, status to "unassigned", and store the listing address in customListingAddress
    for (const listingId of listingIds) {
      const listingAddress = listingAddressMap.get(listingId)

      if (listingAddress) {
        // Update all offers that reference this listing
        const { error: updateError } = await supabase
          .from("offers")
          .update({
            listingId: null,
            customListingAddress: listingAddress,
            status: "unassigned",
          })
          .eq("listingId", listingId)

        if (updateError) {
          console.error(
            `Error updating offers for listing ${listingId}:`,
            updateError,
          )
          // Continue with deletion even if update fails, but log the error
        }
      }
    }

    // Now delete the listings
    const { data, error } = await supabase
      .from("listings")
      .delete()
      .in("id", listingIds)
      .eq("createdBy", user.id)
      .select()

    if (error) {
      console.error("Error deleting listings:", error)
      return {
        success: false,
        error: error.message || "Failed to delete listings",
      }
    }

    // Verify that listings were actually deleted
    const deletedCount = data?.length || 0
    if (deletedCount === 0) {
      console.error(
        "No listings were deleted. Possible reasons: listings don't exist, user doesn't own them, or RLS policy blocked deletion.",
      )
      return {
        success: false,
        error:
          "No listings were deleted. Please ensure you own the selected listings.",
      }
    }

    if (deletedCount < listingIds.length) {
      console.warn(
        `Only ${deletedCount} out of ${listingIds.length} listings were deleted.`,
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteListings:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function updateListingsStatus(
  listingIds: string[],
  status: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user to ensure we only update their listings
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    if (!listingIds || listingIds.length === 0) {
      return {
        success: false,
        error: "No listings selected",
      }
    }

    // Update listings that belong to the current user
    const { data, error } = await supabase
      .from("listings")
      .update({ status: status as any })
      .in("id", listingIds)
      .eq("createdBy", user.id)
      .select()

    if (error) {
      console.error("Error updating listing status:", error)
      return {
        success: false,
        error: error.message || "Failed to update listing status",
      }
    }

    // Verify that listings were actually updated
    const updatedCount = data?.length || 0
    if (updatedCount === 0) {
      console.error(
        "No listings were updated. Possible reasons: listings don't exist, user doesn't own them, or RLS policy blocked update.",
      )
      return {
        success: false,
        error:
          "No listings were updated. Please ensure you own the selected listings.",
      }
    }

    if (updatedCount < listingIds.length) {
      console.warn(
        `Only ${updatedCount} out of ${listingIds.length} listings were updated.`,
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateListingsStatus:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function getListingById(
  listingId: string,
): Promise<ListingWithOfferCounts | null> {
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, offers(*), leads(*)")
    .eq("id", listingId)
    .single()

  if (!listing || error) {
    console.error("Error fetching listing:", error)
    return null
  }

  const offers = listing.offers || []
  const leads = listing.leads || []

  return {
    ...listing,
    activeOffers: offers.filter((offer) => offer.status === "verified").length,
    pendingOffers: offers.filter((offer) => offer.status === "unverified")
      .length,
    totalOffers: offers.length,
    leads: leads.length,
    offers: undefined,
  } as ListingWithOfferCounts
}
