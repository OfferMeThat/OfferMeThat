/**
 * Universal UI Configuration Schema for Offer Form Questions
 *
 * This type defines the standard structure for all question uiConfig objects.
 * It includes base fields that all questions use, plus optional fields for
 * complex questions that have sub-questions or multiple fields.
 */

/**
 * Base UI configuration that all questions have
 */
export interface BaseQuestionUIConfig {
  /** Main question label/text */
  label: string

  /** Main placeholder text (if applicable) */
  placeholder?: string

  /** Optional description text */
  description?: string
}

/**
 * Sub-question configuration for complex questions
 * Used by questions like Deposit, Loan Approval, Settlement Date, etc.
 */
export interface SubQuestionConfig {
  /** Label for the sub-question */
  label?: string

  /** Placeholder for the sub-question */
  placeholder?: string

  /** Whether this sub-question/field is required (independent of question-level required) */
  required?: boolean
}

/**
 * Sub-questions map - key is the sub-question ID (e.g., "deposit_amount", "deposit_due")
 */
export type SubQuestionsMap = Record<string, SubQuestionConfig>

/**
 * Extended UI configuration for questions with sub-questions
 * Used by: deposit, subjectToLoanApproval, settlementDate, etc.
 */
export interface ComplexQuestionUIConfig extends BaseQuestionUIConfig {
  /** Map of sub-question IDs to their labels and placeholders */
  subQuestions?: SubQuestionsMap
}

/**
 * UI configuration for name-related questions (nameOfPurchaser)
 */
export interface NameQuestionUIConfig extends BaseQuestionUIConfig {
  /** Label for first name field */
  firstNameLabel?: string

  /** Placeholder for first name field */
  firstNamePlaceholder?: string

  /** Label for middle name field */
  middleNameLabel?: string

  /** Placeholder for middle name field */
  middleNamePlaceholder?: string

  /** Label for last name field */
  lastNameLabel?: string

  /** Placeholder for last name field */
  lastNamePlaceholder?: string
}

/**
 * UI configuration for loan approval questions
 */
export interface LoanApprovalUIConfig extends ComplexQuestionUIConfig {
  /** Label for loan approval question */
  loanApprovalQuestionLabel?: string

  /** Label for loan amount field */
  loanAmountLabel?: string

  /** Placeholder for loan amount field */
  loanAmountPlaceholder?: string

  /** Label for company name field */
  companyNameLabel?: string

  /** Placeholder for company name field */
  companyNamePlaceholder?: string

  /** Label for contact name field */
  contactNameLabel?: string

  /** Placeholder for contact name field */
  contactNamePlaceholder?: string

  /** Label for contact phone field */
  contactPhoneLabel?: string

  /** Placeholder for contact phone field */
  contactPhonePlaceholder?: string

  /** Label for contact email field */
  contactEmailLabel?: string

  /** Placeholder for contact email field */
  contactEmailPlaceholder?: string
}

/**
 * UI configuration for settlement date questions
 */
export interface SettlementDateUIConfig extends ComplexQuestionUIConfig {
  /** Label for settlement location field */
  settlementLocationLabel?: string

  /** Placeholder for settlement location field */
  locationPlaceholder?: string

  /** Placeholder for days field */
  daysPlaceholder?: string
}

/**
 * UI configuration for special conditions questions
 */
export interface SpecialConditionsUIConfig extends BaseQuestionUIConfig {
  /** Label for custom condition field */
  customConditionLabel?: string

  /** Placeholder for custom condition field */
  customConditionPlaceholder?: string
}

/**
 * UI configuration for statement questions (custom questions with statement type)
 */
export interface StatementQuestionUIConfig extends BaseQuestionUIConfig {
  /** Text for the statement */
  statementText?: string

  /** Text for the tickbox/agreement checkbox */
  tickboxText?: string
}

/**
 * UI configuration for amount/number questions
 */
export interface AmountQuestionUIConfig extends BaseQuestionUIConfig {
  /** Placeholder for amount field */
  amountPlaceholder?: string

  /** Placeholder for currency field */
  currencyPlaceholder?: string

  /** Placeholder for phone number field */
  phonePlaceholder?: string

  /** Placeholder for percentage field */
  percentagePlaceholder?: string

  /** Placeholder for number field */
  numberPlaceholder?: string
}

