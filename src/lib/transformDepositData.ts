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
    const depositTypeKey =
      instalmentNum === 1
        ? formData.deposit_type || formData.deposit_type_instalment_1
        : `deposit_type_instalment_${instalmentNum}`
    const depositType = formData[depositTypeKey]

    // Get amount/percentage
    const amountKey =
      instalmentNum === 1
        ? formData.deposit_amount || formData.deposit_amount_1
        : `deposit_amount_${instalmentNum}`
    const percentageKey =
      instalmentNum === 1
        ? formData.deposit_percentage || formData.deposit_percentage_1
        : `deposit_percentage_${instalmentNum}`

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

    // Get currency
    const currencyKey =
      instalmentNum === 1
        ? formData.deposit_amount_currency ||
          formData.deposit_amount_1_currency ||
          formData.deposit_amount_currency_1
        : `deposit_amount_${instalmentNum}_currency` ||
          `deposit_amount_currency_${instalmentNum}`
    const currency = formData[currencyKey]
    if (currency) {
      instalment.currency = currency
    }

    // Get due date
    const dueKey =
      instalmentNum === 1
        ? formData.deposit_due || formData.deposit_due_1
        : `deposit_due_${instalmentNum}`
    const due = parseDate(formData[dueKey])
    if (due) {
      instalment.depositDue = due
    }

    // Get due date text (for seller-specified text)
    const dueTextKey =
      instalmentNum === 1
        ? formData.deposit_due_text || formData.deposit_due_1_text
        : `deposit_due_${instalmentNum}_text`
    const dueText = formData[dueTextKey]
    if (dueText) {
      instalment.depositDueText = dueText
    }

    // Get due date within (for "within X days" format)
    const dueWithinNumberKey =
      instalmentNum === 1
        ? formData.deposit_due || formData.deposit_due_1
        : `deposit_due_${instalmentNum}`
    const dueWithinUnitKey =
      instalmentNum === 1
        ? formData.deposit_due_unit || formData.deposit_due_1_unit
        : `deposit_due_${instalmentNum}_unit`

    const dueWithinNumber = parseAmount(formData[dueWithinNumberKey])
    const dueWithinUnit = formData[dueWithinUnitKey]

    if (dueWithinNumber !== undefined && dueWithinUnit) {
      instalment.depositDueWithin = {
        number: dueWithinNumber,
        unit: dueWithinUnit.replace(/_/g, " ") as any,
      }
    }

    // Get holding
    const holdingKey =
      instalmentNum === 1
        ? formData.deposit_holding || formData.deposit_holding_1
        : `deposit_holding_${instalmentNum}`
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
    depositData.instalments =
      numInstalments === 2 ? "two_always" : "three_plus"
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

