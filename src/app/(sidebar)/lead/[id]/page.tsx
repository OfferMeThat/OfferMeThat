import LeadDetailPage from "@/components/lead/LeadDetailPage"
import { processLeadFileUrls } from "@/lib/processLeadFileUrls"
import { notFound } from "next/navigation"
import { getFormQuestions, getLeadById } from "../../../actions/leadForm"

const LeadPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const lead = await getLeadById(id)

  if (!lead) {
    notFound()
  }

  // Fetch questions to parse formData
  let questions = null
  if (lead.formId) {
    try {
      questions = await getFormQuestions(lead.formId)
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  // Process file URLs to create signed URLs for secure access
  const processedLead = await processLeadFileUrls(lead)

  return <LeadDetailPage lead={processedLead} questions={questions} />
}

export default LeadPage

