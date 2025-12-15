import { createSignedUrls } from "@/lib/supabase/storage"

/**
 * Process lead data to convert all file URLs to signed URLs
 */
export async function processLeadFileUrls(lead: any): Promise<any> {
  if (!lead) return lead

  const processedLead = { ...lead }
  const urlsToSign: string[] = []
  const urlMap = new Map<string, number>() // Maps URL to its index in urlsToSign array

  // Helper to collect URLs
  const collectUrl = (url: string | undefined | null): void => {
    if (
      url &&
      typeof url === "string" &&
      url.includes("/storage/v1/object/public/")
    ) {
      if (!urlMap.has(url)) {
        urlMap.set(url, urlsToSign.length)
        urlsToSign.push(url)
      }
    }
  }

  // Collect URLs from messageToAgent
  if (processedLead.messageToAgent) {
    const messageData = processedLead.messageToAgent
    if (typeof messageData === "object" && messageData !== null) {
      if (messageData.attachmentUrls && Array.isArray(messageData.attachmentUrls)) {
        messageData.attachmentUrls.forEach(collectUrl)
      }
      if (messageData.attachments && Array.isArray(messageData.attachments)) {
        messageData.attachments.forEach(collectUrl)
      }
    }
  }

  // Collect URLs from customQuestionsData
  if (
    processedLead.customQuestionsData &&
    typeof processedLead.customQuestionsData === "object"
  ) {
    const customData = processedLead.customQuestionsData as Record<string, any>
    Object.values(customData).forEach((questionData: any) => {
      if (questionData && typeof questionData === "object") {
        // Handle file_upload type questions
        if (
          (questionData.answerType === "file_upload" ||
            questionData.answerType === "uploadFiles") &&
          questionData.value
        ) {
          if (typeof questionData.value === "string") {
            collectUrl(questionData.value)
          } else if (Array.isArray(questionData.value)) {
            questionData.value.forEach((url: any) => {
              if (typeof url === "string") {
                collectUrl(url)
              }
            })
          }
        }
      }
    })
  }

  // Collect URLs from formData (for questions stored there that might have files)
  if (processedLead.formData && typeof processedLead.formData === "object") {
    const formData = processedLead.formData as Record<string, any>
    Object.values(formData).forEach((value: any) => {
      if (typeof value === "string" && value.includes("/storage/v1/object/public/")) {
        collectUrl(value)
      } else if (Array.isArray(value)) {
        value.forEach((item: any) => {
          if (typeof item === "string" && item.includes("/storage/v1/object/public/")) {
            collectUrl(item)
          }
        })
      } else if (typeof value === "object" && value !== null) {
        // Check for nested file URLs
        if (value.url && typeof value.url === "string") {
          collectUrl(value.url)
        }
        if (value.attachmentUrls && Array.isArray(value.attachmentUrls)) {
          value.attachmentUrls.forEach(collectUrl)
        }
      }
    })
  }

  // If no URLs to sign, return original lead
  if (urlsToSign.length === 0) {
    return processedLead
  }

  // Create signed URLs
  const signedUrls = await createSignedUrls(urlsToSign, 3600) // 1 hour expiry

  // Helper to replace URL with signed version
  const getSignedUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return url as undefined
    const index = urlMap.get(url)
    return index !== undefined ? signedUrls[index] : url
  }

  // Replace URLs in messageToAgent
  if (
    processedLead.messageToAgent &&
    typeof processedLead.messageToAgent === "object"
  ) {
    const messageData = processedLead.messageToAgent
    if (messageData.attachmentUrls && Array.isArray(messageData.attachmentUrls)) {
      messageData.attachmentUrls = messageData.attachmentUrls.map(
        (url: string) => getSignedUrl(url) || url,
      )
    }
    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      messageData.attachments = messageData.attachments.map(
        (url: string) => getSignedUrl(url) || url,
      )
    }
  }

  // Replace URLs in customQuestionsData
  if (
    processedLead.customQuestionsData &&
    typeof processedLead.customQuestionsData === "object"
  ) {
    const customData = processedLead.customQuestionsData as Record<string, any>
    Object.values(customData).forEach((questionData: any) => {
      if (questionData && typeof questionData === "object") {
        // Handle file_upload type questions
        if (
          (questionData.answerType === "file_upload" ||
            questionData.answerType === "uploadFiles") &&
          questionData.value
        ) {
          if (typeof questionData.value === "string") {
            questionData.value =
              getSignedUrl(questionData.value) || questionData.value
          } else if (Array.isArray(questionData.value)) {
            questionData.value = questionData.value.map((url: any) => {
              if (typeof url === "string") {
                return getSignedUrl(url) || url
              }
              return url
            })
          }
        }
      }
    })
  }

  // Replace URLs in formData
  if (processedLead.formData && typeof processedLead.formData === "object") {
    const formData = processedLead.formData as Record<string, any>
    Object.keys(formData).forEach((key) => {
      const value = formData[key]
      if (typeof value === "string" && value.includes("/storage/v1/object/public/")) {
        formData[key] = getSignedUrl(value) || value
      } else if (Array.isArray(value)) {
        formData[key] = value.map((item: any) => {
          if (typeof item === "string" && item.includes("/storage/v1/object/public/")) {
            return getSignedUrl(item) || item
          }
          return item
        })
      } else if (typeof value === "object" && value !== null) {
        if (value.url && typeof value.url === "string") {
          value.url = getSignedUrl(value.url) || value.url
        }
        if (value.attachmentUrls && Array.isArray(value.attachmentUrls)) {
          value.attachmentUrls = value.attachmentUrls.map(
            (url: string) => getSignedUrl(url) || url,
          )
        }
      }
    })
  }

  return processedLead
}

