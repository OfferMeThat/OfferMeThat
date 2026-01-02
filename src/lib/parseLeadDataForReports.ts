export function parseJsonField<T = any>(field: any): T | null {
  if (!field) return null
  if (typeof field === "string") {
    try {
      return JSON.parse(field) as T
    } catch {
      return field as T
    }
  }
  return field as T
}

export function getOpinionOfSalePrice(opinionOfSalePrice: string | null): string {
  if (!opinionOfSalePrice) return "N/A"

  try {
    const parsed = parseJsonField(opinionOfSalePrice)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "amount" in parsed
    ) {
      const amount = parsed.amount
      const currency = parsed.currency || "USD"
      
      if (amount === "" || amount === null || amount === undefined) {
        return "N/A"
      }
      
      const formattedAmount =
        typeof amount === "number"
          ? amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : String(amount)
      
      return `${currency} ${formattedAmount}`
    }
  } catch {}

  return opinionOfSalePrice.trim() || "N/A"
}

export function getSubmitterName(lead: any): string {
  const firstName = lead.submitterFirstName || ""
  const lastName = lead.submitterLastName || ""
  const name = `${firstName} ${lastName}`.trim()
  return name || "N/A"
}

export function getListingAddress(lead: any): string {
  if (lead.customListingAddress) {
    return lead.customListingAddress
  }
  return lead.listing?.address || "N/A"
}

export function getMessageToAgentFromData(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  const data = parseJsonField(messageToAgent)
  if (!data) return "N/A"

  if (typeof data === "string") {
    return data.trim() || "N/A"
  }

  if (typeof data === "object" && data !== null) {
    if (data.message && typeof data.message === "string") {
      return data.message.trim() || "N/A"
    }
    if (data.text && typeof data.text === "string") {
      return data.text.trim() || "N/A"
    }
  }

  return "N/A"
}

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

export function getAllMessageToAgentInfo(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  let message = getMessageToAgentFromData(messageToAgent)
  const attachments = getMessageAttachmentUrls(messageToAgent)

  if (message === "N/A" && attachments === "N/A") {
    return "N/A"
  }

  if (message !== "N/A" && message.length > 200) {
    message = message.substring(0, 200) + "..."
  }

  const parts: string[] = []
  if (message !== "N/A") parts.push(message)
  if (attachments === "Yes") parts.push("Attachments: Yes")

  return parts.length > 0 ? parts.join(" | ") : "N/A"
}

function isUrl(val: any): boolean {
  if (!messageToAgent) return "N/A"

  let message = getMessageToAgentFromData(messageToAgent)
  const attachments = getMessageAttachmentUrls(messageToAgent)

  if (message === "N/A" && attachments === "N/A") {
    return "N/A"
  }

  // Clip message to 200 characters if longer
  if (message !== "N/A" && message.length > 200) {
    message = message.substring(0, 200) + "..."
  }

  const parts: string[] = []
  if (message !== "N/A") parts.push(message)
  if (attachments === "Yes") parts.push("Attachments: Yes")

  return parts.length > 0 ? parts.join(" | ") : "N/A"
}

function countAttachments(val: any): number {
  if (Array.isArray(val)) {
    return val.filter((item) => isUrl(item)).length
  } else if (typeof val === "string" && isUrl(val)) {
    return 1
  } else if (typeof val === "object" && val !== null) {
    const values = Object.values(val)
    return values.filter((item) => isUrl(item)).length
  }
  return 0
}

