"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSmartQuestion } from "@/data/smartQuestions"
import { useCallback, useEffect, useRef, useState } from "react"
import DepositDueDateModal from "./DepositDueDateModal"
import LoanDueDateModal from "./LoanDueDateModal"

// Interfaces
interface SmartQuestionOption {
  value: string
  label: string
}

interface SmartQuestionConditional {
  dependsOn: string
  showWhen: string | string[]
}

interface SetupQuestion {
  id: string
  question: string
  type: string
  options?: SmartQuestionOption[]
  required?: boolean
  defaultAnswer?: string | boolean
  placeholder?: string
  conditional?: SmartQuestionConditional
  conditional_display?: SmartQuestionConditional
}

interface SmartQuestionDefinition {
  id: string
  title: string
  summary: string
  hasSetup?: boolean
  setupQuestions: SetupQuestion[]
  generateProperties: (setupAnswers: Record<string, any>) => any
}

// Helper function to get currency display names
const getCurrencyDisplayName = (
  currencyCode: string | { value: string; code?: string } | any,
) => {
  // Ensure currencyCode is a string
  const code =
    typeof currencyCode === "string"
      ? currencyCode
      : currencyCode?.value || currencyCode?.code || ""

  const currencyNames = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    JPY: "Japanese Yen",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
    PLN: "Polish Zloty",
    CZK: "Czech Koruna",
    HUF: "Hungarian Forint",
    RON: "Romanian Leu",
    BGN: "Bulgarian Lev",
    HRK: "Croatian Kuna",
    RSD: "Serbian Dinar",
    MKD: "Macedonian Denar",
    ALL: "Albanian Lek",
    BAM: "Bosnia-Herzegovina Mark",
    ISK: "Icelandic Krona",
    MDL: "Moldovan Leu",
    UAH: "Ukrainian Hryvnia",
    BYN: "Belarusian Ruble",
    RUB: "Russian Ruble",
    TRY: "Turkish Lira",
    ILS: "Israeli Shekel",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    QAR: "Qatari Riyal",
    KWD: "Kuwaiti Dinar",
    BHD: "Bahraini Dinar",
    OMR: "Omani Rial",
    JOD: "Jordanian Dinar",
    LBP: "Lebanese Pound",
    EGP: "Egyptian Pound",
    MAD: "Moroccan Dirham",
    TND: "Tunisian Dinar",
    DZD: "Algerian Dinar",
    ZAR: "South African Rand",
    NGN: "Nigerian Naira",
    GHS: "Ghanaian Cedi",
    KES: "Kenyan Shilling",
    UGX: "Ugandan Shilling",
    TZS: "Tanzanian Shilling",
    ETB: "Ethiopian Birr",
    MUR: "Mauritian Rupee",
    BRL: "Brazilian Real",
    ARS: "Argentine Peso",
    CLP: "Chilean Peso",
    COP: "Colombian Peso",
    PEN: "Peruvian Sol",
    UYU: "Uruguayan Peso",
    VES: "Venezuelan Bolivar",
    MXN: "Mexican Peso",
    GTQ: "Guatemalan Quetzal",
    HNL: "Honduran Lempira",
    NIO: "Nicaraguan Cordoba",
    CRC: "Costa Rican Colon",
    PAB: "Panamanian Balboa",
    DOP: "Dominican Peso",
    JMD: "Jamaican Dollar",
    TTD: "Trinidad & Tobago Dollar",
    BBD: "Barbadian Dollar",
    XCD: "East Caribbean Dollar",
    AWG: "Aruban Florin",
    BZD: "Belize Dollar",
    KYD: "Cayman Islands Dollar",
    SGD: "Singapore Dollar",
    MYR: "Malaysian Ringgit",
    THB: "Thai Baht",
    VND: "Vietnamese Dong",
    IDR: "Indonesian Rupiah",
    PHP: "Philippine Peso",
    KRW: "South Korean Won",
    INR: "Indian Rupee",
    PKR: "Pakistani Rupee",
    BDT: "Bangladeshi Taka",
    LKR: "Sri Lankan Rupee",
    NPR: "Nepalese Rupee",
    MMK: "Myanmar Kyat",
    KHR: "Cambodian Riel",
    LAK: "Lao Kip",
    BND: "Brunei Dollar",
  }
  return currencyNames[code as keyof typeof currencyNames] || code
}

interface SmartQuestionSetupProps {
  questionId: string
  onComplete: (
    generatedProperties: any,
    answers: Record<string, any>,
    requiredOverride?: boolean,
  ) => void
  onCancel: () => void
  hideButtons?: boolean
  initialSetupConfig?: Record<string, any>
  initialUIConfig?: Record<string, any>
  mode?: "add" | "edit"
}

