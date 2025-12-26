/**
 * Comprehensive TypeScript Schema for Special Conditions Question
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
 * Whether custom conditions are allowed
 * Determines if buyers can add their own custom conditions
 */
export type AllowCustomConditions = "yes" | "no"

/**
 * Setup attachment file structure
 * Files uploaded by form builder for SUBMITTERS to review
 */
export interface SetupAttachment {
  /**
   * Public URL of the uploaded file
   */
  url: string

  /**
   * Original filename
   */
  fileName: string

  /**
   * File size in bytes (optional)
   */
  fileSize?: number

  /**
   * Upload timestamp (optional)
   */
  uploadedAt?: string
}

/**
 * Condition definition in setup configuration
 * Each predefined condition that can be selected by SUBMITTERS
 */
export interface ConditionDefinition {
  /**
   * Condition name/identifier
   * Example: "Subject to Building Inspection"
   */
  name: string

  /**
   * Additional details or description (optional)
   * Example: "Buyer must complete inspection within 14 days"
   */
  details?: string

  /**
   * Setup attachments for this condition
   * Reference documents that submitters can review (read-only)
   * Uploaded by form builder, stored in "special-conditions" bucket
   */
  attachments?: SetupAttachment[]
}

/**
 * Setup configuration for Special Conditions question
 * This is stored in question.setupConfig
 */
export interface SpecialConditionsSetupConfig {
  /**
   * Whether to allow custom conditions
   * @default "no"
   */
  allow_custom_conditions?: AllowCustomConditions

  /**
   * Array of predefined conditions
   * Maximum 15 conditions allowed
   */
  conditions?: ConditionDefinition[]
}

// ==================== Collected Data ====================

/**
 * Collected data structure when SUBMITTER fills out the form
 * This is stored in offer.specialConditions
 */
export interface SpecialConditionsCollectedData {
  /**
   * Array of selected condition indices
   * Each number corresponds to the index in setupConfig.conditions array
   * Example: [0, 2] means conditions at index 0 and 2 were selected
   */
  selectedConditions?: number[]

  /**
   * Custom condition text (only if allow_custom_conditions === "yes")
   * SUBMITTER-provided custom condition description
   */
  customCondition?: string

  /**
   * Attachment URLs for predefined conditions
   * Key is condition index, value is array of uploaded file URLs
   * Note: SUBMITTERS cannot upload attachments for predefined conditions
   * Only setup attachments (from setupConfig) are visible as reference documents
   */
  conditionAttachmentUrls?: Record<number, string[]>

  /**
   * Attachment URLs for custom condition
   * Files uploaded by SUBMITTERS for their custom condition
   * These files are shown in offer pages/reports
   */
  customConditionAttachmentUrls?: string[]
}

// ==================== UI Configuration ====================

/**
 * UI Configuration for Special Conditions question
 * Customizable labels and placeholders
 */
export interface SpecialConditionsUIConfig {
  /**
   * Main question label
   * @default "Special Conditions"
   */
  label?: string

  /**
   * Custom condition label
   * @default "Add Custom Condition"
   */
  customConditionLabel?: string

  /**
   * Custom condition placeholder
   * @default "Type your custom condition here..."
   */
  customConditionPlaceholder?: string

  /**
   * Sub-questions configuration for field-level required/optional settings
   */
  subQuestions?: {
    /**
     * Custom condition field required/optional
     */
    customCondition?: {
      required?: boolean
    }

    /**
     * Custom condition attachments required/optional
     */
    customConditionAttachments?: {
      required?: boolean
    }
  }
}

// ==================== Helper Types ====================

/**
 * Special Conditions value type (union of collected data and legacy string format)
 * Supports backward compatibility with legacy string-based storage
 */
export type SpecialConditionsValue =
  | SpecialConditionsCollectedData
  | string // Legacy format for backward compatibility

/**
 * Validation helper type
 */
export interface SpecialConditionsValidationResult {
  isValid: boolean
  errors?: string[]
}

// ==================== Constants ====================

/**
 * Maximum number of predefined conditions allowed
 */
export const MAX_CONDITIONS = 15

/**
 * Maximum number of files for setup attachments per condition
 */
export const MAX_SETUP_ATTACHMENTS_PER_CONDITION = 10

/**
 * Maximum total size for setup attachments per condition (50MB)
 */
export const MAX_SETUP_ATTACHMENT_SIZE = 50 * 1024 * 1024

/**
 * Maximum number of files for custom condition attachments
 */
export const MAX_CUSTOM_CONDITION_ATTACHMENTS = 10

/**
 * Maximum total size for custom condition attachments (50MB)
 */
export const MAX_CUSTOM_CONDITION_ATTACHMENT_SIZE = 50 * 1024 * 1024

/**
 * Accepted file types for attachments
 */
export const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".txt",
]

/**
 * Storage bucket name for setup attachments
 */
export const SETUP_ATTACHMENTS_BUCKET = "special-conditions"

/**
 * Storage bucket name for custom condition attachments (submitted by SUBMITTERS)
 */
export const CUSTOM_CONDITION_ATTACHMENTS_BUCKET = "offer-documents"

