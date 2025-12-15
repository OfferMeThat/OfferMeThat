import MyLeadsPageContent from "@/components/lead/MyLeadsPageContent"
import {
  getAllListingsForLeads,
  getFilteredLeads,
} from "../../actions/leadForm"

const DEFAULT_FILTERS = {
  nameSearch: "",
  listingId: null,
  dateRange: { from: null, to: null },
}

const LeadsPage = async () => {
  const leadData = await getFilteredLeads(DEFAULT_FILTERS)
  const listingsData = await getAllListingsForLeads()

  return (
    <MyLeadsPageContent
      initialData={leadData}
      initialListings={listingsData}
    />
  )
}

export default LeadsPage

