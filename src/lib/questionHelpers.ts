import { QuestionType } from "@/types/form"
import { QuestionSetupConfig } from "@/types/questionConfig"

/**
 * Determines if a question should be required based on its setup configuration
 * Some questions have a "required/optional" setting in their setup that should
 * control the main `required` field of the question
 */
export function getQuestionRequiredFromSetup(
  questionType: QuestionType,
  setupConfig: QuestionSetupConfig,
): boolean | null {
  const config = setupConfig as Record<string, any>

  // Offer Expiry - check expiry_requirement
  if (questionType === "offerExpiry") {
    if (config.expiry_requirement === "required") return true
    if (config.expiry_requirement === "optional") return false
  }

  // Attach Purchase Agreement - check contract_requirement
  if (questionType === "attachPurchaseAgreement") {
    if (config.contract_requirement === "required") return true
    if (config.contract_requirement === "optional") return false
  }

  // Name of Purchaser - check collect_identification
  // Only make question required if ID is mandatory
  // If ID is optional or "no", return null to preserve the question's current required status
  if (questionType === "nameOfPurchaser") {
    if (config.collect_identification === "mandatory") return true
    // Don't return false - return null to indicate no setup-based requirement
    // This allows the question to remain mandatory/optional based on its current state
    if (
      config.collect_identification === "optional" ||
      config.collect_identification === "no"
    )
      return null
  }

  // Subject to Loan Approval - check lender_details and attachments
  // IMPORTANT: Check field-level required from uiConfig first, then fall back to setup config
  if (questionType === "subjectToLoanApproval") {
    // Get field-level required from uiConfig if available
    const uiConfig = (config as any).uiConfig || {}
    const lenderDetailsFieldRequired =
      uiConfig.subQuestions?.lenderDetails?.required
    const attachmentsFieldRequired =
      uiConfig.subQuestions?.loan_attachments?.required
    const evidenceOfFundsFieldRequired =
      uiConfig.subQuestions?.evidence_of_funds_attachment?.required

    // If any field-level required is true, question should be required
    if (
      lenderDetailsFieldRequired === true ||
      attachmentsFieldRequired === true ||
      evidenceOfFundsFieldRequired === true
    ) {
      return true
    }

    // Fall back to setup config if field-level not set
    // If lender details are required, question should be required
    if (config.lender_details === "required") return true
    // If attachments are required, question should be required
    if (config.attachments === "required") return true
    // If evidence_of_funds is required, question should be required
    if ((config as any).evidence_of_funds === "required") return true
    // If both are optional/not_required, question can be optional
    if (
      config.lender_details === "not_required" &&
      config.attachments === "not_required"
    )
      return false
  }

  // Evidence of Funds - check evidence_of_funds
  if ((questionType as string) === "evidenceOfFunds") {
    const configAny = config as any
    if (configAny.evidence_of_funds === "required") return true
    if (
      configAny.evidence_of_funds === "optional" ||
      configAny.evidence_of_funds === "not_required"
    )
      return false
  }

  // Custom Statement question - check add_tickbox
  if (questionType === "custom" && config.answer_type === "statement") {
    if (config.add_tickbox === "required") return true
    if (config.add_tickbox === "optional" || config.add_tickbox === "no")
      return false
  }

  // Return null if no setup-based requirement logic applies
  // This means the question uses default required logic
  return null
}

/**
 * Syncs setup config based on question's required status
 * This is used when editing a question to ensure the setup config reflects
 * the current required state (which may have been changed via the checkbox)
 */
export function syncSetupConfigFromRequired(
  questionType: QuestionType,
  setupConfig: QuestionSetupConfig,
  required: boolean,
): QuestionSetupConfig {
  const config = { ...setupConfig } as Record<string, any>

  // Offer Expiry - sync expiry_requirement
  if (questionType === "offerExpiry") {
    config.expiry_requirement = required ? "required" : "optional"
  }

  // Attach Purchase Agreement - sync contract_requirement
  if (questionType === "attachPurchaseAgreement") {
    config.contract_requirement = required ? "required" : "optional"
  }

  // Name of Purchaser - sync collect_identification
  // IMPORTANT: Don't sync collect_identification when question.required changes
  // Field-level required should be independent of question-level required
  // The field can be optional even if question is mandatory, and vice versa
  // Field-level required is stored in uiConfig.subQuestions.idUploadLabel.required
  if (questionType === "nameOfPurchaser") {
    // Don't change collect_identification based on question.required
    // This allows field-level required to be independent
  }

  // Subject to Loan Approval - sync lender_details and attachments
  // IMPORTANT: Don't sync lender_details/attachments when question.required changes
  // Field-level required should be independent of question-level required
  // Fields can be optional even if question is mandatory, and vice versa
  // Field-level required is stored in uiConfig.subQuestions
  if (questionType === "subjectToLoanApproval") {
    // Don't change lender_details or attachments based on question.required
    // This allows field-level required to be independent
    // Exception: If both are "not_required" and question becomes required,
    // we need at least one field, so set lender_details to "required"
    // BUT: Only do this if field-level required is not explicitly set
    const uiConfig = (config as any).uiConfig || {}
    const hasFieldLevelRequired =
      uiConfig.subQuestions?.lenderDetails?.required !== undefined ||
      uiConfig.subQuestions?.loan_attachments?.required !== undefined ||
      uiConfig.subQuestions?.evidence_of_funds_attachment?.required !==
        undefined

    if (required && !hasFieldLevelRequired) {
      if (
        config.lender_details === "not_required" &&
        config.attachments === "not_required"
      ) {
        config.lender_details = "required"
      }
    }
  }

  // Evidence of Funds - sync evidence_of_funds
  if ((questionType as string) === "evidenceOfFunds") {
    // Only update if it's currently "required" or "optional"
    // Don't change it if it's "not_required" (user explicitly doesn't want it)
    const configAny = config as any
    if (
      configAny.evidence_of_funds === "required" ||
      configAny.evidence_of_funds === "optional"
    ) {
      config.evidence_of_funds = required ? "required" : "optional"
    }
  }

  // Custom Statement question - sync add_tickbox
  if (questionType === "custom" && config.answer_type === "statement") {
    // If required is false and tickbox is "required", change it to "optional"
    if (!required && config.add_tickbox === "required") {
      config.add_tickbox = "optional"
    }
    // If required is true and tickbox is "optional", change it to "required"
    if (required && config.add_tickbox === "optional") {
      config.add_tickbox = "required"
    }
    // Don't change if add_tickbox is "no" (user explicitly doesn't want tickbox)
  }

  return config
}
