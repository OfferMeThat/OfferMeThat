import { createSignedUrls } from "@/lib/supabase/storage"
import {
  MessageToAgentData,
  PurchaserData,
  SubjectToLoanApprovalData,
} from "@/types/offerData"

/**
 * Process offer data to convert all file URLs to signed URLs
 */
export async function processOfferFileUrls(offer: any): Promise<any> {
  if (!offer) return offer

  const processedOffer = { ...offer }
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

  // Collect URLs from purchaserData
  if (processedOffer.purchaserData) {
    const purchaserData = processedOffer.purchaserData as PurchaserData
    // Single field: support both idFileUrl (single) and idFileUrls (array)
    if (purchaserData.method === "single_field") {
      if (purchaserData.idFileUrl) {
        collectUrl(purchaserData.idFileUrl)
      }
      if (purchaserData.idFileUrls) {
        const urls = Array.isArray(purchaserData.idFileUrls)
          ? purchaserData.idFileUrls
          : [purchaserData.idFileUrls]
        urls.forEach(collectUrl)
      }
    }
    // Individual names: support both single URLs and arrays per key
    if (
      purchaserData.method === "individual_names" &&
      purchaserData.idFileUrls
    ) {
      Object.values(purchaserData.idFileUrls).forEach((urlOrUrls) => {
        if (Array.isArray(urlOrUrls)) {
          urlOrUrls.forEach(collectUrl)
        } else if (typeof urlOrUrls === "string") {
          collectUrl(urlOrUrls)
        }
      })
    }
  }

  // Collect URLs from messageToAgent
  if (processedOffer.messageToAgent) {
    const messageData = processedOffer.messageToAgent as MessageToAgentData
    if (typeof messageData === "object") {
      collectUrl(messageData.attachmentUrl)
      if (messageData.attachmentUrls) {
        messageData.attachmentUrls.forEach(collectUrl)
      }
      if (messageData.attachments) {
        messageData.attachments.forEach(collectUrl)
      }
    }
  }

  // Collect URLs from subjectToLoanApproval
  if (processedOffer.subjectToLoanApproval) {
    const loanData =
      processedOffer.subjectToLoanApproval as SubjectToLoanApprovalData
    // Check all possible field names for backward compatibility
    collectUrl((loanData as any).supportingDocUrl)
    collectUrl((loanData as any).supportingDocsUrl)
    if ((loanData as any).supportingDocUrls) {
      const urls = (loanData as any).supportingDocUrls
      if (Array.isArray(urls)) {
        urls.forEach(collectUrl)
      }
    }
    if ((loanData as any).supportingDocsUrls) {
      const urls = (loanData as any).supportingDocsUrls
      if (Array.isArray(urls)) {
        urls.forEach(collectUrl)
      }
    }
    if (loanData.preApprovalDocuments) {
      loanData.preApprovalDocuments.forEach(collectUrl)
    }
    collectUrl(loanData.evidenceOfFundsUrl)
    if (loanData.evidenceOfFundsUrls) {
      loanData.evidenceOfFundsUrls.forEach(collectUrl)
    }
  }

  // Collect URLs from customQuestionsData
  if (
    processedOffer.customQuestionsData &&
    typeof processedOffer.customQuestionsData === "object"
  ) {
    const customData = processedOffer.customQuestionsData as Record<string, any>
    Object.values(customData).forEach((questionData: any) => {
      if (questionData && typeof questionData === "object") {
        // Handle file_upload type questions
        if (questionData.answerType === "file_upload" && questionData.value) {
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

  // Helper to parse purchaseAgreementFileUrl (can be single URL string or JSON array)
  const parsePurchaseAgreementUrls = (
    value: string | null | undefined,
  ): string[] => {
    if (!value) return []
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((url) => typeof url === "string")
      }
    } catch {
      // Not JSON, treat as single URL string
    }
    // Single URL string (backward compatibility)
    return [value]
  }

  // Collect URLs from purchaseAgreementFileUrl
  const purchaseAgreementUrls = parsePurchaseAgreementUrls(
    processedOffer.purchaseAgreementFileUrl,
  )
  purchaseAgreementUrls.forEach(collectUrl)

  // Collect URLs from specialConditions
  if (processedOffer.specialConditions) {
    let specialConditionsData = processedOffer.specialConditions
    // Parse if it's a JSON string
    if (typeof specialConditionsData === "string") {
      try {
        specialConditionsData = JSON.parse(specialConditionsData)
      } catch {
        // If parsing fails, skip URL collection for special conditions
        specialConditionsData = null
      }
    }
    // Collect URLs from conditionAttachmentUrls (deprecated - for backward compatibility)
    if (
      specialConditionsData &&
      typeof specialConditionsData === "object" &&
      specialConditionsData !== null
    ) {
      const conditionAttachmentUrls =
        (specialConditionsData as any).conditionAttachmentUrls
      if (conditionAttachmentUrls && typeof conditionAttachmentUrls === "object") {
        Object.values(conditionAttachmentUrls).forEach((urls: any) => {
          if (Array.isArray(urls)) {
            urls.forEach((url: any) => {
              if (typeof url === "string") {
                collectUrl(url)
              }
            })
          }
        })
      }
      // Collect URLs from customConditionAttachmentUrls (new format)
      const customConditionAttachmentUrls =
        (specialConditionsData as any).customConditionAttachmentUrls
      if (Array.isArray(customConditionAttachmentUrls)) {
        customConditionAttachmentUrls.forEach((url: any) => {
          if (typeof url === "string") {
            collectUrl(url)
          }
        })
      }
    }
  }

  // If no URLs to sign, return original offer
  if (urlsToSign.length === 0) {
    return processedOffer
  }

  // Create signed URLs
  const signedUrls = await createSignedUrls(urlsToSign, 3600) // 1 hour expiry

  // Helper to replace URL with signed version
  const getSignedUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return url as undefined
    const index = urlMap.get(url)
    return index !== undefined ? signedUrls[index] : url
  }

  // Replace URLs in purchaserData
  if (processedOffer.purchaserData) {
    const purchaserData = processedOffer.purchaserData as PurchaserData
    // Single field: support both idFileUrl (single) and idFileUrls (array)
    if (purchaserData.method === "single_field") {
      if (purchaserData.idFileUrl) {
        purchaserData.idFileUrl = getSignedUrl(purchaserData.idFileUrl) || ""
      }
      if (purchaserData.idFileUrls) {
        const urls = Array.isArray(purchaserData.idFileUrls)
          ? purchaserData.idFileUrls
          : [purchaserData.idFileUrls]
        purchaserData.idFileUrls = urls.map((url) => getSignedUrl(url) || url)
      }
    }
    // Individual names: support both single URLs and arrays per key
    if (
      purchaserData.method === "individual_names" &&
      purchaserData.idFileUrls
    ) {
      const signedIdFileUrls: Record<string, string | string[]> = {}
      Object.entries(purchaserData.idFileUrls).forEach(([key, urlOrUrls]) => {
        if (Array.isArray(urlOrUrls)) {
          signedIdFileUrls[key] = urlOrUrls.map((url) => getSignedUrl(url) || url)
        } else if (typeof urlOrUrls === "string") {
          signedIdFileUrls[key] = getSignedUrl(urlOrUrls) || urlOrUrls
        }
      })
      purchaserData.idFileUrls = signedIdFileUrls
    }
  }

  // Replace URLs in messageToAgent
  if (
    processedOffer.messageToAgent &&
    typeof processedOffer.messageToAgent === "object"
  ) {
    const messageData = processedOffer.messageToAgent as MessageToAgentData
    if (messageData.attachmentUrl) {
      messageData.attachmentUrl = getSignedUrl(messageData.attachmentUrl)
    }
    if (messageData.attachmentUrls) {
      messageData.attachmentUrls = messageData.attachmentUrls.map(
        (url) => getSignedUrl(url) || url,
      )
    }
    if (messageData.attachments) {
      messageData.attachments = messageData.attachments.map(
        (url) => getSignedUrl(url) || url,
      )
    }
  }

  // Replace URLs in subjectToLoanApproval
  if (processedOffer.subjectToLoanApproval) {
    const loanData =
      processedOffer.subjectToLoanApproval as SubjectToLoanApprovalData
    // Handle all possible field names for backward compatibility
    if ((loanData as any).supportingDocUrl) {
      ;(loanData as any).supportingDocUrl = getSignedUrl(
        (loanData as any).supportingDocUrl,
      )
    }
    if ((loanData as any).supportingDocsUrl) {
      ;(loanData as any).supportingDocsUrl = getSignedUrl(
        (loanData as any).supportingDocsUrl,
      )
    }
    if ((loanData as any).supportingDocUrls) {
      ;(loanData as any).supportingDocUrls = (
        loanData as any
      ).supportingDocUrls.map((url: string) => getSignedUrl(url) || url)
    }
    if ((loanData as any).supportingDocsUrls) {
      ;(loanData as any).supportingDocsUrls = (
        loanData as any
      ).supportingDocsUrls.map((url: string) => getSignedUrl(url) || url)
    }
    if (loanData.preApprovalDocuments) {
      loanData.preApprovalDocuments = loanData.preApprovalDocuments.map(
        (url) => getSignedUrl(url) || url,
      )
    }
    if (loanData.evidenceOfFundsUrl) {
      loanData.evidenceOfFundsUrl = getSignedUrl(loanData.evidenceOfFundsUrl)
    }
    if (loanData.evidenceOfFundsUrls) {
      loanData.evidenceOfFundsUrls = loanData.evidenceOfFundsUrls.map(
        (url) => getSignedUrl(url) || url,
      )
    }
  }

  // Replace URLs in customQuestionsData
  if (
    processedOffer.customQuestionsData &&
    typeof processedOffer.customQuestionsData === "object"
  ) {
    const customData = processedOffer.customQuestionsData as Record<string, any>
    Object.values(customData).forEach((questionData: any) => {
      if (questionData && typeof questionData === "object") {
        // Handle file_upload type questions
        if (questionData.answerType === "file_upload" && questionData.value) {
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

  // Replace URLs in purchaseAgreementFileUrl
  if (processedOffer.purchaseAgreementFileUrl) {
    const originalUrls = parsePurchaseAgreementUrls(
      processedOffer.purchaseAgreementFileUrl,
    )
    const signedUrls = originalUrls.map(
      (url) => getSignedUrl(url) || url,
    )
    // Store back in the same format (JSON array if multiple, plain string if single)
    if (signedUrls.length === 1) {
      processedOffer.purchaseAgreementFileUrl = signedUrls[0]
    } else if (signedUrls.length > 1) {
      processedOffer.purchaseAgreementFileUrl = JSON.stringify(signedUrls)
    }
  }

  // Replace URLs in specialConditions
  if (processedOffer.specialConditions) {
    let specialConditionsData = processedOffer.specialConditions
    let isString = false
    // Parse if it's a JSON string
    if (typeof specialConditionsData === "string") {
      try {
        specialConditionsData = JSON.parse(specialConditionsData)
        isString = true
      } catch {
        // If parsing fails, skip URL replacement
        return processedOffer
      }
    }
    // Replace URLs in conditionAttachmentUrls (deprecated - for backward compatibility)
    if (
      specialConditionsData &&
      typeof specialConditionsData === "object" &&
      specialConditionsData !== null
    ) {
      const conditionAttachmentUrls =
        (specialConditionsData as any).conditionAttachmentUrls
      if (conditionAttachmentUrls && typeof conditionAttachmentUrls === "object") {
        const signedConditionAttachmentUrls: Record<number | string, string[]> = {}
        Object.entries(conditionAttachmentUrls).forEach(([key, urls]: [string, any]) => {
          if (Array.isArray(urls)) {
            signedConditionAttachmentUrls[key] = urls.map((url: any) => {
              if (typeof url === "string") {
                return getSignedUrl(url) || url
              }
              return url
            })
          }
        })
        ;(specialConditionsData as any).conditionAttachmentUrls =
          signedConditionAttachmentUrls
      }
      // Replace URLs in customConditionAttachmentUrls (new format)
      const customConditionAttachmentUrls =
        (specialConditionsData as any).customConditionAttachmentUrls
      if (Array.isArray(customConditionAttachmentUrls)) {
        ;(specialConditionsData as any).customConditionAttachmentUrls =
          customConditionAttachmentUrls.map((url: any) => {
            if (typeof url === "string") {
              return getSignedUrl(url) || url
            }
            return url
          })
      }

      // Store back in the same format (JSON string if it was originally a string)
      if (isString) {
        processedOffer.specialConditions = JSON.stringify(specialConditionsData)
      } else {
        processedOffer.specialConditions = specialConditionsData
      }
    }
  }

  return processedOffer
}
