import { getFormByUsername } from "@/app/actions/offerForm"
import { OfferFormInteractiveView } from "@/components/offerForm/OfferFormInteractiveView"
import { notFound } from "next/navigation"

interface PublicFormPageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicFormPage({
  params,
  searchParams,
}: PublicFormPageProps) {
  const { username } = await params
  const resolvedSearchParams = await searchParams
  const isTestMode = resolvedSearchParams.test === "true"

  // Fetch form data by username
  const formData = await getFormByUsername(username)

  // If username doesn't exist, show 404
  if (!formData) {
    notFound()
  }

  const {
    formId,
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
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* White form card - fixed width, centered */}
        <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <OfferFormInteractiveView
            questions={questions}
            pages={pages}
            isLoading={false}
            title={
              ownerName ? `Submit an Offer to ${ownerName}` : "Submit an Offer"
            }
            description="Please provide details about your offer"
            brandingConfig={brandingConfig}
            profilePictureUrl={profilePictureUrl}
            formId={formId || undefined}
            isTestMode={isTestMode}
          />
        </div>
      </div>
    </div>
  )
}
