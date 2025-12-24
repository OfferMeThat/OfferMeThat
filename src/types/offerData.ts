/**
 * TypeScript schemas for offer additional data structures
 * These types represent the data collected from offer forms
 */

// ==================== Purchaser Data ====================

/**
 * @deprecated Use NameOfPurchaserCollectedData from nameOfPurchaserQuestionSchema.ts instead
 * This type is kept for backward compatibility
 */
export interface SingleFieldPurchaser {
  method: "single_field"
  name: string
  idFileUrl?: string
}

/**
 * @deprecated Use IndividualNamesPurchaserDataVariant from nameOfPurchaserQuestionSchema.ts instead
 * This type is kept for backward compatibility
 */
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

/**
 * @deprecated Use NameOfPurchaserCollectedData from nameOfPurchaserQuestionSchema.ts instead
 * This type is kept for backward compatibility
 */
export type PurchaserData = SingleFieldPurchaser | IndividualNamesPurchaser

// Re-export new schema types for convenience
export type {
  NameOfPurchaserSetupConfig,
  NameOfPurchaserCollectedData,
  SingleFieldPurchaserData,
  IndividualNamesPurchaserDataVariant,
  IndividualNamesPurchaserData,
  SinglePersonPurchaserData,
  MultiplePeoplePurchaserData,
  CorporationPurchaserData,
  OtherPurchaserData,
  PersonNameData,
  PurchaserScenario,
  PurchaserType,
  NameCollectionMethod,
  CollectMiddleNames,
  CollectIdentification,
} from "./questions/nameOfPurchaser"

// ==================== Deposit Data ====================

/**
 * Time unit for "within X days" format
 */
export type DepositTimeUnit =
  | "business_days"
  | "calendar_days"
  | "days"
  | "weeks"
  | "months"
  | "hours"

/**
 * Deposit type (amount or percentage)
 */
export type DepositType = "amount" | "percentage"

/**
 * Instalment configuration type
 */
export type InstalmentConfig = "single" | "two_always" | "one_or_two" | "three_plus"

/**
 * Deposit due date information
 * Can be a specific date, text description, or "within X time" format
 */
export interface DepositDueInfo {
  // Specific date/time
  depositDue?: string | Date

  // Seller-specified text description
  depositDueText?: string

  // "Within X time" format
  depositDueWithin?: {
    number: number
    unit: DepositTimeUnit
    // Optional trigger event (e.g., "offer_acceptance", "contract_signing")
    trigger?: string
    // Optional action word (e.g., "of", "from", "after")
    action?: string
  }
}

/**
 * Single deposit instalment data
 * Represents one instalment of a deposit payment
 */
export interface DepositInstalment {
  // Deposit type (for buyer_choice scenario)
  depositType?: DepositType

  // Amount information
  amount?: number
  percentage?: number
  currency?: string

  // Due date information
  depositDue?: string | Date
  depositDueText?: string
  depositDueWithin?: {
    number: number
    unit: DepositTimeUnit
    trigger?: string
    action?: string
  }

  // Holding information (where deposit will be held)
  depositHolding?: string
}

/**
 * Comprehensive Deposit Data Schema
 * Handles all variants: single instalment, multiple instalments, and legacy formats
 */
export interface DepositData {
  // ========== Instalment Configuration ==========
  /**
   * Type of instalment configuration
   * - "single": One deposit payment
   * - "two_always": Always two instalments
   * - "one_or_two": Buyer chooses 1 or 2 instalments
   * - "three_plus": Three or more instalments
   */
  instalments?: InstalmentConfig
  numInstalments?: number

  // ========== Single Instalment Data (when instalments === "single" or numInstalments === 1) ==========
  /**
   * Deposit type for single instalment (when buyer_choice is enabled)
   */
  depositType?: DepositType

  /**
   * Amount for single instalment
   */
  amount?: number

  /**
   * Percentage for single instalment (percentage of purchase price)
   */
  percentage?: number

  /**
   * Currency code for single instalment (e.g., "USD", "EUR")
   */
  currency?: string

  /**
   * Due date for single instalment
   */
  depositDue?: string | Date

  /**
   * Due date text for single instalment (seller-specified)
   */
  depositDueText?: string

  /**
   * Due date "within X time" format for single instalment
   */
  depositDueWithin?: {
    number: number
    unit: DepositTimeUnit
    trigger?: string
    action?: string
  }

  /**
   * Holding information for single instalment
   */
  depositHolding?: string

  // ========== Multiple Instalments Data (when numInstalments > 1) ==========
  /**
   * First instalment data
   */
  instalment_1?: DepositInstalment

  /**
   * Second instalment data
   */
  instalment_2?: DepositInstalment

  /**
   * Third instalment data
   */
  instalment_3?: DepositInstalment

  // ========== Legacy/Raw Format Support ==========
  /**
   * Legacy field names for backward compatibility
   * These may exist in older data or raw form submissions
   */
  deposit_amount?: number | string
  deposit_amount_1?: number | string
  deposit_amount_2?: number | string
  deposit_amount_3?: number | string
  deposit_percentage?: number | string
  deposit_percentage_1?: number | string
  deposit_percentage_2?: number | string
  deposit_percentage_3?: number | string
  deposit_amount_currency?: string
  deposit_amount_1_currency?: string
  deposit_amount_2_currency?: string
  deposit_amount_3_currency?: string
  deposit_amount_currency_1?: string
  deposit_amount_currency_2?: string
  deposit_amount_currency_3?: string
  deposit_type?: DepositType
  deposit_type_instalment_1?: DepositType
  deposit_type_instalment_2?: DepositType
  deposit_type_instalment_3?: DepositType
  deposit_due?: string | Date | number
  deposit_due_1?: string | Date | number
  deposit_due_2?: string | Date | number
  deposit_due_3?: string | Date | number
  deposit_due_instalment_1?: string | Date | number
  deposit_due_instalment_2?: string | Date | number
  deposit_due_instalment_3?: string | Date | number
  deposit_due_text?: string
  deposit_due_1_text?: string
  deposit_due_2_text?: string
  deposit_due_3_text?: string
  deposit_due_unit?: string
  deposit_due_1_unit?: string
  deposit_due_2_unit?: string
  deposit_due_3_unit?: string
  deposit_due_instalment_1_unit?: string
  deposit_due_instalment_2_unit?: string
  deposit_due_instalment_3_unit?: string
  deposit_holding?: string
  deposit_holding_1?: string
  deposit_holding_2?: string
  deposit_holding_3?: string
  deposit_holding_instalment_1?: string
  deposit_holding_instalment_2?: string
  deposit_holding_instalment_3?: string
  deposit_instalments?: number | string

  // ========== Additional Fields ==========
  /**
   * Allow additional fields for flexibility
   */
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

/**
 * @deprecated Use SubjectToLoanApprovalCollectedData from subjectToLoanApproval.ts instead
 * This type is kept for backward compatibility
 */
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

// Re-export new schema types for convenience
export type {
  SubjectToLoanApprovalSetupConfig,
  SubjectToLoanApprovalCollectedData,
  SubjectToLoanData,
  NotSubjectToLoanData,
  LenderDetailsData,
  LoanApprovalDueDateData,
  LoanAmountType,
  LenderDetailsRequirement,
  AttachmentsRequirement,
  LoanApprovalDueDateManagement,
  FinanceCommunications,
  EvidenceOfFundsRequirement,
  LoanAmountTypeSelection,
} from "./questions/subjectToLoanApproval"
