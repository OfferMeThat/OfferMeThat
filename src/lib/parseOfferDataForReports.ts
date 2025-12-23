/**
 * Helper functions to parse offer data for reports
 * Handles JSON string parsing and field access
 */

import {
  formatDepositAmount,
  formatDepositDue,
  normalizeDepositData,
} from "./depositDataHelpers"

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
 * Gets purchaser names from purchaserData (handles JSON strings)
 */
export function getPurchaserNamesFromData(purchaserData: any): string {
  if (!purchaserData) return "N/A"

  const data = parseJsonField(purchaserData)

  // Single field method
  if (data?.method === "single_field" && data?.name) {
    return data.name
  }

  // Individual names method
  if (data?.method === "individual_names" && data?.nameFields) {
    const names = Object.values(data.nameFields).map((nameData: any) => {
      return [nameData.firstName, nameData.middleName, nameData.lastName]
        .filter(Boolean)
        .join(" ")
    })
    return names.join(", ")
  }

  return "N/A"
}

/**
 * Gets deposit data from offer, checking both depositData field and formData
 */
export function getDepositDataFromOffer(offer: any): any {
  // First check depositData field
  if (offer.depositData) {
    const parsed = parseJsonField(offer.depositData)
    if (
      parsed &&
      (parsed.instalment_1 ||
        parsed.amount ||
        parsed.depositAmount ||
        parsed.deposit_amount ||
        parsed.deposit_percentage)
    ) {
      return parsed
    }
  }

  // If depositData is null or empty, check formData for deposit question
  if (offer.formData) {
    const formData = parseJsonField(offer.formData)
    if (formData && typeof formData === "object") {
      // Look for deposit question in formData (wrapped in question object)
      for (const key in formData) {
        const entry = formData[key]
        if (
          entry &&
          typeof entry === "object" &&
          entry.questionType === "deposit"
        ) {
          return entry.value
        }
      }

      // Also check for raw deposit fields in formData (legacy format)
      // Check if any keys start with "deposit_" or "instalment_"
      const depositFields: Record<string, any> = {}
      let hasDepositFields = false

      for (const key in formData) {
        if (key.startsWith("deposit_") || key.startsWith("instalment_")) {
          const entry = formData[key]
          // If it's wrapped in a question object, get the value
          if (entry && typeof entry === "object" && entry.value !== undefined) {
            depositFields[key] = entry.value
          } else {
            depositFields[key] = entry
          }
          hasDepositFields = true
        }
      }

      if (hasDepositFields) {
        return depositFields
      }
    }
  }

  return null
}

/**
 * Gets deposit amount from depositData (handles JSON strings and both formats)
 */
