"use server"

import { createClient } from "@/lib/supabase/server"
import {
  uploadFileToStorage,
  uploadMultipleFilesToStorage,
} from "@/lib/supabase/storage"
import { transformFormDataToOffer } from "@/lib/transformOfferData"
import { Database } from "@/types/supabase"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface SaveOfferParams {
  formData: Record<string, any>
  questions: Question[]
  formId: string
  isTest?: boolean
}

// Helper to get a random uuid (works in most recent Node/Browser)
const getTempId = () => {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Saves an offer to the database with all form data
 * Handles file uploads to Supabase Storage
 */
export const saveOffer = async ({
  formData,
  questions,
  formId,
  isTest = false,
}: SaveOfferParams): Promise<{
  success: boolean
  offerId?: string
  error?: string
}> => {
  try {
    const supabase = await createClient()
    // Generate temp offerId for storage file path before DB insert
    const tempOfferId = getTempId()

    // Transform form data to database schema
    const offerData = transformFormDataToOffer(
      formData,
      questions,
      formId,
      isTest,
    )

    // Purchase Agreement files
    if ((offerData as any).purchaseAgreementFiles) {
      const files = (offerData as any).purchaseAgreementFiles as File[]
      if (files.length > 0) {
        const urls = await uploadMultipleFilesToStorage(
          "offer-documents",
          files,
          tempOfferId,
          "purchase-agreements",
        )
        // Store multiple URLs as JSON string in the existing column
        // If single file, store as plain string for backward compatibility
        if (urls.length === 1) {
          offerData.purchaseAgreementFileUrl = urls[0]
        } else {
          // Store array as JSON string
          offerData.purchaseAgreementFileUrl = JSON.stringify(urls)
        }
      }
      delete (offerData as any).purchaseAgreementFiles
    }

    // Purchaser ID files
    if (
      offerData.purchaserData &&
      typeof offerData.purchaserData === "object"
    ) {
      const purchaserData = offerData.purchaserData as any

      if (
        purchaserData.method === "single_field" &&
        purchaserData.idFile instanceof File
      ) {
        const timestamp = Date.now()
        const fileExtension =
          purchaserData.idFile.name.split(".").pop() || "file"
        const fileName = `${timestamp}-${purchaserData.idFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const path = `${tempOfferId}/purchaser-ids/${fileName}`

        const fileUrl = await uploadFileToStorage(
          "offer-ids",
          path,
          purchaserData.idFile,
        )
        purchaserData.idFileUrl = fileUrl
        delete purchaserData.idFile
      }

      if (
        purchaserData.method === "individual_names" &&
        purchaserData.idFiles &&
        typeof purchaserData.idFiles === "object"
      ) {
        const idFiles = purchaserData.idFiles as Record<string, File>
        const uploadedUrls: Record<string, string> = {}

        for (const [key, file] of Object.entries(idFiles)) {
          if (file instanceof File) {
            const timestamp = Date.now()
            const fileExtension = file.name.split(".").pop() || "file"
            const fileName = `${timestamp}-${key}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
            const path = `${tempOfferId}/purchaser-ids/${fileName}`

            const fileUrl = await uploadFileToStorage("offer-ids", path, file)
            uploadedUrls[key] = fileUrl
          }
        }

        purchaserData.idFileUrls = uploadedUrls
        delete purchaserData.idFiles
      }
    }

    // Loan Approval supporting documents
    if (
      offerData.subjectToLoanApproval &&
      typeof offerData.subjectToLoanApproval === "object"
    ) {
      const loanData = offerData.subjectToLoanApproval as any

      if (loanData.supportingDocs instanceof File) {
        const timestamp = Date.now()
        const fileExtension =
          loanData.supportingDocs.name.split(".").pop() || "file"
        const fileName = `${timestamp}-${loanData.supportingDocs.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const path = `${tempOfferId}/loan-documents/${fileName}`

        const fileUrl = await uploadFileToStorage(
          "offer-documents",
          path,
          loanData.supportingDocs,
        )
        loanData.supportingDocsUrl = fileUrl
        delete loanData.supportingDocs
      } else if (Array.isArray(loanData.supportingDocs)) {
        const files = loanData.supportingDocs.filter(
          (f: any) => f instanceof File,
        )
        if (files.length > 0) {
          const urls = await uploadMultipleFilesToStorage(
            "offer-documents",
            files,
            tempOfferId,
            "loan-documents",
          )
          loanData.supportingDocsUrls = urls
          delete loanData.supportingDocs
        }
      }
    }

    // Message attachments
    if (
      offerData.messageToAgent &&
      typeof offerData.messageToAgent === "object"
    ) {
      const messageData = offerData.messageToAgent as any

      if (Array.isArray(messageData.attachments)) {
        const files = messageData.attachments.filter(
          (f: any) => f instanceof File,
        )
        if (files.length > 0) {
          const urls = await uploadMultipleFilesToStorage(
            "offer-attachments",
            files,
            tempOfferId,
            "message-attachments",
          )
          messageData.attachmentUrls = urls
          delete messageData.attachments
        }
      }
    }

    // Custom uploaded files
    if (
      offerData.customQuestionsData &&
      typeof offerData.customQuestionsData === "object"
    ) {
      const customData = offerData.customQuestionsData as any

      for (const [questionId, questionData] of Object.entries(customData)) {
        const data = questionData as any

        if (data.answerType === "file_upload" && data.value) {
          if (data.value instanceof File) {
            const timestamp = Date.now()
            const fileExtension = data.value.name.split(".").pop() || "file"
            const fileName = `${timestamp}-${data.value.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
            const path = `${tempOfferId}/custom-files/${questionId}/${fileName}`

            const fileUrl = await uploadFileToStorage(
              "offer-attachments",
              path,
              data.value,
            )
            data.value = fileUrl
          } else if (Array.isArray(data.value)) {
            const files = data.value.filter((f: any) => f instanceof File)
            if (files.length > 0) {
              const urls = await uploadMultipleFilesToStorage(
                "offer-attachments",
                files,
                tempOfferId,
                `custom-files-${questionId}`,
              )
              data.value = urls
            }
          }
        }
      }
    }

    // Insert offer into database
    const { data: offer, error } = await supabase
      .from("offers")
      .insert(offerData)
      .select("id")
      .single()

    if (error) {
      console.error("Error saving offer:", error)
      return { success: false, error: error.message }
    }

    if (!offer) {
      return { success: false, error: "Failed to create offer" }
    }

    return { success: true, offerId: offer.id }
  } catch (error: any) {
    console.error("Error in saveOffer:", error)
    return { success: false, error: error.message || "Failed to save offer" }
  }
}

