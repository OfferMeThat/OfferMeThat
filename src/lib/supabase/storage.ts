"use server"

import { createClient } from "./server"

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket (e.g., "offers/offer-id/file.pdf")
 * @param file - The File object to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFileToStorage(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const supabase = await createClient()

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
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
 * Upload multiple files to Supabase Storage
 * @param bucket - The storage bucket name
 * @param files - Array of File objects
 * @param offerId - The offer ID to organize files
 * @param questionId - The question ID
 * @returns Array of public URLs
 */
export async function uploadMultipleFilesToStorage(
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

    return uploadFileToStorage(bucket, path, file)
  })

  return Promise.all(uploadPromises)
}

/**
 * Create a signed URL for a file in Supabase Storage
 * @param url - The public URL of the file
 * @param expiresIn - Expiry duration in seconds (default: 1 hour)
 * @returns The signed URL or original URL if bucket is public
 */
export async function createSignedUrl(
  url: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    // If URL doesn't contain the storage path, return as-is
    if (!url.includes("/storage/v1/object/")) {
      return url
    }

    const supabase = await createClient()

    // Extract bucket and path from the URL
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]
    let bucket: string
    let path: string

    if (url.includes("/storage/v1/object/public/")) {
      const urlParts = url.split("/storage/v1/object/public/")
      if (urlParts.length !== 2) {
        console.warn(
          "Invalid Supabase storage URL format, returning original URL",
        )
        return url
      }
      const [extractedBucket, ...pathParts] = urlParts[1].split("/")
      bucket = extractedBucket
      path = pathParts.join("/")
    } else if (url.includes("/storage/v1/object/sign/")) {
      const urlParts = url.split("/storage/v1/object/sign/")
      if (urlParts.length !== 2) {
        console.warn(
          "Invalid Supabase storage URL format, returning original URL",
        )
        return url
      }
      const [extractedBucket, ...pathParts] = urlParts[1].split("/")
      bucket = extractedBucket
      path = pathParts.join("/")
    } else {
      console.warn("Unknown storage URL format, returning original URL")
      return url
    }

    // Decode the path in case it has URL encoding
    path = decodeURIComponent(path)

    // Try to create signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error(`Error creating signed URL for ${bucket}/${path}:`, error)
      // Return original URL as fallback
      return url
    }

    return data.signedUrl
  } catch (error) {
    console.error("Error in createSignedUrl:", error)
    // Fallback to original URL on any error
    return url
  }
}

/**
 * Create signed URLs for multiple files
 * @param urls - Array of public URLs
 * @param expiresIn - Expiry duration in seconds (default: 1 hour)
 * @returns Array of signed URLs
 */
export async function createSignedUrls(
  urls: string[],
  expiresIn: number = 3600,
): Promise<string[]> {
  const signedUrlPromises = urls.map((url) => createSignedUrl(url, expiresIn))
  return Promise.all(signedUrlPromises)
}
