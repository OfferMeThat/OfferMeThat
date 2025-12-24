/**
 * Comprehensive TypeScript Schema for "Name of Purchaser" Question
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
 * Collection method for purchaser names
 * - "single_field": One freeform text field for all purchasers
 * - "individual_names": Collect each purchaser's name individually with structured fields
 */
export type NameCollectionMethod = "single_field" | "individual_names"

/**
 * Whether to collect middle names (only for individual_names method)
 */
export type CollectMiddleNames = "yes" | "no"

/**
 * Whether to collect identification documents
 * - "mandatory": ID upload is required
 * - "optional": ID upload is optional
 * - "no": Don't collect ID
 */
export type CollectIdentification = "mandatory" | "optional" | "no"

/**
 * Setup configuration for Name of Purchaser question
 * This is stored in question.setupConfig
 */
export interface NameOfPurchaserSetupConfig {
  /**
   * How to collect purchaser names
   * @default "single_field"
   */
  collection_method: NameCollectionMethod

  /**
   * Whether to collect middle names
   * Only applicable when collection_method === "individual_names"
   * @default "no"
   */
  collect_middle_names?: CollectMiddleNames

  /**
   * Whether to collect identification documents
   * Applies to both collection methods
   * @default "no"
   */
  collect_identification: CollectIdentification
}

// ==================== Individual Names Scenarios ====================

/**
 * Scenario type for individual names collection
 * - "single": 1 Person is Buying
 * - "multiple": 2 or more People are Buying
 * - "corporation": A Corporation is Buying
 * - "other": Mixed scenario (persons and/or corporations)
 */
export type PurchaserScenario = "single" | "multiple" | "corporation" | "other"

/**
 * Purchaser type in "other" scenario
 * - "person": Individual person
 * - "corporation": Corporation entity
 */
export type PurchaserType = "person" | "corporation"

// ==================== Name Field Structure ====================

/**
 * Individual name field data
 * Used for each person's name in individual_names method
 */
export interface PersonNameData {
  /**
   * First name (required when ID is mandatory or question is required)
   */
  firstName: string

  /**
   * Middle name (optional, only collected if collect_middle_names === "yes")
   */
  middleName?: string

  /**
   * Last name (required when ID is mandatory or question is required)
   */
  lastName: string

  /**
   * Whether middle name was skipped (only when collect_middle_names === "yes")
   */
  skipMiddleName?: boolean
}

/**
 * Prefix patterns for nameFields and idFiles in different scenarios:
 * 
 * Scenario "single":
 *   - nameFields["single"]
 *   - idFiles["single"]
 * 
 * Scenario "multiple":
 *   - nameFields["purchaser-1"], nameFields["purchaser-2"], etc.
 *   - idFiles["purchaser-1"], idFiles["purchaser-2"], etc.
 * 
 * Scenario "corporation":
 *   - nameFields["rep-1"], nameFields["rep-2"], etc. (representatives)
 *   - idFiles["rep-1"], idFiles["rep-2"], etc.
 * 
 * Scenario "other":
 *   - For persons: nameFields["other-person-1"], nameFields["other-person-2"], etc.
 *   - For corporations: nameFields["other-corp-1-rep"], nameFields["other-corp-2-rep"], etc.
 *   - idFiles follow the same pattern
 */
export type NameFieldPrefix = 
  | "single"
  | `purchaser-${number}`
  | `rep-${number}`
  | `other-person-${number}`
  | `other-corp-${number}-rep`

// ==================== Collected Data - Single Field ====================

/**
 * Single field collection data
 * Used when collection_method === "single_field"
 * 
 * Can be:
 * 1. A simple string (just the name)
 * 2. An object with name and optional ID file
 */
export type SingleFieldPurchaserData = 
  | string
  | {
      /**
       * Purchaser name(s) as freeform text
       */
      name: string
      
      /**
       * ID file (only if collect_identification !== "no")
       * File object during form filling, URL string after upload
       */
      idFile?: File | string
    }

// ==================== Collected Data - Individual Names ====================

/**
 * Base structure for individual names collection
 * Used when collection_method === "individual_names"
 */
export interface IndividualNamesPurchaserData {
  /**
   * Selected scenario
   */
  scenario: PurchaserScenario

