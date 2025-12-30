import { QuestionType } from "@/types/form"
import { CUSTOM_QUESTION_SETUP_QUESTIONS } from "./customQuestionSetup"

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
  type:
    | "radio"
    | "select"
    | "text"
    | "number"
    | "multiChoiceSelect"
    | "currency_options"
  options?: SetupQuestionOption[] // Required for radio/select/multiChoiceSelect, not for text/number
  placeholder?: string // For text/number inputs
  dependsOn?: {
    questionId: string
    value: string | string[]
  }
}

export type QuestionDefinition = {
  label: string
  description: string
  setupDescription?: string // Separate description for the setup modal
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
    description: "Capture interest level from potential leads.",
    setupQuestions: [
      {
        id: "options",
        label: "Which of the following would you like to include as options:",
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
    description: "Allow leads to opt-in to follow all your listings.",
    setupDescription:
      "This question invites people to automatically register as a Lead for ALL of your future listings (making them a 'Follower'). It is a great way to assist people who are researching to buy or sell, and a great way to showcase your results to potential future clients.",
    setupQuestions: [
      {
        id: "receiveInformation",
        label:
          "We can send you information about how to make the most of this tool to grow your business. Would you like to receive this information?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },

  opinionOfSalePrice: {
    label: "Opinion of Sale Price",
    description: "Collect leads' opinions on sale price.",
    setupQuestions: [
      {
        id: "answerType",
        label:
          "This question invites people to give their opinion about what the Listing is worth. You can allow them to provide their opinion by writing text, or insist that they give a specific number. Which would you prefer?",
        type: "radio",
        options: [
          {
            value: "text",
            label: "Text",
          },
          {
            value: "number",
            label: "A number",
          },
        ],
      },
    ],
  },

  captureFinanceLeads: {
    label: "Capture Finance Leads",
    description: "Capture finance-related information from leads.",
    setupDescription:
      "Some Leads may be interested in borrowing money to fund a purchase. Do you want to invite them to receive communications from a Finance Specialist? Note: All Leads authorize this when agreeing to the Terms & Conditions.",
    setupQuestions: [
      {
        id: "financeSetup",
        label: "How would you like to manage finance leads?",
        type: "select",
        options: [
          {
            value: "referralPartner",
            label:
              "Yes, and send leads directly to my Finance Referral Partner",
          },
          {
            value: "selfManage",
            label: "Yes, send me leads and I'll manage them myself",
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
    description: "Let the Lead to include a Personal Message.",
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

  // Custom question type (shared with offer forms)
  custom: {
    label: "Create Your Own",
    description:
      "Create a custom question with your preferred input type and options.",
    setupQuestions: CUSTOM_QUESTION_SETUP_QUESTIONS,
  },
}

// Filtered question definitions for the Add Question modal in lead form builder
// Only these questions should be available when adding questions to a lead form
export const LEAD_FORM_ADD_QUESTION_DEFINITIONS: Partial<
  Record<QuestionType, QuestionDefinition>
> = {
  submitterRole: QUESTION_DEFINITIONS.submitterRole,
  areYouInterested: QUESTION_DEFINITIONS.areYouInterested,
  followAllListings: QUESTION_DEFINITIONS.followAllListings,
  opinionOfSalePrice: QUESTION_DEFINITIONS.opinionOfSalePrice,
  captureFinanceLeads: QUESTION_DEFINITIONS.captureFinanceLeads,
  messageToAgent: QUESTION_DEFINITIONS.messageToAgent,
  custom: QUESTION_DEFINITIONS.custom,
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
