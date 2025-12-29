/**
 * Comprehensive TypeScript Schema for "Subject to Loan Approval" Question
 * 
 * This schema defines the structure for:
 * 1. Setup Configuration - How the question is configured in the form builder
 * 2. Generated Questions - The UI structure generated from setup
 * 3. Collected Data - The data structure when a user fills out the form
 * 
 * This ensures type safety and consistency across:
 * - Form builder setup/edit
 * - Form preview
 * - Actual form submission
 * - Data validation
 * - Data storage/retrieval
 */

// ==================== Setup Configuration ====================

/**
 * Loan amount type configuration
 * Determines how the loan amount is collected
 */
export type LoanAmountType =
  | "fixed_amount" // Buyer must enter a fixed amount
  | "percentage" // Buyer must enter a percentage of purchase price
  | "amount_or_percentage" // Buyer can choose between amount or percentage
  | "no_amount" // Don't collect loan amount

/**
 * Lender details requirement
 * Determines if and how lender details are collected
 */
export type LenderDetailsRequirement =
  | "required" // Lender details must be provided
  | "optional" // Lender details are optional, buyer can say "I don't know yet"
  | "not_required" // Don't collect lender details

/**
 * Attachments requirement
 * Determines if and how pre-approval documents are collected
 */
export type AttachmentsRequirement =
  | "required" // 1 or more attachments are required
  | "optional" // Attachments are optional
  | "not_required" // Don't ask for attachments

/**
 * Loan approval due date management
 * Determines how the loan approval due date is handled
 */
export type LoanApprovalDueDateManagement =
  | "no_due_date" // Buyers don't need to provide a Due Date
  | "calendar" // Buyer selects Due Date using calendar selector
  | "datetime" // Buyer sets deadline time and date
  | "buyer_text" // Buyer provides due date by writing text field
  | "seller_text" // Seller sets due date by writing text field (buyers must agree)
  | "within_time" // Within X days of Offer Acceptance
  | "custom" // Something Else (Create your Own)

/**
 * Finance communications preference
 * Determines how finance-related communications are handled
 */
export type FinanceCommunications =
  | "referral_partner" // Send leads to Finance Referral Partner
  | "self_manage" // Send leads to seller, seller manages them
  | "no_thanks" // Don't send finance communications

/**
 * Evidence of funds requirement
 * Determines if and how evidence of funds is collected (when NOT subject to loan)
 */
export type EvidenceOfFundsRequirement =
  | "required" // An attachment must be provided
  | "optional" // Attachment is optional
  | "not_required" // Don't ask for evidence of funds

/**
 * Setup configuration for Subject to Loan Approval question
 * This is stored in question.setupConfig
 */
export interface SubjectToLoanApprovalSetupConfig {
  /**
   * How to collect loan amount
   * @default "no_amount"
   */
  loan_amount_type?: LoanAmountType

  /**
   * Whether to collect lender details
   * @default "not_required"
   */
  lender_details?: LenderDetailsRequirement

  /**
   * Whether to collect pre-approval documents/attachments
   * @default "not_required"
   */
  attachments?: AttachmentsRequirement

  /**
   * How to manage loan approval due date
   * @default "no_due_date"
   */
  loan_approval_due?: LoanApprovalDueDateManagement

  /**
   * Finance approval due date text (only when loan_approval_due === "seller_text")
   * Example: "Within 30 business days of Offer Acceptance"
   */
  finance_approval_due_date?: string

  /**
   * Finance communications preference
   * @default "no_thanks"
   */
  finance_communications?: FinanceCommunications

  /**
   * Email of lead recipient (only when finance_communications === "referral_partner")
   */
  lead_recipient_email?: string

  /**
   * Whether to collect evidence of funds when NOT subject to loan
   * @default "not_required"
   */
  evidence_of_funds?: EvidenceOfFundsRequirement
}

// ==================== Collected Data - When Subject to Loan (Yes) ====================

/**
 * Loan amount type selection (when loan_amount_type === "amount_or_percentage")
 */
export type LoanAmountTypeSelection = "amount" | "percentage"

/**
 * Lender details data
 * Collected when lender_details !== "not_required"
 */
export interface LenderDetailsData {
  /**
   * Company name
   * Can be empty if unknownLender is true
   */
  companyName?: string

  /**
   * Whether buyer doesn't know lender details yet
   * When true, companyName, contactName, contactPhone, contactEmail are not required
   */
  unknownLender?: boolean

  /**
   * Contact name (only shown/collected if unknownLender is false)
   */
  contactName?: string

  /**
   * Contact phone (only shown/collected if unknownLender is false)
   */
  contactPhone?: string

