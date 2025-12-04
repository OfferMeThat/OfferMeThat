import OfferDetailPage from "@/components/offer/OfferDetailPage"
import { getOfferById } from "../../../actions/offers"
import { notFound } from "next/navigation"

const OfferPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const offer = await getOfferById(id)

  if (!offer) {
    notFound()
  }

  return <OfferDetailPage offer={offer} />
}

export default OfferPage

