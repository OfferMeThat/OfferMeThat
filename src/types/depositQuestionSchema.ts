/**
 * Comprehensive TypeScript Schema for Deposit Question
 * 
 * This schema describes the complete structure of deposit questions:
 * - Setup Configuration (what sellers configure)
 * - Generated Questions (what buyers see)
 * - Collected Data (what gets saved)
 * 
 * This schema is designed to be:
 * - Self-documenting with clear comments
 * - Type-safe for all variants
 * - Easy to extend and modify
 * - Reusable across the application
 */

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

/**
 * Instalment configuration type
 * Determines how many instalments the deposit can be paid in
 */
export type DepositInstalmentConfig =
  | "single" // Buyer always pays deposit in one instalment
  | "two_always" // Buyer always pays deposit in two instalments
  | "one_or_two" // Buyer can choose 1 or 2 instalments
  | "three_plus" // Buyer can choose 1, 2, or 3 instalments

/**
 * Deposit amount management type
 * Determines how the deposit amount is handled
 */
export type DepositAmountManagement =
  | "buyer_enters" // Buyer enters an amount
  | "buyer_percentage" // Buyer enters a percentage of purchase price
  | "buyer_choice" // Buyer can choose between amount or percentage
  | "fixed_amount" // Deposit is a fixed amount, decided by seller
  | "fixed_percentage" // Deposit is a fixed percentage, decided by seller

/**
 * Currency stipulation type
 * Determines how currency selection is handled
 */
export type CurrencyStipulation =
  | "any" // Let buyer choose any currency
  | "options" // Give buyer 2+ currency options
  | "fixed" // Stipulate a specific currency

/**
 * Deposit due date management type
 * Determines how the deposit due date is handled
 */
export type DepositDueDateManagement =
  | "immediately" // Deposit is paid immediately upon Offer Acceptance
  | "calendar" // Buyer selects a due date with a calendar selector
  | "datetime" // Buyer sets a deadline time and date with clock and calendar selector
  | "buyer_text" // Buyer provides a due date by writing into a text field
  | "seller_text" // Seller sets the due date by writing into a text field (buyers must agree)
  | "within_time" // Within X days of Offer Acceptance (Buyer selects a number)
  | "custom" // Something else (Customize your own)

/**
 * Deposit holding type
 * Determines how deposit holding location is handled
 */
export type DepositHoldingType =
  | "buyer_input" // Yes, let buyer input where deposit will be held
  | "stipulate" // Stipulate where deposit is held (buyers must agree to submit offers)
  | "not_ascertain" // Do not ascertain where deposit is held
  | "no_ascertain" // Alternative name for not_ascertain

/**
 * Deposit type (for buyer_choice scenarios)
 * Whether deposit is an amount or percentage
 */
export type DepositType = "amount" | "percentage"

/**
 * Time unit for "within X time" format
 */
export type DepositTimeUnit =
  | "hours"
  | "days"
  | "business_days"
  | "calendar_days"
  | "weeks"
  | "months"

/**
 * Currency code (ISO 4217 format, e.g., "USD", "EUR", "GBP")
 */
export type CurrencyCode = string

// ============================================================================
// SETUP CONFIGURATION SCHEMA
// ============================================================================

/**
 * Currency field configuration for generated questions
 */
export interface DepositCurrencyField {
  type: "select" | "display" | "multi_select"
  placeholder?: string
  options?: Array<{ value: CurrencyCode; label: string }>
  value?: CurrencyCode // For display type (fixed currency)
}

/**
 * Custom due date configuration
 * Used when deposit_due === "custom"
 */
export interface DepositCustomDueDateConfig {
  timeConstraint?: string[]
  number?: string[]
  timeUnit?: string[]
  action?: string[]
  trigger?: string[]
}

/**
 * Per-instalment setup configuration
 * Used for multi-instalment scenarios (two_always, one_or_two, three_plus)
 */