function formatCustomQuestionValue(value: any, answerType: string): string {
  if (value === undefined || value === null) return "N/A"

  if (answerType === "file_upload") {
    const attachmentCount = countAttachments(value)
    if (attachmentCount > 0) {
      return `${attachmentCount} Attachment${attachmentCount !== 1 ? "s" : ""}`
    }
    return typeof value === "string" ? "File uploaded" : "N/A"
  }

  if (Array.isArray(value)) {
    const attachmentCount = countAttachments(value)
    if (attachmentCount > 0) {
      return `${attachmentCount} Attachment${attachmentCount !== 1 ? "s" : ""}`
    }
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return JSON.stringify(item)
        }
        return String(item)
      })
      .join(", ")
  }

  if (answerType === "number_amount") {
    if (
      typeof value === "object" &&
      value.number !== undefined &&
      value.countryCode !== undefined
    ) {
      return `${value.countryCode}${value.number}`
    }
    if (typeof value === "object" && value.amount !== undefined) {
      const currency = value.currency || "USD"
      const amount =
        typeof value.amount === "number"
          ? value.amount
          : parseFloat(String(value.amount))
      if (!isNaN(amount)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      }
      return String(value.amount)
    }
    if (typeof value === "object" && value.percentage !== undefined) {
      const percentage =
        typeof value.percentage === "number"
          ? value.percentage
          : parseFloat(String(value.percentage))
      if (!isNaN(percentage)) {
        return `${percentage}%`
      }
      return String(value.percentage)
    }
    // Plain number
    if (typeof value === "number") {
      return String(value)
    }
    // String number
    if (typeof value === "string") {
      const parsed = parseFloat(value)
      return !isNaN(parsed) ? String(parsed) : value
    }
    return String(value)
  }

  if (answerType === "number") {
    if (typeof value === "object" && value !== null) {
      if (value.number !== undefined && value.countryCode !== undefined) {
        return `${value.countryCode}${value.number}`
      }
      return JSON.stringify(value)
    }
    return String(value)
  }

  if (answerType === "phone") {
    if (
      typeof value === "object" &&
      value.number &&
      value.countryCode
    ) {
      return `${value.countryCode}${value.number}`
    }
    return String(value)
  }

  if (answerType === "time_date") {
    if (typeof value === "string") {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      } catch {}
    }
    if (typeof value === "object" && value !== null) {
      const parts: string[] = []
      if (value.date) {
        try {
          const date = new Date(value.date)
          if (!isNaN(date.getTime())) {
            parts.push(
              date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            )
          } else {
            parts.push(String(value.date))
          }
        } catch {
          parts.push(String(value.date))
        }
      }
      if (value.time) {
        parts.push(String(value.time))
      }
      return parts.length > 0 ? parts.join(" at ") : JSON.stringify(value)
    }
    return String(value)
  }

  if (answerType === "yes_no") {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No"
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase()
      if (lower === "yes" || lower === "true") return "Yes"
      if (lower === "no" || lower === "false") return "No"
      if (lower === "unsure") return "Unsure"
      return value
    }
    return String(value)
  }

  if (answerType === "single_select") {
    return String(value)
  }

  if (answerType === "multi_select") {
    if (Array.isArray(value)) {
      return value.map(String).join(", ")
    }
    return String(value)
  }

  if (answerType === "statement") {
    if (typeof value === "object" && value !== null) {
      if (value.agreed !== undefined) {
        return value.agreed ? "Agreed" : "Not Agreed"
      }
      if (value.text) {
        return String(value.text)
      }
    }
    return String(value)
  }

  if (answerType === "short_text" || answerType === "long_text") {
    return String(value)
  }

  if (typeof value === "object" && value !== null) {
    if (value.amount !== undefined) {
      const currency = value.currency || "USD"
      const amount =
        typeof value.amount === "number"
          ? value.amount
          : parseFloat(String(value.amount))
      if (!isNaN(amount)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      }
      return String(value.amount)
    }
    const attachmentCount = countAttachments(value)
    if (attachmentCount > 0) {
      return `${attachmentCount} Attachment${attachmentCount !== 1 ? "s" : ""}`
    }
    return JSON.stringify(value)
  }

  const attachmentCount = countAttachments(value)
  if (attachmentCount > 0) {
    return `${attachmentCount} Attachment${attachmentCount !== 1 ? "s" : ""}`
  }

  return String(value)
}

export function getCustomQuestionsFromLead(
  lead: any,
): Array<{ questionText: string; answer: string }> {
  const customQuestions: Array<{ questionText: string; answer: string }> = []

  if (lead.customQuestionsData) {
    const customData = parseJsonField(lead.customQuestionsData)
    if (customData && typeof customData === "object") {
      for (const key in customData) {
        if (key === "currency") continue

        const questionData = customData[key]
        if (questionData && typeof questionData === "object") {
          const questionText =
            questionData.questionText || `Custom Question ${key}`
          const answerType = questionData.answerType
          const value = questionData.value

          const answer = formatCustomQuestionValue(value, answerType)
          customQuestions.push({ questionText, answer })
        }
      }
    }
  }

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
          const existingIndex = customQuestions.findIndex(
            (q) => q.questionText.includes(key) || entry.questionId === key,
          )

          if (existingIndex === -1) {
            const value = entry.value
            const answerType = entry.answerType || "short_text"
            const answer = formatCustomQuestionValue(value, answerType)

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

export function formatCustomQuestions(
  customQuestions: Array<{ questionText: string; answer: string }>,
): string {
  if (customQuestions.length === 0) return "N/A"

  return customQuestions
    .map((q) => `${q.questionText}: ${q.answer}`)
    .join(" | ")
}

