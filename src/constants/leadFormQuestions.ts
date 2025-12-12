import { QuestionType } from "@/types/form"

export const REQUIRED_QUESTION_TYPES: Array<QuestionType> = [
  "listingInterest",
  "name",
  "email",
  "tel",
  "submitButton",
]

export const QUESTION_TYPE_TO_LABEL: Record<QuestionType, string> = {
  // Offer form question types
  specifyListing: "Specify Listing",
  submitterRole: "Submitter Role",
  submitterName: "Submitter Name",
  submitterEmail: "Submitter Email",
  submitterPhone: "Submitter Phone",
  nameOfPurchaser: "Name of Purchaser",
  offerAmount: "Offer Amount",
  submitButton: "Submit Button",
  offerExpiry: "Offer Expiry",
  deposit: "Deposit",
  subjectToLoanApproval: "Subject to Loan Approval",
  attachPurchaseAgreement: "Attach Purchase Agreement",
  specialConditions: "Special Conditions",
  settlementDate: "Settlement Date",
  messageToAgent: "Message to Agent",
  custom: "Custom",
  shortText: "Short Text",
  longText: "Long Text",
  provideAmount: "Provide Amount",
  uploadFiles: "Upload Files",
  provideTime: "Provide Time",
  yesNo: "Yes/No",
  singleChoiceSelect: "Single Choice Select",
  multiChoiceSelect: "Multi Choice Select",
  statement: "Statement",
  // Lead form question types
  listingInterest: "Listing Interest",
  name: "Name",
  email: "Email Address",
  tel: "Phone Number",
  areYouInterested: "Are You Interested?",
  followAllListings: "Follow All Listings?",
  opinionOfSalePrice: "Opinion of Sale Price",
  captureFinanceLeads: "Capture Finance Leads",
}

export type SetupQuestionOption = {
  value: string
  label: string
}

export type SetupQuestion = {
  id: string // key in setupConfig JSON
  label: string
  type: "radio" | "select" | "text" | "number"
  options?: SetupQuestionOption[] // Required for radio/select, not for text/number
  placeholder?: string // For text/number inputs
  dependsOn?: {
    questionId: string
    value: string | string[]
  }
}

export type QuestionDefinition = {
  label: string
  description: string
  setupQuestions?: SetupQuestion[]
}

export const QUESTION_DEFINITIONS: Partial<
  Record<QuestionType, QuestionDefinition>
> = {
  // Lead form specific question definitions
  listingInterest: {
    label: "Listing Interest",
    description:
      "Collect which listing the user is interested in via free-form text input.",
  },

  submitterRole: {
    label: "Submitter Role",
    description:
      "Identify Submitter as an Unrepresented Buyer, a Represented Buyer, or an Agent.",
  },

  name: {
    label: "Name",
    description: "Collect the submitter's first and last name.",
  },

  email: {
    label: "Email Address",
    description: "Collect the submitter's email address.",
  },

  tel: {
    label: "Phone Number",
    description: "Collect the submitter's mobile phone number.",
  },

  areYouInterested: {
    label: "Are You Interested?",
    description:
      "Ask if the user is potentially interested in making an offer for the listing.",
    setupQuestions: [
      {
        id: "options",
        label: "Which options would you like to include?",
        type: "multiChoiceSelect",
        options: [
          {
            value: "yesVeryInterested",
            label: "Yes, very interested",
          },
          {
            value: "yes",
            label: "Yes",
          },
          {
            value: "no",
            label: "No",
          },
          {
            value: "maybe",
            label: "Maybe",
          },
        ],
      },
    ],
  },

  followAllListings: {
    label: "Follow All Listings?",
    description:
      "Ask if the user wants to register to receive updates about future listings or this listing only.",
    // No setup questions - options are fixed
  },

  opinionOfSalePrice: {
    label: "Opinion of Sale Price",
    description: "Collect the user's opinion about what the listing is worth.",
    setupQuestions: [
      {
        id: "answerType",
        label: "What type of answer would you like to collect?",
        type: "radio",
        options: [
          {
            value: "text",
            label: "Text - Free-form text input",
          },
          {
            value: "number",
            label: "A number - Numeric input only",
          },
        ],
      },
    ],
  },

  captureFinanceLeads: {
    label: "Capture Finance Leads",
    description:
      "Ask if the user would like to receive communication from a Finance Specialist.",
    setupQuestions: [
      {
        id: "financeSetup",
        label: "How would you like to manage finance leads?",
        type: "radio",
        options: [
          {
            value: "referralPartner",
            label: "Send leads to my Finance Referral Partner",
          },
          {
            value: "selfManage",
            label: "Send me the leads and I'll manage them",
          },
        ],
      },
      {
        id: "referralPartnerEmail",
        label: "Referral Partner Email",
        type: "text",
        placeholder: "partner@example.com",
        dependsOn: {
          questionId: "financeSetup",
          value: "referralPartner",
        },
      },
      {
        id: "leadRecipientEmail",
        label: "Lead Recipient Email",
        type: "text",
        placeholder: "recipient@example.com",
        dependsOn: {
          questionId: "financeSetup",
          value: "selfManage",
        },
      },
    ],
  },

  messageToAgent: {
    label: "Message to Listing Agent",
    description:
      "Allow buyers to send a message to the listing agent with optional attachments.",
    setupQuestions: [
      {
        id: "allowAttachments",
        label: "Allow Buyers/Agents to add attachments to their message?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
}

// Default questions for lead forms
export interface DefaultLeadQuestion {
  type: QuestionType
  order: number
  required: boolean
  setupConfig?: Record<string, any>
  uiConfig: {
    label: string
    placeholder?: string
    description?: string
  }
}

export const DEFAULT_LEAD_QUESTIONS: DefaultLeadQuestion[] = [
  {
    type: "listingInterest",
    order: 1,
    required: true,
    uiConfig: {
      label: "What listing are you interested in?",
      placeholder: "Specify the listing here...",
      description: "LISTING INTEREST",
    },
  },
  {
    type: "submitterRole",
    order: 2,
    required: false,
    uiConfig: {
      label: "What best describes you?",
      placeholder: "Select your role",
      description: "SUBMITTER ROLE",
    },
  },
  {
    type: "name",
    order: 3,
    required: true,
    uiConfig: {
      label: "What is your name?",
      placeholder: "Enter your first name",
      description: "NAME",
    },
  },
  {
    type: "email",
    order: 4,
    required: true,
    uiConfig: {
      label: "What is your email address?",
      placeholder: "example@email.com",
      description: "EMAIL ADDRESS",
    },
  },
  {
    type: "tel",
    order: 5,
    required: true,
    uiConfig: {
      label: "What is your mobile phone number?",
      placeholder: "555-123-4567",
      description: "MOBILE PHONE NUMBER",
    },
  },
  {
    type: "submitButton",
    order: 6,
    required: true,
    uiConfig: {
      label: "Submit",
      description: "SUBMIT BUTTON",
    },
  },
]

