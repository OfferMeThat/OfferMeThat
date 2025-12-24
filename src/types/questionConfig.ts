import { QuestionType } from "./form"
import type { NameOfPurchaserSetupConfig as NameOfPurchaserSetupConfigSchema } from "./questions/nameOfPurchaser"

/**
 * Reusable type structures for question setup and configuration
 */

// Base UI Config that all questions have
export interface BaseUIConfig {
  label?: string
  placeholder?: string
  description?: string
}

// Setup Config Types for different question types
/**
 * Setup configuration for Name of Purchaser question
 * Uses the comprehensive schema from nameOfPurchaserQuestionSchema.ts
 * All fields are optional here to allow partial updates during setup
 */
export type NameOfPurchaserSetupConfig = Partial<NameOfPurchaserSetupConfigSchema>

export interface AttachPurchaseAgreementSetupConfig {
  contract_requirement?: "required" | "optional"
}

export interface OfferExpirySetupConfig {
  expiry_requirement?: "required" | "optional"
}

export interface DepositSetupConfig {
  instalments?: "single" | "two_always" | "one_or_two" | "three_plus"
  amount_management?: "buyer_enters" | "buyer_percentage" | "buyer_choice" | "fixed_amount" | "fixed_percentage"
  fixed_amount_value?: string | number
  fixed_amount_currency?: string
  fixed_percentage_value?: string | number
  currency_stipulation?: "any" | "options" | "fixed"
  currency_options?: string
  currency_fixed?: string
  due_date_type?: "immediately" | "calendar" | "datetime" | "buyer_text" | "seller_text" | "within_time" | "custom"
  due_date_seller_text?: string
  deposit_holding?: "buyer_input" | "stipulate" | "not_ascertain"
  holding_details?: string
  // Instalment 1 fields
  inst1_amount_management?: string
  inst1_fixed_amount_value?: string | number
  inst1_fixed_amount_currency?: string
  inst1_fixed_percentage_value?: string | number
  inst1_currency_stipulation?: string
  inst1_currency_options?: string
  inst1_currency_fixed?: string
  inst1_due_date_type?: string
  inst1_due_date_seller_text?: string
  inst1_deposit_holding?: string
  inst1_holding_details?: string
  // Instalment 2 fields
  inst2_amount_management?: string
  inst2_fixed_amount_value?: string | number
  inst2_fixed_amount_currency?: string
  inst2_fixed_percentage_value?: string | number
  inst2_currency_stipulation?: string
  inst2_currency_options?: string
  inst2_currency_fixed?: string
  inst2_due_date_type?: string
  inst2_due_date_seller_text?: string
  inst2_deposit_holding?: string
  inst2_holding_details?: string
}

/**
 * Setup configuration for Subject to Loan Approval question
 * Uses the comprehensive schema from subjectToLoanApproval.ts
 * All fields are optional here to allow partial updates during setup
 */
export type SubjectToLoanApprovalSetupConfig = import("./questions/subjectToLoanApproval").SubjectToLoanApprovalSetupConfig

export interface SpecialConditionsSetupConfig {
  allow_custom_conditions?: "yes" | "no"
  conditions?: Array<{
    name: string
    details?: string
  }>
}

export interface SettlementDateSetupConfig {
  settlement_date_type?: "calendar" | "datetime" | "buyer_text" | "seller_text" | "within_days" | "CYO"
  settlement_date_text?: string
  settlement_location?: "not_required" | "buyer_text" | "seller_text"
  settlement_location_text?: string
}

export interface MessageToAgentSetupConfig {
  allow_attachments?: "yes" | "no"
}

export interface CustomQuestionSetupConfig {
  answer_type?: "short_text" | "long_text" | "number_amount" | "file_upload" | "time_date" | "yes_no" | "single_select" | "multi_select" | "statement"
  number_type?: "money" | "phone" | "percentage"
  currency_stipulation?: "any" | "options" | "fixed"
  currency_options?: string
  currency_fixed?: string
  time_date_type?: "time" | "date" | "datetime"
  allow_unsure?: "yes" | "no"
  select_options?: string
  add_tickbox?: "yes" | "no"
  tickbox_requirement?: "optional" | "essential"
  tickbox_text?: string
  question_text?: string
}

// Union type for all setup configs
export type QuestionSetupConfig =
  | NameOfPurchaserSetupConfig
  | AttachPurchaseAgreementSetupConfig
  | OfferExpirySetupConfig
  | DepositSetupConfig
  | SubjectToLoanApprovalSetupConfig
  | SpecialConditionsSetupConfig
  | SettlementDateSetupConfig
  | MessageToAgentSetupConfig
  | CustomQuestionSetupConfig
  | Record<string, any> // Fallback for other question types

// Extended UI Config types for specific questions
export interface DepositUIConfig extends BaseUIConfig {
  // Generated UI fields for deposit
  [key: string]: any
}

export interface SubjectToLoanApprovalUIConfig extends BaseUIConfig {
  // Generated UI fields for loan approval
  [key: string]: any
}

// Union type for all UI configs
export type QuestionUIConfig = BaseUIConfig | DepositUIConfig | SubjectToLoanApprovalUIConfig | Record<string, any>

// Full question data type
export interface QuestionData {
  id: string
  type: QuestionType
  order: number
  required: boolean
  setupConfig: QuestionSetupConfig
  uiConfig: QuestionUIConfig
  formId: string
  pageId: string | null
  createdAt: string
}

// Props for setup forms
export interface QuestionSetupFormProps {
  questionType: QuestionType
  initialSetupConfig?: QuestionSetupConfig
  initialUIConfig?: QuestionUIConfig
  onComplete: (setupConfig: QuestionSetupConfig, uiConfig?: QuestionUIConfig) => void
  onCancel: () => void
  hideButtons?: boolean
}

