/**
 * Utility functions for working with deposit data
 * Provides consistent formatting and parsing across the application
 * 
 * This is a pure utility module that can be safely imported in both
 * client and server contexts.
 */

import type {
  DepositData,
  DepositInstalment,
  DepositTimeUnit,
  DepositType,
} from "@/types/offerData"

/**
 * Normalizes deposit data to a consistent structure
 * Handles both structured format (instalment_1, instalment_2) and raw format (deposit_amount_1, etc.)
 */
export function normalizeDepositData(
  data: DepositData | null | undefined,
): {
  instalments: DepositInstalment[]
  numInstalments: number
  instalmentConfig: "single" | "multiple"
} | null {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return null
  }

  const instalments: DepositInstalment[] = []

  // Check for structured format first (instalment_1, instalment_2, instalment_3)
  if (data.instalment_1 || data.instalment_2 || data.instalment_3) {
    for (let i = 1; i <= 3; i++) {
      const instalment = data[`instalment_${i}` as keyof DepositData] as
        | DepositInstalment
        | undefined
      if (instalment && typeof instalment === "object") {
        instalments.push(instalment)
      }
    }
    return {
      instalments,
      numInstalments: instalments.length,
      instalmentConfig: instalments.length > 1 ? "multiple" : "single",
    }
  }

  // Check for single instalment in structured format
  if (
    data.amount !== undefined ||
    data.percentage !== undefined ||
    data.depositDue !== undefined ||
    data.depositDueText !== undefined ||
    data.depositDueWithin !== undefined ||
    data.depositHolding !== undefined
  ) {
    const instalment: DepositInstalment = {}
    if (data.depositType) instalment.depositType = data.depositType
    if (data.amount !== undefined) instalment.amount = data.amount
    if (data.percentage !== undefined) instalment.percentage = data.percentage
    if (data.currency) instalment.currency = data.currency
    if (data.depositDue !== undefined) instalment.depositDue = data.depositDue
    if (data.depositDueText) instalment.depositDueText = data.depositDueText
    if (data.depositDueWithin)
      instalment.depositDueWithin = data.depositDueWithin
    if (data.depositHolding) instalment.depositHolding = data.depositHolding

    if (Object.keys(instalment).length > 0) {
      instalments.push(instalment)
      return {
        instalments,
        numInstalments: 1,
        instalmentConfig: "single",
      }
    }
  }

  // Check for raw form data format (deposit_amount_1, deposit_amount_instalment_1, etc.)
  const hasMultipleInstalments =
    data.deposit_amount_1 !== undefined ||
    data.deposit_amount_2 !== undefined ||
    data.deposit_amount_3 !== undefined ||
    (data as any).deposit_amount_instalment_1 !== undefined ||
    (data as any).deposit_amount_instalment_2 !== undefined ||
    (data as any).deposit_amount_instalment_3 !== undefined ||
    data.deposit_percentage_1 !== undefined ||
    data.deposit_percentage_2 !== undefined ||
    data.deposit_percentage_3 !== undefined ||
    (data as any).deposit_percentage_instalment_1 !== undefined ||
    (data as any).deposit_percentage_instalment_2 !== undefined ||
    (data as any).deposit_percentage_instalment_3 !== undefined ||
    (data as any).deposit_type_instalment_1 ||
    (data as any).deposit_type_instalment_2 ||
    (data as any).deposit_type_instalment_3

  if (hasMultipleInstalments) {
    for (let i = 1; i <= 3; i++) {
      const instalment: DepositInstalment = {}

      // Get deposit type
      const depositType =
        (data as any)[`deposit_type_instalment_${i}`] ||
        (data as any).deposit_type ||
        undefined
      if (depositType) instalment.depositType = depositType

      // Get amount (check multiple field name formats)
      const amount =
        (data as any)[`deposit_amount_instalment_${i}`] ||
        (data as any)[`deposit_amount_${i}`] ||
        (i === 1 ? data.deposit_amount : undefined)
      if (amount !== undefined && amount !== null && amount !== "") {
        instalment.amount =
          typeof amount === "number" ? amount : parseFloat(String(amount))
        if (isNaN(instalment.amount)) delete instalment.amount
      }

      // Get percentage (check multiple field name formats)
      const percentage =
        (data as any)[`deposit_percentage_instalment_${i}`] ||
        (data as any)[`deposit_percentage_${i}`] ||
        (i === 1 ? data.deposit_percentage : undefined)
      if (percentage !== undefined && percentage !== null && percentage !== "") {
        instalment.percentage =
          typeof percentage === "number"
            ? percentage
            : parseFloat(String(percentage))
        if (isNaN(instalment.percentage)) delete instalment.percentage
      }

      // Determine deposit type if not set
      if (!instalment.depositType) {
        if (instalment.amount !== undefined) instalment.depositType = "amount"
        else if (instalment.percentage !== undefined)
          instalment.depositType = "percentage"
      }

      // Get currency (check multiple field name formats)
      const currency =
        (data as any)[`deposit_amount_instalment_${i}_currency`] ||
        (data as any)[`deposit_amount_${i}_currency`] ||
        (data as any)[`deposit_amount_currency_${i}`] ||
        (i === 1
          ? data.deposit_amount_currency || data.deposit_amount_currency_1
          : undefined)
      if (currency) instalment.currency = currency

      // Get due date
      const due =
        (data as any)[`deposit_due_instalment_${i}`] ||
        (data as any)[`deposit_due_${i}`] ||
        (i === 1 ? data.deposit_due : undefined)
      const dueUnit =
        (data as any)[`deposit_due_instalment_${i}_unit`] ||
        (data as any)[`deposit_due_${i}_unit`] ||
        (i === 1 ? data.deposit_due_unit : undefined)
      const dueText =
        (data as any)[`deposit_due_${i}_text`] ||
        (i === 1 ? data.deposit_due_text : undefined)

      if (due !== undefined && due !== null && due !== "") {
        // Check if it's a number (for "within X days" format)
        if (
          typeof due === "number" ||
          (typeof due === "string" && /^\d+$/.test(String(due).trim()))
        ) {
          if (dueUnit) {
            instalment.depositDueWithin = {
              number: typeof due === "number" ? due : parseFloat(String(due)),
              unit: dueUnit.replace(/_/g, " ") as DepositTimeUnit,
            }
          }
        } else {
          instalment.depositDue = due
        }
      }

      if (dueText) {
        instalment.depositDueText = dueText
      }

      // Get holding
      const holding =
        (data as any)[`deposit_holding_instalment_${i}`] ||
        (data as any)[`deposit_holding_${i}`] ||
        (i === 1 ? data.deposit_holding : undefined)
      if (holding) instalment.depositHolding = holding

      // Only add instalment if it has meaningful data
      if (
        instalment.amount !== undefined ||
        instalment.percentage !== undefined ||
        instalment.depositDue !== undefined ||
        instalment.depositDueText !== undefined ||
        instalment.depositDueWithin !== undefined ||
        instalment.depositHolding !== undefined
      ) {
        instalments.push(instalment)
      }
    }

    if (instalments.length > 0) {
      return {
        instalments,
        numInstalments: instalments.length,
        instalmentConfig: instalments.length > 1 ? "multiple" : "single",
      }
    }
  }

  // Check for single instalment in raw format
  if (
    data.deposit_amount !== undefined ||
    data.deposit_percentage !== undefined ||
    data.deposit_due !== undefined ||
    data.deposit_holding !== undefined
  ) {
    const instalment: DepositInstalment = {}

    if (data.deposit_type) instalment.depositType = data.deposit_type
    if (data.deposit_amount !== undefined) {
      instalment.amount =
        typeof data.deposit_amount === "number"
          ? data.deposit_amount
          : parseFloat(String(data.deposit_amount))
      if (!isNaN(instalment.amount) && !instalment.depositType)
        instalment.depositType = "amount"
    }
    if (data.deposit_percentage !== undefined) {
      instalment.percentage =
        typeof data.deposit_percentage === "number"
          ? data.deposit_percentage
          : parseFloat(String(data.deposit_percentage))
      if (!isNaN(instalment.percentage) && !instalment.depositType)
        instalment.depositType = "percentage"
    }
    if (data.deposit_amount_currency) instalment.currency = data.deposit_amount_currency
    if (data.deposit_due !== undefined) {
      if (
        typeof data.deposit_due === "number" ||
        (typeof data.deposit_due === "string" &&
          /^\d+$/.test(String(data.deposit_due).trim()))
      ) {
        if (data.deposit_due_unit) {
          instalment.depositDueWithin = {
            number:
              typeof data.deposit_due === "number"
                ? data.deposit_due
                : parseFloat(String(data.deposit_due)),
            unit: data.deposit_due_unit.replace(/_/g, " ") as DepositTimeUnit,
          }
        }
      } else {
        instalment.depositDue = data.deposit_due
      }
    }
    if (data.deposit_due_text) instalment.depositDueText = data.deposit_due_text
    if (data.deposit_holding) instalment.depositHolding = data.deposit_holding

    if (Object.keys(instalment).length > 0) {
      instalments.push(instalment)
      return {
        instalments,
        numInstalments: 1,
        instalmentConfig: "single",
      }
    }
  }

  return null
}

