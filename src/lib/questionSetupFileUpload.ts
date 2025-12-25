"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * Upload Special Conditions setup attachments
 * Client-side function that uploads files directly to Supabase Storage
 */
export async function uploadSpecialConditionsSetupFiles(
  formId: string,
  questionId: string,
  conditionIndex: number,
  files: File[],
): Promise<Array<{ url: string; fileName: string; fileSize: number }>> {
  const supabase = createClient()

  const basePath = `question-setup/${formId}/${questionId}/condition_${conditionIndex}`
  const bucket = "special-conditions"

  const uploadedFiles: Array<{
    url: string
    fileName: string
    fileSize: number
  }> = []

  for (const file of files) {
    try {
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const filePath = `${basePath}/${timestamp}-${sanitizedFileName}`

      // Convert File to ArrayBuffer then to base64 for upload
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        })

      if (error) {
        console.error("Error uploading file:", error)
        throw new Error(`Failed to upload file: ${error.message}`)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)

      uploadedFiles.push({
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
      })
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error)
      // Continue with other files even if one fails
    }
  }

  return uploadedFiles
}