export function getDepositAmountFromData(
  depositData: any,
  offer?: any,
): string {
  // If offer is provided and depositData is null, try to get from formData
  if (!depositData && offer) {
    depositData = getDepositDataFromOffer(offer)
  }

  if (!depositData) return "N/A"

  const data = parseJsonField(depositData)
  const normalized = normalizeDepositData(data)

  if (!normalized || normalized.instalments.length === 0) {
    return "N/A"
  }

  const { instalments, numInstalments } = normalized

  if (numInstalments > 1) {
    // Multiple instalments - return summary
    const amounts = instalments
      .map((inst) => formatDepositAmount(inst))
      .filter((amt) => amt !== "N/A")
    if (amounts.length > 0) {
      return `${numInstalments} instalments: ${amounts.join(", ")}`
    }
    return `${numInstalments} instalments`
  }

  // Single instalment
  if (instalments[0]) {
    return formatDepositAmount(instalments[0])
  }

  // Fallback to old logic for backward compatibility
  if (data?.depositType === "amount" || data?.amount) {
    const amount =
      typeof data.amount === "number"
        ? data.amount
        : parseFloat(String(data.amount))
    const currency = data.currency || "USD"
    if (!isNaN(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }
  }

  // Single instalment - percentage
  if (data?.depositType === "percentage" || data?.percentage) {
    const percentage =
      typeof data.percentage === "number"
        ? data.percentage
        : parseFloat(String(data.percentage))
    if (!isNaN(percentage)) {
      return `${percentage}% of purchase price`
    }
  }

  // Single instalment - raw form data format (check multiple field name formats)
  const amount =
    data?.deposit_amount_instalment_1 ||
    data?.deposit_amount ||
    data?.deposit_amount_1
  const percentage =
    data?.deposit_percentage_instalment_1 ||
    data?.deposit_percentage ||
    data?.deposit_percentage_1
  const currency =
    data?.deposit_amount_instalment_1_currency ||
    data?.deposit_amount_currency ||
    data?.deposit_amount_1_currency ||
    "USD"

  if (amount !== undefined && amount !== null && amount !== "") {
    const parsedAmount =
      typeof amount === "number" ? amount : parseFloat(String(amount))
    if (!isNaN(parsedAmount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parsedAmount)
    }
  }

  if (percentage !== undefined && percentage !== null && percentage !== "") {
    const parsedPercentage =
      typeof percentage === "number"
        ? percentage
        : parseFloat(String(percentage))
    if (!isNaN(parsedPercentage)) {
      return `${parsedPercentage}% of purchase price`
    }
  }

  return "N/A"
}

/**
 * Gets deposit due date from depositData (handles JSON strings and both formats)
 */
export function getDepositDueFromData(depositData: any, offer?: any): string {
  // If offer is provided and depositData is null, try to get from formData
  if (!depositData && offer) {
    depositData = getDepositDataFromOffer(offer)
  }

  if (!depositData) return "N/A"

  const data = parseJsonField(depositData)
  const normalized = normalizeDepositData(data)

  if (!normalized || normalized.instalments.length === 0) {
    return "N/A"
  }

  const { instalments, numInstalments } = normalized

  if (numInstalments > 1) {
    // Multiple instalments - return summary
    const dues = instalments
      .map((inst) => formatDepositDue(inst))
      .filter((due) => due !== "N/A")
    if (dues.length > 0) {
      return `${numInstalments} instalments: ${dues.join(", ")}`
    }
    return `${numInstalments} instalments`
  }

  // Single instalment
  if (instalments[0]) {
    return formatDepositDue(instalments[0])
  }

  // Fallback to old logic for backward compatibility
  if (data?.depositDueText) {
    return data.depositDueText
  }

  if (data?.depositDue) {
    const date = new Date(data.depositDue)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    return String(data.depositDue)
  }

  if (data?.depositDueWithin) {
    const { number, unit } = data.depositDueWithin
    return `Within ${number} ${String(unit).replace(/_/g, " ")} of offer acceptance`
  }

  // Single instalment - raw form data format
  const due = data?.deposit_due || data?.deposit_due_1
  if (due) {
    if (typeof due === "string" && due.trim() !== "") {
      const date = new Date(due)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      }
      return due
    }
  }

  // Check for "within X days" format in raw form data
  const dueNumber = data?.deposit_due || data?.deposit_due_1
  const dueUnit = data?.deposit_due_unit || data?.deposit_due_1_unit
  if (dueNumber && dueUnit) {
    const parsedNumber =
      typeof dueNumber === "number" ? dueNumber : parseFloat(String(dueNumber))
    if (!isNaN(parsedNumber)) {
      return `Within ${parsedNumber} ${String(dueUnit).replace(/_/g, " ")} of offer acceptance`
    }
  }

  return "N/A"
}

/**
 * Gets settlement date from settlementDateData (handles JSON strings)
 */
export function getSettlementDateFromData(settlementDateData: any): string {
  if (!settlementDateData) return "N/A"

  const data = parseJsonField(settlementDateData)

  // Text description
  if (data?.settlementDateText) {
    return data.settlementDateText
  }

  // Date and time
  if (data?.settlementDateTime) {
    const date = new Date(data.settlementDateTime)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  // Date with optional time
  if (data?.settlementDate) {
    const date = new Date(data.settlementDate)
    if (!isNaN(date.getTime())) {
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      return data.settlementTime
        ? `${dateStr} at ${data.settlementTime}`
        : dateStr
    }
  }

  // Within X days
  if (data?.settlementDateWithin) {
    const { number, unit } = data.settlementDateWithin
    return `Within ${number} ${String(unit).replace(/_/g, " ")} of offer acceptance`
  }

  return "N/A"
}

/**
 * Gets subject to loan approval status (handles JSON strings and field name variations)
 */
export function getSubjectToLoanFromData(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)

  // Check both field names: subjectToLoan and subjectToLoanApproval
  const isSubjectToLoan =
    data?.subjectToLoan === "yes" ||
    data?.subjectToLoan === true ||
    data?.subjectToLoanApproval === "yes" ||
    data?.subjectToLoanApproval === true

  return isSubjectToLoan ? "Yes" : "No"
}

