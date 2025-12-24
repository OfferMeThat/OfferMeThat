/* eslint-disable */
// @ts-nocheck

import { CURRENCY_OPTIONS } from "@/constants/offerFormQuestions"

// Smart Questions Configuration
export const smartQuestionsConfig = {
  message_to_listing_agent: {
    id: "message_to_listing_agent",
    title: "Message to Listing Agent",
    summary: "Allow Buyers/Agents to send messages with optional attachments.",
    setupQuestions: [
      {
        id: "allow_attachments",
        question:
          "Would you like to allow Buyers/Agents to add attachments to their message?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        required: true,
        defaultAnswer: "no",
      },
    ],
    generateProperties: (setupAnswers) => {
      const { allow_attachments } = setupAnswers

      return {
        question_text: "Message to Listing Agent:",
        question_type: "message_to_agent",
        placeholder: "Type message here...",
        is_essential: true,
        button_text: "Next",
        // Store setup answers for form generation
        setup_answers: {
          allow_attachments: allow_attachments === "yes",
        },
      }
    },
  },
  // Add placeholder configurations for other Smart Questions
  submitter_role: {
    id: "submitter_role",
    title: "Submitter Role",
    summary:
      "Identify Submitter as an Unrepresented Buyer, a Represented Buyer, or an Agent.",
    generateProperties: () => ({
      question_text: "What best describes you?",
      question_type: "submitter_role",
      placeholder: "Select your role",
      is_essential: true,
    }),
  },
  name_of_purchaser: {
    id: "name_of_purchaser",
    title: "Name of Purchaser",
    summary:
      "Collect Purchaser Names in your preferred format, require i.d. optional.",
    setupQuestions: [
      {
        id: "collection_method",
        question: "How do you want to collect the Name of Purchaser(s)?",
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
        required: true,
        defaultAnswer: "single_field",
      },
      {
        id: "collect_middle_names",
        question: "Do you want to collect Middle Name(s)?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        required: true,
        defaultAnswer: "no",
        conditional: {
          dependsOn: "collection_method",
          showWhen: "individual_names",
        },
      },
      {
        id: "collect_identification",
        question: "Do you want to collect identification of Purchasers?",
        type: "radio",
        options: [
          { value: "mandatory", label: "Yes (Mandatory)" },
          { value: "optional", label: "Yes (Optional)" },
          { value: "no", label: "No" },
        ],
        required: true,
        defaultAnswer: "no",
        // No conditional - always show this question
      },
    ],
    generateProperties: (setupAnswers) => {
      const {
        collection_method,
        collect_middle_names,
        collect_identification,
      } = setupAnswers

      if (collection_method === "single_field") {
        return {
          question_text: "Who is the Purchaser?",
          question_type: "purchaser_details",
          placeholder: "Enter purchaser name",
          is_essential: false,
          setup_answers: {
            collection_method: "single_field",
            collect_identification: collect_identification,
          },
        }
      } else {
        // Individual names collection
        return {
          question_text: "Which of the following best applies:",
          question_type: "purchaser_details",
          placeholder: "Select option",
          is_essential: false,
          setup_answers: {
            collection_method: "individual_names",
            collect_middle_names: collect_middle_names === "yes",
            collect_identification: collect_identification,
          },
        }
      }
    },
  },
  deposit: {
    id: "deposit",
    title: "Deposit",
    summary: "Collect Deposit Details in your preferred format.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "instalments",
        question: "How many instalments would you like deposits paid in?",
        type: "select",
        options: [
          {
            value: "single",
            label: "Buyer always pays deposit in one instalment.",
          },
          {
            value: "two_always",
            label: "Buyer always pays deposit in two instalments.",
          },
          {
            value: "one_or_two",
            label: "Allow Buyer to pay deposit in one or two instalments",
          },
          { value: "three_plus", label: "Allow 3 instalments" },
        ],
        required: true,
        defaultAnswer: "single",
      },
      {
        id: "deposit_management",
        question: "How would you like to manage the deposit amount?",
        type: "select",
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount." },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price.",
          },
          {
            value: "buyer_choice",
            label:
              "Buyer can choose between an amount or a percentage of purchase price.",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you.",
          },
          {
            value: "fixed_percentage",
            label:
              "Deposit is a fixed percentage of purchase price, decided by you.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_enters",
        conditional: {
          dependsOn: "instalments",
          showWhen: ["single", "one_or_two", "three_plus"],
        },
      },
      {
        id: "deposit_management_instalment_1",
        question:
          "How would you like to manage the deposit amount for Instalment 1:",
        type: "select",
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount." },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price.",
          },
          {
            value: "buyer_choice",
            label:
              "Buyer can choose between an amount or a percentage of purchase price.",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you.",
          },
          {
            value: "fixed_percentage",
            label:
              "Deposit is a fixed percentage of purchase price, decided by you.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_enters",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "deposit_management_instalment_2",
        question:
          "How would you like to manage the deposit amount for Instalment 2:",
        type: "select",
        options: [
          { value: "buyer_enters", label: "Buyer enters an amount." },
          {
            value: "buyer_percentage",
            label: "Buyer enters a % of purchase price.",
          },
          {
            value: "buyer_choice",
            label:
              "Buyer can choose between an amount or a percentage of purchase price.",
          },
          {
            value: "fixed_amount",
            label: "Deposit is a fixed amount, decided by you.",
          },
          {
            value: "fixed_percentage",
            label:
              "Deposit is a fixed percentage of purchase price, decided by you.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_enters",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "fixed_deposit_amount",
        question: "Deposit fixed amount",
        type: "text",
        placeholder: "Enter deposit amount",
        required: true,
        conditional: {
          dependsOn: "deposit_management",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_currency",
        question: "Currency",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "deposit_management",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_percentage",
        question: "Percentage",
        type: "text",
        placeholder: "Enter percentage (e.g., 5, 10, 15)",
        required: true,
        conditional: {
          dependsOn: "deposit_management",
          showWhen: "fixed_percentage",
        },
      },
      {
        id: "fixed_deposit_amount_instalment_1",
        question: "Deposit fixed amount for Instalment 1",
        type: "text",
        placeholder: "Enter deposit amount",
        required: true,
        conditional: {
          dependsOn: "deposit_management_instalment_1",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_currency_instalment_1",
        question: "Currency for Instalment 1",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "deposit_management_instalment_1",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_percentage_instalment_1",
        question: "Percentage for Instalment 1",
        type: "text",
        placeholder: "Enter percentage (e.g., 5, 10, 15)",
        required: true,
        conditional: {
          dependsOn: "deposit_management_instalment_1",
          showWhen: "fixed_percentage",
        },
      },
      {
        id: "fixed_deposit_amount_instalment_2",
        question: "Deposit fixed amount for Instalment 2",
        type: "text",
        placeholder: "Enter deposit amount",
        required: true,
        conditional: {
          dependsOn: "deposit_management_instalment_2",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_currency_instalment_2",
        question: "Currency for Instalment 2",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "deposit_management_instalment_2",
          showWhen: "fixed_amount",
        },
      },
      {
        id: "fixed_deposit_percentage_instalment_2",
        question: "Percentage for Instalment 2",
        type: "text",
        placeholder: "Enter percentage (e.g., 5, 10, 15)",
        required: true,
        conditional: {
          dependsOn: "deposit_management_instalment_2",
          showWhen: "fixed_percentage",
        },
      },
      {
        id: "currency_stipulation",
        question: "Stipulate Currency",
        type: "select",
        options: [
          { value: "any", label: "Let Buyer choose any Currency." },
          { value: "options", label: "Give Buyer 2+ Currency options." },
          { value: "fixed", label: "Stipulate a Currency." },
        ],
        required: true,
        defaultAnswer: "any",
        conditional: {
          dependsOn: "deposit_management",
          showWhen: ["buyer_enters", "buyer_choice"],
        },
      },
      {
        id: "currency_stipulation_instalment_1",
        question: "Stipulate Currency for Instalment 1",
        type: "select",
        options: [
          { value: "any", label: "Let Buyer choose any Currency." },
          { value: "options", label: "Give Buyer 2+ Currency options." },
          { value: "fixed", label: "Stipulate a Currency." },
        ],
        required: true,
        defaultAnswer: "any",
        conditional: {
          dependsOn: "deposit_management_instalment_1",
          showWhen: ["buyer_enters", "buyer_choice"],
        },
      },
      {
        id: "currency_stipulation_instalment_2",
        question: "Stipulate Currency for Instalment 2",
        type: "select",
        options: [
          { value: "any", label: "Let Buyer choose any Currency." },
          { value: "options", label: "Give Buyer 2+ Currency options." },
          { value: "fixed", label: "Stipulate a Currency." },
        ],
        required: true,
        defaultAnswer: "any",
        conditional: {
          dependsOn: "deposit_management_instalment_2",
          showWhen: ["buyer_enters", "buyer_choice"],
        },
      },
      {
        id: "currency_options_1",
        question: "Select Currency 1",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation",
          showWhen: "options",
        },
      },
      {
        id: "currency_options_2",
        question: "Select Currency 2",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "EUR",
        conditional: {
          dependsOn: "currency_stipulation",
          showWhen: "options",
        },
      },
      {
        id: "stipulated_currency",
        question: "Select Currency",
        type: "select",
        options: [
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
        ],
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation",
          showWhen: "fixed",
        },
      },
      {
        id: "currency_options_1_instalment_1",
        question: "Select Currency 1 for Instalment 1",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation_instalment_1",
          showWhen: "options",
        },
      },
      {
        id: "currency_options_2_instalment_1",
        question: "Select Currency 2 for Instalment 1",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "EUR",
        conditional: {
          dependsOn: "currency_stipulation_instalment_1",
          showWhen: "options",
        },
      },
      {
        id: "stipulated_currency_instalment_1",
        question: "Select Currency for Instalment 1",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation_instalment_1",
          showWhen: "fixed",
        },
      },
      {
        id: "currency_options_1_instalment_2",
        question: "Select Currency 1 for Instalment 2",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation_instalment_2",
          showWhen: "options",
        },
      },
      {
        id: "currency_options_2_instalment_2",
        question: "Select Currency 2 for Instalment 2",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "EUR",
        conditional: {
          dependsOn: "currency_stipulation_instalment_2",
          showWhen: "options",
        },
      },
      {
        id: "stipulated_currency_instalment_2",
        question: "Select Currency for Instalment 2",
        type: "select",
        options: CURRENCY_OPTIONS,
        required: true,
        defaultAnswer: "USD",
        conditional: {
          dependsOn: "currency_stipulation_instalment_2",
          showWhen: "fixed",
        },
      },
      {
        id: "deposit_due",
        question: "How would you like to manage your Deposit Due Date?",
        type: "select",
        options: [
          {
            value: "immediately",
            label: "Deposit is paid immediately upon Offer Acceptance.",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with a calendar selector.",
          },
          {
            value: "datetime",
            label:
              "Buyer sets a deadline time and date with a clock and calendar selector.",
          },
          {
            value: "buyer_text",
            label: "Buyer provides a due date by writing into a text field.",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field (buyers must agree to submit offers).",
          },
          {
            value: "within_time",
            label:
              "Within X days of Offer Acceptance (Buyer selects a number).",
          },
          { value: "custom", label: "Something else. (Customize your own.)" },
        ],
        required: true,
        defaultAnswer: "immediately",
        conditional: {
          dependsOn: "instalments",
          showWhen: ["single", "one_or_two", "three_plus"],
        },
      },
      {
        id: "deposit_due_instalment_1",
        question:
          "How would you like to manage your Deposit Due Date for Instalment 1:",
        type: "select",
        options: [
          {
            value: "immediately",
            label: "Deposit is paid immediately upon Offer Acceptance.",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with a calendar selector.",
          },
          {
            value: "datetime",
            label:
              "Buyer sets a deadline time and date with a clock and calendar selector.",
          },
          {
            value: "buyer_text",
            label: "Buyer provides a due date by writing into a text field.",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field (buyers must agree to submit offers).",
          },
          {
            value: "within_time",
            label:
              "Within X days of Offer Acceptance (Buyer selects a number).",
          },
          { value: "custom", label: "Something else. (Customize your own.)" },
        ],
        required: true,
        defaultAnswer: "immediately",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "deposit_due_instalment_2",
        question:
          "How would you like to manage your Deposit Due Date for Instalment 2:",
        type: "select",
        options: [
          {
            value: "immediately",
            label: "Deposit is paid immediately upon Offer Acceptance.",
          },
          {
            value: "calendar",
            label: "Buyer selects a due date with a calendar selector.",
          },
          {
            value: "datetime",
            label:
              "Buyer sets a deadline time and date with a clock and calendar selector.",
          },
          {
            value: "buyer_text",
            label: "Buyer provides a due date by writing into a text field.",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field (buyers must agree to submit offers).",
          },
          {
            value: "within_time",
            label:
              "Within X days of Offer Acceptance (Buyer selects a number).",
          },
          { value: "custom", label: "Something else. (Customize your own.)" },
        ],
        required: true,
        defaultAnswer: "immediately",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "seller_due_date_text",
        question: "Enter the deposit due date text",
        type: "text",
        placeholder:
          'e.g., "Deposit must be paid within 5 business days of offer acceptance"',
        required: true,
        conditional: {
          dependsOn: "deposit_due",
          showWhen: "seller_text",
        },
      },
      {
        id: "seller_due_date_text_instalment_1",
        question: "Enter the deposit due date text for Instalment 1",
        type: "text",
        placeholder:
          'e.g., "First deposit must be paid within 5 business days of offer acceptance"',
        required: true,
        conditional: {
          dependsOn: "deposit_due_instalment_1",
          showWhen: "seller_text",
        },
      },
      {
        id: "seller_due_date_text_instalment_2",
        question: "Enter the deposit due date text for Instalment 2",
        type: "text",
        placeholder:
          'e.g., "Second deposit must be paid within 10 business days of offer acceptance"',
        required: true,
        conditional: {
          dependsOn: "deposit_due_instalment_2",
          showWhen: "seller_text",
        },
      },
      {
        id: "deposit_holding",
        question: "Stipulate where the deposit is held?",
        type: "select",
        options: [
          {
            value: "buyer_input",
            label: "Yes, let Buyer input where deposit will be held.",
          },
          {
            value: "stipulate",
            label:
              "Stipulate where deposit is held. (Buyers must agree to submit offers.)",
          },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit is held.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_input",
        conditional: {
          dependsOn: "instalments",
          showWhen: ["single", "one_or_two", "three_plus"],
        },
      },
      {
        id: "deposit_holding_instalment_1",
        question: "Stipulate where the deposit is held for Instalment 1:",
        type: "select",
        options: [
          {
            value: "buyer_input",
            label: "Yes, let Buyer input where deposit will be held.",
          },
          {
            value: "stipulate",
            label:
              "Stipulate where deposit is held. (Buyers must agree to submit offers.)",
          },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit is held.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_input",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "deposit_holding_instalment_2",
        question: "Stipulate where the deposit is held for Instalment 2:",
        type: "select",
        options: [
          {
            value: "buyer_input",
            label: "Yes, let Buyer input where deposit will be held.",
          },
          {
            value: "stipulate",
            label:
              "Stipulate where deposit is held. (Buyers must agree to submit offers.)",
          },
          {
            value: "not_ascertain",
            label: "Do not ascertain where deposit is held.",
          },
        ],
        required: true,
        defaultAnswer: "buyer_input",
        conditional: {
          dependsOn: "instalments",
          showWhen: "two_always",
        },
      },
      {
        id: "deposit_holding_details",
        question: "Enter details about where the deposit is held",
        type: "text",
        placeholder:
          'e.g., "Deposit must be held in escrow with ABC Law Firm" or "Deposit to be held by the seller\'s solicitor"',
        required: true,
        conditional: {
          dependsOn: "deposit_holding",
          showWhen: "stipulate",
        },
      },
      {
        id: "deposit_holding_details_instalment_1",
        question:
          "Enter details about where the deposit is held for Instalment 1",
        type: "text",
        placeholder:
          'e.g., "First deposit must be held in escrow with ABC Law Firm"',
        required: true,
        conditional: {
          dependsOn: "deposit_holding_instalment_1",
          showWhen: "stipulate",
        },
      },
      {
        id: "deposit_holding_details_instalment_2",
        question:
          "Enter details about where the deposit is held for Instalment 2",
        type: "text",
        placeholder:
          'e.g., "Second deposit must be held in escrow with ABC Law Firm"',
        required: true,
        conditional: {
          dependsOn: "deposit_holding_instalment_2",
          showWhen: "stipulate",
        },
      },
    ],

    // Helper functions for generating preview questions
    generateInstalmentsQuestion: function (instalmentsSetup) {
      let options = []

      if (instalmentsSetup === "two_always") {
        // This question shouldn't appear for two_always, but if it does, show 1 and 2
        options = [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
        ]
      } else if (instalmentsSetup === "one_or_two") {
        options = [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
        ]
      } else if (instalmentsSetup === "three_plus") {
        options = [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
        ]
      }

      return {
        id: "deposit_instalments",
        question_text: "How many instalments will your Deposit be paid in?",
        question_type: "select",
        options: options,
        required: true,
        placeholder: "Select number of instalments",
      }
    },

    generateDepositTypeQuestion: function (setupAnswers) {
      const currencyStipulation = setupAnswers?.currency_stipulation
      const currencyField = this.generateCurrencyField(
        currencyStipulation,
        setupAnswers || {},
        "",
      )
      return {
        id: "deposit_type",
        question_text: "What will your Deposit be?",
        question_type: "select",
        options: [
          { value: "amount", label: "A fixed amount" },
          { value: "percentage", label: "A percentage of purchase price" },
        ],
        required: true,
        placeholder: "Select deposit type",
        conditional_currency: currencyField || undefined,
        conditional_suffix: "% of purchase price",
      }
    },

    generateDepositAmountQuestion: function (setupAnswers) {
      const {
        instalments,
        deposit_management,
        deposit_management_instalment_1,
        deposit_management_instalment_2,
        currency_stipulation,
        currency_stipulation_instalment_1,
        currency_stipulation_instalment_2,
        fixed_deposit_amount,
        fixed_deposit_currency,
        fixed_deposit_percentage,
        fixed_deposit_amount_instalment_1,
        fixed_deposit_currency_instalment_1,
        fixed_deposit_percentage_instalment_1,
        fixed_deposit_amount_instalment_2,
        fixed_deposit_currency_instalment_2,
        fixed_deposit_percentage_instalment_2,
      } = setupAnswers

      let question = {
        id: "deposit_amount",
        question_text: "What is your Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter a value",
      }

      // Determine which deposit management setting to use based on instalments
      let currentDepositManagement = deposit_management
      let currentCurrencyStipulation = currency_stipulation
      let currentFixedAmount = fixed_deposit_amount
      let currentFixedCurrency = fixed_deposit_currency
      let currentFixedPercentage = fixed_deposit_percentage

      // For now, we'll use the main deposit_management for all scenarios
      // This ensures consistency across single instalment and buyer choice scenarios
      // The instalment-specific fields are used in the setup but not in the preview generation

      if (currentDepositManagement === "buyer_enters") {
        question.placeholder = "Enter deposit amount"
        question.currency_field = this.generateCurrencyField(
          currentCurrencyStipulation,
          setupAnswers,
          "",
        )
      } else if (currentDepositManagement === "buyer_percentage") {
        question.placeholder = "Enter percentage"
        question.suffix = "% of purchase price"
        // No currency field for percentage - it's always a percentage of purchase price
      } else if (currentDepositManagement === "buyer_choice") {
        question.placeholder = "Enter amount or percentage"
        question.conditional_currency = this.generateCurrencyField(
          currentCurrencyStipulation,
          setupAnswers,
          "",
        )
        question.conditional_suffix = "% of purchase price"
      } else if (currentDepositManagement === "fixed_amount") {
        question.question_text = "What is your Deposit Amount?"
        question.question_type = "display"
        question.value = `${currentFixedAmount} ${currentFixedCurrency}`
      } else if (currentDepositManagement === "fixed_percentage") {
        question.question_text = "What is your Deposit Amount?"
        question.question_type = "display"
        question.value = `${currentFixedPercentage}% of purchase price`
      }

      return question
    },

    generateCurrencyField: function (
      currencyStipulation,
      setupAnswers,
      suffix = "",
    ) {
      if (currencyStipulation === "any") {
        return {
          type: "select",
          placeholder: "Select currency",
          options: CURRENCY_OPTIONS,
        }
      } else if (currencyStipulation === "options") {
        // Collect all currency options (not just 2)
        const currencyOptions = []
        let i = 1
        while (true) {
          const currencyValue =
            setupAnswers[`currency_options_${i}${suffix}`] ||
            setupAnswers[`currency_options_${i}`]
          if (currencyValue) {
            // Get the full currency name for better display
            const currencyName = this.getCurrencyDisplayName
              ? this.getCurrencyDisplayName(currencyValue)
              : currencyValue
            currencyOptions.push({
              value: currencyValue,
              label: `${currencyValue} - ${currencyName}`,
            })
            i++
          } else {
            break
          }
        }
        // Always return select type (single dropdown with all stipulated currencies)
        return {
          type: "select",
          placeholder: "Select currency",
          options: currencyOptions,
        }
      } else if (currencyStipulation === "fixed") {
        const fixedCurrency =
          setupAnswers[`stipulated_currency${suffix}`] ||
          setupAnswers.stipulated_currency
        return {
          type: "display",
          value: fixedCurrency || "",
        }
      }

      // Default: return a basic currency selector if no stipulation is set
      return {
        type: "select",
        placeholder: "Select currency",
        options: CURRENCY_OPTIONS,
      }
    },

    generateDepositDueQuestion: function (setupAnswers) {
      const { deposit_due, seller_due_date_text, due_date_config } =
        setupAnswers

      let question = {
        id: "deposit_due",
        question_text: "Deposit Due:",
        required: true,
      }

      if (deposit_due === "immediately") {
        question.question_type = "display"
        question.value = "Immediately upon Offer Acceptance"
      } else if (deposit_due === "calendar") {
        question.question_type = "date"
        question.placeholder = "Select due date"
      } else if (deposit_due === "datetime") {
        question.question_type = "datetime"
        question.placeholder = "Select due date and time"
      } else if (deposit_due === "buyer_text") {
        question.question_type = "text"
        question.placeholder = "Enter due date"
      } else if (deposit_due === "seller_text") {
        question.question_type = "display"
        question.value = seller_due_date_text
      } else if (deposit_due === "within_time") {
        question.question_type = "select_with_text"
        question.placeholder = "Enter number of days"
        question.select_options = [
          { value: "hours", label: "Hours" },
          { value: "days", label: "Days" },
          { value: "business_days", label: "Business Days" },
          { value: "calendar_days", label: "Calendar Days" },
          { value: "months", label: "Months" },
        ]
        question.suffix = "of Offer Acceptance"
      } else if (deposit_due === "custom" && due_date_config) {
        question.question_type = "custom_due_date"
        question.config = due_date_config
      }

      return question
    },

    generateDepositHoldingQuestion: function (setupAnswers) {
      const { deposit_holding, deposit_holding_details } = setupAnswers

      let question = {
        id: "deposit_holding",
        question_text: "Deposit to be held:",
        required: true,
      }

      if (deposit_holding === "buyer_input") {
        question.question_type = "text"
        question.placeholder = "Enter where deposit will be held"
      } else if (deposit_holding === "stipulate") {
        question.question_type = "display"
        question.value = deposit_holding_details
      }

      return question
    },

    generateInstalmentQuestions: function (setupAnswers, selectedInstalments) {
      const questions = []
      const numInstalments = parseInt(selectedInstalments)

      for (let i = 1; i <= numInstalments; i++) {
        // Add instalment header
        questions.push({
          id: `instalment_${i}_header`,
          question_text: `Instalment ${i}`,
          question_type: "display",
          value: `Instalment ${i}`,
        })

        // Generate questions for this instalment
        const instalmentQuestions = this.generateQuestionsForInstalment(
          setupAnswers,
          i,
        )
        questions.push(...instalmentQuestions)
      }

      return questions
    },

    generateQuestionsForInstalment: function (setupAnswers, instalmentNumber) {
      const questions = []
      // For two_always, both instalments use _instalment_X suffix
      // For one_or_two/three_plus, instalment 1 uses main fields (no suffix), instalment 2+ use suffix
      const isTwoAlways = setupAnswers.instalments === "two_always"
      const suffix =
        instalmentNumber > 1 || isTwoAlways
          ? `_instalment_${instalmentNumber}`
          : ""

      // Question: What will your Deposit be? (only for buyer_choice scenarios)
      const depositManagement =
        setupAnswers[`deposit_management${suffix}`] ||
        setupAnswers.deposit_management
      const currencyStipulation =
        setupAnswers[`currency_stipulation${suffix}`] ||
        setupAnswers.currency_stipulation
      if (depositManagement === "buyer_choice") {
        const currencyField = this.generateCurrencyField(
          currencyStipulation,
          setupAnswers,
          suffix,
        )
        questions.push({
          id: `deposit_type_instalment_${instalmentNumber}`,
          question_text: `What will your Deposit be for Instalment ${instalmentNumber}?`,
          question_type: "select",
          options: [
            { value: "amount", label: "A fixed amount" },
            { value: "percentage", label: "A percentage of purchase price" },
          ],
          required: true,
          placeholder: "Select deposit type",
          conditional_currency: currencyField || undefined,
          conditional_suffix: "% of purchase price",
        })
      }

      // Question: What is your Deposit Amount?
      const depositAmountQuestion =
        this.generateDepositAmountQuestionForInstalment(
          setupAnswers,
          instalmentNumber,
        )
      questions.push(depositAmountQuestion)

      // Question: Deposit Due
      const depositDueQuestion = this.generateDepositDueQuestionForInstalment(
        setupAnswers,
        instalmentNumber,
      )
      questions.push(depositDueQuestion)

      // Question: Deposit to be held
      const depositHolding =
        setupAnswers[`deposit_holding${suffix}`] || setupAnswers.deposit_holding
      if (
        depositHolding !== "not_ascertain" &&
        depositHolding !== "no_ascertain"
      ) {
        const depositHoldingQuestion =
          this.generateDepositHoldingQuestionForInstalment(
            setupAnswers,
            instalmentNumber,
          )
        questions.push(depositHoldingQuestion)
      }

      return questions
    },

    generateDepositAmountQuestionForInstalment: function (
      setupAnswers,
      instalmentNumber,
    ) {
      // For two_always, both instalments use _instalment_X suffix
      // For one_or_two/three_plus, instalment 1 uses main fields (no suffix), instalment 2+ use suffix
      const isTwoAlways = setupAnswers.instalments === "two_always"
      const suffix =
        instalmentNumber > 1 || isTwoAlways
          ? `_instalment_${instalmentNumber}`
          : ""
      const depositManagement =
        setupAnswers[`deposit_management${suffix}`] ||
        setupAnswers.deposit_management
      const currencyStipulation =
        setupAnswers[`currency_stipulation${suffix}`] ||
        setupAnswers.currency_stipulation

      // Determine the correct question ID based on instalment configuration
      // For one_or_two/three_plus, instalment 1 uses deposit_amount (no suffix)
      // For two_always or instalment 2+, use deposit_amount_instalment_X
      const questionId =
        instalmentNumber === 1 && !isTwoAlways
          ? "deposit_amount"
          : `deposit_amount_instalment_${instalmentNumber}`

      let question = {
        id: questionId,
        question_text: `What is your Deposit Amount${instalmentNumber > 1 ? ` for Instalment ${instalmentNumber}` : ""}?`,
        question_type: "text",
        required: true,
        placeholder: "Enter a value",
      }

      if (depositManagement === "buyer_enters") {
        question.placeholder = "Enter deposit amount"
        question.currency_field = this.generateCurrencyField(
          currencyStipulation,
          setupAnswers,
          suffix,
        )
      } else if (depositManagement === "buyer_percentage") {
        question.placeholder = "Enter percentage"
        question.suffix = "% of purchase price"
        question.currency_field = this.generateCurrencyField(
          currencyStipulation,
          setupAnswers,
          suffix,
        )
      } else if (depositManagement === "buyer_choice") {
        question.placeholder = "Enter amount or percentage"
        question.conditional_currency = this.generateCurrencyField(
          currencyStipulation,
          setupAnswers,
          suffix,
        )
        question.conditional_suffix = "% of purchase price"
      } else if (depositManagement === "fixed_amount") {
        const fixedAmount =
          setupAnswers[`fixed_deposit_amount${suffix}`] ||
          setupAnswers.fixed_deposit_amount
        const fixedCurrency =
          setupAnswers[`fixed_deposit_currency${suffix}`] ||
          setupAnswers.fixed_deposit_currency
        question.question_text = `What is your Deposit Amount${instalmentNumber > 1 ? ` for Instalment ${instalmentNumber}` : ""}?`
        question.question_type = "display"
        question.value = `${fixedAmount} ${fixedCurrency}`
      } else if (depositManagement === "fixed_percentage") {
        const fixedPercentage =
          setupAnswers[`fixed_deposit_percentage${suffix}`] ||
          setupAnswers.fixed_deposit_percentage
        question.question_text = `What is your Deposit Amount${instalmentNumber > 1 ? ` for Instalment ${instalmentNumber}` : ""}?`
        question.question_type = "display"
        question.value = `${fixedPercentage}% of purchase price`
      }

      return question
    },

    generateDepositDueQuestionForInstalment: function (
      setupAnswers,
      instalmentNumber,
    ) {
      // For two_always, both instalments use _instalment_X suffix
      // For one_or_two/three_plus, instalment 1 uses main fields (no suffix), instalment 2+ use suffix
      const isTwoAlways = setupAnswers.instalments === "two_always"
      const suffix =
        instalmentNumber > 1 || isTwoAlways
          ? `_instalment_${instalmentNumber}`
          : ""
      const depositDue =
        setupAnswers[`deposit_due${suffix}`] || setupAnswers.deposit_due
      const sellerDueDateText =
        setupAnswers[`seller_due_date_text${suffix}`] ||
        setupAnswers.seller_due_date_text
      const dueDateConfig = setupAnswers.due_date_config

      // Determine the correct question ID based on instalment configuration
      // For one_or_two/three_plus, instalment 1 uses deposit_due (no suffix)
      // For two_always or instalment 2+, use deposit_due_instalment_X
      const questionId =
        instalmentNumber === 1 && !isTwoAlways
          ? "deposit_due"
          : `deposit_due_instalment_${instalmentNumber}`

      let question = {
        id: questionId,
        question_text: `Deposit Due${instalmentNumber > 1 ? ` for Instalment ${instalmentNumber}` : ""}:`,
        required: true,
      }

      if (depositDue === "immediately") {
        question.question_type = "display"
        question.value = "Immediately upon Offer Acceptance"
      } else if (depositDue === "calendar") {
        question.question_type = "date"
        question.placeholder = "Select due date"
      } else if (depositDue === "datetime") {
        question.question_type = "datetime"
        question.placeholder = "Select due date and time"
      } else if (depositDue === "buyer_text") {
        question.question_type = "text"
        question.placeholder = "Enter due date"
      } else if (depositDue === "seller_text") {
        question.question_type = "display"
        question.value = sellerDueDateText || "Enter due date details"
      } else if (depositDue === "within_time") {
        question.question_type = "select_with_text"
        question.placeholder = "Enter number of days"
        question.select_options = [
          { value: "business_days", label: "business days" },
          { value: "days", label: "days" },
        ]
        question.suffix = "after Offer Acceptance"
      } else if (depositDue === "custom") {
        question.question_type = "custom_due_date"
        question.config = dueDateConfig
      }

      return question
    },

    generateDepositHoldingQuestionForInstalment: function (
      setupAnswers,
      instalmentNumber,
    ) {
      // For two_always, both instalments use _instalment_X suffix
      // For one_or_two/three_plus, instalment 1 uses main fields (no suffix), instalment 2+ use suffix
      const isTwoAlways = setupAnswers.instalments === "two_always"
      const suffix =
        instalmentNumber > 1 || isTwoAlways
          ? `_instalment_${instalmentNumber}`
          : ""
      const depositHolding =
        setupAnswers[`deposit_holding${suffix}`] || setupAnswers.deposit_holding
      const depositHoldingDetails =
        setupAnswers[`deposit_holding_details${suffix}`] ||
        setupAnswers.deposit_holding_details

      // Determine the correct question ID based on instalment configuration
      // For one_or_two/three_plus, instalment 1 uses deposit_holding (no suffix)
      // For two_always or instalment 2+, use deposit_holding_instalment_X
      const questionId =
        instalmentNumber === 1 && !isTwoAlways
          ? "deposit_holding"
          : `deposit_holding_instalment_${instalmentNumber}`

      let question = {
        id: questionId,
        question_text: `Deposit to be held${instalmentNumber > 1 ? ` for Instalment ${instalmentNumber}` : ""}:`,
        required: true,
      }

      if (depositHolding === "buyer_input") {
        question.question_type = "text"
        question.placeholder = "Enter where deposit will be held"
      } else if (depositHolding === "stipulate") {
        question.question_type = "display"
        question.value = depositHoldingDetails
      }

      return question
    },

    generateProperties: function (setupAnswers) {
      const questions = []

      // For single instalment, show questions normally
      if (setupAnswers.instalments === "single") {
        // Question 1: What will your Deposit be? (only for buyer_choice)
        if (setupAnswers.deposit_management === "buyer_choice") {
          const depositTypeQuestion =
            this.generateDepositTypeQuestion(setupAnswers)
          questions.push(depositTypeQuestion)
        }

        // Question 2: What is your Deposit Amount?
        const depositAmountQuestion =
          this.generateDepositAmountQuestion(setupAnswers)
        questions.push(depositAmountQuestion)

        // Question 3: Deposit Due
        const depositDueQuestion = this.generateDepositDueQuestion(setupAnswers)
        questions.push(depositDueQuestion)

        // Question 4: Deposit to be held
        if (
          setupAnswers.deposit_holding !== "not_ascertain" &&
          setupAnswers.deposit_holding !== "no_ascertain"
        ) {
          const depositHoldingQuestion =
            this.generateDepositHoldingQuestion(setupAnswers)
          questions.push(depositHoldingQuestion)
        }
      }
      // For two_always, generate questions for both instalments immediately
      else if (setupAnswers.instalments === "two_always") {
        const instalmentQuestions = this.generateInstalmentQuestions(
          setupAnswers,
          "2",
        )
        questions.push(...instalmentQuestions)
      }
      // For one_or_two or three_plus, show instalments selector first
      // The user will select how many, then questions will be generated dynamically
      else if (
        setupAnswers.instalments === "one_or_two" ||
        setupAnswers.instalments === "three_plus"
      ) {
        // Question 1: How many instalments will your Deposit be paid in?
        const instalmentsQuestion = this.generateInstalmentsQuestion(
          setupAnswers.instalments,
        )
        questions.push(instalmentsQuestion)
        // Note: Additional questions will be generated dynamically based on user's selection
        // This is handled in DepositPreview's generateAdditionalQuestions
      }

      return {
        question_type: "deposit",
        question_text: "Deposit Details",
        is_essential: false,
        setup_answers: setupAnswers,
        deposit_questions: questions, // Store the generated questions for rendering
      }
    },
  },
  subject_to_loan_approval: {
    id: "subject_to_loan_approval",
    title: "Subject to Loan Approval",
    summary:
      "Ask if the Offer is Subject to Loan Approval. Collect details in your preferred format",
    generateProperties: () => ({
      question_text: "Is this offer subject to loan approval?",
      question_type: "subject_to_loan_approval",
      placeholder: "Select option",
      is_essential: true,
    }),
  },
  other_conditions: {
    id: "other_conditions",
    title: "Special Conditions",
    summary:
      "Set up a list of common Conditions and let buyers tick boxes to include.",
    setupQuestions: [
      {
        id: "allow_custom_conditions",
        question_text:
          "You can produce a list of special conditions that the Buyer/Agent can add to their offer by ticking a box. You also have the option to let the Buyer/Agent add their own conditions as well. Would you like to allow the Buyer/Agent to be able to add their own conditions?",
        question_type: "select",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        placeholder: "Select an option",
        defaultAnswer: "no",
      },
      {
        id: "condition_1_name",
        question_text: "Name for Condition 1:",
        question_type: "text",
        required: true,
        placeholder: "Enter condition name",
      },
      {
        id: "condition_1_details",
        question_text: "Additional details and/or attachments",
        question_type: "text_area",
        required: false,
        placeholder: "Enter additional details (optional)",
        hasSkipButton: true,
      },
      {
        id: "add_another_condition",
        question_text: "Add another condition?",
        question_type: "select",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        placeholder: "Select an option",
      },
    ],
    generateProperties: function (setupAnswers) {
      const conditions = []

      // Generate conditions based on setup answers
      for (let i = 1; i <= 15; i++) {
        const conditionName = setupAnswers[`condition_${i}_name`]
        const conditionDetails = setupAnswers[`condition_${i}_details`]
        const conditionAttachments = setupAnswers[`condition_${i}_attachments`]

        if (conditionName) {
          conditions.push({
            id: `condition_${i}`,
            name: conditionName,
            details: conditionDetails || "",
            attachments: conditionAttachments || [],
            required: false,
          })
        }
      }

      // Add attachment question if required
      const questions = []

      // Add custom conditions functionality if allowed
      if (setupAnswers.allow_custom_conditions === "yes") {
        questions.push({
          id: "add_custom_condition",
          question_text: "Do you want to add another condition?",
          question_type: "select",
          required: false,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
          placeholder: "Select an option",
        })

        // Add fields for custom condition input
        questions.push({
          id: "custom_condition_name",
          question_text: "Condition Name:",
          question_type: "text",
          required: false,
          placeholder: "Enter condition name",
          conditional_display: {
            dependsOn: "add_custom_condition",
            showWhen: "yes",
          },
        })

        questions.push({
          id: "custom_condition_details",
          question_text: "Condition Details:",
          question_type: "text_area",
          required: false,
          placeholder: "Enter condition details",
          conditional_display: {
            dependsOn: "add_custom_condition",
            showWhen: "yes",
          },
        })

        questions.push({
          id: "add_another_custom_condition",
          question_text: "Add another Condition",
          question_type: "button",
          required: false,
          conditional_display: {
            dependsOn: "add_custom_condition",
            showWhen: "yes",
          },
        })
      }

      return {
        question_type: "other_conditions",
        question_text: "Select any additional conditions",
        is_essential: true,
        setup_answers: setupAnswers,
        conditions: conditions,
        questions: questions,
        allow_custom_conditions: setupAnswers.allow_custom_conditions === "yes",
      }
    },
  },
  closing_date: {
    id: "closing_date",
    title: "Closing Date",
    summary: "Collect Closing Date in your preferred format.",
    generateProperties: () => ({
      question_text: "What is the preferred closing date?",
      question_type: "closing_date",
      placeholder: "Select closing date",
      is_essential: true,
    }),
  },

  attach_signed_contract: {
    id: "attach_signed_contract",
    title: "Attach Purchase Agreement",
    summary: "Allow buyers to attach signed offer agreements.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "contract_requirement",
        question: "How would you like to manage Purchase Agreements?",
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
        required: true,
        defaultAnswer: "required",
      },
    ],
    generateProperties: (setupAnswers) => {
      const { contract_requirement = "required" } = setupAnswers

      return {
        question_text: "Please submit your Offer Documentation",
        question_type: "attach_signed_contract",
        placeholder: "Upload signed contract",
        is_essential: contract_requirement === "required",
        setup_answers: {
          contract_requirement: contract_requirement,
        },
      }
    },
  },

  offer_expiry: {
    id: "offer_expiry",
    title: "Offer Expiry",
    summary: "Allow buyers to set expiry dates and times for their offers.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "expiry_requirement",
        question: "Allow Offers to include an Expiry?",
        type: "radio",
        options: [
          { value: "required", label: "Expiry Date/Time is required" },
          { value: "optional", label: "Expiry Date/Time is optional" },
        ],
        required: true,
        defaultAnswer: "required",
      },
    ],
    generateProperties: (setupAnswers) => {
      const { expiry_requirement = "required" } = setupAnswers

      return {
        question_text:
          expiry_requirement === "required"
            ? "Offer Expiry:"
            : "Does this Offer have an Expiry time and date?",
        question_type: "offer_expiry",
        placeholder: "Select date and time",
        is_essential: expiry_requirement === "required",
        setup_answers: {
          expiry_requirement: expiry_requirement,
        },
      }
    },
  },
  loan_approval: {
    id: "loan_approval",
    title: "Subject to Loan Approval",
    summary: "Collect Loan Approval Details in your preferred format.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "loan_amount_requirement",
        question:
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
          {
            value: "no_amount",
            label: "No, I don't need to know the amount being borrowed",
          },
        ],
        required: true,
        defaultAnswer: "fixed_amount",
      },
      {
        id: "lender_details",
        question: "Do you want to ask for Lender Name/Details?",
        type: "select",
        options: [
          { value: "required", label: "Yes, Lender details must be provided." },
          {
            value: "optional",
            label: "Yes, but allow the Buyer to say 'I don't know yet'",
          },
          { value: "not_required", label: "No, I don't need Lender details." },
        ],
        required: true,
        defaultAnswer: "required",
      },
      {
        id: "attachments_requirement",
        question:
          "Do you want Buyers to provide attachments (ie pre-approval documents) as supporting evidence of eligibility?",
        type: "select",
        options: [
          { value: "optional", label: "Yes, but it's optional." },
          {
            value: "required",
            label: "Yes, 1 or more attachments are required.",
          },
          {
            value: "not_required",
            label: "No, don't ask for attachments at all.",
          },
        ],
        required: true,
        defaultAnswer: "optional",
      },
      {
        id: "due_date_management",
        question: "When is Loan Approval Due?",
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
          {
            value: "datetime",
            label:
              "Buyer sets a deadline time and date with a clock and calendar selector",
          },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing into a text field",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field. (Buyer must agree)",
          },
          {
            value: "within_time",
            label:
              "Within X days of Offer Acceptance. (Buyer selects a number.)",
          },
          { value: "custom", label: "Something Else (Create your Own)" },
        ],
        required: true,
        defaultAnswer: "within_time",
      },
      {
        id: "seller_due_date_text",
        question: "Finance Approval Due Date",
        type: "text",
        placeholder:
          'Enter due date details (e.g., "Within 14 days of offer acceptance")',
        required: true,
        conditional: {
          dependsOn: "due_date_management",
          showWhen: "seller_text",
        },
      },
      {
        id: "finance_communications",
        question:
          "For Buyers who are 'Subject to Loan Approval', do you want to invite them to receive communications regarding Finance? Note: All Buyers authorize this when agreeing to the Terms & Conditions.",
        type: "select",
        options: [
          {
            value: "referral_partner",
            label:
              "Yes, and send leads directly to my Finance Referral Partner.",
          },
          {
            value: "self_manage",
            label: "Yes, send me the leads and I'll manage them myself.",
          },
          { value: "no_thanks", label: "No thank you." },
        ],
        required: true,
        defaultAnswer: "no_thanks",
      },
      {
        id: "finance_partner_email",
        question: "Email of Lead recipient",
        type: "text",
        placeholder: "Enter email address",
        required: true,
        conditional: {
          dependsOn: "finance_communications",
          showWhen: "referral_partner",
        },
      },
      {
        id: "evidence_of_funds",
        question:
          "If an Offer is NOT Subject to Loan Approval, would you like the Buyer to provide evidence of funds?",
        type: "select",
        options: [
          { value: "optional", label: "Yes, but it is optional" },
          { value: "required", label: "Yes, an attachment must be provided" },
          {
            value: "not_required",
            label: "No, do not ask for evidence of funds",
          },
        ],
        required: true,
        defaultAnswer: "optional",
      },
    ],
    generateProperties: function (setupAnswers) {
      const questions = []

      // Question 1: Is your Offer subject to Loan Approval?
      questions.push({
        id: "subject_to_loan_approval",
        question_text: "Is your Offer subject to Loan Approval?",
        question_type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        required: true,
        placeholder: "Select an option",
      })

      // Question 2: Loan Amount (if required and subject to loan approval)
      if (setupAnswers.loan_amount_requirement !== "no_amount") {
        if (setupAnswers.loan_amount_requirement === "amount_or_percentage") {
          questions.push({
            id: "loan_amount_type",
            question_text: "What will your Loan Amount be?",
            question_type: "select",
            options: [
              { value: "amount", label: "A fixed amount" },
              { value: "percentage", label: "A percentage of purchase price" },
            ],
            required: true,
            placeholder: "Select loan amount type",
            conditional_display: {
              dependsOn: "subject_to_loan_approval",
              showWhen: "yes",
            },
          })
        }

        questions.push({
          id: "loan_amount",
          question_text: "What is your Loan Amount?",
          question_type: "text",
          required: true,
          placeholder: "Enter amount",
          currency_field:
            setupAnswers.loan_amount_requirement === "fixed_amount"
              ? null
              : null,
          conditional_currency:
            setupAnswers.loan_amount_requirement === "amount_or_percentage"
              ? {
                  type: "display",
                  value: "% of purchase price",
                }
              : null,
          conditional_suffix:
            setupAnswers.loan_amount_requirement === "percentage"
              ? "% of purchase price"
              : null,
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })
      }

      // Question 2: Lender Details (if required)
      if (setupAnswers.lender_details !== "not_required") {
        questions.push({
          id: "lender_company_name",
          question_text: "Company Name:",
          question_type: "text",
          required: setupAnswers.lender_details === "required",
          placeholder:
            setupAnswers.lender_details === "optional"
              ? 'Enter company name or "I don\'t know yet"'
              : "Enter company name",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })
        questions.push({
          id: "lender_contact_name",
          question_text: "Contact Name:",
          question_type: "text",
          required: setupAnswers.lender_details === "required",
          placeholder:
            setupAnswers.lender_details === "optional"
              ? 'Enter contact name or "I don\'t know yet"'
              : "Enter contact name",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })

        questions.push({
          id: "lender_contact_phone",
          question_text: "Contact Phone:",
          question_type: "text",
          required: setupAnswers.lender_details === "required",
          placeholder:
            setupAnswers.lender_details === "optional"
              ? 'Enter phone number or "I don\'t know yet"'
              : "Enter phone number",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })

        questions.push({
          id: "lender_contact_email",
          question_text: "Contact Email:",
          question_type: "text",
          required: setupAnswers.lender_details === "required",
          placeholder:
            setupAnswers.lender_details === "optional"
              ? 'Enter email address or "I don\'t know yet"'
              : "Enter email address",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })
      }

      // Question 3: Attachments (if required)
      if (setupAnswers.attachments_requirement !== "not_required") {
        questions.push({
          id: "loan_attachments",
          question_text: "Supporting Documents:",
          question_type: "file_upload",
          required: setupAnswers.attachments_requirement === "required",
          placeholder: "Upload pre-approval documents or supporting evidence",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })
      }

      // Question 4: Due Date
      if (setupAnswers.due_date_management !== "no_due_date") {
        let dueDateQuestion = {
          id: "loan_due_date",
          question_text: "Loan Approval Due:",
          required: true,
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        }

        if (setupAnswers.due_date_management === "calendar") {
          dueDateQuestion.question_type = "date"
          dueDateQuestion.placeholder = "Select due date"
        } else if (setupAnswers.due_date_management === "datetime") {
          dueDateQuestion.question_type = "datetime"
          dueDateQuestion.placeholder = "Select due date and time"
        } else if (setupAnswers.due_date_management === "buyer_text") {
          dueDateQuestion.question_type = "text"
          dueDateQuestion.placeholder = "Enter due date details"
        } else if (setupAnswers.due_date_management === "seller_text") {
          dueDateQuestion.question_type = "display"
          dueDateQuestion.value = setupAnswers.seller_due_date_text
        } else if (setupAnswers.due_date_management === "within_time") {
          dueDateQuestion.question_type = "select_with_text"
          dueDateQuestion.placeholder = "Enter number of days"
          dueDateQuestion.select_options = [
            { value: "business_days", label: "business days" },
            { value: "days", label: "days" },
          ]
          dueDateQuestion.suffix = "after Offer Acceptance"
        } else if (setupAnswers.due_date_management === "custom") {
          dueDateQuestion.question_type = "custom_due_date"
          dueDateQuestion.config = setupAnswers.loan_due_date_config
        }

        questions.push(dueDateQuestion)
      }

      // Question 5: Finance Communications (if user selected Yes for finance communications)
      if (
        setupAnswers.finance_communications === "referral_partner" ||
        setupAnswers.finance_communications === "self_manage"
      ) {
        questions.push({
          id: "finance_communications_consent",
          question_text:
            "Would you like to receive communication from a Finance Specialist with regard to your financing options?",
          question_type: "select",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
          required: true,
          placeholder: "Select an option",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "yes",
          },
        })
      }

      // Question 6: Evidence of Funds (if required)
      if (setupAnswers.evidence_of_funds !== "not_required") {
        questions.push({
          id: "evidence_of_funds_attachment",
          question_text: "Evidence of Funds:",
          question_type: "file_upload",
          required: setupAnswers.evidence_of_funds === "required",
          placeholder:
            "Upload evidence of funds (bank statements, pre-approval letters, etc.)",
          conditional_display: {
            dependsOn: "subject_to_loan_approval",
            showWhen: "no",
          },
        })
      }

      return {
        question_type: "loan_approval",
        question_text: "Subject to Loan Approval",
        is_essential: true,
        setup_answers: setupAnswers,
        loan_questions: questions,
      }
    },
  },
  closing_date: {
    id: "closing_date",
    title: "Closing Date",
    summary:
      "Allows the User to collect 'Closing Date' in their preferred format.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "due_date_management",
        question: "When is Closing Date?",
        type: "select",
        options: [
          {
            value: "calendar",
            label: "Buyer selects Closing Date using calendar selector",
          },
          {
            value: "datetime",
            label:
              "Buyer sets Closing Time and Date with a clock and calendar selector",
          },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing into a text field",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field. (Buyer must agree)",
          },
          {
            value: "within_days",
            label:
              "Within X days of Offer Acceptance. (Buyer selects a number.)",
          },
          { value: "custom", label: "Something Else (Create your Own)" },
        ],
        required: true,
        defaultAnswer: "calendar",
      },
      {
        id: "seller_due_date_text",
        question: "Enter the Closing Date text for buyers to agree to:",
        type: "text",
        required: false,
        placeholder: 'e.g., "Closing Date: 30 days from offer acceptance"',
        conditional_display: {
          dependsOn: "due_date_management",
          showWhen: "seller_text",
        },
      },
      {
        id: "closing_location_requirement",
        question: "Would you like to ascertain Closing Location?",
        type: "select",
        options: [
          {
            value: "not_required",
            label: "No, Closing Location is not required",
          },
          {
            value: "buyer_text",
            label:
              "Yes, Buyer stipulates the Closing Location by writing into a text field.",
          },
          {
            value: "seller_text",
            label:
              "You set the Closing Location by writing into a text field. (Buyer must agree)",
          },
        ],
        required: true,
        defaultAnswer: "not_required",
      },
      {
        id: "seller_closing_location_text",
        question: "Enter the Closing Location text for buyers to agree to:",
        type: "text",
        required: false,
        placeholder: 'e.g., "Closing Location: ABC Law Office, 123 Main St"',
        conditional_display: {
          dependsOn: "closing_location_requirement",
          showWhen: "seller_text",
        },
      },
    ],
    generateProperties: function (setupAnswers) {
      const questions = []

      // Question 1: Closing Date
      let closingDateQuestion = {
        id: "closing_date",
        question_text: "Closing Date:",
        question_type: setupAnswers.due_date_management,
        required: true,
        conditional_display: {
          dependsOn: "closing_date",
          showWhen: "yes",
        },
      }

      // Handle different due date types
      if (setupAnswers.due_date_management === "within_days") {
        closingDateQuestion.question_text =
          "Within how many days of Offer Acceptance?"
        closingDateQuestion.question_type = "select_with_text"
        closingDateQuestion.options = Array.from({ length: 100 }, (_, i) => ({
          value: (i + 1).toString(),
          label: (i + 1).toString(),
        }))
        closingDateQuestion.placeholder = "Select number of days"
        closingDateQuestion.suffix = " days of Offer Acceptance"
      } else if (setupAnswers.due_date_management === "seller_text") {
        closingDateQuestion.question_text = "Closing Date:"
        closingDateQuestion.question_type = "display"
        closingDateQuestion.display_text =
          setupAnswers.seller_due_date_text ||
          "Closing Date: As specified in the offer"
      } else if (setupAnswers.due_date_management === "custom") {
        closingDateQuestion.question_text = "Closing Date:"
        closingDateQuestion.question_type = "custom_due_date"
        closingDateQuestion.custom_config = setupAnswers.closing_date_config
      } else if (setupAnswers.due_date_management === "buyer_text") {
        closingDateQuestion.question_text = "Closing Date:"
        closingDateQuestion.question_type = "text"
        closingDateQuestion.placeholder = "Enter closing date"
      }

      questions.push(closingDateQuestion)

      // Question 2: Closing Location (if required)
      if (setupAnswers.closing_location_requirement !== "not_required") {
        let closingLocationQuestion = {
          id: "closing_location",
          question_text: "Closing Location:",
          question_type: setupAnswers.closing_location_requirement,
          required: true,
        }

        if (setupAnswers.closing_location_requirement === "seller_text") {
          closingLocationQuestion.question_type = "display"
          closingLocationQuestion.display_text =
            setupAnswers.seller_closing_location_text ||
            "Closing Location: As specified in the offer"
        } else if (setupAnswers.closing_location_requirement === "buyer_text") {
          closingLocationQuestion.question_type = "text"
          closingLocationQuestion.placeholder = "Enter closing location"
        }

        questions.push(closingLocationQuestion)
      }

      return {
        question_type: "closing_date",
        question_text: "Closing Date",
        is_essential: true,
        setup_answers: setupAnswers,
        closing_questions: questions,
      }
    },
  },
  closing_date_2: {
    id: "closing_date_2",
    title: "Closing Date",
    summary:
      "Allows the User to collect 'Closing Date' in their preferred format.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "due_date_management",
        question: "When is Closing Date?",
        type: "select",
        options: [
          {
            value: "calendar",
            label: "Buyer selects Closing Date using calendar selector",
          },
          {
            value: "datetime",
            label:
              "Buyer sets Closing Time and Date with a clock and calendar selector",
          },
          {
            value: "buyer_text",
            label: "Buyer provides due date by writing into a text field",
          },
          {
            value: "seller_text",
            label:
              "You set the due date by writing into a text field. (Buyer must agree)",
          },
          {
            value: "within_days",
            label:
              "Within X days of Offer Acceptance. (Buyer selects a number.)",
          },
        ],
        required: true,
        defaultAnswer: "calendar",
      },
      {
        id: "seller_due_date_text",
        question: "Enter the Closing Date text for buyers to agree to:",
        type: "text",
        required: false,
        placeholder: 'e.g., "Closing Date: 30 days from offer acceptance"',
        conditional_display: {
          dependsOn: "due_date_management",
          showWhen: "seller_text",
        },
      },
      {
        id: "closing_location_requirement",
        question: "Would you like to ascertain Closing Location?",
        type: "select",
        options: [
          {
            value: "not_required",
            label: "No, Closing Location is not required",
          },
          {
            value: "buyer_text",
            label:
              "Yes, Buyer stipulates the Closing Location by writing into a text field.",
          },
          {
            value: "seller_text",
            label:
              "You set the Closing Location by writing into a text field. (Buyer must agree)",
          },
        ],
        required: true,
        defaultAnswer: "not_required",
      },
      {
        id: "seller_closing_location_text",
        question: "Enter the Closing Location text for buyers to agree to:",
        type: "text",
        required: false,
        placeholder: 'e.g., "Closing Location: ABC Law Office, 123 Main St"',
        conditional_display: {
          dependsOn: "closing_location_requirement",
          showWhen: "seller_text",
        },
      },
    ],
    generateProperties: function (setupAnswers) {
      const questions = []

      // Question 1: Closing Date
      let closingDateQuestion = {
        id: "closing_date",
        question_text: "Closing Date:",
        question_type: setupAnswers.due_date_management,
        required: true,
      }

      // Handle different due date types
      if (setupAnswers.due_date_management === "within_days") {
        closingDateQuestion.question_text =
          "Within how many days of Offer Acceptance?"
        closingDateQuestion.question_type = "select_with_text"
        closingDateQuestion.options = Array.from({ length: 100 }, (_, i) => ({
          value: (i + 1).toString(),
          label: (i + 1).toString(),
        }))
        closingDateQuestion.placeholder = "Select number of days"
        closingDateQuestion.suffix = " days of Offer Acceptance"
      } else if (setupAnswers.due_date_management === "seller_text") {
        closingDateQuestion.question_text = "Closing Date:"
        closingDateQuestion.question_type = "display"
        closingDateQuestion.display_text =
          setupAnswers.seller_due_date_text ||
          "Closing Date: As specified in the offer"
      } else if (setupAnswers.due_date_management === "buyer_text") {
        closingDateQuestion.question_text = "Closing Date:"
        closingDateQuestion.question_type = "text"
        closingDateQuestion.placeholder = "Enter closing date"
      }

      questions.push(closingDateQuestion)

      // Question 2: Closing Location (if required)
      if (setupAnswers.closing_location_requirement !== "not_required") {
        let closingLocationQuestion = {
          id: "closing_location",
          question_text: "Closing Location:",
          question_type: setupAnswers.closing_location_requirement,
          required: true,
        }

        if (setupAnswers.closing_location_requirement === "seller_text") {
          closingLocationQuestion.question_type = "display"
          closingLocationQuestion.display_text =
            setupAnswers.seller_closing_location_text ||
            "Closing Location: As specified in the offer"
        } else if (setupAnswers.closing_location_requirement === "buyer_text") {
          closingLocationQuestion.question_type = "text"
          closingLocationQuestion.placeholder = "Enter closing location"
        }

        questions.push(closingLocationQuestion)
      }

      return {
        question_type: "closing_date_2",
        question_text: "Closing Date",
        is_essential: true,
        setup_answers: setupAnswers,
        closing_questions: questions,
      }
    },
  },
  settlement_date: {
    id: "settlement_date",
    title: "Settlement Date",
    summary:
      "Allows the User to collect 'Settlement Date' in their preferred format.",
    hasSetup: true,
    setupQuestions: [
      {
        id: "due_date_management",
        question: "When is Settlement Date?",
        type: "select",
        options: [
          {
            value: "calendar",
            label: "Buyer selects Settlement Date using calendar selector",
          },
          {
            value: "datetime",
            label:
              "Buyer sets Settlement Time and Date with a clock and calendar selector",
          },
          {
            value: "buyer_text",
            label:
              "Buyer provides settlement date by writing into a text field",
          },
          {
            value: "seller_text",
            label:
              "You set the settlement date by writing into a text field. (Buyer must agree)",
          },
          {
            value: "within_days",
            label:
              "Within X days of Offer Acceptance. (Buyer selects a number.)",
          },
          { value: "CYO", label: "Create Your Own" },
        ],
        required: true,
        defaultAnswer: "calendar",
      },
      {
        id: "seller_due_date_text",
        question: "Enter the Settlement Date text for buyers to agree to:",
        type: "text",
        placeholder: "Enter settlement date text",
        required: false,
        conditional_display: {
          dependsOn: "due_date_management",
          showWhen: "seller_text",
        },
      },
      {
        id: "settlement_location_requirement",
        question: "Would you like to ascertain Settlement Location?",
        type: "select",
        options: [
          { value: "not_required", label: "No" },
          { value: "buyer_text", label: "Buyer stipulates text" },
          { value: "seller_text", label: "You set text (Buyer must agree)" },
        ],
        required: true,
        defaultAnswer: "not_required",
      },
      {
        id: "seller_settlement_location_text",
        question: "Enter the Settlement Location text for buyers to agree to:",
        type: "text",
        placeholder: "Enter settlement location text",
        required: false,
        conditional_display: {
          dependsOn: "settlement_location_requirement",
          showWhen: "seller_text",
        },
      },
    ],
    generateProperties: (setupAnswers) => {
      const questions = []

      // Question 1: Settlement Date
      let settlementDateQuestion = {
        id: "settlement_date",
        question_text: "Settlement Date:",
        question_type: "calendar",
        required: true,
      }

      if (setupAnswers.due_date_management === "calendar") {
        settlementDateQuestion.question_type = "calendar"
      } else if (setupAnswers.due_date_management === "datetime") {
        settlementDateQuestion.question_type = "datetime"
      } else if (setupAnswers.due_date_management === "within_days") {
        settlementDateQuestion.question_type = "select_with_text"
        settlementDateQuestion.options = Array.from({ length: 30 }, (_, i) => ({
          value: (i + 1).toString(),
          label: (i + 1).toString(),
        }))
        settlementDateQuestion.suffix = " days of Offer Acceptance"
      } else if (setupAnswers.due_date_management === "seller_text") {
        settlementDateQuestion.question_text = "Settlement Date:"
        settlementDateQuestion.question_type = "display"
        settlementDateQuestion.display_text =
          setupAnswers.seller_due_date_text ||
          "Settlement Date: As specified in the offer"
      } else if (setupAnswers.due_date_management === "buyer_text") {
        settlementDateQuestion.question_text = "Settlement Date:"
        settlementDateQuestion.question_type = "text"
        settlementDateQuestion.placeholder = "Enter settlement date"
      } else if (setupAnswers.due_date_management === "CYO") {
        settlementDateQuestion.question_text = "Settlement Date:"
        settlementDateQuestion.question_type = "custom_due_date"
        settlementDateQuestion.custom_config =
          setupAnswers.settlement_date_config
      }

      questions.push(settlementDateQuestion)

      // Question 2: Settlement Location (if required)
      if (setupAnswers.settlement_location_requirement !== "not_required") {
        let settlementLocationQuestion = {
          id: "settlement_location",
          question_text: "Settlement Location:",
          question_type: setupAnswers.settlement_location_requirement,
          required: true,
        }

        if (setupAnswers.settlement_location_requirement === "seller_text") {
          settlementLocationQuestion.question_type = "display"
          settlementLocationQuestion.display_text =
            setupAnswers.seller_settlement_location_text ||
            "Settlement Location: As specified in the offer"
        }

        questions.push(settlementLocationQuestion)
      }

      return {
        question_type: "settlement_date",
        question_text: "Settlement Date",
        is_essential: true,
        setup_answers: setupAnswers,
        settlement_questions: questions,
      }
    },
  },
  create_your_own: {
    id: "create_your_own",
    title: "Create Your Own - TBC",
    summary:
      "Create a custom question with your preferred input type and options.",
    setupQuestions: [
      {
        id: "answer_type",
        question:
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
        required: true,
        defaultAnswer: "short_text",
      },
      {
        id: "allow_unsure",
        question:
          "Would you like to allow Buyers/Agents to answer with 'Unsure'?",
        type: "select",
        options: [
          { value: "no", label: "No" },
          { value: "yes", label: "Yes, include 'Unsure' as an option" },
        ],
        required: true,
        defaultAnswer: "no",
        conditional: {
          dependsOn: "answer_type",
          showWhen: "yes_no",
        },
      },
      {
        id: "question_text",
        question: "What is your question?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: [
            "short_text",
            "long_text",
            "file_upload",
            "yes_no",
            "single_select",
            "multi_select",
          ],
        },
      },
      {
        id: "number_type",
        question: "What type of number are you collecting?",
        type: "select",
        options: [
          { value: "money", label: "An amount of money" },
          { value: "phone", label: "A phone number" },
          { value: "percentage", label: "A percentage" },
        ],
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: "number_amount",
        },
      },
      {
        id: "currency_stipulation",
        question: "Would you like to allow Buyers to select a Currency?",
        type: "radio",
        options: [
          { value: "any", label: "Yes, let Buyer choose any" },
          { value: "options", label: "Yes, give Buyer 2+ options" },
          { value: "fixed", label: "No, stipulate a Currency" },
        ],
        required: true,
        conditional: {
          dependsOn: "number_type",
          showWhen: "money",
        },
      },
      {
        id: "currency_options",
        question: "Currency Options",
        type: "currency_options",
        required: true,
        conditional: {
          dependsOn: "currency_stipulation",
          showWhen: "options",
        },
      },
      {
        id: "fixed_currency",
        question: "Stipulate Currency",
        type: "select",
        options: [
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
          { value: "LYD", label: "LYD - Libyan Dinar" },
          { value: "ETB", label: "ETB - Ethiopian Birr" },
          { value: "KES", label: "KES - Kenyan Shilling" },
          { value: "UGX", label: "UGX - Ugandan Shilling" },
          { value: "TZS", label: "TZS - Tanzanian Shilling" },
          { value: "ZAR", label: "ZAR - South African Rand" },
          { value: "NGN", label: "NGN - Nigerian Naira" },
          { value: "GHS", label: "GHS - Ghanaian Cedi" },
          { value: "XOF", label: "XOF - West African CFA Franc" },
          { value: "XAF", label: "XAF - Central African CFA Franc" },
          { value: "MAD", label: "MAD - Moroccan Dirham" },
          { value: "TND", label: "TND - Tunisian Dinar" },
          { value: "DZD", label: "DZD - Algerian Dinar" },
          { value: "LYD", label: "LYD - Libyan Dinar" },
          { value: "ETB", label: "ETB - Ethiopian Birr" },
          { value: "KES", label: "KES - Kenyan Shilling" },
          { value: "UGX", label: "UGX - Ugandan Shilling" },
          { value: "TZS", label: "TZS - Tanzanian Shilling" },
          { value: "ZAR", label: "ZAR - South African Rand" },
          { value: "NGN", label: "NGN - Nigerian Naira" },
          { value: "GHS", label: "GHS - Ghanaian Cedi" },
          { value: "XOF", label: "XOF - West African CFA Franc" },
          { value: "XAF", label: "XAF - Central African CFA Franc" },
          { value: "BRL", label: "BRL - Brazilian Real" },
          { value: "ARS", label: "ARS - Argentine Peso" },
          { value: "CLP", label: "CLP - Chilean Peso" },
          { value: "COP", label: "COP - Colombian Peso" },
          { value: "MXN", label: "MXN - Mexican Peso" },
          { value: "PEN", label: "PEN - Peruvian Sol" },
          { value: "UYU", label: "UYU - Uruguayan Peso" },
          { value: "VES", label: "VES - Venezuelan Bolívar" },
          { value: "INR", label: "INR - Indian Rupee" },
          { value: "PKR", label: "PKR - Pakistani Rupee" },
          { value: "BDT", label: "BDT - Bangladeshi Taka" },
          { value: "LKR", label: "LKR - Sri Lankan Rupee" },
          { value: "NPR", label: "NPR - Nepalese Rupee" },
          { value: "AFN", label: "AFN - Afghan Afghani" },
          { value: "KZT", label: "KZT - Kazakhstani Tenge" },
          { value: "UZS", label: "UZS - Uzbekistani Som" },
          { value: "KGS", label: "KGS - Kyrgyzstani Som" },
          { value: "TJS", label: "TJS - Tajikistani Somoni" },
          { value: "TMT", label: "TMT - Turkmenistani Manat" },
          { value: "MNT", label: "MNT - Mongolian Tugrik" },
          { value: "KRW", label: "KRW - South Korean Won" },
          { value: "THB", label: "THB - Thai Baht" },
          { value: "VND", label: "VND - Vietnamese Dong" },
          { value: "IDR", label: "IDR - Indonesian Rupiah" },
          { value: "MYR", label: "MYR - Malaysian Ringgit" },
          { value: "SGD", label: "SGD - Singapore Dollar" },
          { value: "PHP", label: "PHP - Philippine Peso" },
          { value: "HKD", label: "HKD - Hong Kong Dollar" },
          { value: "TWD", label: "TWD - Taiwan Dollar" },
          { value: "NZD", label: "NZD - New Zealand Dollar" },
          { value: "FJD", label: "FJD - Fijian Dollar" },
          { value: "PGK", label: "PGK - Papua New Guinea Kina" },
          { value: "SBD", label: "SBD - Solomon Islands Dollar" },
          { value: "VUV", label: "VUV - Vanuatu Vatu" },
          { value: "WST", label: "WST - Samoan Tala" },
          { value: "TOP", label: "TOP - Tongan Paʻanga" },
          { value: "KID", label: "KID - Kiribati Dollar" },
          { value: "DZD", label: "DZD - Algerian Dinar" },
          { value: "LYD", label: "LYD - Libyan Dinar" },
          { value: "ETB", label: "ETB - Ethiopian Birr" },
          { value: "KES", label: "KES - Kenyan Shilling" },
          { value: "UGX", label: "UGX - Ugandan Shilling" },
          { value: "TZS", label: "TZS - Tanzanian Shilling" },
          { value: "ZAR", label: "ZAR - South African Rand" },
          { value: "NGN", label: "NGN - Nigerian Naira" },
          { value: "GHS", label: "GHS - Ghanaian Cedi" },
          { value: "XOF", label: "XOF - West African CFA Franc" },
          { value: "XAF", label: "XAF - Central African CFA Franc" },
          { value: "BRL", label: "BRL - Brazilian Real" },
          { value: "ARS", label: "ARS - Argentine Peso" },
          { value: "CLP", label: "CLP - Chilean Peso" },
          { value: "COP", label: "COP - Colombian Peso" },
          { value: "MXN", label: "MXN - Mexican Peso" },
          { value: "PEN", label: "PEN - Peruvian Sol" },
          { value: "UYU", label: "UYU - Uruguayan Peso" },
          { value: "VES", label: "VES - Venezuelan Bolívar" },
          { value: "INR", label: "INR - Indian Rupee" },
          { value: "PKR", label: "PKR - Pakistani Rupee" },
          { value: "BDT", label: "BDT - Bangladeshi Taka" },
          { value: "LKR", label: "LKR - Sri Lankan Rupee" },
          { value: "NPR", label: "NPR - Nepalese Rupee" },
          { value: "AFN", label: "AFN - Afghan Afghani" },
          { value: "KZT", label: "KZT - Kazakhstani Tenge" },
          { value: "UZS", label: "UZS - Uzbekistani Som" },
          { value: "KGS", label: "KGS - Kyrgyzstani Som" },
          { value: "TJS", label: "TJS - Tajikistani Somoni" },
          { value: "TMT", label: "TMT - Turkmenistani Manat" },
          { value: "MNT", label: "MNT - Mongolian Tugrik" },
          { value: "KRW", label: "KRW - South Korean Won" },
          { value: "THB", label: "THB - Thai Baht" },
          { value: "VND", label: "VND - Vietnamese Dong" },
          { value: "IDR", label: "IDR - Indonesian Rupiah" },
          { value: "MYR", label: "MYR - Malaysian Ringgit" },
          { value: "SGD", label: "SGD - Singapore Dollar" },
          { value: "PHP", label: "PHP - Philippine Peso" },
          { value: "HKD", label: "HKD - Hong Kong Dollar" },
          { value: "TWD", label: "TWD - Taiwan Dollar" },
          { value: "NZD", label: "NZD - New Zealand Dollar" },
          { value: "FJD", label: "FJD - Fijian Dollar" },
          { value: "PGK", label: "PGK - Papua New Guinea Kina" },
          { value: "SBD", label: "SBD - Solomon Islands Dollar" },
          { value: "VUV", label: "VUV - Vanuatu Vatu" },
          { value: "WST", label: "WST - Samoan Tala" },
          { value: "TOP", label: "TOP - Tongan Paʻanga" },
          { value: "KID", label: "KID - Kiribati Dollar" },
        ],
        required: true,
        conditional: {
          dependsOn: "currency_stipulation",
          showWhen: "fixed",
        },
      },
      {
        id: "number_question_text",
        question: "What is your question?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "number_type",
          showWhen: ["phone", "percentage"],
        },
      },
      {
        id: "money_question_text",
        question: "What is your question?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "number_type",
          showWhen: "money",
        },
      },
      {
        id: "time_date_type",
        question: "What would you like to collect?",
        type: "select",
        options: [
          { value: "time", label: "Time" },
          { value: "date", label: "Date" },
          { value: "datetime", label: "Time and Date" },
        ],
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: "time_date",
        },
      },
      {
        id: "time_date_question_text",
        question: "What is your question?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: "time_date",
        },
      },
      {
        id: "select_options",
        question: "Create your list:",
        type: "option_list",
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: ["single_select", "multi_select"],
        },
      },
      {
        id: "statement_text",
        question: "What is your question/statement?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: "statement",
        },
      },
      {
        id: "add_tickbox",
        question: "Do you wish to add a tickbox for the Buyer/Agent to agree?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        required: true,
        conditional: {
          dependsOn: "answer_type",
          showWhen: "statement",
        },
      },
      {
        id: "tickbox_requirement",
        question:
          "Is it optional or essential that the Buyer/Agent ticks to agree?",
        type: "select",
        options: [
          { value: "optional", label: "Optional" },
          { value: "essential", label: "Essential" },
        ],
        required: true,
        conditional: {
          dependsOn: "add_tickbox",
          showWhen: "yes",
        },
      },
      {
        id: "tickbox_text",
        question:
          "What text would you like to display next to your tickbox (eg 'I agree')?",
        type: "text",
        required: true,
        conditional: {
          dependsOn: "add_tickbox",
          showWhen: "yes",
        },
      },
    ],
    generateProperties: (setupAnswers) => {
      const {
        answer_type,
        question_text,
        number_type,
        currency_stipulation,
        currency_options,
        fixed_currency,
        number_question_text,
        money_question_text,
        time_date_type,
        time_date_question_text,
        select_options,
        statement_text,
        add_tickbox,
        tickbox_requirement,
        tickbox_text,
        allow_unsure,
      } = setupAnswers

      let finalQuestionText = ""
      let questionType = ""
      let additionalProps = {}

      // Determine question text and type based on answer type
      switch (answer_type) {
        case "short_text":
          finalQuestionText = question_text
          questionType = "text"
          break

        case "long_text":
          finalQuestionText = question_text
          questionType = "textarea"
          break

        case "number_amount":
          if (number_type === "money") {
            finalQuestionText = money_question_text
            questionType = "number"
            if (currency_stipulation === "fixed") {
              additionalProps.currency = fixed_currency
            } else if (currency_stipulation === "options") {
              // Extract currency codes from currency_options array
              if (Array.isArray(currency_options)) {
                additionalProps.currency_options = currency_options.map(
                  (option) => {
                    // If option is an object with value property, extract the value
                    if (typeof option === "object" && option.value) {
                      return option.value
                    }
                    // If option is already a string, use it as is
                    return option
                  },
                )
              } else {
                additionalProps.currency_options = currency_options
              }
            } else if (currency_stipulation === "any") {
              // Buyer can choose any currency - show currency selector with all options
              additionalProps.currency_options = [
                "USD",
                "EUR",
                "GBP",
                "CAD",
                "AUD",
                "JPY",
                "CHF",
                "CNY",
                "SEK",
                "NOK",
                "DKK",
                "PLN",
                "CZK",
                "HUF",
                "RON",
                "BGN",
                "HRK",
                "RSD",
                "MKD",
                "ALL",
                "BAM",
                "ISK",
                "MDL",
                "UAH",
                "BYN",
                "RUB",
                "TRY",
                "ILS",
                "AED",
                "SAR",
                "QAR",
                "KWD",
                "BHD",
                "OMR",
                "JOD",
                "LBP",
                "EGP",
                "MAD",
                "TND",
                "DZD",
                "ZAR",
                "NGN",
                "GHS",
                "KES",
                "UGX",
                "TZS",
                "ETB",
                "MUR",
                "BRL",
                "ARS",
                "CLP",
                "COP",
                "PEN",
                "UYU",
                "VES",
                "MXN",
                "GTQ",
                "HNL",
                "NIO",
                "CRC",
                "PAB",
                "DOP",
                "JMD",
                "TTD",
                "BBD",
                "XCD",
                "AWG",
                "BZD",
                "KYD",
                "SGD",
                "MYR",
                "THB",
                "VND",
                "IDR",
                "PHP",
                "KRW",
                "TWD",
                "HKD",
                "INR",
                "PKR",
                "BDT",
                "LKR",
                "NPR",
                "MMK",
                "KHR",
                "LAK",
                "MOP",
                "BND",
                "FJD",
                "PGK",
                "SBD",
                "VUV",
                "WST",
                "TOP",
                "NZD",
              ]
              additionalProps.currency_placeholder = "Select Currency"
            }
          } else {
            finalQuestionText = number_question_text
            questionType = number_type === "phone" ? "phone" : "number"
          }
          break

        case "file_upload":
          finalQuestionText = question_text
          questionType = "file_upload"
          break

        case "time_date":
          finalQuestionText = time_date_question_text
          questionType = time_date_type
          break

        case "yes_no":
          finalQuestionText = question_text
          questionType = "select"
          additionalProps.options = [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]
          // Add "Unsure" option if allowed
          if (allow_unsure === "yes") {
            additionalProps.options.push({ value: "unsure", label: "Unsure" })
          }
          break

        case "single_select":
          finalQuestionText = question_text
          questionType = "select"
          additionalProps.options = select_options
          break

        case "multi_select":
          finalQuestionText = question_text
          questionType = "select"
          additionalProps.options = select_options
          additionalProps.multiple = true
          break

        case "statement":
          finalQuestionText = statement_text
          questionType = "display"
          // Handle new format: required, optional, or no
          if (add_tickbox === "required" || add_tickbox === "optional") {
            additionalProps.show_tickbox = true
            additionalProps.tickbox_required = add_tickbox === "required"
            additionalProps.tickbox_text = tickbox_text || "I agree"
          }
          // Legacy format support: "yes" with tickbox_requirement
          else if (add_tickbox === "yes") {
            additionalProps.show_tickbox = true
            additionalProps.tickbox_required =
              tickbox_requirement === "essential"
            additionalProps.tickbox_text = tickbox_text || "I agree"
          }
          break
      }

      return {
        question_text: finalQuestionText,
        question_type: questionType,
        is_essential: false,
        placeholder: getPlaceholderForType(questionType),
        ...additionalProps,
      }
    },
  },
}

