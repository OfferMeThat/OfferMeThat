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

// Subject to Loan Approval Question Schema
export type {
  LoanAmountType,
  LenderDetailsRequirement,
  AttachmentsRequirement,
  LoanApprovalDueDateManagement,
  FinanceCommunications,
  EvidenceOfFundsRequirement,
  SubjectToLoanApprovalSetupConfig,
  LoanAmountTypeSelection,
  LenderDetailsData,
  LoanApprovalDueDateData,
  SubjectToLoanData,
  NotSubjectToLoanData,
  SubjectToLoanApprovalCollectedData,
} from "./subjectToLoanApproval"

export {
  isSubjectToLoan,
  isNotSubjectToLoan,
  isLoanAmountRequired,
  isLenderDetailsRequired,
  isAttachmentsRequired,
  isEvidenceOfFundsRequired,
  isLoanApprovalDueRequired,
  allowsLoanAmountChoice,
  allowsUnknownLender,
  getDataFieldName as getLoanDataFieldName,
  isLenderDetailsComplete,
} from "./subjectToLoanApproval"

// Special Conditions Question Schema
export type {
  AllowCustomConditions,
  SetupAttachment,
  ConditionDefinition,
  SpecialConditionsSetupConfig,
  SpecialConditionsCollectedData,
  SpecialConditionsUIConfig,
  SpecialConditionsValue,
  SpecialConditionsValidationResult,
} from "./specialConditions"

export {
  MAX_CONDITIONS,
  MAX_SETUP_ATTACHMENTS_PER_CONDITION,
  MAX_SETUP_ATTACHMENT_SIZE,
  MAX_CUSTOM_CONDITION_ATTACHMENTS,
  MAX_CUSTOM_CONDITION_ATTACHMENT_SIZE,
  ACCEPTED_FILE_TYPES,
  SETUP_ATTACHMENTS_BUCKET,
  CUSTOM_CONDITION_ATTACHMENTS_BUCKET,
} from "./specialConditions"

