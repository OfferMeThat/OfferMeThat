import { QuestionType } from "@/types/form"

export const REQUIRED_QUESTION_TYPES: Array<QuestionType> = [
  "specifyListing",
  "submitterRole",
  "submitterName",
  "submitterEmail",
  "submitterPhone",
  "offerAmount",
  "submitButton",
]

export const ADD_QUESTION_LIST: Partial<
  Record<QuestionType, { label: string; description: string }>
> = {
  submitterRole: {
    label: "Submitter Role",
    description:
      "Identify Submitter as an Unrepresented Buyer, a Represented Buyer, or an Agent.",
  },
  nameOfPurchaser: {
    label: "Name of Purchaser",
    description:
      "Collect Purchaser Names in your preferred format, require i.d. optional.",
  },
  attachPurchaseAgreement: {
    label: "Attach Purchase Agreement",
    description: "Collect signed purchase agreements with your Offer Form.",
  },
  offerExpiry: {
    label: "Offer Expiry",
    description: "Allow buyers to set expiry dates and times for their offers.",
  },
  deposit: {
    label: "Deposit",
    description: "Collect Deposit Details in your preferred format.",
  },
  subjectToLoanApproval: {
    label: "Subject to Loan Approval",
    description:
      "Ask if the Offer is Subject to Loan Approval. Collect details in your preferred format.",
  },
  specialConditions: {
    label: "Subject to Loan Approval",
    description:
      "Set up a list of common Conditions and let buyers tick boxes to include.",
  },
  settlementDate: {
    label: "Settlement Date",
    description:
      "Allows the User to collect 'Settlement Date' in their preferred format.",
  },
}
