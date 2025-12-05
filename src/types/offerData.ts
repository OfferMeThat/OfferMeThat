/**
 * TypeScript schemas for offer additional data structures
 * These types represent the data collected from offer forms
 */

// ==================== Purchaser Data ====================

export interface SingleFieldPurchaser {
  method: "single_field"
  name: string
  idFileUrl?: string
}

export interface IndividualNamesPurchaser {
  method: "individual_names"
  scenario: string
  numPurchasers?: number
  numRepresentatives?: number
  purchaserTypes?: Record<number, string>
  nameFields: Record<
    string,
    {
      firstName: string
      middleName?: string
      lastName: string
    }
  >
  idFileUrls?: Record<string, string>
}

export type PurchaserData = SingleFieldPurchaser | IndividualNamesPurchaser

// ==================== Deposit Data ====================

export interface DepositInstalment {
  // Amount information
  depositType?: "amount" | "percentage" // For buyer_choice scenario
  amount?: number
  percentage?: number
  currency?: string

  // Due date information
  depositDue?: string | Date
  depositDueText?: string // For seller-specified text
  depositDueWithin?: {
    number: number
    unit: "business_days" | "days"
  }

  // Holding information
  depositHolding?: string
}

export interface DepositData {
  // Instalment configuration
  instalments?: "single" | "two_always" | "one_or_two" | "three_plus"
  numInstalments?: number

  // Single instalment data
  depositType?: "amount" | "percentage"
  amount?: number
  percentage?: number
  currency?: string
  depositDue?: string | Date
  depositDueText?: string
  depositDueWithin?: {
    number: number
    unit: "business_days" | "days"
  }
  depositHolding?: string

  // Multiple instalments data (indexed by instalment number)
  instalment_1?: DepositInstalment
  instalment_2?: DepositInstalment
  instalment_3?: DepositInstalment

  // Additional fields that might be present
  [key: string]: any
}

// ==================== Settlement Date Data ====================

export interface SettlementDateData {
  // Date/time information
  settlementDate?: string | Date
  settlementTime?: string
  settlementDateTime?: string | Date
  settlementDateText?: string // For buyer/seller-specified text
  settlementDateWithin?: {
    number: number
    unit: "business_days" | "days"
  }

  // Location information
  settlementLocation?: string
  settlementLocationText?: string

  // Additional custom fields
  [key: string]: any
}

// ==================== Message to Agent ====================

export interface MessageToAgentData {
  message?: string
  text?: string // Alternative field name
  attachmentUrl?: string // Single attachment
  attachmentUrls?: string[] // Multiple attachments
  attachments?: string[] // Alternative field name
}

// ==================== Subject to Loan Approval ====================

export interface SubjectToLoanApprovalData {
  // Whether subject to loan approval
  subjectToLoanApproval?: "yes" | "no" | boolean

  // Loan amount information
  loanAmount?: number
  loanPercentage?: number
  loanAmountType?: "amount" | "percentage"

  // Lender information
  lenderName?: string
  lenderDetails?: string
  lenderUnknown?: boolean

  // Due date information
  loanDueDate?: string | Date
  loanDueDateTime?: string | Date
  loanDueText?: string
  loanDueWithin?: {
    number: number
    unit: "business_days" | "days"
  }

  // Supporting documentation
  supportingDocUrl?: string // Single document
  supportingDocUrls?: string[] // Multiple documents
  preApprovalDocuments?: string[]

  // Evidence of funds (if NOT subject to loan)
  evidenceOfFundsUrl?: string
  evidenceOfFundsUrls?: string[]

  // Additional fields
  [key: string]: any
}
