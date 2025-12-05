import MyOffersPageContent from "@/components/offer/MyOffersPageContent"
import { getFilteredOffers, getAllListings } from "../../actions/offers"

const DEFAULT_FILTERS = {
  nameSearch: "",
  status: null,
  listingId: null,
  minAmount: null,
  maxAmount: null,
  dateRange: { from: null, to: null },
}

const OffersPage = async () => {
  const offerData = await getFilteredOffers(DEFAULT_FILTERS)
  const listingsData = await getAllListings()

  return (
    <MyOffersPageContent
      initialData={offerData}
      initialListings={listingsData}
    />
  )
}

export default OffersPage

