import { QuestionType } from "@/types/form"
import { QuestionSetupConfig } from "@/types/questionConfig"

/**
 * Determines if a question should be required based on its setup configuration
 * Some questions have a "required/optional" setting in their setup that should
 * control the main `required` field of the question
 */
export function getQuestionRequiredFromSetup(
  questionType: QuestionType,
  setupConfig: QuestionSetupConfig
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
  if (questionType === "nameOfPurchaser") {
    if (config.collect_identification === "mandatory") return true
    if (config.collect_identification === "optional" || config.collect_identification === "no") return false
  }

  // Subject to Loan Approval - check lender_details and attachments
  if (questionType === "subjectToLoanApproval") {
    // If lender details are required, question should be required
    if (config.lender_details === "required") return true
    // If attachments are required, question should be required
    if (config.attachments === "required") return true
    // If both are optional/not_required, question can be optional
    if (config.lender_details === "not_required" && config.attachments === "not_required") return false
  }

  // Evidence of Funds - check evidence_of_funds
  if (questionType === "evidenceOfFunds") {
    if (config.evidence_of_funds === "required") return true
    if (config.evidence_of_funds === "optional" || config.evidence_of_funds === "not_required") return false
  }

  // Return null if no setup-based requirement logic applies
  // This means the question uses default required logic
  return null
}

