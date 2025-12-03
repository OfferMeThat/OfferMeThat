"use client"

import { createClient } from "./client"

/**
 * Upload a file to Supabase Storage from the client
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket (e.g., "offers/offer-id/file.pdf")
 * @param file - The File object to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFileToStorageClient(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const supabase = createClient()

  // Upload file directly from client
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: true, // Overwrite if exists
    })

  if (error) {
    console.error("Error uploading file:", error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return publicUrl
}

/**
 * Upload multiple files to Supabase Storage from the client
 * @param bucket - The storage bucket name
 * @param files - Array of File objects
 * @param offerId - The offer ID to organize files
 * @param questionId - The question ID
 * @returns Array of public URLs
 */
export async function uploadMultipleFilesToStorageClient(
  bucket: string,
  files: File[],
  offerId: string,
  questionId: string,
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "file"
    const fileName = `${timestamp}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const path = `${offerId}/${questionId}/${fileName}`

    return uploadFileToStorageClient(bucket, path, file)
  })

  return Promise.all(uploadPromises)
}