export interface DepositInstalmentSetupConfig {
  // Deposit amount management for this instalment
  deposit_management?: DepositAmountManagement

  // Fixed amount configuration (if deposit_management === "fixed_amount")
  fixed_deposit_amount?: string | number
  fixed_deposit_currency?: CurrencyCode

  // Fixed percentage configuration (if deposit_management === "fixed_percentage")
  fixed_deposit_percentage?: string | number

  // Currency stipulation (if deposit_management === "buyer_enters" | "buyer_choice")
  currency_stipulation?: CurrencyStipulation

  // Currency options (if currency_stipulation === "options")
  currency_options_1?: CurrencyCode
  currency_options_2?: CurrencyCode

  // Stipulated currency (if currency_stipulation === "fixed")
  stipulated_currency?: CurrencyCode

  // Deposit due date management
  deposit_due?: DepositDueDateManagement

  // Seller-specified due date text (if deposit_due === "seller_text")
  seller_due_date_text?: string

  // Custom due date configuration (if deposit_due === "custom")
  due_date_config?: DepositCustomDueDateConfig

  // Deposit holding
  deposit_holding?: DepositHoldingType

  // Deposit holding details (if deposit_holding === "stipulate")
  deposit_holding_details?: string
}

/**
 * Complete Deposit Setup Configuration
 * This is what gets saved when a seller configures the deposit question
 */
export interface DepositSetupConfig {
  // ========== Instalment Configuration ==========
  /**
   * How many instalments would you like deposits paid in?
   * This is the primary configuration that determines the structure
   */
  instalments: DepositInstalmentConfig

  // ========== Single Instalment Configuration ==========
  /**
   * Deposit amount management for single instalment
   * Only used when instalments === "single" | "one_or_two" | "three_plus"
   */
  deposit_management?: DepositAmountManagement

  /**
   * Fixed deposit amount (if deposit_management === "fixed_amount")
   */
  fixed_deposit_amount?: string | number

  /**
   * Fixed deposit currency (if deposit_management === "fixed_amount")
   */
  fixed_deposit_currency?: CurrencyCode

  /**
   * Fixed deposit percentage (if deposit_management === "fixed_percentage")
   */
  fixed_deposit_percentage?: string | number

  /**
   * Currency stipulation (if deposit_management === "buyer_enters" | "buyer_choice")
   */
  currency_stipulation?: CurrencyStipulation

  /**
   * Currency option 1 (if currency_stipulation === "options")
   */
  currency_options_1?: CurrencyCode

  /**
   * Currency option 2 (if currency_stipulation === "options")
   */
  currency_options_2?: CurrencyCode

  /**
   * Stipulated currency (if currency_stipulation === "fixed")
   */
  stipulated_currency?: CurrencyCode

  /**
   * Deposit due date management for single instalment
   */
  deposit_due?: DepositDueDateManagement

  /**
   * Seller-specified due date text (if deposit_due === "seller_text")
   */
  seller_due_date_text?: string

  /**
   * Custom due date configuration (if deposit_due === "custom")
   */
  due_date_config?: DepositCustomDueDateConfig

  /**
   * Deposit holding for single instalment
   */
  deposit_holding?: DepositHoldingType

  /**
   * Deposit holding details (if deposit_holding === "stipulate")
   */
  deposit_holding_details?: string

  // ========== Instalment-Specific Configuration ==========
  /**
   * Configuration for Instalment 1
   * Used when instalments === "two_always" or for instalment 1 in one_or_two/three_plus
   */
  deposit_management_instalment_1?: DepositAmountManagement
  fixed_deposit_amount_instalment_1?: string | number
  fixed_deposit_currency_instalment_1?: CurrencyCode
  fixed_deposit_percentage_instalment_1?: string | number
  currency_stipulation_instalment_1?: CurrencyStipulation
  currency_options_1_instalment_1?: CurrencyCode
  currency_options_2_instalment_1?: CurrencyCode
  stipulated_currency_instalment_1?: CurrencyCode
  deposit_due_instalment_1?: DepositDueDateManagement
  seller_due_date_text_instalment_1?: string
  deposit_holding_instalment_1?: DepositHoldingType
  deposit_holding_details_instalment_1?: string

