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

  // Return null if no setup-based requirement logic applies
  // This means the question uses default required logic
  return null
}

