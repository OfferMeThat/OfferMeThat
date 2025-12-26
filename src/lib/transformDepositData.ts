import { DepositData } from "@/types/offerData"

/**
 * Transforms raw deposit form data into structured deposit data format
 * Handles both single and multiple instalments
 */
export function transformDepositFormData(
  formData: Record<string, any>,
): DepositData | null {
  if (!formData || Object.keys(formData).length === 0) {
    return null
  }

  const depositData: DepositData = {}

  // Get instalments configuration
  const instalmentsValue = formData.deposit_instalments
  const numInstalments =
    typeof instalmentsValue === "string"
      ? parseInt(instalmentsValue, 10)
      : typeof instalmentsValue === "number"
        ? instalmentsValue
        : null

  // Helper to parse amount/percentage
  const parseAmount = (value: any): number | undefined => {
    if (value === null || value === undefined || value === "") return undefined
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = parseFloat(value.trim())
      return isNaN(parsed) ? undefined : parsed
    }
    return undefined
  }

  // Helper to parse date
  const parseDate = (value: any): string | Date | undefined => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === "string") {
      if (value.trim() === "") return undefined
      return value
    }
    return undefined
  }

  // Helper to build instalment data
  const buildInstalmentData = (instalmentNum: number): any => {
    const instalment: any = {}

    // Get deposit type for this instalment
    // For instalment 1: check deposit_type_instalment_1 first (for one_or_two/three_plus), then deposit_type (for single)
    // For instalment 2+: check deposit_type_instalment_X
    const depositTypeKey1 =
      instalmentNum === 1
        ? "deposit_type_instalment_1"
        : `deposit_type_instalment_${instalmentNum}`
    const depositTypeKey2 = instalmentNum === 1 ? "deposit_type" : undefined
    const depositType =
      formData[depositTypeKey1] ||
      (depositTypeKey2 ? formData[depositTypeKey2] : undefined)

    // Get amount/percentage - check which key exists in formData
    // For instalment 1: check deposit_amount (for one_or_two/three_plus) or deposit_amount_instalment_1 (for two_always)
    // For instalment 2+: check deposit_amount_instalment_X
    const amountKey1 =
      instalmentNum === 1
        ? "deposit_amount"
        : `deposit_amount_instalment_${instalmentNum}`
    const amountKey2 =
      instalmentNum === 1 ? "deposit_amount_instalment_1" : undefined
    const amountKey3 = instalmentNum === 1 ? "deposit_amount_1" : undefined
    const amountKey =
      formData[amountKey1] !== undefined
        ? amountKey1
        : amountKey2 && formData[amountKey2] !== undefined
          ? amountKey2
          : amountKey3 && formData[amountKey3] !== undefined
            ? amountKey3
            : amountKey1

    const percentageKey1 =
      instalmentNum === 1
        ? "deposit_percentage"
        : `deposit_percentage_instalment_${instalmentNum}`
    const percentageKey2 =
      instalmentNum === 1 ? "deposit_percentage_instalment_1" : undefined
    const percentageKey3 =
      instalmentNum === 1 ? "deposit_percentage_1" : undefined
    const percentageKey =
      formData[percentageKey1] !== undefined
        ? percentageKey1
        : percentageKey2 && formData[percentageKey2] !== undefined
          ? percentageKey2
          : percentageKey3 && formData[percentageKey3] !== undefined
            ? percentageKey3
            : percentageKey1

    const amount = parseAmount(formData[amountKey])
    const percentage = parseAmount(formData[percentageKey])

    // Set deposit type
    if (depositType) {
      instalment.depositType = depositType
    } else if (amount !== undefined) {
      instalment.depositType = "amount"
    } else if (percentage !== undefined) {
      instalment.depositType = "percentage"
    }

    // Set amount or percentage
    if (amount !== undefined) {
      instalment.amount = amount
    }
    if (percentage !== undefined) {
      instalment.percentage = percentage
    }

    // Get currency - check which key exists in formData
    // Currency can be attached to either amount or percentage fields depending on deposit type
    // For amount: deposit_amount_currency, deposit_amount_instalment_X_currency, etc.
    // For percentage: deposit_percentage_currency, deposit_percentage_instalment_X_currency, etc.
    let currency: string | undefined

    // Check amount currency fields first
    const amountCurrencyKey1 =
      instalmentNum === 1
        ? "deposit_amount_currency"
        : `deposit_amount_instalment_${instalmentNum}_currency`
    const amountCurrencyKey2 =
      instalmentNum === 1 ? "deposit_amount_instalment_1_currency" : undefined
    const amountCurrencyKey3 =
      instalmentNum === 1 ? "deposit_amount_1_currency" : undefined
    const amountCurrencyKey4 =
      instalmentNum === 1
        ? "deposit_amount_currency_1"
        : `deposit_amount_currency_${instalmentNum}`

    currency = formData[amountCurrencyKey1]
    if (!currency && amountCurrencyKey2) {
      currency = formData[amountCurrencyKey2]
    }
    if (!currency && amountCurrencyKey3) {
      currency = formData[amountCurrencyKey3]
    }
    if (!currency) {
      currency = formData[amountCurrencyKey4]
    }

    // If not found in amount fields, check percentage currency fields
    if (!currency) {
      const percentageCurrencyKey1 =
        instalmentNum === 1
          ? "deposit_percentage_currency"
          : `deposit_percentage_instalment_${instalmentNum}_currency`
      const percentageCurrencyKey2 =
        instalmentNum === 1
          ? "deposit_percentage_instalment_1_currency"
          : undefined
      const percentageCurrencyKey3 =
        instalmentNum === 1 ? "deposit_percentage_1_currency" : undefined

      currency = formData[percentageCurrencyKey1]
      if (!currency && percentageCurrencyKey2) {
        currency = formData[percentageCurrencyKey2]
      }
      if (!currency && percentageCurrencyKey3) {
        currency = formData[percentageCurrencyKey3]
      }
    }

    if (currency) {
      instalment.currency = currency
    }

    // Get due date - check which key exists in formData
    // For instalment 1, check: deposit_due, deposit_due_1, deposit_due_instalment_1
    // For other instalments, check: deposit_due_${instalmentNum}, deposit_due_instalment_${instalmentNum}
    // But skip if it's a number (that would be for "within X days" format)
    const dueKeys =
      instalmentNum === 1
        ? ["deposit_due", "deposit_due_1", "deposit_due_instalment_1"]
        : [
            `deposit_due_${instalmentNum}`,
            `deposit_due_instalment_${instalmentNum}`,
          ]

    let due: string | Date | undefined
    for (const key of dueKeys) {
      const value = formData[key]
      if (value !== undefined) {
        // Check if it's a number (for "within X days" format) - skip it, it will be handled by depositDueWithin
        if (
          typeof value === "number" ||
          (typeof value === "string" && /^\d+$/.test(value.trim()))
        ) {
          continue
        }
        due = parseDate(value)
        if (due) {
          instalment.depositDue = due
          break
        }
      }
    }

    // Get due date text (for seller-specified text) - check which key exists
    const dueTextKey1 =
      instalmentNum === 1
        ? "deposit_due_text"
        : `deposit_due_${instalmentNum}_text`
    const dueTextKey2 = instalmentNum === 1 ? "deposit_due_1_text" : undefined
    const dueTextKey =
      formData[dueTextKey1] !== undefined
        ? dueTextKey1
        : dueTextKey2 && formData[dueTextKey2] !== undefined
          ? dueTextKey2
          : dueTextKey1
    const dueText = formData[dueTextKey]
    if (dueText) {
      instalment.depositDueText = dueText
    }

    // Get due date within (for "within X days" format) - check which key exists
    // For instalment 1, check: deposit_due, deposit_due_1, deposit_due_instalment_1
    // For other instalments, check: deposit_due_${instalmentNum}, deposit_due_instalment_${instalmentNum}
    const dueWithinNumberKeys =
      instalmentNum === 1
        ? ["deposit_due", "deposit_due_1", "deposit_due_instalment_1"]
        : [
            `deposit_due_${instalmentNum}`,
            `deposit_due_instalment_${instalmentNum}`,
          ]

    const dueWithinUnitKeys =
      instalmentNum === 1
        ? [
            "deposit_due_unit",
            "deposit_due_1_unit",
            "deposit_due_instalment_1_unit",
          ]
        : [
            `deposit_due_${instalmentNum}_unit`,
            `deposit_due_instalment_${instalmentNum}_unit`,
          ]

    let dueWithinNumber: number | undefined
    let dueWithinUnit: string | undefined

    // Find the number key that exists
    for (const key of dueWithinNumberKeys) {
      if (formData[key] !== undefined) {
        dueWithinNumber = parseAmount(formData[key])
        break
      }
    }

    // Find the unit key that exists
    for (const key of dueWithinUnitKeys) {
      if (formData[key] !== undefined) {
        dueWithinUnit = formData[key]
        break
      }
    }

    if (dueWithinNumber !== undefined && dueWithinUnit) {
      instalment.depositDueWithin = {
        number: dueWithinNumber,
        unit: dueWithinUnit.replace(/_/g, " ") as any,
      }
      // Clear depositDue if we have depositDueWithin
      delete instalment.depositDue
    }

    // Get holding - check which key exists
    const holdingKey1 =
      instalmentNum === 1
        ? "deposit_holding"
        : `deposit_holding_${instalmentNum}`
    const holdingKey2 = instalmentNum === 1 ? "deposit_holding_1" : undefined
    const holdingKey =
      formData[holdingKey1] !== undefined
        ? holdingKey1
        : holdingKey2 && formData[holdingKey2] !== undefined
          ? holdingKey2
          : holdingKey1
    const holding = formData[holdingKey]
    if (holding) {
      instalment.depositHolding = holding
    }

    return Object.keys(instalment).length > 0 ? instalment : null
  }

  // Handle single instalment
  if (!numInstalments || numInstalments === 1) {
    const instalment = buildInstalmentData(1)
    if (instalment) {
      Object.assign(depositData, instalment)
      depositData.instalments = "single"
      depositData.numInstalments = 1
    }
  }
  // Handle multiple instalments
  else if (numInstalments > 1) {
    depositData.instalments = numInstalments === 2 ? "two_always" : "three_plus"
    depositData.numInstalments = numInstalments

    // Build instalment data for each instalment
    for (let i = 1; i <= Math.min(numInstalments, 3); i++) {
      const instalment = buildInstalmentData(i)
      if (instalment) {
        depositData[`instalment_${i}` as keyof DepositData] = instalment as any
      }
    }
  }

  // Preserve any additional fields from formData
  Object.keys(formData).forEach((key) => {
    if (
      !key.startsWith("deposit_") &&
      !key.startsWith("instalment_") &&
      !depositData.hasOwnProperty(key)
    ) {
      depositData[key] = formData[key]
    }
  })

  return Object.keys(depositData).length > 0 ? depositData : null
}
