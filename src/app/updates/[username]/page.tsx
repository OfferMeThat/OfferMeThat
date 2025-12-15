import { getFormByUsername } from "@/app/actions/leadForm"
import { LeadFormInteractiveView } from "@/components/leadForm/LeadFormInteractiveView"
import { notFound } from "next/navigation"

interface PublicLeadFormPageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicLeadFormPage({
  params,
  searchParams,
}: PublicLeadFormPageProps) {
  const { username } = await params
  const resolvedSearchParams = await searchParams

  // Fetch form data by username
  const formData = await getFormByUsername(username)

  // If username doesn't exist, show 404
  if (!formData) {
    notFound()
  }

  const {
    formId,
    ownerId,
    questions,
    pages,
    brandingConfig,
    profilePictureUrl,
    ownerName,
  } = formData

  return (
    <div className="min-h-screen">
      {/* Background container with background image */}
      <div
        className="min-h-screen py-8"
        style={{
          backgroundColor: brandingConfig.backgroundColor,
          backgroundImage: brandingConfig.backgroundImage
            ? `url(${brandingConfig.backgroundImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "2rem",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* White form card - fixed width, centered */}
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <LeadFormInteractiveView
            questions={questions}
            pages={pages}
            isLoading={false}
            title={
              ownerName ? `Submit a Lead to ${ownerName}` : "Submit a Lead"
            }
            description="Please provide your information"
            brandingConfig={brandingConfig}
            profilePictureUrl={profilePictureUrl}
            formId={formId || undefined}
            ownerId={ownerId}
            isPreviewMode={false}
          />
        </div>
      </div>
    </div>
  )
}