const QUESTION_TYPE_TO_SMART_ID = {
  messageToAgent: "message_to_listing_agent",
  submitterRole: "submitter_role",
  nameOfPurchaser: "name_of_purchaser",
  offerExpiry: "offer_expiry",
  attachPurchaseAgreement: "attach_signed_contract",
  deposit: "deposit",
  subjectToLoanApproval: "loan_approval",
  specialConditions: "other_conditions",
  settlementDate: "settlement_date",
  custom: "create_your_own",
} as const

const resolveSmartQuestionKey = (questionId) => {
  if (!questionId) return null

  if (smartQuestionsConfig[questionId]) {
    return questionId
  }

  const mappedKey = QUESTION_TYPE_TO_SMART_ID[questionId]
  if (mappedKey && smartQuestionsConfig[mappedKey]) {
    return mappedKey
  }

  return null
}

// Helper function to get appropriate placeholder based on question type
const getPlaceholderForType = (questionType) => {
  switch (questionType) {
    case "text":
      return "Enter your answer here..."
    case "textarea":
      return "Enter your detailed answer here..."
    case "number":
      return "Enter amount..."
    case "tel":
      return "Enter phone number..."
    case "file_upload":
      return "Click to upload files..."
    case "time":
      return "Select time..."
    case "date":
      return "Select date..."
    case "datetime":
      return "Select date and time..."
    case "select":
      return "Select an option..."
    default:
      return "Enter your answer here..."
  }
}

export const getSmartQuestion = (questionId) => {
  const key = resolveSmartQuestionKey(questionId)
  if (!key) return null
  return smartQuestionsConfig[key] || null
}

export const buildSmartQuestionUiConfig = (questionType, setupConfig = {}) => {
  const smartQuestion = getSmartQuestion(questionType)

  if (
    !smartQuestion ||
    typeof smartQuestion.generateProperties !== "function"
  ) {
    return null
  }

  try {
    const generated = smartQuestion.generateProperties(setupConfig || {})
    if (!generated || typeof generated !== "object") {
      return null
    }

    return {
      label: generated.question_text || smartQuestion.title || questionType,
      placeholder: generated.placeholder || "",
      summary: smartQuestion.summary || "",
      generatedProperties: generated,
    }
  } catch (error) {
    console.error(
      `[smartQuestions] Failed to build UI config for ${questionType}`,
      error,
    )
    return null
  }
}
