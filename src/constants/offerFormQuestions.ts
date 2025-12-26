import { QuestionType } from "@/types/form"

// Full list of currency options for deposit instalments
export const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "SEK", label: "SEK - Swedish Krona" },
  { value: "NOK", label: "NOK - Norwegian Krone" },
  { value: "DKK", label: "DKK - Danish Krone" },
  { value: "PLN", label: "PLN - Polish Zloty" },
  { value: "CZK", label: "CZK - Czech Koruna" },
  { value: "HUF", label: "HUF - Hungarian Forint" },
  { value: "RON", label: "RON - Romanian Leu" },
  { value: "BGN", label: "BGN - Bulgarian Lev" },
  { value: "HRK", label: "HRK - Croatian Kuna" },
  { value: "RSD", label: "RSD - Serbian Dinar" },
  { value: "MKD", label: "MKD - Macedonian Denar" },
  { value: "ALL", label: "ALL - Albanian Lek" },
  { value: "BAM", label: "BAM - Bosnia-Herzegovina Mark" },
  { value: "ISK", label: "ISK - Icelandic Krona" },
  { value: "MDL", label: "MDL - Moldovan Leu" },
  { value: "UAH", label: "UAH - Ukrainian Hryvnia" },
  { value: "BYN", label: "BYN - Belarusian Ruble" },
  { value: "RUB", label: "RUB - Russian Ruble" },
  { value: "TRY", label: "TRY - Turkish Lira" },
  { value: "ILS", label: "ILS - Israeli Shekel" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "JOD", label: "JOD - Jordanian Dinar" },
  { value: "LBP", label: "LBP - Lebanese Pound" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "MAD", label: "MAD - Moroccan Dirham" },
  { value: "TND", label: "TND - Tunisian Dinar" },
  { value: "DZD", label: "DZD - Algerian Dinar" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "GHS", label: "GHS - Ghanaian Cedi" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "ETB", label: "ETB - Ethiopian Birr" },
  { value: "MUR", label: "MUR - Mauritian Rupee" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "ARS", label: "ARS - Argentine Peso" },
  { value: "CLP", label: "CLP - Chilean Peso" },
  { value: "COP", label: "COP - Colombian Peso" },
  { value: "PEN", label: "PEN - Peruvian Sol" },
  { value: "UYU", label: "UYU - Uruguayan Peso" },
  { value: "VES", label: "VES - Venezuelan Bolivar" },
  { value: "MXN", label: "MXN - Mexican Peso" },
  { value: "GTQ", label: "GTQ - Guatemalan Quetzal" },
  { value: "HNL", label: "HNL - Honduran Lempira" },
  { value: "NIO", label: "NIO - Nicaraguan Cordoba" },
  { value: "CRC", label: "CRC - Costa Rican Colon" },
  { value: "PAB", label: "PAB - Panamanian Balboa" },
  { value: "DOP", label: "DOP - Dominican Peso" },
  { value: "JMD", label: "JMD - Jamaican Dollar" },
  { value: "TTD", label: "TTD - Trinidad & Tobago Dollar" },
  { value: "BBD", label: "BBD - Barbadian Dollar" },
  { value: "XCD", label: "XCD - East Caribbean Dollar" },
  { value: "AWG", label: "AWG - Aruban Florin" },
  { value: "BZD", label: "BZD - Belize Dollar" },
  { value: "KYD", label: "KYD - Cayman Islands Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "VND", label: "VND - Vietnamese Dong" },
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
  { value: "PHP", label: "PHP - Philippine Peso" },
  { value: "KRW", label: "KRW - South Korean Won" },
  { value: "TWD", label: "TWD - Taiwan Dollar" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "PKR", label: "PKR - Pakistani Rupee" },
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
  { value: "LKR", label: "LKR - Sri Lankan Rupee" },
  { value: "NPR", label: "NPR - Nepalese Rupee" },
  { value: "MMK", label: "MMK - Myanmar Kyat" },
  { value: "KHR", label: "KHR - Cambodian Riel" },
  { value: "LAK", label: "LAK - Laotian Kip" },
  { value: "MOP", label: "MOP - Macanese Pataca" },
  { value: "BND", label: "BND - Brunei Dollar" },
  { value: "FJD", label: "FJD - Fijian Dollar" },
  { value: "PGK", label: "PGK - Papua New Guinea Kina" },
  { value: "SBD", label: "SBD - Solomon Islands Dollar" },
  { value: "VUV", label: "VUV - Vanuatu Vatu" },
  { value: "WST", label: "WST - Samoan Tala" },
  { value: "TOP", label: "TOP - Tongan Pa'anga" },
  { value: "NZD", label: "NZD - New Zealand Dollar" },
]

