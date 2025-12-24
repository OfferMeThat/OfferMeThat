/**
 * Question Type Schemas
 * 
 * Centralized exports for all question type schemas.
 * This allows for easier imports and better organization.
 */

// Deposit Question Schema
export type {
  DepositInstalmentConfig,
  DepositAmountManagement,
  CurrencyStipulation,
  DepositDueDateManagement,
  DepositHoldingType,
  DepositType,
  DepositTimeUnit,
  CurrencyCode,
  DepositSetupConfig,
  DepositQuestion,
  DepositQuestionBase,
  DepositTypeQuestion,
  DepositAmountQuestion,
  DepositDueQuestion,
  DepositHoldingQuestion,
  DepositInstalmentsQuestion,
  DepositInstalmentHeader,
  DepositCollectedData,
  DepositInstalmentData,
} from "./deposit"

export {
  isMultiInstalmentConfig,
  requiresInstalmentSelector,
  allowsBuyerChoice,
  isFixedDeposit,
  isDepositHoldingConfigured,
} from "./deposit"

// Name of Purchaser Question Schema
export type {
  NameCollectionMethod,
  CollectMiddleNames,
  CollectIdentification,
  NameOfPurchaserSetupConfig,
  PurchaserScenario,
  PurchaserType,
  PersonNameData,
  NameFieldPrefix,
  SingleFieldPurchaserData,
  IndividualNamesPurchaserData,
  SinglePersonPurchaserData,
  MultiplePeoplePurchaserData,
  CorporationPurchaserData,
  OtherPurchaserData,
  IndividualNamesPurchaserDataVariant,
  NameOfPurchaserCollectedData,
} from "./nameOfPurchaser"

export {
  isSingleFieldPurchaserData,
  isIndividualNamesPurchaserData,
  isSinglePersonScenario,
  isMultiplePeopleScenario,
  isCorporationScenario,
  isOtherScenario,
  getNameFieldPrefixes,
  isIdRequired,
  shouldCollectMiddleNames,
  getDataFieldName,
  isPersonNameComplete,
  areAllNamesComplete,
  areAllIdFilesProvided,
} from "./nameOfPurchaser"