  /**
   * Contact email (only shown/collected if unknownLender is false)
   */
  contactEmail?: string
}

/**
 * Loan approval due date data
 * Structure depends on loan_approval_due setting
 */
export interface LoanApprovalDueDateData {
  /**
   * Due date as string (for buyer_text, seller_text, or custom)
   */
  loanDueDate?: string

  /**
   * Due date as Date object (for calendar, datetime)
   */
  loanDueDateTime?: string | Date

  /**
   * Due date text (for seller_text - this is the seller-specified text)
   */
  loanDueText?: string

  /**
   * Due date "within X time" format (for within_time)
   */
  loanDueWithin?: {
    number: number
    unit: "business_days" | "days"
  }
}

/**
 * Data collected when subjectToLoan === "yes"
 */
export interface SubjectToLoanData {
  /**
   * Loan amount type selection (only if loan_amount_type === "amount_or_percentage")
   */
  loanAmountType?: LoanAmountTypeSelection

  /**
   * Loan amount (when loanAmountType === "amount" or loan_amount_type === "fixed_amount")
   * Can be number or string (string during form filling, number after processing)
   */
  loanAmount?: number | string

  /**
   * Loan percentage (when loanAmountType === "percentage" or loan_amount_type === "percentage")
   * Can be number or string (string during form filling, number after processing)
   */
  loanPercentage?: number | string

  /**
   * Lender details (only if lender_details !== "not_required")
   */
  lenderDetails?: LenderDetailsData

  /**
   * Supporting documents/pre-approval attachments (only if attachments !== "not_required")
   * File objects during form filling, URL strings after upload
   */
  supportingDocs?: File[] | string[]

  /**
   * Loan approval due date information (only if loan_approval_due !== "no_due_date")
   */
  loanApprovalDue?: LoanApprovalDueDateData

  /**
   * Finance specialist communication preference (only if finance_communications is set)
   * "yes" or "no"
   */
  financeSpecialist?: "yes" | "no"
}

// ==================== Collected Data - When NOT Subject to Loan (No) ====================

/**
 * Data collected when subjectToLoan === "no"
 */
export interface NotSubjectToLoanData {
  /**
   * Evidence of funds attachments (only if evidence_of_funds !== "not_required")
   * File objects during form filling, URL strings after upload
   */
  evidenceOfFunds?: File[] | string[]
}

// ==================== Collected Data - Main Union ====================

/**
 * Complete collected data structure for Subject to Loan Approval question
 * 
 * This is the value stored in formData[questionId] when the form is submitted.
 * 
 * The structure depends on the subjectToLoan value:
 * - If "yes": SubjectToLoanData fields are present
 * - If "no": NotSubjectToLoanData fields are present
 */
export interface SubjectToLoanApprovalCollectedData {
  /**
   * Whether the offer is subject to loan approval
   * This is the main question answer
   */
  subjectToLoan: "yes" | "no"

  /**
   * Data when subjectToLoan === "yes"
   */
  loanData?: SubjectToLoanData

  /**
   * Data when subjectToLoan === "no"
   */
  evidenceData?: NotSubjectToLoanData

  // Legacy field names for backward compatibility
  /**
   * @deprecated Use loanData.loanAmount instead
   */
  loanAmount?: number | string

  /**
   * @deprecated Use loanData.loanPercentage instead
   */
  loanPercentage?: number | string

  /**
   * @deprecated Use loanData.loanAmountType instead
   */
  loanAmountType?: LoanAmountTypeSelection

  /**
   * @deprecated Use loanData.lenderDetails.companyName instead
   */
  companyName?: string

  /**
   * @deprecated Use loanData.lenderDetails.unknownLender instead
   */
  unknownLender?: boolean

  /**
   * @deprecated Use loanData.lenderDetails.contactName instead
   */
  contactName?: string

  /**
   * @deprecated Use loanData.lenderDetails.contactPhone instead
   */
  contactPhone?: string

  /**
   * @deprecated Use loanData.lenderDetails.contactEmail instead
   */
  contactEmail?: string

  /**
   * @deprecated Use loanData.supportingDocs instead
   */
  supportingDocs?: File[] | string[]

  /**
   * @deprecated Use loanData.loanApprovalDue instead
   */
  loanDueDate?: string | Date

  /**
   * @deprecated Use loanData.financeSpecialist instead
   */
  financeSpecialist?: "yes" | "no"

  /**
   * @deprecated Use evidenceData.evidenceOfFunds instead
   */
  evidenceOfFunds?: File[] | string[]
}

// ==================== Type Guards ====================

/**
 * Type guard to check if subject to loan
 */