const SmartQuestionSetup = ({
  questionId,
  onComplete,
  onCancel,
  hideButtons = false,
  initialSetupConfig = {},
  initialUIConfig = {},
  mode = "add",
}: SmartQuestionSetupProps) => {
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    // Initialize with initial config in edit mode, empty otherwise
    const initialAnswers = mode === "edit" ? { ...initialSetupConfig } : {}

    // Convert legacy comma-separated currency_options string to array format
    if (
      initialAnswers.currency_options &&
      typeof initialAnswers.currency_options === "string"
    ) {
      const currencyCodes = initialAnswers.currency_options
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c !== "")
      // Convert to array of objects format
      initialAnswers.currency_options = currencyCodes.map((code: string) => ({
        value: code,
        label: code,
      }))
    }

    return initialAnswers
  })
  const [showDueDateModal, setShowDueDateModal] = useState(false)
  const [showLoanDueDateModal, setShowLoanDueDateModal] = useState(false)
  const [currentConditionNumber, setCurrentConditionNumber] = useState(1)
  const isSavingRef = useRef(false)
  const hasCompletedRef = useRef(false)
  const answersRef = useRef(answers)

  // Keep answersRef in sync with answers
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Sync answers with initialSetupConfig when it changes in edit mode
  useEffect(() => {
    if (mode === "edit" && initialSetupConfig) {
      setAnswers((prev) => {
        // Merge with existing answers to preserve any user changes
        // but update with any new values from initialSetupConfig
        const updated = { ...prev, ...initialSetupConfig }

        // Convert legacy comma-separated currency_options string to array format
        if (
          updated.currency_options &&
          typeof updated.currency_options === "string"
        ) {
          const currencyCodes = updated.currency_options
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c !== "")
          // Convert to array of objects format
          updated.currency_options = currencyCodes.map((code: string) => ({
            value: code,
            label: code,
          }))
        }

        return updated
      })
    }
  }, [mode, initialSetupConfig])

  // Reset completion flag when component unmounts or mode changes
  useEffect(() => {
    hasCompletedRef.current = false
    isSavingRef.current = false
    return () => {
      hasCompletedRef.current = false
      isSavingRef.current = false
    }
  }, [mode])

  const smartQuestion = getSmartQuestion(
    questionId,
  ) as unknown as SmartQuestionDefinition

  // Memoize handleSave to prevent duplicate calls
  const handleSave = useCallback(() => {
    // Prevent duplicate saves
    if (isSavingRef.current || hasCompletedRef.current) {
      console.warn(
        "handleSave: Already saving or completed, ignoring duplicate call",
      )
      return
    }
    isSavingRef.current = true
    hasCompletedRef.current = true

    try {
      // All questions answered, generate properties and complete
      const generatedProperties = smartQuestion.generateProperties(
        answersRef.current,
      )

      // Determine required status based on mandatory settings in answers
      let requiredOverride: boolean | undefined = undefined
      const answers = answersRef.current

      // Check for mandatory/optional settings that should affect question required status
      // Name of Purchaser - collect_identification
      if (smartQuestion.id === "name_of_purchaser") {
        if (answers.collect_identification === "mandatory") {
          requiredOverride = true
        } else if (
          answers.collect_identification === "optional" ||
          answers.collect_identification === "no"
        ) {
          requiredOverride = false
        }
      }

      // Subject to Loan Approval - lender_details and attachments
      if (smartQuestion.id === "loan_approval") {
        if (
          answers.lender_details === "required" ||
          answers.attachments === "required"
        ) {
          requiredOverride = true
        } else if (
          answers.lender_details === "not_required" &&
          answers.attachments === "not_required"
        ) {
          requiredOverride = false
        }
      }

      // Evidence of Funds - evidence_of_funds
      if (smartQuestion.id === "evidence_of_funds") {
        if (answers.evidence_of_funds === "required") {
          requiredOverride = true
        } else if (
          answers.evidence_of_funds === "optional" ||
          answers.evidence_of_funds === "not_required"
        ) {
          requiredOverride = false
        }
      }

      onComplete(generatedProperties, answersRef.current, requiredOverride)
    } catch (error) {
      console.error("Error in handleSave:", error)
      isSavingRef.current = false
      hasCompletedRef.current = false
      throw error
    }

    // Reset after a delay to allow the save to complete
    // Note: hasCompletedRef stays true to prevent any further calls
    setTimeout(() => {
      isSavingRef.current = false
    }, 2000)
  }, [smartQuestion, onComplete])

  // Add event listener for external save trigger
  // This needs to be after canProceed is defined, so we'll use a ref-based approach
  const canProceedRef = useRef<(() => boolean) | null>(null)

  useEffect(() => {
    const handleExternalSave = () => {
      if (isSavingRef.current) return // Prevent duplicate saves
      // Always validate before saving, even in edit mode
      if (canProceedRef.current && canProceedRef.current()) {
        handleSave()
      }
    }

    window.addEventListener("smartQuestionSave", handleExternalSave)
    return () => {
      window.removeEventListener("smartQuestionSave", handleExternalSave)
    }
  }, [handleSave])

  // Ensure no currency fields are pre-populated on component mount
  // Only clear in "add" mode, not "edit" mode (where we want to preserve saved values)
  useEffect(() => {
    // Skip clearing in edit mode - we want to preserve the saved values
    if (mode === "edit") {
      return
    }

    // Force clear all currency fields by setting them to empty string
    const currencyFields = [
      "currency_options_1",
      "currency_options_2",
      "currency_options_1_instalment_1",
      "currency_options_2_instalment_1",
      "currency_options_1_instalment_2",
      "currency_options_2_instalment_2",
      "fixed_deposit_currency",
      "fixed_deposit_currency_instalment_1",
      "fixed_deposit_currency_instalment_2",
      "stipulated_currency",
      "stipulated_currency_instalment_1",
      "stipulated_currency_instalment_2",
    ]

    // Clear any cached currency values from localStorage and sessionStorage
    currencyFields.forEach((field) => {
      localStorage.removeItem(field)
      sessionStorage.removeItem(field)
    })

    // Force clear with a small delay to ensure it overrides any other initialization
    setTimeout(() => {
      setAnswers((prev) => {
        const newAnswers = { ...prev }
        currencyFields.forEach((field) => {
          // Only clear if the field doesn't already have a value from initialSetupConfig
          if (!initialSetupConfig[field]) {
            newAnswers[field] = "" // Force set to empty string
          }
        })
        return newAnswers
      })
    }, 100)
  }, [mode, initialSetupConfig])

  if (!smartQuestion) {
    return <div>Question not found</div>
  }

  const setupQuestions = smartQuestion.setupQuestions

  // Generate dynamic condition questions for other_conditions
  const getDynamicConditionQuestions = () => {
    const visibleQuestions: SetupQuestion[] = []

    // First, add the allow_custom_conditions question
    const allowCustomConditionsQuestion = setupQuestions.find(
      (q: SetupQuestion) => q.id === "allow_custom_conditions",
    )
    if (allowCustomConditionsQuestion) {
      const convertedQuestion: SetupQuestion = {
        id: allowCustomConditionsQuestion.id,
        question: allowCustomConditionsQuestion.question,
        type: allowCustomConditionsQuestion.type,
        required: allowCustomConditionsQuestion.required,
        placeholder: allowCustomConditionsQuestion.placeholder,
        options: allowCustomConditionsQuestion.options,
        defaultAnswer: allowCustomConditionsQuestion.defaultAnswer,
      }

      visibleQuestions.push(convertedQuestion)
      // Check if this question is answered - if not, stop here
      if (
        !answers[allowCustomConditionsQuestion.id] ||
        answers[allowCustomConditionsQuestion.id] === ""
      ) {
        return visibleQuestions // Return early if allow_custom_conditions is not answered
      }
    }

    // Then, show all fields for all conditions up to currentConditionNumber
    for (
      let conditionNumber = 1;
      conditionNumber <= currentConditionNumber;
      conditionNumber++
    ) {
      // Add condition name question
      const nameQuestion: SetupQuestion = {
        id: `condition_${conditionNumber}_name`,
        question: `Name for Condition ${conditionNumber}:`,
        type: "text",
        required: true,
        placeholder: "Enter condition name",
      }

      visibleQuestions.push(nameQuestion)

      // Add details question (always show)
      const detailsQuestion: SetupQuestion = {
        id: `condition_${conditionNumber}_details`,
        question: "Additional details",
        type: "text_area",
        required: false,
        placeholder: "Enter additional details (optional)",
      }

      visibleQuestions.push(detailsQuestion)

      // Add attachment field for this condition (always show)
      const attachmentQuestion: SetupQuestion = {
        id: `condition_${conditionNumber}_attachments`,
        question: "Attachments for this condition",
        type: "file_upload",
        required: false,
        placeholder: "Upload supporting documents (optional)",
      }

      visibleQuestions.push(attachmentQuestion)
    }

    return visibleQuestions
  }

  // Filter questions based on conditions and sequential display
  const getVisibleQuestions = () => {
    // If user selected "two_always", we need to reorder questions to show all single questions first, then all instalment 1 questions, then all instalment 2 questions
    if (answers.instalments === "two_always") {
      return getReorderedQuestionsForTwoInstalments()
    }

    // Handle dynamic condition questions for other_conditions
    if (smartQuestion.id === "other_conditions") {
      return getDynamicConditionQuestions()
    }

    const visibleQuestions: SetupQuestion[] = []

    for (let i = 0; i < setupQuestions.length; i++) {
      const question = setupQuestions[i]

      // Check if this question should be shown based on its conditions
      // Handle three possible formats:
      // 1. question.conditional or question.conditional_display with { dependsOn: string, showWhen: string }
      // 2. question.conditional or question.conditional_display with { dependsOn: { questionId, value } }
      // 3. question.dependsOn directly (from offerFormQuestions.ts format)

      const conditional = question.conditional || question.conditional_display
      const questionAny = question as any
      const directDependsOn = questionAny.dependsOn

      // If question has no conditional, conditional_display, or direct dependsOn, show it
      if (!conditional && !directDependsOn) {
        visibleQuestions.push(question)
        continue
      }

      // Determine dependsOnId and showWhenValue
      let dependsOnId: string
      let showWhenValue: string | string[]

      if (
        directDependsOn &&
        typeof directDependsOn === "object" &&
        "questionId" in directDependsOn
      ) {
        // Format 3: question.dependsOn directly (from offerFormQuestions.ts)
        dependsOnId = directDependsOn.questionId
        showWhenValue = directDependsOn.value
      } else if (conditional) {
        if (typeof conditional.dependsOn === "string") {
          // Format 1: { dependsOn: string, showWhen: string }
          dependsOnId = conditional.dependsOn
          showWhenValue = conditional.showWhen
        } else if (
          conditional.dependsOn &&
          typeof conditional.dependsOn === "object" &&
          "questionId" in conditional.dependsOn
        ) {
          // Format 2: { dependsOn: { questionId, value } }
          const dependsOnObj = conditional.dependsOn as any
          dependsOnId = dependsOnObj.questionId
          showWhenValue = dependsOnObj.value
        } else {
          continue
        }
      } else {
        continue
      }

      const dependentAnswer = answers[dependsOnId]

      let shouldShow = false
      if (Array.isArray(showWhenValue)) {
        shouldShow = showWhenValue.includes(dependentAnswer)
      } else {
        shouldShow = dependentAnswer === showWhenValue
      }

      if (shouldShow) {
        visibleQuestions.push(question)
        // Continue showing all questions regardless of answer status
        if (answers[question.id] && answers[question.id] !== "") {
          // Special check for currency_stipulation when 'options' is selected
          if (
            (question.id === "currency_stipulation" ||
              question.id === "currency_stipulation_instalment_1" ||
              question.id === "currency_stipulation_instalment_2") &&
            answers[question.id] === "options"
          ) {
            // Check if at least 2 currency options are selected
            let firstCurrencyId, secondCurrencyId
            if (question.id === "currency_stipulation") {
              firstCurrencyId = "currency_options_1"
              secondCurrencyId = "currency_options_2"
            } else if (question.id === "currency_stipulation_instalment_1") {
              firstCurrencyId = "currency_options_1_instalment_1"
              secondCurrencyId = "currency_options_2_instalment_1"
            } else if (question.id === "currency_stipulation_instalment_2") {
              firstCurrencyId = "currency_options_1_instalment_2"
              secondCurrencyId = "currency_options_2_instalment_2"
            }

            const firstCurrency = firstCurrencyId
              ? answers[firstCurrencyId]
              : undefined
            const secondCurrency = secondCurrencyId
              ? answers[secondCurrencyId]
              : undefined

            if (!firstCurrency || !secondCurrency) {
              // Currency options not fully selected yet
            }
          }

          // Special check for custom due date questions
          if (
            (question.id === "deposit_due" ||
              question.id === "deposit_due_instalment_1" ||
              question.id === "deposit_due_instalment_2") &&
            answers[question.id] === "custom"
          ) {
            const dueDateConfig = answers.due_date_config
            if (
              !dueDateConfig ||
              Object.keys(dueDateConfig).length === 0 ||
              !Object.values(dueDateConfig).some(
                (selections) =>
                  Array.isArray(selections) && selections.length > 0,
              )
            ) {
              // Custom due date not configured yet
            }
          }
        }
      }
      // If this question shouldn't be shown, continue to the next question
      // (don't break - this allows skipping questions that don't meet conditions)
    }

    return visibleQuestions
  }

  // Special function to reorder questions for two instalments
  const getReorderedQuestionsForTwoInstalments = () => {
    const visibleQuestions: SetupQuestion[] = []
    let foundUnansweredQuestion = false

    // Define the order: single questions first, then instalment 1, then instalment 2
    const questionOrder = [
      // Single instalment questions
      "instalments",
      "deposit_management",
      "fixed_deposit_amount",
      "fixed_deposit_currency",
      "fixed_deposit_percentage",
      "currency_stipulation",
      "currency_options_1",
      "currency_options_2",
      "stipulated_currency",
      "deposit_due",
      "seller_due_date_text",
      "deposit_holding",
      "deposit_holding_details",

      // Instalment 1 questions
      "deposit_management_instalment_1",
      "fixed_deposit_amount_instalment_1",
      "fixed_deposit_currency_instalment_1",
      "fixed_deposit_percentage_instalment_1",
      "currency_stipulation_instalment_1",
      "currency_options_1_instalment_1",
      "currency_options_2_instalment_1",
      "stipulated_currency_instalment_1",
      "deposit_due_instalment_1",
      "seller_due_date_text_instalment_1",
      "deposit_holding_instalment_1",
      "deposit_holding_details_instalment_1",

      // Instalment 2 questions
      "deposit_management_instalment_2",
      "fixed_deposit_amount_instalment_2",
      "fixed_deposit_currency_instalment_2",
      "fixed_deposit_percentage_instalment_2",
      "currency_stipulation_instalment_2",
      "currency_options_1_instalment_2",
      "currency_options_2_instalment_2",
      "stipulated_currency_instalment_2",
      "deposit_due_instalment_2",
      "seller_due_date_text_instalment_2",
      "deposit_holding_instalment_2",
      "deposit_holding_details_instalment_2",
    ]

    for (const questionId of questionOrder) {
      if (foundUnansweredQuestion) {
        return visibleQuestions
      }

      const question = setupQuestions.find(
        (q: SetupQuestion) => q.id === questionId,
      )
      if (!question) {
        continue
      }
      // Skip currency option fields as they're handled specially
      if (question.id.includes("currency_options_")) {
        continue
      }

      // If question has no conditional, show it
      if (!question.conditional) {
        visibleQuestions.push(question)
        // Check if this question is answered
        if (!answers[question.id] || answers[question.id] === "") {
          foundUnansweredQuestion = true
        }
        continue
      }

      // Check if this question should be shown based on its conditions
      const { dependsOn, showWhen } = question.conditional
      const dependentAnswer = answers[dependsOn]

      let shouldShow = false
      if (Array.isArray(showWhen)) {
        shouldShow = showWhen.includes(dependentAnswer)
      } else {
        shouldShow = dependentAnswer === showWhen
      }

      if (shouldShow) {
        visibleQuestions.push(question)
        // Check if this question is answered
        if (!answers[question.id] || answers[question.id] === "") {
          foundUnansweredQuestion = true
        } else {
          // Special check for currency stipulation questions
          if (
            question.id === "currency_stipulation" &&
            answers[question.id] === "options"
          ) {
            // Check if at least 2 currency options are selected
            if (
              !answers["currency_options_1"] ||
              !answers["currency_options_2"]
            ) {
              foundUnansweredQuestion = true
              break // Stop here until currencies are selected
            }
            // If 2 currencies are selected, we can proceed (don't require all 5)
          } else if (
            question.id === "currency_stipulation_instalment_1" &&
            answers[question.id] === "options"
          ) {
            // Check if at least 2 currency options are selected for instalment 1
            if (
              !answers["currency_options_1_instalment_1"] ||
              !answers["currency_options_2_instalment_1"]
            ) {
              foundUnansweredQuestion = true
              break // Stop here until currencies are selected
            }
          } else if (
            question.id === "currency_stipulation_instalment_2" &&
            answers[question.id] === "options"
          ) {
            // Check if at least 2 currency options are selected for instalment 2
            if (
              !answers["currency_options_1_instalment_2"] ||
              !answers["currency_options_2_instalment_2"]
            ) {
              foundUnansweredQuestion = true
              break // Stop here until currencies are selected
            }
          }

          // Special check for custom due date questions
          if (
            (question.id === "deposit_due" ||
              question.id === "deposit_due_instalment_1" ||
              question.id === "deposit_due_instalment_2") &&
            answers[question.id] === "custom"
          ) {
            const dueDateConfig = answers.due_date_config
            if (
              !dueDateConfig ||
              Object.keys(dueDateConfig).length === 0 ||
              !Object.values(dueDateConfig).some(
                (selections) =>
                  Array.isArray(selections) && selections.length > 0,
              )
            ) {
              foundUnansweredQuestion = true
            }
          }
        }
      }
    }

    return visibleQuestions
  }

  const visibleQuestions = getVisibleQuestions()

  const handleAddAnotherCondition = () => {
    if (smartQuestion.id === "other_conditions") {
      setCurrentConditionNumber((prev) => prev + 1)
    }
  }

  const handleFileUpload = (
    questionId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      setAnswers((prev) => ({
        ...prev,
        [questionId]: fileArray,
      }))
    }
    // Clear the input so the same files can be selected again
    event.target.value = ""
  }

  const handleRemoveFile = (questionId: string, fileIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId].filter(
        (_: any, index: number) => index !== fileIndex,
      ),
    }))
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    // Initialize currency_options when switching currency_stipulation to "options" for custom questions
    if (
      questionId === "currency_stipulation" &&
      value === "options" &&
      !answers["currency_options"]
    ) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: value,
        currency_options: [
          { value: "", label: "" },
          { value: "", label: "" },
        ],
      }))
      return
    }

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: value,
      }

      // If setting a currency field to empty, ensure it's truly empty
      if (questionId.includes("currency") && (!value || value === "")) {
        newAnswers[questionId] = ""
      }

      // Clear dependent fields when parent selection changes
      setupQuestions.forEach((question) => {
        const conditional = question.conditional || question.conditional_display
        const questionAny = question as any
        const directDependsOn = questionAny.dependsOn

        // Check if this question depends on the changed questionId
        let dependsOnId: string | undefined
        let showWhenValue: string | string[] | undefined

        if (
          directDependsOn &&
          typeof directDependsOn === "object" &&
          "questionId" in directDependsOn
        ) {
          dependsOnId = directDependsOn.questionId
          showWhenValue = directDependsOn.value
        } else if (conditional) {
          if (typeof conditional.dependsOn === "string") {
            dependsOnId = conditional.dependsOn
            showWhenValue = conditional.showWhen
          } else if (
            conditional.dependsOn &&
            typeof conditional.dependsOn === "object" &&
            "questionId" in conditional.dependsOn
          ) {
            const dependsOnObj = conditional.dependsOn as any
            dependsOnId = dependsOnObj.questionId
            showWhenValue = dependsOnObj.value
          }
        }

        if (dependsOnId === questionId) {
          const shouldShow = showWhenValue
            ? Array.isArray(showWhenValue)
              ? showWhenValue.includes(value)
              : value === showWhenValue
            : false

          // If the dependent field should not be shown, clear its value
          if (!shouldShow) {
            delete newAnswers[question.id]
          }
        }
      })

      // Special handling for other_conditions: increment condition number when "Add another condition" button is clicked
      // This will be handled by a separate function for the button click

      // Special handling for currency stipulation changes
      if (
        questionId === "currency_stipulation" ||
        questionId === "currency_stipulation_instalment_1" ||
        questionId === "currency_stipulation_instalment_2"
      ) {
        // For custom questions, initialize currency_options when switching to "options"
        if (questionId === "currency_stipulation" && value === "options") {
          if (!newAnswers["currency_options"]) {
            newAnswers["currency_options"] = [
              { value: "", label: "" },
              { value: "", label: "" },
            ]
          }
        }

        // Clear all currency options when currency stipulation changes
        const currencyOptionIds = []
        if (questionId === "currency_stipulation") {
          currencyOptionIds.push("currency_options_1", "currency_options_2")
        } else if (questionId === "currency_stipulation_instalment_1") {
          currencyOptionIds.push(
            "currency_options_1_instalment_1",
            "currency_options_2_instalment_1",
          )
        } else if (questionId === "currency_stipulation_instalment_2") {
          currencyOptionIds.push(
            "currency_options_1_instalment_2",
            "currency_options_2_instalment_2",
          )
        }

        currencyOptionIds.forEach((id) => {
          delete newAnswers[id]
        })
      }

      return newAnswers
    })

    // Auto-open DepositDueDateModal when "Something else" is selected
    if (
      (questionId === "deposit_due" ||
        questionId === "deposit_due_instalment_1" ||
        questionId === "deposit_due_instalment_2") &&
      value === "custom"
    ) {
      setShowDueDateModal(true)
    }

    // Auto-open LoanDueDateModal when "Something else" is selected for loan approval
    if (
      questionId === "due_date_management" &&
      value === "custom" &&
      smartQuestion.id === "loan_approval"
    ) {
      setShowLoanDueDateModal(true)
    }

    // Auto-open DepositDueDateModal when "CYO" is selected for settlement_date
    if (
      questionId === "due_date_management" &&
      value === "CYO" &&
      smartQuestion.id === "settlement_date"
    ) {
      setShowDueDateModal(true)
    }
  }

  interface DepositConfig {
    timeConstraint: string[]
    number: string[]
    timeUnit: string[]
    action: string[]
    trigger: string[]
  }

  // Handle due date configuration
  const handleDueDateConfig = (config: DepositConfig) => {
    const newAnswers = { ...answers, due_date_config: config }
    setAnswers(newAnswers)
  }

  // Handle loan due date configuration
  const handleLoanDueDateConfig = (config: DepositConfig) => {
    const newAnswers = { ...answers, loan_due_date_config: config }
    setAnswers(newAnswers)
  }

  // Handle settlement date configuration
  const handleSettlementDateConfig = (config: DepositConfig) => {
    const newAnswers = { ...answers, settlement_date_config: config }
    setAnswers(newAnswers)
  }

  const canProceed = () => {
    // Check if all visible questions are answered (excluding currency option fields)
    const visibleQuestions = getVisibleQuestions()
    const allQuestionsAnswered = visibleQuestions.every((question) => {
      // Skip currency option fields as they're handled specially
      if (question.id.includes("currency_options_")) {
        return true // Always consider currency option fields as "answered" for validation
      }

      // For Special Conditions, only require condition names to be filled
      if (smartQuestion.id === "other_conditions") {
        if (question.id.includes("_name")) {
          const value = answers[question.id]
          return value !== undefined && value !== ""
        } else {
          // For details and attachments, they're optional
          return true
        }
      }

      const value = answers[question.id]
      return value !== undefined && value !== ""
    })

    // Additional check: if any currency_stipulation is 'options', ensure currency options are filled
    const currencyStipulationQuestions = [
      "currency_stipulation",
      "currency_stipulation_instalment_1",
      "currency_stipulation_instalment_2",
    ]

    for (const stipulationId of currencyStipulationQuestions) {
      if (answers[stipulationId] === "options") {
        let firstCurrencyId, secondCurrencyId
        if (stipulationId === "currency_stipulation") {
          firstCurrencyId = "currency_options_1"
          secondCurrencyId = "currency_options_2"
        } else if (stipulationId === "currency_stipulation_instalment_1") {
          firstCurrencyId = "currency_options_1_instalment_1"
          secondCurrencyId = "currency_options_2_instalment_1"
        } else if (stipulationId === "currency_stipulation_instalment_2") {
          firstCurrencyId = "currency_options_1_instalment_2"
          secondCurrencyId = "currency_options_2_instalment_2"
        }

        const firstCurrency = firstCurrencyId
          ? answers[firstCurrencyId]
          : undefined
        const secondCurrency = secondCurrencyId
          ? answers[secondCurrencyId]
          : undefined

        if (!firstCurrency || !secondCurrency) {
          return false // Need at least 2 currency options
        }
      }
    }

    // Additional check: if any deposit_due question is set to 'custom',
    // ensure due_date_config exists and has selections
    const hasCustomDueDate = visibleQuestions.some(
      (question) =>
        (question.id === "deposit_due" ||
          question.id === "deposit_due_instalment_1" ||
          question.id === "deposit_due_instalment_2") &&
        answers[question.id] === "custom",
    )

    if (hasCustomDueDate) {
      const dueDateConfig = answers.due_date_config
      if (!dueDateConfig || Object.keys(dueDateConfig).length === 0) {
        return false // Custom due date selected but no configuration made
      }

      // Check if at least one field in the configuration has selections
      const hasSelections = Object.values(dueDateConfig).some(
        (selections) => Array.isArray(selections) && selections.length > 0,
      )

      if (!hasSelections) {
        return false // Configuration exists but no selections made
      }
    }

    // Additional check: if loan_approval due_date_management is set to 'custom',
    // ensure loan_due_date_config exists and has selections
    if (
      smartQuestion.id === "loan_approval" &&
      answers.due_date_management === "custom"
    ) {
      const loanDueDateConfig = answers.loan_due_date_config
      if (!loanDueDateConfig || Object.keys(loanDueDateConfig).length === 0) {
        return false // Custom due date selected but no configuration made
      }

      // Check if at least one field in the configuration has selections
      const hasSelections = Object.values(loanDueDateConfig).some(
        (selections) => Array.isArray(selections) && selections.length > 0,
      )

      if (!hasSelections) {
        return false // Configuration exists but no selections made
      }
    }

    // Additional check: if settlement_date due_date_management is set to 'CYO',
    // ensure settlement_date_config exists and has selections
    if (
      smartQuestion.id === "settlement_date" &&
      answers.due_date_management === "CYO"
    ) {
      const settlementDateConfig = answers.settlement_date_config
      if (
        !settlementDateConfig ||
        Object.keys(settlementDateConfig).length === 0
      ) {
        return false // Custom due date selected but no configuration made
      }

      // Check if at least one field in the configuration has selections
      const hasSelections = Object.values(settlementDateConfig).some(
        (selections) => Array.isArray(selections) && selections.length > 0,
      )

      if (!hasSelections) {
        return false // Configuration exists but no selections made
      }
    }

    // Additional check: if due_date_management is set to 'custom' for loan approval,
    // ensure loan_due_date_config exists and has selections
    const hasCustomLoanDueDate = visibleQuestions.some(
      (question) =>
        question.id === "due_date_management" &&
        answers[question.id] === "custom",
    )

    if (hasCustomLoanDueDate) {
      const loanDueDateConfig = answers.loan_due_date_config
      if (!loanDueDateConfig || Object.keys(loanDueDateConfig).length === 0) {
        return false // Custom loan due date selected but no configuration made
      }

      // Check if at least one field in the configuration has selections
      const hasSelections = Object.values(loanDueDateConfig).some(
        (selections) => Array.isArray(selections) && selections.length > 0,
      )

      if (!hasSelections) {
        return false // Configuration exists but no selections made
      }
    }

    // Special validation for Special Conditions: ensure at least the first condition name is filled
    if (smartQuestion.id === "other_conditions") {
      const firstConditionName = answers["condition_1_name"]
      if (!firstConditionName || firstConditionName.trim() === "") {
        return false // Need at least the first condition name
      }
    }

    // Special validation for Deposit questions: ensure all visible required fields are filled
    if (smartQuestion.id === "deposit") {
      // Check all visible questions for deposit-specific validation
      for (const question of visibleQuestions) {
        // Check if this is a required field that needs a value
        if (question.required !== false) {
          const value = answers[question.id]

          // Skip currency option fields as they're handled separately
          if (question.id.includes("currency_options_")) {
            continue
          }

          // Check if the field is empty
          if (value === undefined || value === "" || value === null) {
            return false
          }

          // Special validation for deposit_holding_details when deposit_holding is "stipulate"
          if (question.id.includes("deposit_holding_details")) {
            const holdingFieldId = question.id.replace("_details", "")
            if (answers[holdingFieldId] === "stipulate") {
              if (!value || value.trim() === "") {
                return false
              }
            }
          }

          // Special validation for fixed_deposit fields
          if (
            question.id.includes("fixed_deposit_amount") &&
            !question.id.includes("currency")
          ) {
            // If fixed_amount is selected, check for corresponding currency
            const currencyFieldId = question.id.replace("amount", "currency")
            const hasCurrencyField = visibleQuestions.some(
              (q) => q.id === currencyFieldId,
            )
            if (hasCurrencyField) {
              const currencyValue = answers[currencyFieldId]
              if (!currencyValue || currencyValue === "") {
                return false
              }
            }
          }
        }
      }
    }

    return allQuestionsAnswered
  }

  // Update the ref whenever canProceed function changes
  useEffect(() => {
    canProceedRef.current = canProceed
  }, [answers, currentConditionNumber]) // Dependencies that affect canProceed

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Question Setup: {smartQuestion.title}
        </h2>
      </div>

      <div className="space-y-6">
        {visibleQuestions.map((question) => {
          // Check if this is a fixed amount question and if there's a corresponding currency field
          const isFixedAmount = question.id.includes("fixed_deposit_amount")
          const currencyFieldId = question.id.replace("amount", "currency")
          const hasCurrencyField = visibleQuestions.some(
            (q) => q.id === currencyFieldId,
          )

          // Skip currency fields that will be displayed inline with amount fields
          if (question.id.includes("fixed_deposit_currency")) {
            return null
          }

          // Skip all currency option fields (1, 2, 3, 4, 5) as they're handled in the special layout
          // BUT allow currency_options for custom questions (it's a single field, not numbered)
          if (question.id.includes("currency_options_")) {
            return null
          }

          // Check if this is a currency stipulation question that should show the special currency options layout
          const isCurrencyOptions =
            (question.id === "currency_stipulation" ||
              question.id === "currency_stipulation_instalment_1" ||
              question.id === "currency_stipulation_instalment_2") &&
            answers[question.id] === "options"

          return (
            <div key={question.id} className="space-y-3">
              {/* Don't show label for currency_options - it's handled in the currency_options type rendering */}
              {question.id !== "currency_options" && (
                <h3 className="text-sm font-medium text-gray-900">
                  {question.question}
                </h3>
              )}

              {question.type === "radio" ? (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <div
                      key={
                        typeof option.value === "string"
                          ? option.value
                          : JSON.stringify(option.value)
                      }
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        id={`${question.id}-${typeof option.value === "string" ? option.value : JSON.stringify(option.value)}`}
                        name={question.id}
                        value={
                          typeof option.value === "string"
                            ? option.value
                            : JSON.stringify(option.value)
                        }
                        checked={
                          answers[question.id] ===
                          (typeof option.value === "string"
                            ? option.value
                            : JSON.stringify(option.value))
                        }
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.value)
                        }
                        className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor={`${question.id}-${typeof option.value === "string" ? option.value : JSON.stringify(option.value)}`}
                        className="cursor-pointer text-sm font-medium text-gray-900"
                      >
                        {typeof option.label === "string"
                          ? option.label
                          : getCurrencyDisplayName(option.value)}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : question.type === "select" ? (
                <Select
                  value={
                    typeof answers[question.id] === "string"
                      ? answers[question.id]
                      : ""
                  }
                  onValueChange={(value) =>
                    handleAnswerChange(question.id, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {question.options?.map((option) => (
                      <SelectItem
                        key={
                          typeof option.value === "string"
                            ? option.value
                            : JSON.stringify(option.value)
                        }
                        value={
                          typeof option.value === "string"
                            ? option.value
                            : JSON.stringify(option.value)
                        }
                      >
                        {typeof option.label === "string"
                          ? option.label
                          : getCurrencyDisplayName(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : question.type === "text" ? (
                <div
                  className={
                    isFixedAmount && hasCurrencyField ? "flex space-x-3" : ""
                  }
                >
                  <Input
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder={question.placeholder || "Enter value"}
                    className={
                      isFixedAmount && hasCurrencyField ? "w-1/4" : "w-full"
                    }
                  />
                  {isFixedAmount && hasCurrencyField && (
                    <Select
                      value={
                        typeof answers[currencyFieldId] === "string"
                          ? answers[currencyFieldId]
                          : ""
                      }
                      onValueChange={(value) =>
                        handleAnswerChange(currencyFieldId, value)
                      }
                    >
                      <SelectTrigger className="w-1/4">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleQuestions
                          .find((q) => q.id === currencyFieldId)
                          ?.options?.map((option) => (
                            <SelectItem
                              key={
                                typeof option.value === "string"
                                  ? option.value
                                  : JSON.stringify(option.value)
                              }
                              value={
                                typeof option.value === "string"
                                  ? option.value
                                  : JSON.stringify(option.value)
                              }
                            >
                              {typeof option.label === "string"
                                ? option.label
                                : getCurrencyDisplayName(option.value)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : question.type === "text_area" ? (
                <div className="space-y-3">
                  <Textarea
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder={question.placeholder || "Enter details"}
                    className="min-h-[100px] w-full"
                  />
                </div>
              ) : question.type === "file_upload" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() =>
                        document
                          .getElementById(`file-input-${question.id}`)
                          ?.click()
                      }
                    >
                      <span>📎</span>
                      Choose files (multiple allowed)
                    </Button>
                    <input
                      id={`file-input-${question.id}`}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => handleFileUpload(question.id, e)}
                      className="hidden"
                    />
                  </div>

                  {/* Display uploaded files */}
                  {answers[question.id] && answers[question.id].length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Uploaded files ({answers[question.id].length}):
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: [],
                            }))
                          }
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                      {answers[question.id].map((file: File, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFile(question.id, index)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : question.type === "option_list" ? (
                <div className="space-y-3">
                  {(() => {
                    const options = answers[question.id] || [
                      { value: "", label: "" },
                      { value: "", label: "" },
                    ]
                    const maxOptions = 25

                    return (
                      <div className="space-y-3">
                        {options.map(
                          (option: SmartQuestionOption, index: number) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3"
                            >
                              <Label className="min-w-[80px] text-sm font-medium text-gray-900">
                                Option {index + 1}:
                              </Label>
                              <Input
                                value={
                                  typeof option.label === "string"
                                    ? option.label
                                    : getCurrencyDisplayName(option.value) || ""
                                }
                                onChange={(e) => {
                                  const newOptions = [...options]
                                  newOptions[index] = {
                                    value: e.target.value
                                      .toLowerCase()
                                      .replace(/\s+/g, "_"),
                                    label: e.target.value,
                                  }
                                  handleAnswerChange(question.id, newOptions)
                                }}
                                placeholder={`Enter option ${index + 1}`}
                                className="flex-1"
                              />
                              {options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = options.filter(
                                      (_: any, i: number) => i !== index,
                                    )
                                    handleAnswerChange(question.id, newOptions)
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ),
                        )}

                        {options.length < maxOptions && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = [
                                ...options,
                                { value: "", label: "" },
                              ]
                              handleAnswerChange(question.id, newOptions)
                            }}
                            className="mt-2"
                          >
                            Add another Option
                          </Button>
                        )}

                        <p className="text-xs text-gray-500">
                          Maximum {maxOptions} options allowed
                        </p>
                      </div>
                    )
                  })()}
                </div>
              ) : question.type === "currency_options" ? (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="space-y-3">
                    {(() => {
                      const currencyOptions = answers[question.id] || [
                        { value: "", label: "" },
                        { value: "", label: "" },
                      ]
                      const maxCurrencies = 5
                      const validOptions = currencyOptions.filter(
                        (opt: any) => opt?.value && opt.value !== "",
                      )
                      const needsMore = validOptions.length < 2

                      // Currency options from the smartQuestions.js file
                      const allCurrencies = [
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
                        {
                          value: "BAM",
                          label: "BAM - Bosnia-Herzegovina Mark",
                        },
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
                        {
                          value: "XAF",
                          label: "XAF - Central African CFA Franc",
                        },
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
                      ]

                      return (
                        <>
                          <div className="mb-4">
                            <h3 className="mb-3 text-sm font-medium text-gray-900">
                              {question.question || "Currency Options"}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Select at least 2 currencies
                              </span>
                            </div>
                          </div>
                          {currencyOptions.map(
                            (currency: SmartQuestionOption, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="w-32 text-xs font-medium text-gray-700">
                                  Currency Option {index + 1}:
                                </span>
                                <Select
                                  value={currency.value || ""}
                                  onValueChange={(value) => {
                                    const newCurrencies = [...currencyOptions]
                                    const selectedCurrency = allCurrencies.find(
                                      (c) => c.value === value,
                                    )
                                    newCurrencies[index] = {
                                      value: value,
                                      label: selectedCurrency
                                        ? selectedCurrency.label
                                        : value,
                                    }
                                    handleAnswerChange(
                                      question.id,
                                      newCurrencies,
                                    )
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Currency" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    {allCurrencies.map((currencyOption) => (
                                      <SelectItem
                                        key={currencyOption.value}
                                        value={currencyOption.value}
                                      >
                                        {currencyOption.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {currencyOptions.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCurrencies =
                                        currencyOptions.filter(
                                          (_: any, i: number) => i !== index,
                                        )
                                      handleAnswerChange(
                                        question.id,
                                        newCurrencies,
                                      )
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ),
                          )}

                          {needsMore && (
                            <p className="text-xs text-amber-600">
                              Please select at least 2 currencies for buyers to
                              choose from.
                            </p>
                          )}

                          {currencyOptions.length < maxCurrencies && (
                            <button
                              type="button"
                              onClick={() => {
                                const newCurrencies = [
                                  ...currencyOptions,
                                  { value: "", label: "" },
                                ]
                                handleAnswerChange(question.id, newCurrencies)
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              + Add another Currency
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              ) : null}

              {/* Special rendering for currency options */}
              {isCurrencyOptions && (
                <div className="space-y-3">
                  {/* Always show first currency option */}
                  {(() => {
                    let currencyOptionId: string = ""
                    if (question.id === "currency_stipulation") {
                      currencyOptionId = `currency_options_1`
                    } else if (
                      question.id === "currency_stipulation_instalment_1"
                    ) {
                      currencyOptionId = `currency_options_1_instalment_1`
                    } else if (
                      question.id === "currency_stipulation_instalment_2"
                    ) {
                      currencyOptionId = `currency_options_1_instalment_2`
                    }

                    const currencyQuestion = setupQuestions.find(
                      (q) => q.id === currencyOptionId,
                    )

                    if (!currencyQuestion) return null

                    return (
                      <div
                        key={currencyOptionId}
                        className="flex items-center space-x-3"
                      >
                        <Label className="min-w-[120px] text-sm font-medium text-gray-900">
                          {currencyQuestion.question}:
                        </Label>
                        <Select
                          value={
                            typeof answers[currencyOptionId] === "string"
                              ? answers[currencyOptionId]
                              : ""
                          }
                          onValueChange={(value) =>
                            handleAnswerChange(currencyOptionId, value)
                          }
                        >
                          <SelectTrigger className="min-w-52">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencyQuestion.options?.map((option) => (
                              <SelectItem
                                key={
                                  typeof option.value === "string"
                                    ? option.value
                                    : option.value
                                }
                                value={
                                  typeof option.value === "string"
                                    ? option.value
                                    : option.value
                                }
                              >
                                {typeof option.label === "string"
                                  ? option.label
                                  : getCurrencyDisplayName(option.value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })()}

                  {/* Show second currency option only if first is selected */}
                  {(() => {
                    let firstCurrencyId: string = ""
                    if (question.id === "currency_stipulation") {
                      firstCurrencyId = `currency_options_1`
                    } else if (
                      question.id === "currency_stipulation_instalment_1"
                    ) {
                      firstCurrencyId = `currency_options_1_instalment_1`
                    } else if (
                      question.id === "currency_stipulation_instalment_2"
                    ) {
                      firstCurrencyId = `currency_options_1_instalment_2`
                    }

                    if (!answers[firstCurrencyId]) return null

                    let currencyOptionId: string = ""
                    if (question.id === "currency_stipulation") {
                      currencyOptionId = `currency_options_2`
                    } else if (
                      question.id === "currency_stipulation_instalment_1"
                    ) {
                      currencyOptionId = `currency_options_2_instalment_1`
                    } else if (
                      question.id === "currency_stipulation_instalment_2"
                    ) {
                      currencyOptionId = `currency_options_2_instalment_2`
                    }

                    const currencyQuestion = setupQuestions.find(
                      (q) => q.id === currencyOptionId,
                    )

                    if (!currencyQuestion) return null

                    return (
                      <div
                        key={currencyOptionId}
                        className="flex items-center space-x-3"
                      >
                        <Label className="min-w-[120px] text-sm font-medium text-gray-900">
                          {currencyQuestion.question}:
                        </Label>
                        <Select
                          value={
                            typeof answers[currencyOptionId] === "string"
                              ? answers[currencyOptionId]
                              : ""
                          }
                          onValueChange={(value) =>
                            handleAnswerChange(currencyOptionId, value)
                          }
                        >
                          <SelectTrigger className="min-w-52">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencyQuestion.options?.map((option) => (
                              <SelectItem
                                key={
                                  typeof option.value === "string"
                                    ? option.value
                                    : option.value
                                }
                                value={
                                  typeof option.value === "string"
                                    ? option.value
                                    : option.value
                                }
                              >
                                {typeof option.label === "string"
                                  ? option.label
                                  : getCurrencyDisplayName(option.value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Show Configure Custom Due Date button when deposit_due is set to 'custom' */}
              {(question.id === "deposit_due" ||
                question.id === "deposit_due_instalment_1" ||
                question.id === "deposit_due_instalment_2") &&
                answers[question.id] === "custom" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={() => setShowDueDateModal(true)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {!answers.due_date_config ||
                      Object.keys(answers.due_date_config).length === 0 ||
                      !Object.values(answers.due_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )
                        ? "Create Custom Due Date"
                        : "View/Edit Custom Due Date"}
                    </Button>

                    {/* Show warning if no configuration has been made */}
                    {(!answers.due_date_config ||
                      Object.keys(answers.due_date_config).length === 0 ||
                      !Object.values(answers.due_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )) && (
                      <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                        <p className="text-sm text-yellow-800">
                          ⚠️ You must configure your custom due date options
                          before proceeding.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Show Configure Custom Due Date button when due_date_management is set to 'custom' for loan approval */}
              {question.id === "due_date_management" &&
                answers[question.id] === "custom" &&
                smartQuestion.id === "loan_approval" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={() => setShowLoanDueDateModal(true)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {!answers.loan_due_date_config ||
                      Object.keys(answers.loan_due_date_config).length === 0 ||
                      !Object.values(answers.loan_due_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )
                        ? "Create Custom Due Date"
                        : "View/Edit Custom Due Date"}
                    </Button>

                    {/* Show warning if no configuration has been made */}
                    {(!answers.loan_due_date_config ||
                      Object.keys(answers.loan_due_date_config).length === 0 ||
                      !Object.values(answers.loan_due_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )) && (
                      <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                        <p className="text-sm text-yellow-800">
                          ⚠️ You must configure your custom due date options
                          before proceeding.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Show Configure Custom Due Date button when due_date_management is set to 'CYO' for settlement_date */}
              {question.id === "due_date_management" &&
                answers[question.id] === "CYO" &&
                smartQuestion.id === "settlement_date" && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={() => setShowDueDateModal(true)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {!answers.settlement_date_config ||
                      Object.keys(answers.settlement_date_config).length ===
                        0 ||
                      !Object.values(answers.settlement_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )
                        ? "Create Custom Due Date"
                        : "View/Edit Custom Due Date"}
                    </Button>

                    {/* Show warning if no configuration has been made */}
                    {(!answers.settlement_date_config ||
                      Object.keys(answers.settlement_date_config).length ===
                        0 ||
                      !Object.values(answers.settlement_date_config || {}).some(
                        (selections) =>
                          Array.isArray(selections) && selections.length > 0,
                      )) && (
                      <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                        <p className="text-sm text-yellow-800">
                          ⚠️ You must configure your custom due date options
                          before proceeding.
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )
        })}

        {/* Add another condition button for Special Conditions */}
        {smartQuestion.id === "other_conditions" &&
          visibleQuestions.length > 0 && (
            <div className="flex justify-start pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAnotherCondition}
                className="flex items-center gap-2"
              >
                <span>+</span>
                Add another condition
              </Button>
            </div>
          )}

        {!hideButtons && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="px-6">
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={!canProceed()}
              className="bg-green-600 px-6 hover:bg-green-700"
            >
              Add Question
            </Button>
          </div>
        )}
      </div>

      {/* Deposit Due Date Configuration Modal */}
      <DepositDueDateModal
        isOpen={showDueDateModal && smartQuestion.id !== "settlement_date"}
        onClose={() => setShowDueDateModal(false)}
        onSave={handleDueDateConfig}
        initialConfig={answers.due_date_config || {}}
      />

      {/* Settlement Date Configuration Modal */}
      <DepositDueDateModal
        isOpen={showDueDateModal && smartQuestion.id === "settlement_date"}
        onClose={() => setShowDueDateModal(false)}
        onSave={handleSettlementDateConfig}
        initialConfig={answers.settlement_date_config || {}}
        title="Settlement Date"
      />

      {/* Loan Due Date Configuration Modal */}
      <LoanDueDateModal
        isOpen={showLoanDueDateModal}
        onClose={() => setShowLoanDueDateModal(false)}
        onSave={handleLoanDueDateConfig}
        initialConfig={answers.loan_due_date_config || {}}
      />
    </div>
  )
}

export default SmartQuestionSetup