/**
 * Formats deposit amount for display
 */
export function formatDepositAmount(
  instalment: DepositInstalment,
  defaultCurrency: string = "USD",
): string {
  if (instalment.amount !== undefined) {
    const currency = instalment.currency || defaultCurrency
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(instalment.amount)
  }

  if (instalment.percentage !== undefined) {
    return `${instalment.percentage}% of purchase price`
  }

  return "N/A"
}

/**
 * Formats deposit due date for display
 */
export function formatDepositDue(instalment: DepositInstalment): string {
  // Check for "within X time" format
  if (instalment.depositDueWithin) {
    const { number, unit, trigger, action } = instalment.depositDueWithin
    let formatted = `Within ${number} ${unit.replace(/_/g, " ")}`

    if (action) {
      formatted += ` ${action}`
    }

    if (trigger) {
      const triggerLabels: Record<string, string> = {
        offer_acceptance: "Offer Acceptance",
        contract_signing: "Contract Signing",
        inspection_completion: "Inspection Completion",
        loan_approval: "Loan Approval",
        closing_date: "Closing Date",
      }
      formatted += ` ${triggerLabels[trigger] || trigger}`
    } else {
      formatted += " of Offer Acceptance"
    }

    return formatted
  }

  // Check for text description
  if (instalment.depositDueText) {
    return instalment.depositDueText
  }

  // Check for specific date
  if (instalment.depositDue) {
    if (instalment.depositDue instanceof Date) {
      return instalment.depositDue.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    if (typeof instalment.depositDue === "string") {
      try {
        const date = new Date(instalment.depositDue)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        }
      } catch {
        // Not a valid date string, return as-is
      }
      return instalment.depositDue
    }
  }

  return "N/A"
}

