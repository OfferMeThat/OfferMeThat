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
  if ((questionType as string) === "evidenceOfFunds") {
    const configAny = config as any
    if (configAny.evidence_of_funds === "required") return true
    if (configAny.evidence_of_funds === "optional" || configAny.evidence_of_funds === "not_required") return false
  }

  // Custom Statement question - check add_tickbox
  if (questionType === "custom" && config.answer_type === "statement") {
    if (config.add_tickbox === "required") return true
    if (config.add_tickbox === "optional" || config.add_tickbox === "no") return false
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
  if (questionType === "nameOfPurchaser") {
    // Only update if collect_identification is currently "mandatory" or "optional"
    // Don't change it if it's "no" (user explicitly doesn't want ID collection)
    if (config.collect_identification === "mandatory" || config.collect_identification === "optional") {
      config.collect_identification = required ? "mandatory" : "optional"
    }
  }

  // Subject to Loan Approval - sync lender_details and attachments
  if (questionType === "subjectToLoanApproval") {
    // If required, ensure at least one is "required"
    if (required) {
      // If both are "not_required", set lender_details to "required"
      if (config.lender_details === "not_required" && config.attachments === "not_required") {
        config.lender_details = "required"
      } else {
        // If lender_details is "optional", change it to "required"
        if (config.lender_details === "optional") {
          config.lender_details = "required"
        }
        // If attachments is "optional", change it to "required"
        if (config.attachments === "optional") {
          config.attachments = "required"
        }
      }
    } else {
      // If not required, change "required" to "optional" (but keep "not_required" as is)
      // Only change if at least one is currently "required"
      if (config.lender_details === "required") {
        config.lender_details = "optional"
      }
      if (config.attachments === "required") {
        config.attachments = "optional"
      }
    }
  }

  // Evidence of Funds - sync evidence_of_funds
  if ((questionType as string) === "evidenceOfFunds") {
    // Only update if it's currently "required" or "optional"
    // Don't change it if it's "not_required" (user explicitly doesn't want it)
    const configAny = config as any
    if (configAny.evidence_of_funds === "required" || configAny.evidence_of_funds === "optional") {
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