  /**
   * Configuration for Instalment 2
   * Used when instalments === "two_always" or for instalment 2 in one_or_two/three_plus
   */
  deposit_management_instalment_2?: DepositAmountManagement
  fixed_deposit_amount_instalment_2?: string | number
  fixed_deposit_currency_instalment_2?: CurrencyCode
  fixed_deposit_percentage_instalment_2?: string | number
  currency_stipulation_instalment_2?: CurrencyStipulation
  currency_options_1_instalment_2?: CurrencyCode
  currency_options_2_instalment_2?: CurrencyCode
  stipulated_currency_instalment_2?: CurrencyCode
  deposit_due_instalment_2?: DepositDueDateManagement
  seller_due_date_text_instalment_2?: string
  deposit_holding_instalment_2?: DepositHoldingType
  deposit_holding_details_instalment_2?: string

  /**
   * Configuration for Instalment 3
   * Used for instalment 3 in three_plus scenarios
   */
  deposit_management_instalment_3?: DepositAmountManagement
  fixed_deposit_amount_instalment_3?: string | number
  fixed_deposit_currency_instalment_3?: CurrencyCode
  fixed_deposit_percentage_instalment_3?: string | number
  currency_stipulation_instalment_3?: CurrencyStipulation
  currency_options_1_instalment_3?: CurrencyCode
  currency_options_2_instalment_3?: CurrencyCode
  stipulated_currency_instalment_3?: CurrencyCode
  deposit_due_instalment_3?: DepositDueDateManagement
  seller_due_date_text_instalment_3?: string
  deposit_holding_instalment_3?: DepositHoldingType
  deposit_holding_details_instalment_3?: string

  // ========== Legacy/Alternative Field Names ==========
  /**
   * Alternative field name for deposit_management
   * Used in some parts of the codebase
   */
  amount_management?: DepositAmountManagement

  /**
   * Alternative field name for instalments
   * Used in some parts of the codebase
   */
  instalments_setup?: DepositInstalmentConfig
}

// ============================================================================
// GENERATED QUESTION SCHEMA
// ============================================================================

/**
 * Base question structure for generated deposit questions
 */