/**
 * Gets a summary of deposit data for reports
 */
export function getDepositSummary(data: DepositData | null | undefined): {
  hasDeposit: boolean
  summary: string
  details: string[]
} {
  const normalized = normalizeDepositData(data)

  if (!normalized || normalized.instalments.length === 0) {
    return {
      hasDeposit: false,
      summary: "No deposit",
      details: [],
    }
  }

  const { instalments, numInstalments } = normalized

  if (numInstalments === 1) {
    const instalment = instalments[0]
    const amount = formatDepositAmount(instalment)
    const due = formatDepositDue(instalment)

    return {
      hasDeposit: true,
      summary: `${amount}${instalment.depositHolding ? ` (Held: ${instalment.depositHolding})` : ""}`,
      details: [
        `Amount: ${amount}`,
        `Due: ${due}`,
        ...(instalment.depositHolding
          ? [`Holding: ${instalment.depositHolding}`]
          : []),
      ],
    }
  }

  // Multiple instalments
  const details: string[] = []
  instalments.forEach((instalment, index) => {
    const amount = formatDepositAmount(instalment)
    const due = formatDepositDue(instalment)
    details.push(
      `Instalment ${index + 1}: ${amount} - Due: ${due}${instalment.depositHolding ? ` (Held: ${instalment.depositHolding})` : ""}`,
    )
  })

  return {
    hasDeposit: true,
    summary: `${numInstalments} instalments`,
    details,
  }
}


