"use client"

import {
  getBrandingConfig,
  getFormOwnerProfilePicture,
  getFormPages,
  getFormQuestions,
  getOrCreateLeadForm,
  saveBrandingConfig,
} from "@/app/actions/leadForm"
import { createClient } from "@/lib/supabase/client"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { Database } from "@/types/supabase"
import { Copy, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import Heading from "../shared/typography/Heading"
import { Button } from "../ui/button"
import { Spinner } from "../ui/spinner"
import { QUESTION_TYPE_TO_LABEL } from "@/constants/leadFormQuestions"
import { buildFormValidationSchema } from "@/lib/leadFormValidation"
import BrandingModal from "../offerForm/BrandingModal"
import { FormPreview } from "../shared/FormPreview"

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["leadFormPages"]["Row"]

const LeadFormPageContent = () => {
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [leadLink, setLeadLink] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [formLoading, setFormLoading] = useState(true)
  const [formId, setFormId] = useState<string | null>(null)
  const [showBrandingModal, setShowBrandingModal] = useState(false)
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    DEFAULT_BRANDING_CONFIG,
  )
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  )
  const [profileName, setProfileName] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, fullName")
          .eq("id", user.id)
          .single()

        if (profile?.username) {
          setUsername(profile.username)
          const domain = window.location.origin
          setLeadLink(`${domain}/updates/${profile.username}`)
        }
        if (profile?.fullName) {
          setProfileName(profile.fullName)
        }
      }
      setIsLoading(false)
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const id = await getOrCreateLeadForm()
        setFormId(id)
        const [
          fetchedQuestions,
          fetchedPages,
          fetchedBranding,
          fetchedProfilePicture,
        ] = await Promise.all([
          getFormQuestions(id),
          getFormPages(id),
          getBrandingConfig(id),
          getFormOwnerProfilePicture(id),
        ])
        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
        setBrandingConfig(fetchedBranding)
        setProfilePictureUrl(fetchedProfilePicture)
      } catch (error) {
        console.error("Error loading form:", error)
        toast.error("Failed to load form preview")
      } finally {
        setFormLoading(false)
      }
    }

    fetchFormData()
  }, [])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(leadLink)
    toast.success("Link copied to clipboard!")
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById("lead-qr-code")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = `lead-qr-${username}.png`
      downloadLink.href = pngFile
      downloadLink.click()
      toast.success("QR code downloaded!")
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex w-fit items-center gap-2 px-6 py-8">
        <Spinner /> Loading...
      </main>
    )
  }

  if (!username) {
    return (
      <main className="px-6 py-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">
            Please set up your username in account settings to create your lead
            link.
          </p>
          <Link href="/settings">
            <Button className="mt-4">Go to Settings</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="px-6 py-8">
      <div className="mb-6">
        <Heading as="h1" size="large" weight="bold" className="text-teal-500">
          My Lead Form
        </Heading>
        <p className="text-md font-medium opacity-75">
          Share your lead form link with potential buyers
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          Share your Lead Form Link or QR code with buyers to get leads:
        </h2>

        <div className="flex flex-wrap justify-between gap-12">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                <span className="flex-1 truncate font-medium text-gray-900">
                  {leadLink}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="shrink-0 text-gray-600 hover:text-gray-900"
                  aria-label="Copy link"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Want to change your URL?{" "}
                <Link
                  href="/settings"
                  className="font-medium text-teal-500 hover:text-teal-700"
                >
                  Check availability here.
                </Link>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700">
                  Want to see it in action?
                </span>
                <Link href={`/updates/${username}?test=true`} target="_blank">
                  <Button className="w-38 gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Test it out!
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mx-auto flex flex-col items-center justify-center space-y-4">
            <div className="rounded-lg border-4 border-gray-200 bg-white p-4">
              <QRCodeSVG
                id="lead-qr-code"
                value={leadLink}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Download className="h-4 w-4" />
              Download QR code
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          Here is a preview of your Lead Form.
        </h2>
        <p className="text-sm text-gray-600">
          Customize the questions by clicking{" "}
          <Link
            href="/lead-form/builder"
            className="font-medium text-teal-500 hover:text-teal-700"
          >
            here
          </Link>
          .
        </p>
        <p className="text-sm text-gray-600">
          Personalize the colors, logo & branding by clicking{" "}
          <button
            onClick={() => setShowBrandingModal(true)}
            className="cursor-pointer font-medium text-teal-500 hover:text-teal-700"
          >
            here
          </button>
          .
        </p>

        {/* Background container with background image */}
        <div
          className="mt-6 min-h-[600px] rounded-2xl"
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
            <FormPreview
              questions={questions}
              pages={pages}
              isLoading={formLoading}
              title={`Register for Updates from ${profileName}`}
              description="Please provide your details to receive updates"
              brandingConfig={brandingConfig}
              profilePictureUrl={profilePictureUrl}
              questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
              buildValidationSchema={buildFormValidationSchema as any}
              formType="lead"
            />
          </div>
        </div>
      </div>

      <BrandingModal
        open={showBrandingModal}
        onOpenChange={setShowBrandingModal}
        initialConfig={brandingConfig}
        onSave={async (config) => {
          if (!formId) {
            toast.error("Form ID not available")
            return
          }
          try {
            await saveBrandingConfig(formId, config)
            setBrandingConfig(config)
            toast.success("Branding settings saved!")
          } catch (error) {
            console.error("Error saving branding:", error)
            toast.error("Failed to save branding settings")
          }
        }}
      />
    </main>
  )
}

export default LeadFormPageContent