/**
 * UI configuration for date/time questions
 */
export interface DateTimeQuestionUIConfig extends BaseQuestionUIConfig {
  /** Label for date field */
  dateLabel?: string

  /** Label for time field */
  timeLabel?: string
}

/**
 * Universal Question UI Config
 * This is the main type that should be used for all questions.
 * It includes all possible fields, but most questions will only use a subset.
 * The index signature allows for additional fields that might be added dynamically.
 */
export type QuestionUIConfig = BaseQuestionUIConfig &
  Partial<ComplexQuestionUIConfig> &
  Partial<NameQuestionUIConfig> &
  Partial<LoanApprovalUIConfig> &
  Partial<SettlementDateUIConfig> &
  Partial<SpecialConditionsUIConfig> &
  Partial<StatementQuestionUIConfig> &
  Partial<AmountQuestionUIConfig> &
  Partial<DateTimeQuestionUIConfig> & {
    // Index signature to allow any additional fields
    [key: string]: any
  }

/**
 * Helper function to safely parse uiConfig from JSON
 */
export function parseUIConfig(uiConfig: unknown): QuestionUIConfig {
  if (!uiConfig || typeof uiConfig !== "object") {
    return { label: "" }
  }

  return uiConfig as QuestionUIConfig
}

/**
 * Helper function to get a sub-question label
 * Checks subQuestions first, then direct properties on uiConfig (for backward compatibility), then fallback
 */
export function getSubQuestionLabel(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
  fallback: string,
): string {
  // First check subQuestions
  if (uiConfig.subQuestions?.[subQuestionId]?.label) {
    return uiConfig.subQuestions[subQuestionId].label!
  }

  // Then check direct properties on uiConfig (for backward compatibility)
  // This handles cases like firstNameLabel, lastNameLabel, etc.
  if (uiConfig[subQuestionId] && typeof uiConfig[subQuestionId] === "string") {
    return uiConfig[subQuestionId] as string
  }

  // Finally, use fallback
  return fallback
}

/**
 * Helper function to get a sub-question placeholder
 * Checks subQuestions first, then direct properties on uiConfig (for backward compatibility), then fallback
 */
export function getSubQuestionPlaceholder(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
  fallback: string,
): string {
  // First check subQuestions
  if (uiConfig.subQuestions?.[subQuestionId]?.placeholder) {
    return uiConfig.subQuestions[subQuestionId].placeholder!
  }

  // Then check direct properties on uiConfig (for backward compatibility)
  // This handles cases like firstNamePlaceholder, lastNamePlaceholder, etc.
  if (uiConfig[subQuestionId] && typeof uiConfig[subQuestionId] === "string") {
    return uiConfig[subQuestionId] as string
  }

  // Finally, use fallback
  return fallback
}

/**
 * Helper function to update a sub-question label
 */
export function updateSubQuestionLabel(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
  label: string,
): QuestionUIConfig {
  return {
    ...uiConfig,
    subQuestions: {
      ...(uiConfig.subQuestions || {}),
      [subQuestionId]: {
        ...(uiConfig.subQuestions?.[subQuestionId] || {}),
        label,
      },
    },
  }
}

/**
 * Helper function to update a sub-question placeholder
 */
export function updateSubQuestionPlaceholder(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
  placeholder: string,
): QuestionUIConfig {
  return {
    ...uiConfig,
    subQuestions: {
      ...(uiConfig.subQuestions || {}),
      [subQuestionId]: {
        ...(uiConfig.subQuestions?.[subQuestionId] || {}),
        placeholder,
      },
    },
  }
}

/**
 * Helper function to get a sub-question's required status
 * Checks uiConfig.subQuestions first, then returns undefined if not set
 */
export function getSubQuestionRequired(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
): boolean | undefined {
  return uiConfig.subQuestions?.[subQuestionId]?.required
}

/**
 * Helper function to update a sub-question's required status
 */
export function updateSubQuestionRequired(
  uiConfig: QuestionUIConfig,
  subQuestionId: string,
  required: boolean,
): QuestionUIConfig {
  return {
    ...uiConfig,
    subQuestions: {
      ...(uiConfig.subQuestions || {}),
      [subQuestionId]: {
        ...(uiConfig.subQuestions?.[subQuestionId] || {}),
        required,
      },
    },
  }
}
