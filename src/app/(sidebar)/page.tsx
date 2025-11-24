import MyListingsPageContent from "@/components/listing/MyListingsPageContent"
import { getFilteredListings } from "../actions/listings"

const DEFAULT_FILTERS = {
  address: "",
  status: null,
  dateListed: { from: null, to: null },
  dateSold: { from: null, to: null },
  pendingOffers: { from: null, to: null },
  activeOffers: { from: null, to: null },
  totalOffers: { from: null, to: null },
  numberOfLeads: { from: null, to: null },
}

const HomePage = async () => {
  const listingData = await getFilteredListings(DEFAULT_FILTERS)

  return <MyListingsPageContent initialData={listingData} />
}

export default HomePage
