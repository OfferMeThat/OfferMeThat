/**
 * Utility functions for handling file URLs and names
 */

/**
 * Extracts a clean filename from a URL
 * Handles various URL formats and removes timestamps/prefixes
 */
export function extractFileName(url: string): string {
  if (!url || typeof url !== "string") return "File"

  try {
    // Remove query parameters
    const urlWithoutParams = url.split("?")[0]
    
    // Extract the last part of the path
    const pathParts = urlWithoutParams.split("/")
    let fileName = pathParts[pathParts.length - 1] || "File"

    // Remove timestamp prefixes (e.g., "1766412621619-single-filename.jpg" -> "filename.jpg")
    // Pattern: digits followed by dash, then more digits and dash, then filename
    fileName = fileName.replace(/^\d+-\d+-/, "")
    
    // Remove UUID prefixes if present (e.g., "uuid-filename.jpg" -> "filename.jpg")
    // Pattern: UUID followed by dash
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i
    fileName = fileName.replace(uuidPattern, "")

    // If filename is still empty or just extension, return a default
    if (!fileName || fileName === "." || fileName.startsWith(".")) {
      return "File"
    }

    return fileName
  } catch {
    return "File"
  }
}

/**
 * Formats a file URL for display with a clean filename
 */
export function formatFileLink(url: string, label?: string): {
  url: string
  fileName: string
  displayName: string
} {
  const fileName = extractFileName(url)
  return {
    url,
    fileName,
    displayName: label || fileName,
  }
}

/**
 * Formats multiple file URLs for display
 */
export function formatFileLinks(
  urls: string[],
  labelPrefix?: string,
): Array<{ url: string; fileName: string; displayName: string }> {
  return urls.map((url, index) => {
    const fileName = extractFileName(url)
    const displayName = labelPrefix
      ? `${labelPrefix} ${index + 1}`
      : fileName
    return {
      url,
      fileName,
      displayName,
    }
  })
}