  /**
   * Name fields for all persons
   * Key is the prefix (e.g., "single", "purchaser-1", "rep-1", "other-person-1")
   * Value is the person's name data
   */
  nameFields: Record<string, PersonNameData>

  /**
   * ID files for all persons (only if collect_identification !== "no")
   * Key matches the prefix from nameFields
   * Value is File object during form filling, URL string after upload
   */
  idFiles?: Record<string, File | string>
}

/**
 * Individual names data for "single" scenario
 * 1 Person is Buying
 */
export interface SinglePersonPurchaserData extends IndividualNamesPurchaserData {
  scenario: "single"
  // No additional fields - nameFields["single"] contains the person's name
}

/**
 * Individual names data for "multiple" scenario
 * 2 or more People are Buying
 */
export interface MultiplePeoplePurchaserData extends IndividualNamesPurchaserData {
  scenario: "multiple"
  
  /**
   * Number of purchasers (2-10)
   */
  numPurchasers: number
  
  // nameFields["purchaser-1"], nameFields["purchaser-2"], etc.
  // idFiles["purchaser-1"], idFiles["purchaser-2"], etc.
}

/**
 * Individual names data for "corporation" scenario
 * A Corporation is Buying
 */
export interface CorporationPurchaserData extends IndividualNamesPurchaserData {
  scenario: "corporation"
  
  /**
   * Corporation name
   */
  corporationName: string
  
  /**
   * Number of representatives (1+)
   */
  numRepresentatives: number
  
  // nameFields["rep-1"], nameFields["rep-2"], etc. (representatives)
  // idFiles["rep-1"], idFiles["rep-2"], etc.
}

/**
 * Individual names data for "other" scenario
 * Mixed scenario with persons and/or corporations
 */
export interface OtherPurchaserData extends IndividualNamesPurchaserData {
  scenario: "other"
  
  /**
   * Number of purchasers (1+)
   */
  numPurchasers: number
  
  /**
   * Type of each purchaser (by index)
   * Key is the purchaser number (1, 2, 3, etc.)
   * Value is "person" or "corporation"
   */
  purchaserTypes: Record<number, PurchaserType>
  
  /**
   * Corporation names (for corporations in this scenario)
   * Key format: "corporationName_${num}" where num is the purchaser number
   * Only present for purchasers where purchaserTypes[num] === "corporation"
   */
  [corporationNameKey: `corporationName_${number}`]: string
  
  // For persons:
  //   nameFields["other-person-1"], nameFields["other-person-2"], etc.
  //   idFiles["other-person-1"], idFiles["other-person-2"], etc.
  // 
  // For corporations:
  //   nameFields["other-corp-1-rep"], nameFields["other-corp-2-rep"], etc. (representatives)
  //   idFiles["other-corp-1-rep"], idFiles["other-corp-2-rep"], etc.
}

/**
 * Union type for all individual names data variants
 */
export type IndividualNamesPurchaserDataVariant =
  | SinglePersonPurchaserData
  | MultiplePeoplePurchaserData
  | CorporationPurchaserData
  | OtherPurchaserData

// ==================== Collected Data - Main Union ====================

/**
 * Complete collected data structure for Name of Purchaser question
 * 
 * This is the value stored in formData[questionId] when the form is submitted.
 * 
 * The structure depends on collection_method:
 * - If "single_field": SingleFieldPurchaserData
 * - If "individual_names": IndividualNamesPurchaserDataVariant
 */
export type NameOfPurchaserCollectedData =
  | SingleFieldPurchaserData
  | IndividualNamesPurchaserDataVariant

// ==================== Type Guards ====================

/**
 * Type guard to check if data is single field format
 */
export function isSingleFieldPurchaserData(
  data: any,
  setupConfig: NameOfPurchaserSetupConfig
): data is SingleFieldPurchaserData {
  return setupConfig.collection_method === "single_field"
}

/**
 * Type guard to check if data is individual names format
 */
export function isIndividualNamesPurchaserData(
  data: any,
  setupConfig: NameOfPurchaserSetupConfig
): data is IndividualNamesPurchaserDataVariant {
  return (
    setupConfig.collection_method === "individual_names" &&
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    "scenario" in data &&
    "nameFields" in data
  )
}