/**
 * Gets message to agent text (handles JSON strings)
 */
export function getMessageToAgentFromData(messageToAgent: any): string {
  if (!messageToAgent) return "N/A"

  // Handle string message
  if (typeof messageToAgent === "string") {
    try {
      const parsed = JSON.parse(messageToAgent)
      return parsed.message || parsed.text || messageToAgent
    } catch {
      return messageToAgent
    }
  }

  // Handle object message
  const data = parseJsonField(messageToAgent)
  return data?.message || data?.text || "N/A"
}

/**
 * Gets special conditions text (handles JSON strings)
 */
export function getSpecialConditionsFromData(specialConditions: any): string {
  if (!specialConditions) return "N/A"

  // Handle legacy string format
  if (typeof specialConditions === "string") {
    try {
      const parsed = JSON.parse(specialConditions)
      // Check if it has meaningful data
      if (
        (parsed.selectedConditions &&
          Array.isArray(parsed.selectedConditions) &&
          parsed.selectedConditions.length > 0) ||
        (parsed.conditionAttachmentUrls &&
          typeof parsed.conditionAttachmentUrls === "object" &&
          Object.keys(parsed.conditionAttachmentUrls).length > 0) ||
        (parsed.customCondition &&
          typeof parsed.customCondition === "string" &&
          parsed.customCondition.trim())
      ) {
        return "Yes"
      }
      return "N/A"
    } catch {
      // If parsing fails, treat as legacy string
      return specialConditions.trim() ? "Yes" : "N/A"
    }
  }

  // Handle object format
  const data = parseJsonField(specialConditions)
  if (
    (data?.selectedConditions &&
      Array.isArray(data.selectedConditions) &&
      data.selectedConditions.length > 0) ||
    (data?.conditionAttachmentUrls &&
      typeof data.conditionAttachmentUrls === "object" &&
      Object.keys(data.conditionAttachmentUrls).length > 0) ||
    (data?.customCondition &&
      typeof data.customCondition === "string" &&
      data.customCondition.trim())
  ) {
    return "Yes"
  }

  return "N/A"
}

/**
 * Gets deposit holding location from depositData
 */
export function getDepositHoldingFromData(
  depositData: any,
  offer?: any,
): string {
  // If offer is provided and depositData is null, try to get from formData
  if (!depositData && offer) {
    depositData = getDepositDataFromOffer(offer)
  }

  if (!depositData) return "N/A"

  const data = parseJsonField(depositData)
  const normalized = normalizeDepositData(data)

  if (!normalized || normalized.instalments.length === 0) {
    return "N/A"
  }

  const { instalments } = normalized

  // Get holding from first instalment (or combine if multiple)
  if (instalments.length === 1) {
    return instalments[0]?.depositHolding || "N/A"
  }

  // Multiple instalments - combine holdings
  const holdings = instalments
    .map((inst, index) => {
      if (inst.depositHolding) {
        return `Instalment ${index + 1}: ${inst.depositHolding}`
      }
      return null
    })
    .filter(Boolean)

  return holdings.length > 0 ? holdings.join("; ") : "N/A"
}

/**
 * Gets submitter role from formData or offer
 */
export function getSubmitterRoleFromData(offer: any): string {
  // Check formData first
  if (offer.formData) {
    const formData = parseJsonField(offer.formData)
    if (formData && typeof formData === "object") {
      for (const key in formData) {
        const entry = formData[key]
        if (
          entry &&
          typeof entry === "object" &&
          entry.questionType === "submitterRole"
        ) {
          const role = entry.value
          const roleLabels: Record<string, string> = {
            buyer_self: "Unrepresented Buyer",
            buyer_represented: "Represented Buyer",
            agent: "Agent",
          }
          return roleLabels[role] || role || "N/A"
        }
      }
    }
  }

  return "N/A"
}

/**
 * Gets loan amount from subjectToLoanApproval
 */
export function getLoanAmountFromData(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)
  const loanAmount = data?.loanAmount

  if (loanAmount !== undefined && loanAmount !== null && loanAmount !== "") {
    const parsed =
      typeof loanAmount === "number"
        ? loanAmount
        : parseFloat(String(loanAmount))
    if (!isNaN(parsed)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parsed)
    }
    return String(loanAmount)
  }

  return "N/A"
}