export const REQUIRED_QUESTION_TYPES: Array<QuestionType> = [
  "specifyListing",
  "submitterRole",
  "submitterName",
  "submitterEmail",
  "submitterPhone",
  "offerAmount",
  "submitButton",
]

export const QUESTION_TYPE_TO_LABEL: Record<QuestionType, string> = {
  specifyListing: "Specify Listing",
  submitterRole: "Submitter Role",
  submitterName: "Submitter Name",
  submitterEmail: "Submitter Email",
  submitterPhone: "Submitter Phone",
  nameOfPurchaser: "Name of Purchaser",
  offerAmount: "Offer Amount",
  submitButton: "Submit Button",
  offerExpiry: "Offer Expiry",
  deposit: "Deposit Details",
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
  submitterRole: {
    label: "Submitter Role",
    description:
      "Identify Submitter as an Unrepresented Buyer, a Represented Buyer, or an Agent.",
    // No setup questions for this one
  },

  nameOfPurchaser: {
    label: "Name of Purchaser",
    description:
      "Collect Purchaser Names in your preferred format, require i.d. optional.",
    setupQuestions: [
      {
        id: "collection_method",
        label: "How do you want to collect the Name of Purchaser(s)?",
        type: "radio",
        options: [
          {
            value: "single_field",
            label:
              "Use one freeform text field to collect the name of the Purchaser(s)",
          },
          {
            value: "individual_names",
            label:
              "Ascertain the number of Purchasers, and collect each name individually",
          },
        ],
      },
      {
        id: "collect_middle_names",
        label: "Do you want to collect Middle Name(s)?",
        type: "radio",
        dependsOn: {
          questionId: "collection_method",
          value: "individual_names",
        },
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "collect_identification",
        label: "Do you want to collect identification of Purchasers?",
        type: "radio",
        options: [
          { value: "mandatory", label: "Yes (Mandatory)" },
          { value: "optional", label: "Yes (Optional)" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },

  offerAmount: {
    label: "Offer Amount",
    description: "Collect the offer amount from the buyer.",
    setupQuestions: [
      {
        id: "currency_mode",
        label: "Would you like to allow Buyers to select a Currency?",
        type: "radio",
        options: [
          { value: "any", label: "Yes, let Buyer choose any" },
          { value: "options", label: "Yes, give Buyer 2+ options" },
          { value: "fixed", label: "No, stipulate a Currency" },
        ],
      },
      // Note: Dynamic currency fields for 'options' and 'fixed' modes
      // will be handled in QuestionSetupForm.tsx as they require
      // dynamic list building or specific currency selection logic
      // that isn't fully supported by the standard declarative schema yet.
    ],
  },

  attachPurchaseAgreement: {
    label: "Attach Purchase Agreement",
    description: "Collect signed purchase agreements with your Offer Form.",
    setupQuestions: [
      {
        id: "contract_requirement",
        label: "How would you like to manage Purchase Agreements?",
        type: "radio",
        options: [
          {
            value: "required",
            label:
              "ALL of the offers I receive must include a Purchase Agreement.",
          },
          {
            value: "optional",
            label:
              "I want to allow Buyers/Agents to include a Purchase Agreement, but it isn't required.",
          },
        ],
      },
    ],
  },

  offerExpiry: {
    label: "Offer Expiry",
    description: "Allow buyers to set expiry dates and times for their offers.",
    setupQuestions: [
      {
        id: "expiry_requirement",
        label: "Allow Offers to include an Expiry?",
        type: "radio",
        options: [
          { value: "required", label: "Expiry Date/Time is required" },
          { value: "optional", label: "Expiry Date/Time is optional" },
        ],
      },
    ],
  },

  deposit: {
    label: "Deposit Details",
    description: "Collect Deposit Details in your preferred format.",
    setupQuestions: [
      // Q1: How many instalments?
      {
        id: "instalments",
        label: "How many instalments would you like deposits paid in?",
        type: "select",
        options: [
          {
            value: "single",
            label: "Buyer always pays deposit in one instalment",
          },
          {
            value: "two_always",
            label: "Buyer always pays deposit in two instalments",
          },
          {
            value: "one_or_two",
            label: "Allow Buyer to pay deposit in one or two instalments",
          },
          { value: "three_plus", label: "Allow 3 instalments" },
        ],
      },

      // === SINGLE INSTALMENT PATH ===
      // Q2: Deposit amount management
      {
        id: "amount_management",
        label: "How would you like to manage the deposit amount?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: ["single", "one_or_two", "three_plus"],
        },
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount" },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price",
          },
          {
            value: "buyer_choice",
            label: "Buyer can choose between amount or %",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you",
          },
          {
            value: "fixed_percentage",
            label: "Deposit is a fixed % of purchase price, decided by you",
          },
        ],
      },

      // Q3a: Fixed amount input
      {
        id: "fixed_amount_value",
        label: "Enter the fixed deposit amount",
        type: "number",
        placeholder: "0.00",
        dependsOn: {
          questionId: "amount_management",
          value: "fixed_amount",
        },
      },

      // Q3b: Fixed amount currency
      {
        id: "fixed_amount_currency",
        label: "Select currency",
        type: "select",
        dependsOn: {
          questionId: "amount_management",
          value: "fixed_amount",
        },
        options: [
          { value: "USD", label: "USD ($)" },
          { value: "EUR", label: "EUR (€)" },
          { value: "GBP", label: "GBP (£)" },
          { value: "CAD", label: "CAD ($)" },
          { value: "AUD", label: "AUD ($)" },
        ],
      },

      // Q3c: Fixed percentage input
      {
        id: "fixed_percentage_value",
        label: "Enter the fixed deposit percentage",
        type: "number",
        placeholder: "10",
        dependsOn: {
          questionId: "amount_management",
          value: "fixed_percentage",
        },
      },

      // Q4: Currency stipulation (if buyer enters or has choice)
      {
        id: "currency_stipulation",
        label: "Stipulate Currency",
        type: "select",
        dependsOn: {
          questionId: "amount_management",
          value: ["buyer_enters", "buyer_choice"],
        },
        options: [
          { value: "any", label: "Let Buyer choose any Currency" },
          { value: "options", label: "Give Buyer 2+ Currency options" },
          { value: "fixed", label: "Stipulate a Currency" },
        ],
      },

      // Q5: Select currencies (if options)
      {
        id: "currency_options",
        label: "Select currencies to offer (select multiple)",
        type: "text",
        placeholder: "USD, EUR, GBP",
        dependsOn: {
          questionId: "currency_stipulation",
          value: "options",
        },
      },

      // Q6: Select single currency (if fixed)
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

      // Q7: Deposit Due Date
      {
        id: "due_date_type",
        label: "How would you like to manage your Deposit Due Date?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: ["single", "one_or_two", "three_plus"],
        },
        options: [
          {
            value: "immediately",
            label: "Deposit paid immediately upon Offer Acceptance",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with calendar selector",
          },
          { value: "datetime", label: "Buyer sets deadline time and date" },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing text field",
          },
          {
            value: "seller_text",
            label: "You set due date by writing text field",
          },
          { value: "within_time", label: "Within X days of Offer Acceptance" },
          { value: "custom", label: "Something else (Customize)" },
        ],
      },

      // Q8: Seller text for due date
      {
        id: "due_date_seller_text",
        label: "Enter the due date text",
        type: "text",
        placeholder: "e.g., Within 7 business days",
        dependsOn: {
          questionId: "due_date_type",
          value: "seller_text",
        },
      },

      // Q9: Deposit Holding
      {
        id: "deposit_holding",
        label: "Stipulate where the deposit is held?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: ["single", "one_or_two", "three_plus"],
        },
        options: [
          { value: "buyer_input", label: "Let Buyer input where deposit held" },
          { value: "stipulate", label: "Stipulate where deposit is held" },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit held",
          },
        ],
      },

      // Q10: Holding details
      {
        id: "holding_details",
        label: "Enter holding details",
        type: "text",
        placeholder: "e.g., Held in trust by ABC Law Firm",
        dependsOn: {
          questionId: "deposit_holding",
          value: "stipulate",
        },
      },

      // === TWO INSTALMENTS PATH ===
      // Instalment 1
      {
        id: "inst1_amount_management",
        label:
          "How would you like to manage the deposit amount for Instalment 1?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount" },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price",
          },
          {
            value: "buyer_choice",
            label: "Buyer can choose between amount or %",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you",
          },
          {
            value: "fixed_percentage",
            label: "Deposit is a fixed % of purchase price, decided by you",
          },
        ],
      },

      {
        id: "inst1_fixed_amount_value",
        label: "Enter the fixed deposit amount for Instalment 1",
        type: "number",
        placeholder: "0.00",
        dependsOn: {
          questionId: "inst1_amount_management",
          value: "fixed_amount",
        },
      },

      {
        id: "inst1_fixed_amount_currency",
        label: "Select currency for Instalment 1",
        type: "select",
        dependsOn: {
          questionId: "inst1_amount_management",
          value: "fixed_amount",
        },
        options: CURRENCY_OPTIONS,
      },

      {
        id: "inst1_fixed_percentage_value",
        label: "Enter the fixed deposit percentage for Instalment 1",
        type: "number",
        placeholder: "10",
        dependsOn: {
          questionId: "inst1_amount_management",
          value: "fixed_percentage",
        },
      },

      {
        id: "inst1_currency_stipulation",
        label: "Stipulate Currency for Instalment 1",
        type: "select",
        dependsOn: {
          questionId: "inst1_amount_management",
          value: ["buyer_enters", "buyer_choice"],
        },
        options: [
          { value: "any", label: "Let Buyer choose any Currency" },
          { value: "options", label: "Give Buyer 2+ Currency options" },
          { value: "fixed", label: "Stipulate a Currency" },
        ],
      },

      {
        id: "inst1_currency_options",
        label: "Select currencies for Instalment 1 (select multiple)",
        type: "text",
        placeholder: "USD, EUR, GBP",
        dependsOn: {
          questionId: "inst1_currency_stipulation",
          value: "options",
        },
      },

      {
        id: "inst1_currency_fixed",
        label: "Select currency for Instalment 1",
        type: "select",
        dependsOn: {
          questionId: "inst1_currency_stipulation",
          value: "fixed",
        },
        options: CURRENCY_OPTIONS,
      },

      {
        id: "inst1_due_date_type",
        label:
          "How would you like to manage Deposit Due Date for Instalment 1?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          {
            value: "immediately",
            label: "Deposit paid immediately upon Offer Acceptance",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with calendar selector",
          },
          { value: "datetime", label: "Buyer sets deadline time and date" },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing text field",
          },
          {
            value: "seller_text",
            label: "You set due date by writing text field",
          },
          { value: "within_time", label: "Within X days of Offer Acceptance" },
          { value: "custom", label: "Something else (Customize)" },
        ],
      },

      {
        id: "inst1_due_date_seller_text",
        label: "Enter the due date text for Instalment 1",
        type: "text",
        placeholder: "e.g., Within 7 business days",
        dependsOn: {
          questionId: "inst1_due_date_type",
          value: "seller_text",
        },
      },

      {
        id: "inst1_deposit_holding",
        label: "Stipulate where the deposit is held for Instalment 1?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          { value: "buyer_input", label: "Let Buyer input where deposit held" },
          { value: "stipulate", label: "Stipulate where deposit is held" },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit held",
          },
        ],
      },

      {
        id: "inst1_holding_details",
        label: "Enter holding details for Instalment 1",
        type: "text",
        placeholder: "e.g., Held in trust by ABC Law Firm",
        dependsOn: {
          questionId: "inst1_deposit_holding",
          value: "stipulate",
        },
      },

      // Instalment 2
      {
        id: "inst2_amount_management",
        label:
          "How would you like to manage the deposit amount for Instalment 2?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount" },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price",
          },
          {
            value: "buyer_choice",
            label: "Buyer can choose between amount or %",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you",
          },
          {
            value: "fixed_percentage",
            label: "Deposit is a fixed % of purchase price, decided by you",
          },
        ],
      },

      {
        id: "inst2_fixed_amount_value",
        label: "Enter the fixed deposit amount for Instalment 2",
        type: "number",
        placeholder: "0.00",
        dependsOn: {
          questionId: "inst2_amount_management",
          value: "fixed_amount",
        },
      },

      {
        id: "inst2_fixed_amount_currency",
        label: "Select currency for Instalment 2",
        type: "select",
        dependsOn: {
          questionId: "inst2_amount_management",
          value: "fixed_amount",
        },
        options: CURRENCY_OPTIONS,
      },

      {
        id: "inst2_fixed_percentage_value",
        label: "Enter the fixed deposit percentage for Instalment 2",
        type: "number",
        placeholder: "10",
        dependsOn: {
          questionId: "inst2_amount_management",
          value: "fixed_percentage",
        },
      },

      {
        id: "inst2_currency_stipulation",
        label: "Stipulate Currency for Instalment 2",
        type: "select",
        dependsOn: {
          questionId: "inst2_amount_management",
          value: ["buyer_enters", "buyer_choice"],
        },
        options: [
          { value: "any", label: "Let Buyer choose any Currency" },
          { value: "options", label: "Give Buyer 2+ Currency options" },
          { value: "fixed", label: "Stipulate a Currency" },
        ],
      },

      {
        id: "inst2_currency_options",
        label: "Select currencies for Instalment 2 (select multiple)",
        type: "text",
        placeholder: "USD, EUR, GBP",
        dependsOn: {
          questionId: "inst2_currency_stipulation",
          value: "options",
        },
      },

      {
        id: "inst2_currency_fixed",
        label: "Select currency for Instalment 2",
        type: "select",
        dependsOn: {
          questionId: "inst2_currency_stipulation",
          value: "fixed",
        },
        options: CURRENCY_OPTIONS,
      },

      {
        id: "inst2_due_date_type",
        label:
          "How would you like to manage Deposit Due Date for Instalment 2?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          {
            value: "immediately",
            label: "Deposit paid immediately upon Offer Acceptance",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with calendar selector",
          },
          { value: "datetime", label: "Buyer sets deadline time and date" },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing text field",
          },
          {
            value: "seller_text",
            label: "You set due date by writing text field",
          },
          { value: "within_time", label: "Within X days of Offer Acceptance" },
          { value: "custom", label: "Something else (Customize)" },
        ],
      },

      {
        id: "inst2_due_date_seller_text",
        label: "Enter the due date text for Instalment 2",
        type: "text",
        placeholder: "e.g., Within 14 business days",
        dependsOn: {
          questionId: "inst2_due_date_type",
          value: "seller_text",
        },
      },

      {
        id: "inst2_deposit_holding",
        label: "Stipulate where the deposit is held for Instalment 2?",
        type: "select",
        dependsOn: {
          questionId: "instalments",
          value: "two_always",
        },
        options: [
          { value: "buyer_input", label: "Let Buyer input where deposit held" },
          { value: "stipulate", label: "Stipulate where deposit is held" },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit held",
          },
        ],
      },

      {
        id: "inst2_holding_details",
        label: "Enter holding details for Instalment 2",
        type: "text",
        placeholder: "e.g., Held in trust by ABC Law Firm",
        dependsOn: {
          questionId: "inst2_deposit_holding",
          value: "stipulate",
        },
      },
    ],
  },

  subjectToLoanApproval: {
    label: "Subject to Loan Approval",
    description:
      "Ask if the Offer is Subject to Loan Approval. Collect details in your preferred format.",
    setupQuestions: [
      // Q1: Specify loan amount?
      {
        id: "loan_amount_type",
        label:
          "If an Offer is Subject to Loan Approval, would you like the Buyer to specify the amount being borrowed?",
        type: "select",
        options: [
          {
            value: "fixed_amount",
            label: "Yes, Buyer must enter a fixed amount",
          },
          {
            value: "percentage",
            label: "Yes, Buyer must enter a percentage of purchase price",
          },
          {
            value: "amount_or_percentage",
            label: "Yes, let Buyer provide an amount or percentage",
          },
          { value: "no_amount", label: "No, I don't need to know the amount" },
        ],
      },

      // Q2: Ask for Lender Name/Details?
      {
        id: "lender_details",
        label: "Do you want to ask for Lender Name/Details?",
        type: "select",
        options: [
          {
            value: "required",
            label: "Yes, Lender details must be provided",
          },
          {
            value: "optional",
            label: "Yes, but allow Buyer to say 'I don't know yet'",
          },
          { value: "not_required", label: "No, I don't need Lender details" },
        ],
      },

      // Q3: Attachments (pre-approval documents)?
      {
        id: "attachments",
        label:
          "Do you want Buyers to provide attachments (ie pre-approval documents) as supporting evidence of eligibility?",
        type: "select",
        options: [
          { value: "optional", label: "Yes, but it's optional" },
          {
            value: "required",
            label: "Yes, 1 or more attachments are required",
          },
          {
            value: "not_required",
            label: "No, don't ask for attachments at all",
          },
        ],
      },

      // Q4: When is Loan Approval Due?
      {
        id: "loan_approval_due",
        label: "When is Loan Approval Due?",
        type: "select",
        options: [
          {
            value: "no_due_date",
            label: "Buyers don't need to provide a Due Date",
          },
          {
            value: "calendar",
            label: "Buyer selects Due Date using calendar selector",
          },
          { value: "datetime", label: "Buyer sets deadline time and date" },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing text field",
          },
          {
            value: "seller_text",
            label: "You set due date by writing text field",
          },
          {
            value: "within_time",
            label: "Within X days of Offer Acceptance",
          },
          { value: "custom", label: "Something Else (Create your Own)" },
        ],
      },

      // Q5: Finance Approval Due Date (if seller_text)
      {
        id: "finance_approval_due_date",
        label: "Finance Approval Due Date",
        type: "text",
        placeholder: "e.g., Within 30 business days of Offer Acceptance",
        dependsOn: {
          questionId: "loan_approval_due",
          value: "seller_text",
        },
      },

      // Q6: Finance communications?
      {
        id: "finance_communications",
        label: "Finance communications?",
        type: "select",
        options: [
          {
            value: "referral_partner",
            label: "Yes, send leads to my Finance Referral Partner",
          },
          {
            value: "self_manage",
            label: "Yes, send me the leads and I'll manage them",
          },
          { value: "no_thanks", label: "No thank you" },
        ],
      },

      // Q7: Email of Lead recipient (if referral_partner)
      {
        id: "lead_recipient_email",
        label: "Email of Lead recipient",
        type: "text",
        placeholder: "partner@example.com",
        dependsOn: {
          questionId: "finance_communications",
          value: "referral_partner",
        },
      },

      // Q8: Evidence of funds (if NOT subject to loan)?
      {
        id: "evidence_of_funds",
        label: "Evidence of funds (if NOT subject to loan)?",
        type: "select",
        options: [
          { value: "optional", label: "Yes, but it is optional" },
          {
            value: "required",
            label: "Yes, an attachment must be provided",
          },
          {
            value: "not_required",
            label: "No, do not ask for evidence of funds",
          },
        ],
      },
    ],
  },

  specialConditions: {
    label: "Special Conditions",
    description:
      "Set up a list of common Conditions and let buyers tick boxes to include.",
    setupQuestions: [
      // Q1: Allow Buyer/Agent to add their own conditions?
      {
        id: "allow_custom_conditions",
        label:
          "You can produce a list of special conditions that the Buyer/Agent can add to their offer by ticking a box. You also have the option to let the Buyer/Agent add their own conditions as well. Would you like to allow the Buyer/Agent to be able to add their own conditions?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      // Note: The dynamic condition builder (Q2-Q4 repeating pattern) will be handled
      // specially in the UI. The conditions will be stored as a JSON array in setupConfig
      // under the key "conditions" with structure:
      // [{ name: string, details?: string, attachments?: string[] }]
      // This special handling is needed because the standard SetupQuestion type
      // doesn't support dynamic repeating fields.
    ],
  },

  settlementDate: {
    label: "Settlement Date",
    description:
      "Allows the User to collect 'Settlement Date' in their preferred format.",
    setupQuestions: [
      // Q1: When is Settlement Date?
      {
        id: "settlement_date_type",
        label: "When is Settlement Date?",
        type: "select",
        options: [
          {
            value: "calendar",
            label: "Buyer selects Settlement Date using calendar selector",
          },
          {
            value: "datetime",
            label:
              "Buyer sets Settlement Time and Date with clock and calendar",
          },
          {
            value: "buyer_text",
            label: "Buyer provides settlement date by writing text field",
          },
          {
            value: "seller_text",
            label:
              "You set settlement date by writing text field (Buyer must agree)",
          },
          {
            value: "within_days",
            label: "Within X days of Offer Acceptance (Buyer selects number)",
          },
          { value: "CYO", label: "Create Your Own" },
        ],
      },

      // Q2: Settlement Date text (if seller_text)
      {
        id: "settlement_date_text",
        label: "Enter the Settlement Date text for buyers to agree to:",
        type: "text",
        placeholder: "Enter settlement date text",
        dependsOn: {
          questionId: "settlement_date_type",
          value: "seller_text",
        },
      },

      // Q3: Ascertain Settlement Location?
      {
        id: "settlement_location",
        label: "Would you like to ascertain Settlement Location?",
        type: "select",
        options: [
          { value: "not_required", label: "No" },
          { value: "buyer_text", label: "Buyer stipulates text" },
          {
            value: "seller_text",
            label: "You set text (Buyer must agree)",
          },
        ],
      },

      // Q4: Settlement Location text (if seller_text)
      {
        id: "settlement_location_text",
        label: "Enter the Settlement Location text for buyers to agree to:",
        type: "text",
        placeholder: "Enter settlement location text",
        dependsOn: {
          questionId: "settlement_location",
          value: "seller_text",
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
        id: "allow_attachments",
        label: "Allow Buyers/Agents to add attachments to their message?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },

  custom: {
    label: "Create Your Own",
    description:
      "Create a custom question with your preferred answer format and validation.",
    setupQuestions: [
      // Q1: What type of answer/information do you want?
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

      // PATH 2: Number or Amount - Q2
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

      // PATH 2: Money - Q3
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

      // PATH 2: Money - Q4 (if options)
      {
        id: "currency_options",
        label: "Currency Options",
        type: "currency_options",
        dependsOn: {
          questionId: "currency_stipulation",
          value: "options",
        },
      },

      // PATH 2: Money - Q4 (if fixed)
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

      // PATH 4: Time and/or Date - Q2
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

      // PATH 5: Yes or No - Q2
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

      // PATH 6: Select from List - Q3
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

      // PATH 7: Statement - Q3
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

      // PATH 7: Statement - Q4
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

      // Common Question Text (for all paths)
      {
        id: "question_text",
        label: "What is your question/statement?",
        type: "text",
        placeholder: "Enter your question here",
      },
    ],
  },
}
