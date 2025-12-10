import { getAllListings, getFilteredOffers } from "@/app/actions/offers"
import MyOffersPageContent from "@/components/offer/MyOffersPageContent"
import { createClient } from "@/lib/supabase/server"

export default async function TestOffersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Initial data fetch for server-side rendering
  const initialData = await getFilteredOffers(
    {
      nameSearch: "",
      status: null,
      listingId: null,
      minAmount: null,
      maxAmount: null,
      dateRange: { from: null, to: null },
    },
    true, // isTestMode = true
  )

  // Fetch listings for filter dropdown
  const listings = await getAllListings()

  return (
    <MyOffersPageContent
      initialData={initialData}
      initialUnassignedData={null} // No unassigned offers in test mode
      initialListings={listings}
      isTestMode={true}
    />
  )
}
