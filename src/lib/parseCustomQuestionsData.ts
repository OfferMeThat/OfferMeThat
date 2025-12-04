/**
 * Parses and formats custom questions data from offers
 * Handles all question types: text, numbers, files, dates, yes/no, selects, statements
 */

export type ParsedQuestion = {
  questionText: string
  answerType: string
  formattedValue: string
  rawValue: any
}

/**
 * Formats currency amount
 */
function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats phone number
 */
function formatPhoneNumber(phone: string): string {
  // Basic phone formatting - can be enhanced
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Formats percentage
 */
function formatPercentage(value: number): string {
  return `${value}%`
}

/**
 * Formats date/time
 */
function formatDateTime(value: any): string {
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
    } catch (e) {
      // Fall through
    }
  }
  
  // Handle object with date and time
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
        }
      } catch (e) {
        parts.push(String(value.date))
      }
    }
    if (value.time) {
      parts.push(String(value.time))
    }
    return parts.join(" at ") || JSON.stringify(value)
  }
  
  return String(value)
}

/**
 * Parses a single custom question entry
 */
export function parseCustomQuestion(
  questionId: string,
  questionData: {
    questionText: string
    answerType: string
    value: any
  }
): ParsedQuestion | null {
  if (!questionData || questionData.value === null || questionData.value === undefined || questionData.value === "") {
    return null
  }

  const { questionText, answerType, value } = questionData
  let formattedValue: string | JSX.Element

  switch (answerType) {
    case "short_text":
    case "longText":
      formattedValue = String(value)
      break

    case "long_text":
      formattedValue = String(value)
      break

    case "number_amount": {
      // Check if it's money, phone, or percentage based on setupConfig
      // For now, we'll try to infer from the value
      if (typeof value === "number") {
        // Could be money or percentage - default to money
        formattedValue = formatCurrency(value)
      } else if (typeof value === "string") {
        // Check if it looks like a phone number
        if (/^\+?[\d\s\-\(\)]+$/.test(value) && value.replace(/\D/g, "").length >= 10) {
          formattedValue = formatPhoneNumber(value)
        } else {
          // Try to parse as number
          const num = parseFloat(value)
          if (!isNaN(num)) {
            formattedValue = formatCurrency(num)
          } else {
            formattedValue = value
          }
        }
      } else {
        formattedValue = String(value)
      }
      break
    }

    case "money":
      if (typeof value === "number") {
        formattedValue = formatCurrency(value)
      } else if (typeof value === "object" && value !== null) {
        // Handle object with amount and currency
        const amount = value.amount || value.value || 0
        const currency = value.currency || "USD"
        formattedValue = formatCurrency(amount, currency)
      } else {
        const num = parseFloat(String(value))
        formattedValue = isNaN(num) ? String(value) : formatCurrency(num)
      }
      break

    case "phone":
      formattedValue = formatPhoneNumber(String(value))
      break

    case "percentage":
      if (typeof value === "number") {
        formattedValue = formatPercentage(value)
      } else {
        const num = parseFloat(String(value))
        formattedValue = isNaN(num) ? String(value) : formatPercentage(num)
      }
      break

    case "file_upload":
    case "uploadFiles": {
      if (Array.isArray(value)) {
        // Multiple files
        formattedValue = value
          .map((file, idx) => {
            const url = typeof file === "string" ? file : file.url || file.path || String(file)
            const name = typeof file === "object" && file.name ? file.name : `File ${idx + 1}`
            return { url, name }
          })
          .map((file) => `[${file.name}](${file.url})`)
          .join(", ")
      } else if (typeof value === "string") {
        // Single file URL
        formattedValue = `[View File](${value})`
      } else if (typeof value === "object" && value !== null) {
        // File object
        const url = value.url || value.path || ""
        const name = value.name || "File"
        formattedValue = `[${name}](${url})`
      } else {
        formattedValue = String(value)
      }
      break
    }

    case "time_date":
    case "provideTime": {
      formattedValue = formatDateTime(value)
      break
    }

    case "yes_no":
    case "yesNo": {
      if (typeof value === "boolean") {
        formattedValue = value ? "Yes" : "No"
      } else if (typeof value === "string") {
        const lower = value.toLowerCase()
        formattedValue = lower === "yes" || lower === "true" || lower === "1" ? "Yes" : "No"
      } else {
        formattedValue = value ? "Yes" : "No"
      }
      break
    }

    case "single_select":
    case "singleChoiceSelect": {
      if (typeof value === "string") {
        formattedValue = value
      } else if (typeof value === "object" && value !== null) {
        formattedValue = value.label || value.value || JSON.stringify(value)
      } else {
        formattedValue = String(value)
      }
      break
    }

    case "multi_select":
    case "multiChoiceSelect": {
      if (Array.isArray(value)) {
        formattedValue = value
          .map((item) => (typeof item === "object" && item !== null ? item.label || item.value : String(item)))
          .join(", ")
      } else if (typeof value === "string") {
        formattedValue = value
      } else {
        formattedValue = String(value)
      }
      break
    }

    case "statement": {
      // Statement might have an agreement checkbox
      if (typeof value === "object" && value !== null) {
        const agreed = value.agreed || value.checked || false
        const text = value.text || value.statement || ""
        formattedValue = agreed ? `✓ Agreed: ${text}` : text || "Not agreed"
      } else if (typeof value === "boolean") {
        formattedValue = value ? "Agreed" : "Not agreed"
      } else {
        formattedValue = String(value)
      }
      break
    }

    // Handle other question types that might be stored in customQuestionsData
    case "shortText":
      formattedValue = String(value)
      break

    case "provideAmount": {
      if (typeof value === "number") {
        formattedValue = formatCurrency(value)
      } else if (typeof value === "object" && value !== null) {
        const amount = value.amount || value.value || 0
        const currency = value.currency || "USD"
        formattedValue = formatCurrency(amount, currency)
      } else {
        const num = parseFloat(String(value))
        formattedValue = isNaN(num) ? String(value) : formatCurrency(num)
      }
      break
    }

    // Handle question types that are stored directly (not as custom)
    case "offerExpiry": {
      if (typeof value === "object" && value !== null) {
        const parts: string[] = []
        if (value.expiryDate) {
          parts.push(formatDateTime(value.expiryDate))
        }
        if (value.expiryTime) {
          parts.push(String(value.expiryTime))
        }
        formattedValue = parts.join(" at ") || "No expiry set"
      } else {
        formattedValue = formatDateTime(value)
      }
      break
    }

    case "attachPurchaseAgreement": {
      if (typeof value === "string") {
        formattedValue = `[View Purchase Agreement](${value})`
      } else {
        formattedValue = String(value)
      }
      break
    }

    default:
      // For unknown types, try to format nicely
      if (typeof value === "object" && value !== null) {
        formattedValue = JSON.stringify(value, null, 2)
      } else {
        formattedValue = String(value)
      }
      break
  }

  return {
    questionText: questionText || "Custom Question",
    answerType,
    formattedValue,
    rawValue: value,
  }
}

/**
 * Parses all custom questions data from an offer
 */
export function parseAllCustomQuestions(
  customQuestionsData: Record<string, any> | null | undefined
): ParsedQuestion[] {
  if (!customQuestionsData || typeof customQuestionsData !== "object") {
    return []
  }

  const parsed: ParsedQuestion[] = []

  for (const [questionId, questionData] of Object.entries(customQuestionsData)) {
    if (
      questionData &&
      typeof questionData === "object" &&
      "questionText" in questionData &&
      "answerType" in questionData &&
      "value" in questionData
    ) {
      const parsedQuestion = parseCustomQuestion(questionId, questionData as any)
      if (parsedQuestion) {
        parsed.push(parsedQuestion)
      }
    }
  }

  return parsed
}

