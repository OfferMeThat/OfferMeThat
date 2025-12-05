import OfferDetailPage from "@/components/offer/OfferDetailPage"
import { processOfferFileUrls } from "@/lib/processOfferFileUrls"
import { notFound } from "next/navigation"
import { getOfferById } from "../../../actions/offers"

const OfferPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const offer = await getOfferById(id)

  if (!offer) {
    notFound()
  }

  // Process file URLs to create signed URLs for secure access
  const processedOffer = await processOfferFileUrls(offer)

  return <OfferDetailPage offer={processedOffer} />
}

export default OfferPage
