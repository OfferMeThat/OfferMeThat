/**
 * Helper functions to parse lead data for reports
 * Handles JSON string parsing and field access
 */

/**
 * Parses a JSON string or returns the value as-is
 */
export function parseJsonField<T = any>(field: any): T | null {
  if (!field) return null
  if (typeof field === "string") {
    try {
      return JSON.parse(field) as T
    } catch {
      // If parsing fails, return the string as-is
      return field as T
    }
  }
  return field as T
}

/**
 * Gets submitter name from lead
 */
export function getSubmitterName(lead: any): string {
  const firstName = lead.submitterFirstName || ""
  const lastName = lead.submitterLastName || ""
  const name = `${firstName} ${lastName}`.trim()
  return name || "N/A"
}

/**
 * Gets listing address from lead
 */
export function getListingAddress(lead: any): string {
  if (lead.customListingAddress) {
    return lead.customListingAddress
  }
  return lead.listing?.address || "N/A"
}

/**
 * Gets message to agent from lead
 */
export function getMessageToAgentFromData(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  const data = parseJsonField(messageToAgent)
  if (!data) return "N/A"

  if (typeof data === "string") {
    return data.trim() || "N/A"
  }

  if (typeof data === "object" && data.message) {
    return String(data.message).trim() || "N/A"
  }

  return "N/A"
}

/**
 * Gets message to agent attachment URLs - returns "Yes" if exists, "N/A" otherwise
 */
export function getMessageAttachmentUrls(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  const data = parseJsonField(messageToAgent)
  if (!data) return "N/A"

  if (data.attachmentUrls && Array.isArray(data.attachmentUrls)) {
    const urls = data.attachmentUrls.filter(
      (url: string) => typeof url === "string",
    )
    return urls.length > 0 ? "Yes" : "N/A"
  }

  return "N/A"
}

/**
 * Gets all message to agent information consolidated
 */
export function getAllMessageToAgentInfo(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  const message = getMessageToAgentFromData(messageToAgent)
  const attachments = getMessageAttachmentUrls(messageToAgent)

  if (message === "N/A" && attachments === "N/A") {
    return "N/A"
  }

  const parts: string[] = []
  if (message !== "N/A") parts.push(message)
  if (attachments === "Yes") parts.push("Attachments: Yes")

  return parts.length > 0 ? parts.join(" | ") : "N/A"
}

/**
 * Gets custom questions from lead
 */
export function getCustomQuestionsFromLead(
  lead: any,
): Array<{ questionText: string; answer: string }> {
  const customQuestions: Array<{ questionText: string; answer: string }> = []

  // First check customQuestionsData
  if (lead.customQuestionsData) {
    const customData = parseJsonField(lead.customQuestionsData)
    if (customData && typeof customData === "object") {
      for (const key in customData) {
        // Skip the currency field
        if (key === "currency") continue

        const questionData = customData[key]
        if (questionData && typeof questionData === "object") {
          const questionText =
            questionData.questionText || `Custom Question ${key}`
          const answerType = questionData.answerType
          const value = questionData.value

          let answer = "N/A"
          if (value !== undefined && value !== null) {
            if (answerType === "file_upload") {
              answer = typeof value === "string" ? "File uploaded" : "N/A"
            } else if (answerType === "number_amount") {
              // Check if it's a phone number object (has number and countryCode)
              if (
                typeof value === "object" &&
                value.number !== undefined &&
                value.countryCode !== undefined
              ) {
                answer = `${value.countryCode}${value.number}`
              } else if (typeof value === "object" && value.amount !== undefined) {
                const currency = value.currency || "USD"
                const amount =
                  typeof value.amount === "number"
                    ? value.amount
                    : parseFloat(String(value.amount))
                if (!isNaN(amount)) {
                  answer = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(amount)
                } else {
                  answer = String(value.amount)
                }
              } else if (typeof value === "number") {
                answer = String(value)
              } else if (typeof value === "string") {
                const parsed = parseFloat(value)
                if (!isNaN(parsed)) {
                  answer = String(parsed)
                } else {
                  answer = value
                }
              } else {
                answer = String(value)
              }
            } else if (answerType === "number") {
              if (typeof value === "object" && value !== null) {
                if (value.number !== undefined && value.countryCode !== undefined) {
                  answer = `${value.countryCode}${value.number}`
                } else {
                  answer = JSON.stringify(value)
                }
              } else {
                answer = String(value)
              }
            } else if (answerType === "phone") {
              if (
                typeof value === "object" &&
                value.number &&
                value.countryCode
              ) {
                answer = `${value.countryCode}${value.number}`
              } else {
                answer = String(value)
              }
            } else {
              // For other types, handle objects properly
              if (typeof value === "object" && value !== null) {
                if (value.amount !== undefined) {
                  const currency = value.currency || "USD"
                  const amount =
                    typeof value.amount === "number"
                      ? value.amount
                      : parseFloat(String(value.amount))
                  if (!isNaN(amount)) {
                    answer = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(amount)
                  } else {
                    answer = String(value.amount)
                  }
                } else if (value.number !== undefined && value.countryCode !== undefined) {
                  answer = `${value.countryCode}${value.number}`
                } else {
                  answer = JSON.stringify(value)
                }
              } else {
                answer = String(value)
              }
            }
          }

          customQuestions.push({ questionText, answer })
        }
      }
    }
  }

  // Also check formData for custom questions
  if (lead.formData) {
    const formData = parseJsonField(lead.formData)
    if (formData && typeof formData === "object") {
      for (const key in formData) {
        const entry = formData[key]
        if (
          entry &&
          typeof entry === "object" &&
          entry.questionType === "custom"
        ) {
          // Check if we already have this question from customQuestionsData
          const existingIndex = customQuestions.findIndex(
            (q) => q.questionText.includes(key) || entry.questionId === key,
          )

          if (existingIndex === -1) {
            // Format the answer based on the value type
            let answer = "N/A"
            const value = entry.value

            if (value !== undefined && value !== null) {
              if (typeof value === "string" && value.startsWith("http")) {
                answer = "File uploaded"
              } else if (typeof value === "object") {
                // Check for phone number format first
                if (value.number !== undefined && value.countryCode !== undefined) {
                  answer = `${value.countryCode}${value.number}`
                } else if (value.amount !== undefined) {
                  const currency = value.currency || "USD"
                  const amount =
                    typeof value.amount === "number"
                      ? value.amount
                      : parseFloat(String(value.amount))
                  if (!isNaN(amount)) {
                    answer = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(amount)
                  } else {
                    answer = String(value.amount)
                  }
                } else {
                  // For other objects, try to find a meaningful string representation
                  const keys = Object.keys(value)
                  if (keys.length === 0) {
                    answer = "N/A"
                  } else if (keys.length === 1) {
                    answer = String(value[keys[0]])
                  } else {
                    answer = JSON.stringify(value)
                  }
                }
              } else {
                answer = String(value)
              }
            }

            customQuestions.push({
              questionText: `Custom Question ${key}`,
              answer,
            })
          }
        }
      }
    }
  }

  return customQuestions
}

/**
 * Formats custom questions as a single string for display
 */
export function formatCustomQuestions(
  customQuestions: Array<{ questionText: string; answer: string }>,
): string {
  if (customQuestions.length === 0) return "N/A"

  return customQuestions
    .map((q) => `${q.questionText}: ${q.answer}`)
    .join(" | ")
}