import { Filters } from "@/components/offer/MyOffersPageContent"
import { Listing } from "@/types/listing"
import { OfferWithListing } from "@/types/offer"

export async function getAllListings(): Promise<Listing[] | null> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Only fetch listings created by the current user
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("createdBy", user.id)
    .order("address", { ascending: true })

  if (!listings || error) {
    console.error("Error fetching listings:", error)
    return null
  }

  return listings
}

export async function getFilteredOffers(
  filters: Filters,
  isTestMode: boolean = false,
): Promise<OfferWithListing[] | null> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Get user's offer form(s)
  const { data: userForms, error: formsError } = await supabase
    .from("offerForms")
    .select("id")
    .eq("ownerId", user.id)

  if (formsError || !userForms || userForms.length === 0) {
    // User has no forms, return empty array
    return []
  }

  const userFormIds = userForms.map((form) => form.id)

  // Start building the query with listing join
  let query = supabase.from("offers").select("*, listings(*)")

  // Filter by user's formIds
  query = query.in("formId", userFormIds)

  // Exclude unassigned offers from main query (they're shown separately)
  query = query.neq("status", "unassigned")

  if (isTestMode) {
    // Only show test offers
    query = query.eq("isTest", true)
  } else {
    // Exclude test offers (isTest is null or false)
    query = query.or("isTest.is.null,isTest.eq.false")
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  // Apply listing filter
  if (filters.listingId) {
    query = query.eq("listingId", filters.listingId)
  }

  // Apply amount filters
  if (filters.minAmount) {
    query = query.gte("amount", filters.minAmount)
  }
  if (filters.maxAmount) {
    query = query.lte("amount", filters.maxAmount)
  }

  // Apply date range filter (on createdAt)
  if (filters.dateRange.from) {
    query = query.gte("createdAt", filters.dateRange.from)
  }
  if (filters.dateRange.to) {
    query = query.lte("createdAt", filters.dateRange.to)
  }

  // Execute the query
  const { data: offers, error } = await query

  if (!offers || error) {
    console.error("Error fetching filtered offers:", error)
    return null
  }

  // If in test mode, filter out expired offers and delete them
  if (isTestMode) {
    const now = new Date()
    const validOffers: any[] = []
    const expiredOfferIds: string[] = []

    offers.forEach((offer) => {
      const createdAt = new Date(offer.createdAt)
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 72) {
        validOffers.push(offer)
      } else {
        expiredOfferIds.push(offer.id)
      }
    })

    // Delete expired offers in background
    if (expiredOfferIds.length > 0) {
      deleteOffers(expiredOfferIds).catch((err) =>
        console.error("Failed to delete expired test offers:", err),
      )
    }

    // Transform the data to match OfferWithListing type
    const transformedValidOffers = validOffers.map((offer: any) => ({
      ...offer,
      listing: Array.isArray(offer.listings)
        ? offer.listings[0] || null
        : offer.listings || null,
    })) as OfferWithListing[]

    // Apply name search filter in memory (searches in listing address and custom listing address)
    if (filters.nameSearch) {
      const searchLower = filters.nameSearch.toLowerCase()
      return transformedValidOffers.filter((offer) => {
        const listingAddress = (offer.listing?.address || "").toLowerCase()
        const customAddress = (offer.customListingAddress || "").toLowerCase()
        return (
          listingAddress.includes(searchLower) ||
          customAddress.includes(searchLower)
        )
      })
    }

    return transformedValidOffers
  }

  // Transform the data to match OfferWithListing type
  let transformedOffers = offers.map((offer: any) => ({
    ...offer,
    listing: Array.isArray(offer.listings)
      ? offer.listings[0] || null
      : offer.listings || null,
  })) as OfferWithListing[]

  // Apply name search client-side (searches in listing address and custom listing address)
  if (filters.nameSearch) {
    const searchLower = filters.nameSearch.toLowerCase()
    transformedOffers = transformedOffers.filter((offer) => {
      const listingAddress = (offer.listing?.address || "").toLowerCase()
      const customAddress = (offer.customListingAddress || "").toLowerCase()
      return (
        listingAddress.includes(searchLower) ||
        customAddress.includes(searchLower)
      )
    })
  }

  return transformedOffers
}