export interface DepositQuestionBase {
  id: string
  question_text: string
  question_type: DepositQuestionType
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

/**
 * Question types that can be generated
 */
export type DepositQuestionType =
  | "text" // Text input field
  | "select" // Dropdown selector
  | "date" // Date picker
  | "datetime" // Date and time picker
  | "calendar" // Alternative date picker
  | "display" // Display-only (read-only value)
  | "custom_due_date" // Custom due date configuration
  | "select_with_text" // Select dropdown with text input (for "within_time")

/**
 * Deposit type question (for buyer_choice scenarios)
 */
export interface DepositTypeQuestion extends DepositQuestionBase {
  id: "deposit_type" | `deposit_type_instalment_${number}`
  question_type: "select"
  options: [
    { value: "amount"; label: "A fixed amount" },
    { value: "percentage"; label: "A percentage of purchase price" },
  ]
  conditional_currency?: DepositCurrencyField
  conditional_suffix?: string // e.g., "% of purchase price"
}

/**
 * Deposit amount question
 */
export interface DepositAmountQuestion extends DepositQuestionBase {
  id:
    | "deposit_amount"
    | `deposit_amount_instalment_${number}`
    | `deposit_amount_${number}`
  question_type: "text" | "display"
  // For text type (buyer enters amount)
  currency_field?: DepositCurrencyField
  suffix?: string // e.g., "% of purchase price"
  // For buyer_choice scenarios
  conditional_currency?: DepositCurrencyField
  conditional_suffix?: string
  // For display type (fixed amount/percentage)
  value?: string // e.g., "1000 USD" or "10% of purchase price"
}

/**
 * Deposit due date question
 */
export interface DepositDueQuestion extends DepositQuestionBase {
  id: "deposit_due" | `deposit_due_instalment_${number}` | `deposit_due_${number}`
  question_type:
    | "display" // For "immediately" or "seller_text"
    | "date" // For "calendar"
    | "datetime" // For "datetime"
    | "text" // For "buyer_text" or "seller_text"
    | "select_with_text" // For "within_time"
    | "custom_due_date" // For "custom"
  // For display type
  value?: string // e.g., "Immediately upon Offer Acceptance"
  // For select_with_text type
  select_options?: Array<{ value: DepositTimeUnit; label: string }>
  suffix?: string // e.g., "of Offer Acceptance"
  // For custom_due_date type
  config?: DepositCustomDueDateConfig
  custom_config?: DepositCustomDueDateConfig
}

/**
 * Deposit holding question
 */
export interface DepositHoldingQuestion extends DepositQuestionBase {
  id:
    | "deposit_holding"
    | `deposit_holding_instalment_${number}`
    | `deposit_holding_${number}`
  question_type: "text" | "display"
  // For display type (stipulated)
  value?: string // Stipulated holding location
}

/**
 * Instalment selector question (for one_or_two and three_plus)
 */
export interface DepositInstalmentsQuestion extends DepositQuestionBase {
  id: "deposit_instalments"
  question_type: "select"
  options: Array<{ value: string; label: string }> // e.g., ["1", "2"] or ["1", "2", "3"]
}

/**
 * Instalment header (display-only separator)
 */
export interface DepositInstalmentHeader extends DepositQuestionBase {
  id: `instalment_${number}_header`
  question_type: "display"
  value: string // e.g., "Instalment 1"
}

/**
 * Union type for all possible deposit questions
 */
export type DepositQuestion =
  | DepositTypeQuestion
  | DepositAmountQuestion
  | DepositDueQuestion
  | DepositHoldingQuestion
  | DepositInstalmentsQuestion
  | DepositInstalmentHeader

/**
 * Array of generated deposit questions
 * This is what gets rendered in the form
 */
export type DepositQuestions = DepositQuestion[]

// ============================================================================
// COLLECTED DATA SCHEMA
// ============================================================================

/**
 * Deposit instalment data (what gets collected from buyers)
 */
export interface DepositInstalmentData {
  // Deposit type (for buyer_choice scenarios)
  depositType?: DepositType

  // Amount information
  amount?: number
  percentage?: number
  currency?: CurrencyCode

  // Due date information
  depositDue?: string | Date
  depositDueText?: string
  depositDueWithin?: {
    number: number
    unit: DepositTimeUnit
    trigger?: string
    action?: string
  }

  // Holding information
  depositHolding?: string
}

/**
 * Complete Deposit Data (what gets saved from form submission)
 * This aligns with the DepositData type in offerData.ts but is more specific
 */
export interface DepositCollectedData {
  // Instalment configuration
  instalments?: DepositInstalmentConfig
  numInstalments?: number
  deposit_instalments?: number | string // Raw form field

  // Single instalment data (when instalments === "single" or numInstalments === 1)
  depositType?: DepositType
  deposit_type?: DepositType // Raw form field
  amount?: number
  percentage?: number
  currency?: CurrencyCode
  depositDue?: string | Date
  depositDueText?: string
  depositDueWithin?: DepositInstalmentData["depositDueWithin"]
  depositHolding?: string

  // Multiple instalments data
  instalment_1?: DepositInstalmentData
  instalment_2?: DepositInstalmentData
  instalment_3?: DepositInstalmentData