/**
 * Type guard to check scenario type
 */
export function isSinglePersonScenario(
  data: IndividualNamesPurchaserData
): data is SinglePersonPurchaserData {
  return data.scenario === "single"
}

export function isMultiplePeopleScenario(
  data: IndividualNamesPurchaserData
): data is MultiplePeoplePurchaserData {
  return data.scenario === "multiple"
}

export function isCorporationScenario(
  data: IndividualNamesPurchaserData
): data is CorporationPurchaserData {
  return data.scenario === "corporation"
}

export function isOtherScenario(
  data: IndividualNamesPurchaserData
): data is OtherPurchaserData {
  return data.scenario === "other"
}

// ==================== Helper Functions ====================

/**
 * Get all name field prefixes for a given scenario
 */
export function getNameFieldPrefixes(
  data: IndividualNamesPurchaserDataVariant
): string[] {
  switch (data.scenario) {
    case "single":
      return ["single"]
    
    case "multiple":
      return Array.from(
        { length: data.numPurchasers },
        (_, i) => `purchaser-${i + 1}`
      )
    
    case "corporation":
      return Array.from(
        { length: data.numRepresentatives },
        (_, i) => `rep-${i + 1}`
      )
    
    case "other":
      const prefixes: string[] = []
      for (let i = 1; i <= data.numPurchasers; i++) {
        const type = data.purchaserTypes[i]
        if (type === "person") {
          prefixes.push(`other-person-${i}`)
        } else if (type === "corporation") {
          prefixes.push(`other-corp-${i}-rep`)
        }
      }
      return prefixes
    
    default:
      return []
  }
}

/**
 * Check if ID collection is required based on setup config and field-level settings
 */
export function isIdRequired(
  setupConfig: NameOfPurchaserSetupConfig,
  questionRequired: boolean,
  fieldLevelRequired?: boolean
): boolean {
  // Field-level required takes precedence
  if (fieldLevelRequired !== undefined) {
    return fieldLevelRequired
  }
  
  // Fall back to setup config
  return setupConfig.collect_identification === "mandatory" && questionRequired
}

/**
 * Check if middle names should be collected
 */
export function shouldCollectMiddleNames(
  setupConfig: NameOfPurchaserSetupConfig
): boolean {
  return (
    setupConfig.collection_method === "individual_names" &&
    setupConfig.collect_middle_names === "yes"
  )
}

/**
 * Get the data field name for a given prefix and field type
 * Used for consistent field naming in validation and data collection
 */
export function getDataFieldName(
  prefix: string,
  fieldType: "firstName" | "lastName" | "middleName" | "idFile"
): string {
  return `${prefix}_${fieldType}`
}

// ==================== Validation Helpers ====================

/**
 * Check if a person name data is complete (has firstName and lastName)
 */
export function isPersonNameComplete(nameData: PersonNameData): boolean {
  return !!(
    nameData.firstName?.trim() &&
    nameData.lastName?.trim()
  )
}

/**
 * Check if all required name fields are filled for a scenario
 */
export function areAllNamesComplete(
  data: IndividualNamesPurchaserDataVariant,
  setupConfig: NameOfPurchaserSetupConfig
): boolean {
  const prefixes = getNameFieldPrefixes(data)
  
  return prefixes.every((prefix) => {
    const nameData = data.nameFields[prefix]
    if (!nameData) return false
    return isPersonNameComplete(nameData)
  })
}

/**
 * Check if all required ID files are provided
 */
export function areAllIdFilesProvided(
  data: IndividualNamesPurchaserDataVariant,
  setupConfig: NameOfPurchaserSetupConfig,
  questionRequired: boolean,
  fieldLevelRequired?: boolean
): boolean {
  if (!isIdRequired(setupConfig, questionRequired, fieldLevelRequired)) {
    return true // ID not required
  }
  
  if (!data.idFiles) {
    return false
  }
  
  const prefixes = getNameFieldPrefixes(data)
  
  return prefixes.every((prefix) => {
    const nameData = data.nameFields[prefix]
    // Only require ID if person has a complete name
    if (!nameData || !isPersonNameComplete(nameData)) {
      return true // Skip if name is incomplete
    }
    
    return !!data.idFiles?.[prefix]
  })
}