export async function deleteOffers(
  offerIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user to ensure we only delete their offers
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    if (!offerIds || offerIds.length === 0) {
      return {
        success: false,
        error: "No offers selected",
      }
    }

    // Get user's offer form(s) to verify ownership
    const { data: userForms, error: formsError } = await supabase
      .from("offerForms")
      .select("id")
      .eq("ownerId", user.id)

    if (formsError || !userForms || userForms.length === 0) {
      return {
        success: false,
        error: "No offer forms found for user",
      }
    }

    const userFormIds = userForms.map((form) => form.id)

    // Delete offers that belong to the user's forms
    const { data, error } = await supabase
      .from("offers")
      .delete()
      .in("id", offerIds)
      .in("formId", userFormIds)
      .select()

    if (error) {
      console.error("Error deleting offers:", error)
      return {
        success: false,
        error: error.message || "Failed to delete offers",
      }
    }

    // Verify that offers were actually deleted
    const deletedCount = data?.length || 0
    if (deletedCount === 0) {
      console.error("No offers were deleted. Possible reasons: offers don't exist, user doesn't own them, or RLS policy blocked deletion.")
      return {
        success: false,
        error: "No offers were deleted. Please ensure you own the selected offers.",
      }
    }

    if (deletedCount < offerIds.length) {
      console.warn(`Only ${deletedCount} out of ${offerIds.length} offers were deleted.`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteOffers:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function updateOffersStatus(
  offerIds: string[],
  status: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user to ensure we only update their offers
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    if (!offerIds || offerIds.length === 0) {
      return {
        success: false,
        error: "No offers selected",
      }
    }

    // Get user's offer form(s) to verify ownership
    const { data: userForms, error: formsError } = await supabase
      .from("offerForms")
      .select("id")
      .eq("ownerId", user.id)

    if (formsError || !userForms || userForms.length === 0) {
      return {
        success: false,
        error: "No offer forms found for user",
      }
    }

    const userFormIds = userForms.map((form) => form.id)

    // Update offers that belong to the user's forms
    const { data, error } = await supabase
      .from("offers")
      .update({ status: status as any })
      .in("id", offerIds)
      .in("formId", userFormIds)
      .select()

    if (error) {
      console.error("Error updating offer status:", error)
      return {
        success: false,
        error: error.message || "Failed to update offer status",
      }
    }

    // Verify that offers were actually updated
    const updatedCount = data?.length || 0
    if (updatedCount === 0) {
      console.error("No offers were updated. Possible reasons: offers don't exist, user doesn't own them, or RLS policy blocked update.")
      return {
        success: false,
        error: "No offers were updated. Please ensure you own the selected offers.",
      }
    }

    if (updatedCount < offerIds.length) {
      console.warn(`Only ${updatedCount} out of ${offerIds.length} offers were updated.`)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateOffersStatus:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function getOfferById(
  offerId: string,
): Promise<OfferWithListing | null> {
  const supabase = await createClient()

  const { data: offer, error } = await supabase
    .from("offers")
    .select("*, listings(*)")
    .eq("id", offerId)
    .single()

  if (!offer || error) {
    console.error("Error fetching offer:", error)
    return null
  }

  // Fetch special conditions question setupConfig if formId exists
  let specialConditionsSetupConfig = null
  if (offer.formId) {
    const { data: specialConditionsQuestion } = await supabase
      .from("offerFormQuestions")
      .select("setupConfig")
      .eq("formId", offer.formId)
      .eq("type", "specialConditions")
      .single()

    if (specialConditionsQuestion?.setupConfig) {
      specialConditionsSetupConfig = specialConditionsQuestion.setupConfig
    }
  }

  // Transform the data to match OfferWithListing type
  const transformedOffer = {
    ...offer,
    listing: Array.isArray(offer.listings)
      ? offer.listings[0] || null
      : offer.listings || null,
    specialConditionsSetupConfig,
  } as OfferWithListing & { specialConditionsSetupConfig?: any }

  return transformedOffer
}

export async function getUnassignedOffers(): Promise<
  OfferWithListing[] | null
> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Get user's offer form(s)
  const { data: userForms, error: formsError } = await supabase
    .from("offerForms")
    .select("id")
    .eq("ownerId", user.id)

  if (formsError || !userForms || userForms.length === 0) {
    // User has no forms, return empty array
    return []
  }

  const userFormIds = userForms.map((form) => form.id)

  const { data: offers, error } = await supabase
    .from("offers")
    .select("*, listings(*)")
    .eq("status", "unassigned")
    .or("isTest.is.null,isTest.eq.false")
    .in("formId", userFormIds)
    .order("createdAt", { ascending: false })

  if (!offers || error) {
    console.error("Error fetching unassigned offers:", error)
    return null
  }

  // Transform the data to match OfferWithListing type
  const transformedOffers = offers.map((offer: any) => ({
    ...offer,
    listing: Array.isArray(offer.listings)
      ? offer.listings[0] || null
      : offer.listings || null,
  })) as OfferWithListing[]

  return transformedOffers
}

export async function assignOffersToListing(
  offerIds: string[],
  listingId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // First, verify the listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .single()

    if (listingError || !listing) {
      return {
        success: false,
        error: "Listing not found",
      }
    }

    // Update offers: set listingId, clear customListingAddress, change status to pending
    const { error } = await supabase
      .from("offers")
      .update({
        listingId: listingId,
        customListingAddress: null,
        status: "pending",
      })
      .in("id", offerIds)
      .eq("status", "unassigned")

    if (error) {
      console.error("Error assigning offers to listing:", error)
      return {
        success: false,
        error: error.message || "Failed to assign offers to listing",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in assignOffersToListing:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function getTestOffers(): Promise<OfferWithListing[] | null> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Get user's offer form(s)
  const { data: userForms, error: formsError } = await supabase
    .from("offerForms")
    .select("id")
    .eq("ownerId", user.id)

  if (formsError || !userForms || userForms.length === 0) {
    return []
  }

  const userFormIds = userForms.map((form) => form.id)

  const { data: offers, error } = await supabase
    .from("offers")
    .select("*, listings(*)")
    .eq("isTest", true)
    .in("formId", userFormIds)
    .order("createdAt", { ascending: false })

  if (!offers || error) {
    console.error("Error fetching test offers:", error)
    return null
  }

  // Filter expired offers (older than 72h)
  const now = new Date()
  const validOffers: any[] = []
  const expiredOfferIds: string[] = []

  for (const offer of offers) {
    const createdAt = new Date(offer.createdAt)
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    if (diffHours > 72) {
      expiredOfferIds.push(offer.id)
    } else {
      validOffers.push(offer)
    }
  }

  // Delete expired offers
  if (expiredOfferIds.length > 0) {
    // Fire and forget deletion
    deleteOffers(expiredOfferIds).catch((err) =>
      console.error("Failed to delete expired test offers", err),
    )
  }

  // Transform the data to match OfferWithListing type
  const transformedOffers = validOffers.map((offer: any) => ({
    ...offer,
    listing: Array.isArray(offer.listings)
      ? offer.listings[0] || null
      : offer.listings || null,
  })) as OfferWithListing[]

  return transformedOffers
}

export async function hasTestOffers(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: userForms } = await supabase
    .from("offerForms")
    .select("id")
    .eq("ownerId", user.id)

  if (!userForms || userForms.length === 0) return false

  const userFormIds = userForms.map((form) => form.id)

  const { count } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("isTest", true)
    .in("formId", userFormIds)

  return (count || 0) > 0
}

export async function getOfferWithQuestions(
  offerId: string,
): Promise<{
  offer: OfferWithListing | null
  questions: any[] | null
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { offer: null, questions: null, error: "User not authenticated" }
  }

  const offer = await getOfferById(offerId)
  if (!offer || !offer.formId) {
    return { offer: null, questions: null, error: "Offer or form not found" }
  }

  const { getFormQuestions } = await import("./offerForm")
  try {
    const questions = await getFormQuestions(offer.formId)
    return { offer, questions }
  } catch (error: any) {
    return {
      offer,
      questions: null,
      error: error.message || "Failed to fetch questions",
    }
  }
}