export function isSubjectToLoan(
  data: SubjectToLoanApprovalCollectedData
): data is SubjectToLoanApprovalCollectedData & {
  subjectToLoan: "yes"
  loanData: SubjectToLoanData
} {
  return data.subjectToLoan === "yes"
}

/**
 * Type guard to check if NOT subject to loan
 */
export function isNotSubjectToLoan(
  data: SubjectToLoanApprovalCollectedData
): data is SubjectToLoanApprovalCollectedData & {
  subjectToLoan: "no"
  evidenceData: NotSubjectToLoanData
} {
  return data.subjectToLoan === "no"
}

/**
 * Check if loan amount is required
 */
export function isLoanAmountRequired(
  setupConfig: SubjectToLoanApprovalSetupConfig
): boolean {
  return (
    setupConfig.loan_amount_type !== undefined &&
    setupConfig.loan_amount_type !== "no_amount"
  )
}

/**
 * Check if lender details are required
 */
export function isLenderDetailsRequired(
  setupConfig: SubjectToLoanApprovalSetupConfig,
  questionRequired: boolean,
  fieldLevelRequired?: boolean
): boolean {
  // Field-level required takes precedence
  if (fieldLevelRequired !== undefined) {
    return fieldLevelRequired
  }

  // Fall back to setup config
  return (
    setupConfig.lender_details === "required" ||
    (setupConfig.lender_details === "optional" && questionRequired)
  )
}

/**
 * Check if attachments are required
 */
export function isAttachmentsRequired(
  setupConfig: SubjectToLoanApprovalSetupConfig,
  questionRequired: boolean,
  fieldLevelRequired?: boolean
): boolean {
  // Field-level required takes precedence
  if (fieldLevelRequired !== undefined) {
    return fieldLevelRequired
  }

  // Fall back to setup config
  return (
    setupConfig.attachments === "required" ||
    (setupConfig.attachments === "optional" && questionRequired)
  )
}

/**
 * Check if evidence of funds is required
 */
export function isEvidenceOfFundsRequired(
  setupConfig: SubjectToLoanApprovalSetupConfig,
  questionRequired: boolean,
  fieldLevelRequired?: boolean
): boolean {
  // Field-level required takes precedence
  if (fieldLevelRequired !== undefined) {
    return fieldLevelRequired
  }

  // Fall back to setup config
  return (
    setupConfig.evidence_of_funds === "required" ||
    (setupConfig.evidence_of_funds === "optional" && questionRequired)
  )
}

/**
 * Check if loan approval due date is required
 */
export function isLoanApprovalDueRequired(
  setupConfig: SubjectToLoanApprovalSetupConfig
): boolean {
  return (
    setupConfig.loan_approval_due !== undefined &&
    setupConfig.loan_approval_due !== "no_due_date"
  )
}

/**
 * Check if buyer can choose between amount and percentage
 */
export function allowsLoanAmountChoice(
  setupConfig: SubjectToLoanApprovalSetupConfig
): boolean {
  return setupConfig.loan_amount_type === "amount_or_percentage"
}

/**
 * Check if buyer can say "I don't know yet" for lender details
 */
export function allowsUnknownLender(
  setupConfig: SubjectToLoanApprovalSetupConfig
): boolean {
  return setupConfig.lender_details === "optional"
}

// ==================== Helper Functions ====================

/**
 * Get the data field name for a given field type
 * Used for consistent field naming in validation and data collection
 */
export function getDataFieldName(
  fieldType:
    | "loanAmount"
    | "loanPercentage"
    | "loanAmountType"
    | "companyName"
    | "contactName"
    | "contactPhone"
    | "contactEmail"
    | "supportingDocs"
    | "loanDueDate"
    | "financeSpecialist"
    | "evidenceOfFunds"
): string {
  return fieldType
}

/**
 * Check if lender details are complete
 */
export function isLenderDetailsComplete(
  lenderDetails?: LenderDetailsData,
  setupConfig?: SubjectToLoanApprovalSetupConfig
): boolean {
  if (!lenderDetails || !setupConfig) return false

  // If unknownLender is true, details are considered "complete" (user has indicated they don't know)
  if (lenderDetails.unknownLender) {
    return true
  }

  // If lender_details is required, all fields must be filled
  if (setupConfig.lender_details === "required") {
    return !!(
      lenderDetails.companyName?.trim() &&
      lenderDetails.contactName?.trim() &&
      lenderDetails.contactPhone?.trim() &&
      lenderDetails.contactEmail?.trim()
    )
  }

  // If optional, at least company name should be provided
  return !!lenderDetails.companyName?.trim()
}

