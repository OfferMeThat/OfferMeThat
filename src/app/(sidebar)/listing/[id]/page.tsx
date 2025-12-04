import ListingDetailPage from "@/components/listing/ListingDetailPage"
import { getListingById } from "../../../actions/listings"
import { notFound } from "next/navigation"

const ListingPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing) {
    notFound()
  }

  return <ListingDetailPage listing={listing} />
}

export default ListingPage

