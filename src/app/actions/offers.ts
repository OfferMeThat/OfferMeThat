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
    const offerData = transformFormDataToOffer(formData, questions, formId)

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