/**
 * Gets loan company name from subjectToLoanApproval
 */
export function getLoanCompanyNameFromData(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)
  const companyName = data?.companyName

  if (companyName && typeof companyName === "string" && companyName.trim()) {
    return companyName.trim()
  }

  return "N/A"
}

/**
 * Gets loan due date from subjectToLoanApproval
 */
export function getLoanDueDateFromData(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)
  const loanDueDate = data?.loanDueDate

  if (loanDueDate && typeof loanDueDate === "string" && loanDueDate.trim()) {
    // Try to parse as date
    const date = new Date(loanDueDate)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    return loanDueDate.trim()
  }

  return "N/A"
}

/**
 * Gets all custom questions from customQuestionsData and formData
 */
export function getCustomQuestionsFromOffer(
  offer: any,
): Array<{ questionText: string; answer: string }> {
  const customQuestions: Array<{ questionText: string; answer: string }> = []

  // First check customQuestionsData
  if (offer.customQuestionsData) {
    const customData = parseJsonField(offer.customQuestionsData)
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
              } else if (
                typeof value === "object" &&
                value.amount !== undefined
              ) {
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
                // Plain number
                answer = String(value)
              } else if (typeof value === "string") {
                // Try to parse as number
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
                // If it's an object, try to extract a meaningful value
                if (
                  value.number !== undefined &&
                  value.countryCode !== undefined
                ) {
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
                // If it's an object, try to extract meaningful values
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
                } else if (
                  value.number !== undefined &&
                  value.countryCode !== undefined
                ) {
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
  if (offer.formData) {
    const formData = parseJsonField(offer.formData)
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
                if (
                  value.number !== undefined &&
                  value.countryCode !== undefined
                ) {
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
                    // Single key-value pair, show the value
                    answer = String(value[keys[0]])
                  } else {
                    // Multiple keys, show as JSON
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

/**
 * Gets individual deposit instalment data
 */
export function getDepositInstalmentData(
  depositData: any,
  instalmentNumber: number,
  offer?: any,
): {
  amount: string
  due: string
  holding: string
} {
  if (!depositData && offer) {
    depositData = getDepositDataFromOffer(offer)
  }

  if (!depositData) {
    return { amount: "N/A", due: "N/A", holding: "N/A" }
  }

  const data = parseJsonField(depositData)

  // First try normalized format
  const normalized = normalizeDepositData(data)
  if (normalized && normalized.instalments.length > 0) {
    const instalment = normalized.instalments[instalmentNumber - 1]
    if (instalment) {
      return {
        amount: formatDepositAmount(instalment),
        due: formatDepositDue(instalment),
        holding: instalment.depositHolding || "N/A",
      }
    }
  }

  // Fallback to raw form data format
  const amountKey =
    instalmentNumber === 1
      ? "deposit_amount_instalment_1"
      : `deposit_amount_instalment_${instalmentNumber}`
  const amount =
    data?.[amountKey] ||
    data?.[`deposit_amount_${instalmentNumber}`] ||
    (instalmentNumber === 1 ? data?.deposit_amount : undefined)

  const percentageKey =
    instalmentNumber === 1
      ? "deposit_percentage_instalment_1"
      : `deposit_percentage_instalment_${instalmentNumber}`
  const percentage =
    data?.[percentageKey] ||
    data?.[`deposit_percentage_${instalmentNumber}`] ||
    (instalmentNumber === 1 ? data?.deposit_percentage : undefined)

  const currencyKey =
    instalmentNumber === 1
      ? "deposit_amount_instalment_1_currency"
      : `deposit_amount_instalment_${instalmentNumber}_currency`
  const currency =
    data?.[currencyKey] ||
    data?.[`deposit_amount_${instalmentNumber}_currency`] ||
    (instalmentNumber === 1
      ? data?.deposit_amount_currency || data?.deposit_amount_1_currency
      : undefined) ||
    "USD"

  const holdingKey =
    instalmentNumber === 1
      ? "deposit_holding_instalment_1"
      : `deposit_holding_instalment_${instalmentNumber}`
  const holding =
    data?.[holdingKey] ||
    data?.[`deposit_holding_${instalmentNumber}`] ||
    (instalmentNumber === 1 ? data?.deposit_holding : undefined)

  const dueKey =
    instalmentNumber === 1
      ? "deposit_due_instalment_1"
      : `deposit_due_instalment_${instalmentNumber}`
  const due =
    data?.[dueKey] ||
    data?.[`deposit_due_${instalmentNumber}`] ||
    (instalmentNumber === 1 ? data?.deposit_due : undefined)
  const dueUnit =
    data?.[`${dueKey}_unit`] ||
    data?.[`deposit_due_${instalmentNumber}_unit`] ||
    (instalmentNumber === 1 ? data?.deposit_due_unit : undefined)

  let amountStr = "N/A"
  if (amount !== undefined && amount !== null && amount !== "") {
    const parsedAmount =
      typeof amount === "number" ? amount : parseFloat(String(amount))
    if (!isNaN(parsedAmount)) {
      amountStr = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parsedAmount)
    }
  } else if (
    percentage !== undefined &&
    percentage !== null &&
    percentage !== ""
  ) {
    const parsedPercentage =
      typeof percentage === "number"
        ? percentage
        : parseFloat(String(percentage))
    if (!isNaN(parsedPercentage)) {
      amountStr = `${parsedPercentage}% of purchase price`
    }
  }

  let dueStr = "N/A"
  if (due !== undefined && due !== null && due !== "") {
    if (typeof due === "string" && due.trim() !== "") {
      const date = new Date(due)
      if (!isNaN(date.getTime())) {
        dueStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      } else {
        dueStr = due
      }
    } else if (dueUnit) {
      const parsedNumber =
        typeof due === "number" ? due : parseFloat(String(due))
      if (!isNaN(parsedNumber)) {
        dueStr = `Within ${parsedNumber} ${String(dueUnit).replace(/_/g, " ")} of offer acceptance`
      }
    }
  }

  return {
    amount: amountStr,
    due: dueStr,
    holding: holding || "N/A",
  }
}

/**
 * Gets purchase agreement URLs - returns "Yes" if exists, "N/A" otherwise
 */
export function getPurchaseAgreementUrls(offer: any): string {
  if (!offer.purchaseAgreementFileUrl) return "N/A"

  try {
    const parsed = JSON.parse(offer.purchaseAgreementFileUrl)
    if (Array.isArray(parsed)) {
      const urls = parsed.filter((url) => typeof url === "string")
      return urls.length > 0 ? "Yes" : "N/A"
    }
  } catch {
    // Not JSON, treat as single URL string
  }

  return offer.purchaseAgreementFileUrl ? "Yes" : "N/A"
}

/**
 * Gets special condition attachment URLs
 */
export function getSpecialConditionUrls(specialConditions: any): string {
  if (!specialConditions) return "N/A"

  const data = parseJsonField(specialConditions)
  if (!data) return "N/A"

  const urls: string[] = []

  // Check conditionAttachmentUrls
  if (
    data.conditionAttachmentUrls &&
    typeof data.conditionAttachmentUrls === "object"
  ) {
    for (const key in data.conditionAttachmentUrls) {
      const attachmentUrls = data.conditionAttachmentUrls[key]
      if (Array.isArray(attachmentUrls)) {
        urls.push(
          ...attachmentUrls.filter((url: string) => typeof url === "string"),
        )
      } else if (typeof attachmentUrls === "string") {
        urls.push(attachmentUrls)
      }
    }
  }

  return urls.length > 0 ? "Yes" : "N/A"
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
 * Gets loan attachment URLs - returns "Yes" if exists, "N/A" otherwise
 */
export function getLoanAttachmentUrls(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)
  if (!data) return "N/A"

  if (data.supportingDocsUrls && Array.isArray(data.supportingDocsUrls)) {
    const urls = data.supportingDocsUrls.filter(
      (url: string) => typeof url === "string",
    )
    return urls.length > 0 ? "Yes" : "N/A"
  }

  return "N/A"
}

/**
 * Gets settlement time separately
 */
export function getSettlementTimeFromData(settlementDateData: any): string {
  if (!settlementDateData) return "N/A"

  const data = parseJsonField(settlementDateData)

  if (data?.settlementTime) {
    return data.settlementTime
  }

  return "N/A"
}

/**
 * Gets all deposit information consolidated (all instalments)
 */
export function getAllDepositInfo(depositData: any, offer?: any): string {
  if (!depositData && offer) {
    depositData = getDepositDataFromOffer(offer)
  }

  if (!depositData) return "N/A"

  const data = parseJsonField(depositData)
  const normalized = normalizeDepositData(data)

  if (!normalized || normalized.instalments.length === 0) {
    // Try fallback to raw format
    const instalment1 = getDepositInstalmentData(depositData, 1, offer)
    if (
      instalment1.amount !== "N/A" ||
      instalment1.due !== "N/A" ||
      instalment1.holding !== "N/A"
    ) {
      const parts: string[] = []
      if (instalment1.amount !== "N/A")
        parts.push(`Amount: ${instalment1.amount}`)
      if (instalment1.due !== "N/A") parts.push(`Due: ${instalment1.due}`)
      if (instalment1.holding !== "N/A")
        parts.push(`Holding: ${instalment1.holding}`)
      return parts.length > 0 ? parts.join(" | ") : "N/A"
    }
    return "N/A"
  }

  const { instalments, numInstalments } = normalized
  const parts: string[] = []

  instalments.forEach((instalment, index) => {
    const instalmentNum = index + 1
    const instalmentParts: string[] = []

    const amount = formatDepositAmount(instalment)
    if (amount !== "N/A") {
      instalmentParts.push(`Amount: ${amount}`)
    }

    const due = formatDepositDue(instalment)
    if (due !== "N/A") {
      instalmentParts.push(`Due: ${due}`)
    }

    if (instalment.depositHolding) {
      instalmentParts.push(`Holding: ${instalment.depositHolding}`)
    }

    if (instalmentParts.length > 0) {
      if (numInstalments > 1) {
        parts.push(`Instalment ${instalmentNum}: ${instalmentParts.join(", ")}`)
      } else {
        parts.push(...instalmentParts)
      }
    }
  })

  return parts.length > 0 ? parts.join(" | ") : "N/A"
}

/**
 * Gets all settlement information (date and time)
 */
export function getAllSettlementInfo(settlementDateData: any): string {
  if (!settlementDateData) return "N/A"

  const data = parseJsonField(settlementDateData)
  const dateStr = getSettlementDateFromData(settlementDateData)
  const timeStr = getSettlementTimeFromData(settlementDateData)

  if (dateStr === "N/A" && timeStr === "N/A") {
    return "N/A"
  }

  const parts: string[] = []
  if (dateStr !== "N/A") parts.push(dateStr)
  if (timeStr !== "N/A" && timeStr !== dateStr.split(" at ")[1]) {
    // Only add time if it's not already included in the date string
    if (!dateStr.includes(timeStr)) {
      parts.push(`Time: ${timeStr}`)
    }
  }

  return parts.length > 0 ? parts.join(" | ") : "N/A"
}

/**
 * Gets all subject to loan information consolidated
 */
export function getAllSubjectToLoanInfo(subjectToLoanApproval: any): string {
  if (!subjectToLoanApproval) return "N/A"

  const data = parseJsonField(subjectToLoanApproval)
  const isSubjectToLoan = getSubjectToLoanFromData(subjectToLoanApproval)

  if (isSubjectToLoan === "No") {
    return "No"
  }

  const parts: string[] = []
  parts.push("Yes")

  const loanAmount = getLoanAmountFromData(subjectToLoanApproval)
  if (loanAmount !== "N/A") {
    parts.push(`Amount: ${loanAmount}`)
  }

  const companyName = getLoanCompanyNameFromData(subjectToLoanApproval)
  if (companyName !== "N/A") {
    parts.push(`Company: ${companyName}`)
  }

  const dueDate = getLoanDueDateFromData(subjectToLoanApproval)
  if (dueDate !== "N/A") {
    parts.push(`Due Date: ${dueDate}`)
  }

  const attachments = getLoanAttachmentUrls(subjectToLoanApproval)
  if (attachments === "Yes") {
    parts.push("Attachments: Yes")
  }

  return parts.join(" | ")
}

/**
 * Gets all special conditions information consolidated
 */
export function getAllSpecialConditionsInfo(specialConditions: any): string {
  if (!specialConditions) return "N/A"

  const conditions = getSpecialConditionsFromData(specialConditions)
  const attachments = getSpecialConditionUrls(specialConditions)

  if (conditions === "N/A" && attachments === "N/A") {
    return "N/A"
  }

  const parts: string[] = []
  if (conditions !== "N/A") parts.push(conditions)
  if (attachments === "Yes") parts.push("Attachments: Yes")

  return parts.length > 0 ? parts.join(" | ") : "N/A"
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
