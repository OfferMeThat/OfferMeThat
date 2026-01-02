import { SetupQuestion } from "./offerFormQuestions"

/**
 * Shared custom question setup configuration used by both lead and offer forms.
 * This ensures consistent behavior and UI across both form types.
 */
export const CUSTOM_QUESTION_SETUP_QUESTIONS: SetupQuestion[] = [
  {
    id: "answer_type",
    label:
      "What type of answer/information do you want the Buyer/Agent to provide?",
    type: "select",
    options: [
      { value: "short_text", label: "Short Text Answer" },
      { value: "long_text", label: "Long Text Answer" },
      { value: "number_amount", label: "Provide a Number or Amount" },
      { value: "file_upload", label: "Upload Files" },
      { value: "time_date", label: "Provide a Time and/or Date" },
      { value: "yes_no", label: "Answer Yes or No" },
      { value: "single_select", label: "Select 1 Option from a List" },
      {
        value: "multi_select",
        label: "Select 1 or more Options from a List",
      },
      {
        value: "statement",
        label: "Statement (Tickbox to Agree is optional)",
      },
    ],
  },
  {
    id: "number_type",
    label: "What type of number?",
    type: "select",
    dependsOn: {
      questionId: "answer_type",
      value: "number_amount",
    },
    options: [
      { value: "money", label: "An amount of money" },
      { value: "phone", label: "A phone number" },
      { value: "percentage", label: "A percentage" },
    ],
  },
  {
    id: "currency_stipulation",
    label: "Would you like to allow Buyers to select a Currency?",
    type: "radio",
    dependsOn: {
      questionId: "number_type",
      value: "money",
    },
    options: [
      { value: "any", label: "Yes, let Buyer choose any" },
      { value: "options", label: "Yes, give Buyer 2+ options" },
      { value: "fixed", label: "No, stipulate a Currency" },
    ],
  },
  {
    id: "currency_options",
    label: "Currency Options",
    type: "currency_options",
    dependsOn: {
      questionId: "currency_stipulation",
      value: "options",
    },
  },
  {
    id: "currency_fixed",
    label: "Select currency",
    type: "select",
    dependsOn: {
      questionId: "currency_stipulation",
      value: "fixed",
    },
    options: [
      { value: "USD", label: "USD ($)" },
      { value: "EUR", label: "EUR (€)" },
      { value: "GBP", label: "GBP (£)" },
      { value: "CAD", label: "CAD ($)" },
      { value: "AUD", label: "AUD ($)" },
    ],
  },
  {
    id: "time_date_type",
    label: "What would you like to collect?",
    type: "select",
    dependsOn: {
      questionId: "answer_type",
      value: "time_date",
    },
    options: [
      { value: "time", label: "Time" },
      { value: "date", label: "Date" },
      { value: "datetime", label: "Time and Date" },
    ],
  },
  {
    id: "allow_unsure",
    label: "Allow 'Unsure' as an option?",
    type: "select",
    dependsOn: {
      questionId: "answer_type",
      value: "yes_no",
    },
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "select_options",
    label: "Create your list (comma-separated options)",
    type: "text",
    placeholder: "Option 1, Option 2, Option 3",
    dependsOn: {
      questionId: "answer_type",
      value: ["single_select", "multi_select"],
    },
  },
  {
    id: "add_tickbox",
    label: "Do you wish to add a tickbox for the Buyer/Agent to agree?",
    type: "select",
    dependsOn: {
      questionId: "answer_type",
      value: "statement",
    },
    options: [
      {
        value: "required",
        label: "Yes, and Submitter must tick the box to submit their Offer",
      },
      {
        value: "optional",
        label: "Yes, ticking the box is optional",
      },
      {
        value: "no",
        label: "No, just add a statement",
      },
    ],
  },
  {
    id: "tickbox_text",
    label:
      "What text would you like to display next to your tickbox (eg 'I agree')?",
    type: "text",
    placeholder: "I agree",
    dependsOn: {
      questionId: "add_tickbox",
      value: ["required", "optional"],
    },
  },
  {
    id: "question_text",
    label: "What is your question/statement?",
    type: "text",
    placeholder: "Enter your question here",
  },
]