  // Legacy/Raw form field names (for backward compatibility)
  deposit_amount?: number | string
  deposit_amount_1?: number | string
  deposit_amount_2?: number | string
  deposit_amount_3?: number | string
  deposit_percentage?: number | string
  deposit_percentage_1?: number | string
  deposit_percentage_2?: number | string
  deposit_percentage_3?: number | string
  deposit_amount_currency?: CurrencyCode
  deposit_amount_1_currency?: CurrencyCode
  deposit_amount_2_currency?: CurrencyCode
  deposit_amount_3_currency?: CurrencyCode
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
  deposit_due_unit?: DepositTimeUnit
  deposit_due_1_unit?: DepositTimeUnit
  deposit_due_2_unit?: DepositTimeUnit
  deposit_due_3_unit?: DepositTimeUnit
  deposit_holding_1?: string
  deposit_holding_2?: string
  deposit_holding_3?: string
  deposit_holding_instalment_1?: string
  deposit_holding_instalment_2?: string
  deposit_holding_instalment_3?: string
}

// ============================================================================
// HELPER TYPES & UTILITIES
// ============================================================================

/**
 * Helper type to get instalment-specific setup config
 */
export type DepositInstalmentSetupConfigForInstalment<
  T extends DepositSetupConfig,
  N extends 1 | 2 | 3,
> = {
  deposit_management: T[`deposit_management_instalment_${N}`] extends
    DepositAmountManagement
    ? T[`deposit_management_instalment_${N}`]
    : T["deposit_management"]
  fixed_deposit_amount: T[`fixed_deposit_amount_instalment_${N}`] extends
    string | number
    ? T[`fixed_deposit_amount_instalment_${N}`]
    : T["fixed_deposit_amount"]
  fixed_deposit_currency: T[`fixed_deposit_currency_instalment_${N}`] extends
    CurrencyCode
    ? T[`fixed_deposit_currency_instalment_${N}`]
    : T["fixed_deposit_currency"]
  fixed_deposit_percentage: T[`fixed_deposit_percentage_instalment_${N}`] extends
    string | number
    ? T[`fixed_deposit_percentage_instalment_${N}`]
    : T["fixed_deposit_percentage"]
  currency_stipulation: T[`currency_stipulation_instalment_${N}`] extends
    CurrencyStipulation
    ? T[`currency_stipulation_instalment_${N}`]
    : T["currency_stipulation"]
  deposit_due: T[`deposit_due_instalment_${N}`] extends DepositDueDateManagement
    ? T[`deposit_due_instalment_${N}`]
    : T["deposit_due"]
  deposit_holding: T[`deposit_holding_instalment_${N}`] extends
    DepositHoldingType
    ? T[`deposit_holding_instalment_${N}`]
    : T["deposit_holding"]
}

/**
 * Type guard to check if setup config is for multi-instalment
 */
export function isMultiInstalmentConfig(
  config: DepositSetupConfig,
): config is DepositSetupConfig & {
  instalments: "two_always" | "one_or_two" | "three_plus"
} {
  return (
    config.instalments === "two_always" ||
    config.instalments === "one_or_two" ||
    config.instalments === "three_plus"
  )
}

/**
 * Type guard to check if setup config requires instalment selector
 */
export function requiresInstalmentSelector(
  config: DepositSetupConfig,
): config is DepositSetupConfig & {
  instalments: "one_or_two" | "three_plus"
} {
  return (
    config.instalments === "one_or_two" || config.instalments === "three_plus"
  )
}

/**
 * Type guard to check if deposit management allows buyer choice
 */
export function allowsBuyerChoice(
  management: DepositAmountManagement,
): management is "buyer_choice" {
  return management === "buyer_choice"
}

/**
 * Type guard to check if deposit management is fixed
 */
export function isFixedDeposit(
  management: DepositAmountManagement,
): management is "fixed_amount" | "fixed_percentage" {
  return management === "fixed_amount" || management === "fixed_percentage"
}

/**
 * Type guard to check if deposit holding is configured
 */
export function isDepositHoldingConfigured(
  holding: DepositHoldingType | undefined,
): holding is "buyer_input" | "stipulate" {
  return holding === "buyer_input" || holding === "stipulate"
}

