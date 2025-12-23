"use client"
/* eslint-disable react/prop-types */

import DatePicker from "@/components/shared/forms/DatePicker"
import DateTimePicker from "@/components/shared/forms/DateTimePicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCY_OPTIONS } from "@/constants/offerFormQuestions"
import { getSmartQuestion } from "@/data/smartQuestions"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"
import {
  getSubQuestionLabel,
  getSubQuestionPlaceholder,
  parseUIConfig,
} from "@/types/questionUIConfig"
import { useEffect, useMemo, useState } from "react"

interface DepositQuestion {
  id: string
  question_text: string
  question_type: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  currency_field?: {
    type?: "select" | "display" | "multi_select"
    placeholder?: string
    options?: Array<{ value: string; label: string }>
    value?: string
  }
  conditional_currency?: {
    type?: "select" | "display" | "multi_select"
    placeholder?: string
    options?: Array<{ value: string; label: string }>
    value?: string
  }
  conditional_suffix?: string
  custom_config?: any
  config?: any
  value?: string
  select_options?: Array<{ value: string; label: string }>
  suffix?: string
}

interface Question {
  id: string
  type: string
  required: boolean
  is_essential?: boolean
  question_text?: string
  sub_questions?: Record<string, any>
  deposit_questions?: DepositQuestion[]
  uiConfig?: unknown // JSON field from database
  setupConfig?: unknown // JSON field from database
}

interface DepositFormProps {
  question: Question
  setupAnswers?: Record<string, any>
  onChange?: (data: Record<string, any>) => void
  editingMode?: boolean
  onEditQuestion?: ((questionId: string, currentText?: string) => void) | null
  onEditPlaceholder?:
    | ((questionId: string, currentText?: string) => void)
    | null
  brandingConfig?: BrandingConfig
}

const DepositForm = ({
  question,
  setupAnswers = {},
  onChange = () => {},
  editingMode = false,
  onEditQuestion = null,
  onEditPlaceholder = null,
  brandingConfig,
}: DepositFormProps) => {
  // Parse uiConfig using standardized type - re-parse when question.uiConfig changes
  // Use JSON.stringify to detect deep changes in the JSON object
  const uiConfigString = JSON.stringify(question.uiConfig || {})
  const uiConfig = useMemo(
    () => parseUIConfig(question.uiConfig),
    [uiConfigString],
  )
  const [localFormData, setLocalFormData] = useState<Record<string, any>>({})

  // Helper: Get input style with branding
  const getInputStyle = () => {
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
        borderWidth: "1px",
        borderStyle: "solid",
      }
    }
    // Don't override border color - let border-input class handle it
    // Only set background to ensure consistency (even in editing mode)
    return {
      backgroundColor: "#ffffff",
    }
  }

  // Helper: Get select style with branding (matching input border styling)
  const getSelectStyle = () => {
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
        borderWidth: "1px",
        borderStyle: "solid",
      }
    }
    // Don't override border color - let border-input class handle it to match input exactly
    // Only set background to ensure consistency (even in editing mode)
    return {
      backgroundColor: "#ffffff",
    }
  }

  // CRITICAL: Re-render when question prop changes to pick up updated text
  useEffect(() => {
    // This ensures the component re-renders when uiConfig, sub_questions, or question_text changes
    // No state updates needed here, just dependency tracking
  }, [question.uiConfig, question.sub_questions, question.question_text])

  // CRITICAL: Re-render when question prop changes to pick up updated text
  useEffect(() => {
    // This ensures the component re-renders when uiConfig, sub_questions, or question_text changes
    // No state updates needed here, just dependency tracking
  }, [question.uiConfig, question.sub_questions, question.question_text])

  // Initialize currency pairs for multi-select mode
  useEffect(() => {
    if (question.deposit_questions) {
      question.deposit_questions.forEach((depositQuestion) => {
        if (
          depositQuestion.currency_field?.type === "multi_select" &&
          depositQuestion.currency_field.options &&
          depositQuestion.currency_field.options.length >= 2
        ) {
          const pairsKey = `${depositQuestion.id}_pairs`
          const currentPairs = localFormData[pairsKey]
          if (
            !currentPairs ||
            !Array.isArray(currentPairs) ||
            currentPairs.length === 0
          ) {
            // Initialize with 2 pairs
            const initialPairs = [
              {
                amount: "",
                currency: depositQuestion.currency_field.options[0].value,
              },
              {
                amount: "",
                currency: depositQuestion.currency_field.options[1].value,
              },
            ]
            handleFieldChange(pairsKey, initialPairs)
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.deposit_questions])

  const handleFieldChange = (fieldId: string, value: any) => {
    const newFormData = {
      ...localFormData,
      [fieldId]: value,
    }
    setLocalFormData(newFormData)
    onChange(newFormData)
  }

  // Helper to generate currency field from setupAnswers
  const generateCurrencyField = (
    instalmentNumber?: number,
  ): {
    type?: "select" | "display" | "multi_select"
    placeholder?: string
    options?: Array<{ value: string; label: string }>
    value?: string
  } | null => {
    const suffix = instalmentNumber ? `_instalment_${instalmentNumber}` : ""
    const currencyStipulation =
      setupAnswers[`currency_stipulation${suffix}`] ||
      setupAnswers.currency_stipulation ||
      "any"

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
          currencyOptions.push({ value: currencyValue, label: currencyValue })
          i++
        } else {
          break
        }
      }
      // Ensure at least 2 options for multi-select mode
      if (currencyOptions.length >= 2) {
        return {
          type: "multi_select",
          placeholder: "Select currency",
          options: currencyOptions,
        }
      }
      // Fallback to single select if less than 2 options
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

    return null
  }

  // Generate additional questions based on instalments selection
  // This is only used for one_or_two and three_plus when user selects number of instalments
  const generateAdditionalQuestions = () => {
    const instalmentsValue = localFormData["deposit_instalments"]
    if (!instalmentsValue) return []

    // Don't generate if we already have instalment questions (e.g., for two_always)
    const hasInstalmentQuestions = question.deposit_questions?.some(
      (q: DepositQuestion) =>
        q.id?.includes("deposit_amount_1") ||
        q.id?.includes("deposit_amount_2") ||
        q.id?.includes("deposit_amount_3"),
    )
    if (hasInstalmentQuestions) return []

    const additionalQuestions = []

    // If user selected 1 instalment, show the standard deposit questions
    if (instalmentsValue === "1") {
      // Add deposit type question if needed
      if (setupAnswers.deposit_management === "buyer_choice") {
        const currencyField = generateCurrencyField()
        additionalQuestions.push({
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
        })
      }

      // Add deposit amount question with currency field if needed
      const depositManagement =
        setupAnswers.deposit_management || setupAnswers.amount_management
      const currencyField = generateCurrencyField()
      const depositAmountQuestion: DepositQuestion = {
        id: "deposit_amount",
        question_text: "What is your Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter deposit amount",
      }
      // Add currency field if deposit management requires it
      if (["buyer_enters", "buyer_percentage"].includes(depositManagement)) {
        depositAmountQuestion.currency_field = currencyField || undefined
      } else if (depositManagement === "buyer_choice") {
        depositAmountQuestion.conditional_currency = currencyField || undefined
        depositAmountQuestion.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion)

      // Add deposit due question
      additionalQuestions.push({
        id: "deposit_due",
        question_text: "When is your Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    // If user selected 2 instalments, show instalment-specific questions
    if (instalmentsValue === "2") {
      // First instalment
      // Add deposit type question if buyer_choice is enabled for instalment 1
      const depositManagement1 =
        setupAnswers.deposit_management_instalment_1 ||
        setupAnswers.deposit_management
      if (depositManagement1 === "buyer_choice") {
        const currencyField = generateCurrencyField(1)
        additionalQuestions.push({
          id: "deposit_type_instalment_1",
          question_text: "What will your Deposit be for Instalment 1?",
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

      // Add deposit amount question for instalment 1 with currency field if needed
      const currencyField1 = generateCurrencyField(1)
      const depositAmountQuestion1: DepositQuestion = {
        id: "deposit_amount_1",
        question_text: "What is your First Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter first deposit amount",
      }
      // Add currency field if deposit management requires it
      if (["buyer_enters", "buyer_percentage"].includes(depositManagement1)) {
        depositAmountQuestion1.currency_field = currencyField1 || undefined
      } else if (depositManagement1 === "buyer_choice") {
        depositAmountQuestion1.conditional_currency =
          currencyField1 || undefined
        depositAmountQuestion1.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion1)

      additionalQuestions.push({
        id: "deposit_due_1",
        question_text: "When is your First Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Second instalment
      // Add deposit type question if buyer_choice is enabled for instalment 2
      const depositManagement2 =
        setupAnswers.deposit_management_instalment_2 ||
        setupAnswers.deposit_management
      if (depositManagement2 === "buyer_choice") {
        const currencyField = generateCurrencyField(2)
        additionalQuestions.push({
          id: "deposit_type_instalment_2",
          question_text: "What will your Deposit be for Instalment 2?",
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

      // Add deposit amount question for instalment 2 with currency field if needed
      const currencyField2 = generateCurrencyField(2)
      const depositAmountQuestion2: DepositQuestion = {
        id: "deposit_amount_2",
        question_text: "What is your Second Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter second deposit amount",
      }
      // Add currency field if deposit management requires it
      if (["buyer_enters", "buyer_percentage"].includes(depositManagement2)) {
        depositAmountQuestion2.currency_field = currencyField2 || undefined
      } else if (depositManagement2 === "buyer_choice") {
        depositAmountQuestion2.conditional_currency =
          currencyField2 || undefined
        depositAmountQuestion2.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion2)

      additionalQuestions.push({
        id: "deposit_due_2",
        question_text: "When is your Second Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    // If user selected 3 instalments, show instalment-specific questions
    if (instalmentsValue === "3") {
      // First instalment
      // Add deposit type question if buyer_choice is enabled for instalment 1
      const depositManagement1For3 =
        setupAnswers.deposit_management_instalment_1 ||
        setupAnswers.deposit_management
      if (depositManagement1For3 === "buyer_choice") {
        const currencyField = generateCurrencyField(1)
        additionalQuestions.push({
          id: "deposit_type_instalment_1",
          question_text: "What will your Deposit be for Instalment 1?",
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

      // Add deposit amount question for instalment 1 with currency field if needed
      const currencyField1For3 = generateCurrencyField(1)
      const depositAmountQuestion1For3: DepositQuestion = {
        id: "deposit_amount_1",
        question_text: "What is your First Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter first deposit amount",
      }
      // Add currency field if deposit management requires it
      if (
        ["buyer_enters", "buyer_percentage"].includes(depositManagement1For3)
      ) {
        depositAmountQuestion1For3.currency_field =
          currencyField1For3 || undefined
      } else if (depositManagement1For3 === "buyer_choice") {
        depositAmountQuestion1For3.conditional_currency =
          currencyField1For3 || undefined
        depositAmountQuestion1For3.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion1For3)

      additionalQuestions.push({
        id: "deposit_due_1",
        question_text: "When is your First Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Second instalment
      // Add deposit type question if buyer_choice is enabled for instalment 2
      const depositManagement2For3 =
        setupAnswers.deposit_management_instalment_2 ||
        setupAnswers.deposit_management
      if (depositManagement2For3 === "buyer_choice") {
        const currencyField = generateCurrencyField(2)
        additionalQuestions.push({
          id: "deposit_type_instalment_2",
          question_text: "What will your Deposit be for Instalment 2?",
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

      // Add deposit amount question for instalment 2 with currency field if needed
      const currencyField2For3 = generateCurrencyField(2)
      const depositAmountQuestion2For3: DepositQuestion = {
        id: "deposit_amount_2",
        question_text: "What is your Second Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter second deposit amount",
      }
      // Add currency field if deposit management requires it
      if (
        ["buyer_enters", "buyer_percentage"].includes(depositManagement2For3)
      ) {
        depositAmountQuestion2For3.currency_field =
          currencyField2For3 || undefined
      } else if (depositManagement2For3 === "buyer_choice") {
        depositAmountQuestion2For3.conditional_currency =
          currencyField2For3 || undefined
        depositAmountQuestion2For3.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion2For3)

      additionalQuestions.push({
        id: "deposit_due_2",
        question_text: "When is your Second Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })

      // Third instalment
      // Add deposit type question if buyer_choice is enabled for instalment 3
      // Note: instalment 3 uses the same deposit_management as instalment 1 or 2, or falls back to main
      const depositManagement3 =
        setupAnswers.deposit_management_instalment_3 ||
        setupAnswers.deposit_management
      if (depositManagement3 === "buyer_choice") {
        const currencyField = generateCurrencyField(3)
        additionalQuestions.push({
          id: "deposit_type_instalment_3",
          question_text: "What will your Deposit be for Instalment 3?",
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

      // Add deposit amount question for instalment 3 with currency field if needed
      const currencyField3 = generateCurrencyField(3)
      const depositAmountQuestion3: DepositQuestion = {
        id: "deposit_amount_3",
        question_text: "What is your Third Deposit Amount?",
        question_type: "text",
        required: true,
        placeholder: "Enter third deposit amount",
      }
      // Add currency field if deposit management requires it
      if (["buyer_enters", "buyer_percentage"].includes(depositManagement3)) {
        depositAmountQuestion3.currency_field = currencyField3 || undefined
      } else if (depositManagement3 === "buyer_choice") {
        depositAmountQuestion3.conditional_currency =
          currencyField3 || undefined
        depositAmountQuestion3.conditional_suffix = "% of purchase price"
      }
      additionalQuestions.push(depositAmountQuestion3)

      additionalQuestions.push({
        id: "deposit_due_3",
        question_text: "When is your Third Deposit Due?",
        question_type: "date",
        required: true,
        placeholder: "Select date",
      })
    }

    return additionalQuestions
  }

  // CRITICAL: Helper Functions for Text Management
  // Now uses standardized uiConfig.subQuestions structure
  const getQuestionText = (
    questionId: string,
    fallbackText: string,
  ): string => {
    // First check standardized uiConfig.subQuestions (new structure)
    const subQuestionLabel = getSubQuestionLabel(uiConfig, questionId, "")
    if (subQuestionLabel) {
      return subQuestionLabel
    }

    // Legacy fallback: check setupConfig.sub_questions
    const setupConfig = (question.setupConfig as Record<string, any>) || {}
    if (
      setupConfig.sub_questions &&
      setupConfig.sub_questions[`sub_question_text_${questionId}`]
    ) {
      return setupConfig.sub_questions[`sub_question_text_${questionId}`]
    }

    // Legacy fallback: check question.sub_questions
    if (
      question.sub_questions &&
      question.sub_questions[`sub_question_text_${questionId}`]
    ) {
      return question.sub_questions[`sub_question_text_${questionId}`]
    }

    // Then check if there's a version in deposit_questions (generated from setupConfig)
    if (question.deposit_questions) {
      const depositQuestion = question.deposit_questions.find(
        (q: DepositQuestion) => q.id === questionId,
      )
      if (depositQuestion && depositQuestion.question_text) {
        return depositQuestion.question_text
      }
    }
    return fallbackText
  }

  const getPlaceholderText = (
    questionId: string,
    fallbackText: string,
  ): string => {
    // First check standardized uiConfig.subQuestions (new structure)
    const subQuestionPlaceholder = getSubQuestionPlaceholder(
      uiConfig,
      questionId,
      "",
    )
    if (subQuestionPlaceholder) {
      return subQuestionPlaceholder
    }

    // Legacy fallback: check setupConfig.sub_questions
    const setupConfig = (question.setupConfig as Record<string, any>) || {}
    if (
      setupConfig.sub_questions &&
      setupConfig.sub_questions[`sub_question_placeholder_${questionId}`]
    ) {
      return setupConfig.sub_questions[`sub_question_placeholder_${questionId}`]
    }

    // Legacy fallback: check question.sub_questions
    if (
      question.sub_questions &&
      question.sub_questions[`sub_question_placeholder_${questionId}`]
    ) {
      return question.sub_questions[`sub_question_placeholder_${questionId}`]
    }

    // Then check if there's a version in deposit_questions (generated from setupConfig)
    if (question.deposit_questions) {
      const depositQuestion = question.deposit_questions.find(
        (q: DepositQuestion) => q.id === questionId,
      )
      if (depositQuestion && depositQuestion.placeholder) {
        return depositQuestion.placeholder
      }
    }
    return fallbackText
  }

  const getMainQuestionText = (): string => {
    return question.question_text || "Deposit Details"
  }

  // Render custom due date section for "Create Your Own" functionality
  const renderCustomDueDate = (config: any) => {
    if (!config) return null

    const { timeConstraint, number, timeUnit, action, trigger } = config

    // Helper function to format text (replace underscores with spaces and capitalize)
    const formatText = (text: string): string => {
      if (!text) return ""
      return text
        .replace(/_/g, " ") // Replace underscores with spaces
        .split(" ")
        .map(
          (word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    }

    // Helper function to render a section (static text or dropdown)
    const renderSection = (sectionData: string[]) => {
      if (!sectionData || !Array.isArray(sectionData)) return null

      if (sectionData.length === 1) {
        // Single selection - show as static text with proper formatting
        return <span className="font-medium">{formatText(sectionData[0])}</span>
      } else if (sectionData.length > 1) {
        // Multiple selections - show as dropdown
        return (
          <Select>
            <SelectTrigger className="w-full max-w-xs" style={getSelectStyle()}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {sectionData.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {formatText(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      return null
    }

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
          {renderSection(timeConstraint)}
          {renderSection(number)}
          {renderSection(timeUnit)}
          {renderSection(action)}
          {renderSection(trigger)}
        </div>
      </div>
    )
  }

  // Render the deposit questions generated by the smart question configuration
  const renderDepositQuestions = () => {
    if (
      !question.deposit_questions ||
      question.deposit_questions.length === 0
    ) {
      return null
    }

    // Start with all original questions from smartQuestions.generateProperties
    const originalQuestions = question.deposit_questions

    // Determine if we need to generate additional questions dynamically
    // For two_always: questions are already generated in generateProperties, use them directly
    // For one_or_two/three_plus: need to generate questions based on user's instalment selection
    const instalmentsValue = localFormData["deposit_instalments"]
    const isTwoAlways = setupAnswers.instalments === "two_always"
    const isOneOrTwoOrThreePlus =
      setupAnswers.instalments === "one_or_two" ||
      setupAnswers.instalments === "three_plus"

    // Check if we already have instalment questions (for two_always or if already generated)
    const hasInstalmentQuestions = originalQuestions.some(
      (q: DepositQuestion) =>
        q.id?.includes("deposit_amount_1") ||
        q.id?.includes("deposit_amount_2") ||
        q.id?.includes("deposit_amount_3"),
    )

    let allQuestions = originalQuestions

    // Only generate additional questions if:
    // 1. It's one_or_two or three_plus (not two_always)
    // 2. User has selected number of instalments
    // 3. Questions haven't been generated yet
    if (isOneOrTwoOrThreePlus && instalmentsValue && !hasInstalmentQuestions) {
      // Use smartQuestions to generate instalment questions dynamically
      const depositSmartQuestion = getSmartQuestion("deposit")
      if (
        depositSmartQuestion &&
        depositSmartQuestion.generateInstalmentQuestions
      ) {
        // Create a modified setupAnswers with the selected instalments
        const modifiedSetupAnswers = {
          ...setupAnswers,
          instalments: setupAnswers.instalments, // Keep original
        }
        const generatedQuestions =
          depositSmartQuestion.generateInstalmentQuestions(
            modifiedSetupAnswers,
            instalmentsValue,
          )
        // Keep the instalments selector visible and add generated questions
        allQuestions = [...originalQuestions, ...generatedQuestions]
      } else {
        // Fallback to generateAdditionalQuestions if smartQuestions method not available
        const additionalQuestions = generateAdditionalQuestions()
        allQuestions = [...originalQuestions, ...additionalQuestions]
      }
    }
    // For two_always, use the questions directly from originalQuestions (already generated)

    return allQuestions.map(
      (depositQuestion: DepositQuestion, index: number) => {
        const { id, question_text, question_type, options, placeholder } =
          depositQuestion

        const labelClassName =
          editingMode && onEditQuestion
            ? "text-sm font-medium text-gray-700 cursor-pointer hover:text-[#08b79d] hover:underline p-2 rounded transition-colors"
            : "text-sm font-medium text-gray-700"

        // Use helper functions to get the current text (including any edits)
        const currentQuestionText = getQuestionText(id, question_text)
        const currentPlaceholder = getPlaceholderText(id, placeholder as string)

        return (
          <div key={id || index} className="space-y-2">
            <Label
              className={labelClassName}
              onClick={() => {
                if (editingMode && onEditQuestion) {
                  // Use the question ID directly (e.g., "deposit_amount", "deposit_due")
                  // The handler will detect it's a sub-question and save to uiConfig.subQuestions
                  onEditQuestion(id, currentQuestionText)
                }
              }}
              title={editingMode ? "Click to edit question text" : ""}
            >
              {currentQuestionText}
              {question.is_essential && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>

            {question_type === "text" && (
              <div className="space-y-1 pt-1.5">
                {/* Check if this question has a currency field */}
                {depositQuestion.currency_field ? (
                  <div className="space-y-2">
                    {/* Amount input with currency */}
                    <div className="flex items-center gap-3">
                      <div className="relative max-w-md flex-1">
                        <Input
                          type="number"
                          min="0"
                          placeholder={currentPlaceholder || "Enter value"}
                          value={localFormData[id] || ""}
                          onChange={(e) =>
                            handleFieldChange(id, e.target.value)
                          }
                          disabled={false}
                          className={cn(
                            editingMode ? "cursor-not-allowed" : "",
                            "w-full",
                            depositQuestion.currency_field.type === "display" &&
                              "pr-12", // Add padding for currency decorator
                          )}
                          style={getInputStyle()}
                        />
                        {/* Currency decorator for fixed mode (like offerAmount) */}
                        {depositQuestion.currency_field.type === "display" && (
                          <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                            {depositQuestion.currency_field.value || "N/A"}
                          </div>
                        )}
                        {/* Edit overlay - adjust right padding for fixed currency mode */}
                        {editingMode &&
                        depositQuestion.currency_field.type === "display" &&
                        onEditPlaceholder ? (
                          <div
                            className="absolute inset-0 right-12 z-20 cursor-pointer bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onEditPlaceholder) {
                                onEditPlaceholder(id, currentPlaceholder)
                              }
                            }}
                            title="Click to edit placeholder text"
                          />
                        ) : editingMode ? (
                          <div
                            className="absolute inset-0 cursor-pointer bg-transparent"
                            onClick={() => {
                              if (onEditPlaceholder) {
                                onEditPlaceholder(id, currentPlaceholder)
                              }
                            }}
                            title="Click to edit placeholder text"
                          />
                        ) : null}
                      </div>
                      {/* Single currency dropdown (for "any" mode) */}
                      {depositQuestion.currency_field.type === "select" && (
                        <Select
                          value={localFormData[`${id}_currency`] || ""}
                          onValueChange={(value) =>
                            handleFieldChange(`${id}_currency`, value)
                          }
                          disabled={false}
                        >
                          <SelectTrigger
                            className="w-full max-w-xs"
                            style={getSelectStyle()}
                          >
                            <SelectValue
                              placeholder={
                                depositQuestion.currency_field.placeholder ||
                                "Currency"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {depositQuestion.currency_field.options?.map(
                              (option: { value: string; label: string }) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {/* Multiple currency/amount pairs (for "options" mode with 2+ currencies) */}
                    {depositQuestion.currency_field.type === "multi_select" &&
                      depositQuestion.currency_field.options &&
                      depositQuestion.currency_field.options.length >= 2 && (
                        <div className="space-y-3">
                          {(
                            localFormData[`${id}_pairs`] || [
                              {
                                amount: "",
                                currency:
                                  depositQuestion.currency_field.options[0]
                                    .value,
                              },
                              {
                                amount: "",
                                currency:
                                  depositQuestion.currency_field.options[1]
                                    .value,
                              },
                            ]
                          ).map(
                            (
                              pair: { amount: string; currency: string },
                              index: number,
                            ) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                {/* Currency Selector */}
                                <Select
                                  value={pair.currency || ""}
                                  onValueChange={(value) => {
                                    const currentPairs =
                                      localFormData[`${id}_pairs`] || []
                                    const newPairs = [...currentPairs]
                                    newPairs[index] = {
                                      ...newPairs[index],
                                      currency: value,
                                    }
                                    handleFieldChange(`${id}_pairs`, newPairs)
                                  }}
                                  disabled={false}
                                >
                                  <SelectTrigger
                                    className="w-full max-w-xs"
                                    style={getSelectStyle()}
                                  >
                                    <SelectValue placeholder="Currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {depositQuestion.currency_field?.options?.map(
                                      (opt: {
                                        value: string
                                        label: string
                                      }) => (
                                        <SelectItem
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                {/* Amount Input */}
                                <div className="relative max-w-md flex-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder={
                                      currentPlaceholder || "Enter amount"
                                    }
                                    value={pair.amount || ""}
                                    onChange={(e) => {
                                      const currentPairs =
                                        localFormData[`${id}_pairs`] || []
                                      const newPairs = [...currentPairs]
                                      newPairs[index] = {
                                        ...newPairs[index],
                                        amount: e.target.value,
                                      }
                                      handleFieldChange(`${id}_pairs`, newPairs)
                                    }}
                                    disabled={false}
                                    className="w-full"
                                    style={getInputStyle()}
                                  />
                                </div>
                                {/* Remove button (only show if more than 2 pairs) */}
                                {(() => {
                                  const currentPairs =
                                    localFormData[`${id}_pairs`] || []
                                  return (
                                    currentPairs.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentPairs =
                                            localFormData[`${id}_pairs`] || []
                                          const newPairs = currentPairs.filter(
                                            (_: any, i: number) => i !== index,
                                          )
                                          handleFieldChange(
                                            `${id}_pairs`,
                                            newPairs,
                                          )
                                        }}
                                        className="text-sm text-red-600 hover:text-red-700"
                                      >
                                        Remove
                                      </button>
                                    )
                                  )
                                })()}
                              </div>
                            ),
                          )}
                          {/* Add Another Currency button */}
                          <button
                            type="button"
                            onClick={() => {
                              const currentPairs =
                                localFormData[`${id}_pairs`] || []
                              const defaultCurrency =
                                depositQuestion.currency_field?.options?.[0]
                                  ?.value || "USD"
                              const newPairs = [
                                ...currentPairs,
                                { amount: "", currency: defaultCurrency },
                              ]
                              handleFieldChange(`${id}_pairs`, newPairs)
                            }}
                            className="text-xs text-green-600 hover:text-green-700"
                          >
                            + Add another Currency
                          </button>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="relative max-w-md">
                    <Input
                      placeholder={currentPlaceholder || "Enter value"}
                      value={localFormData[id] || ""}
                      onChange={(e) => handleFieldChange(id, e.target.value)}
                      disabled={false}
                      className={cn(
                        editingMode ? "cursor-not-allowed" : "",
                        "w-full",
                      )}
                      style={getInputStyle()}
                    />
                    {editingMode && (
                      <div
                        className="absolute inset-0 cursor-pointer bg-transparent"
                        onClick={() => {
                          if (onEditPlaceholder) {
                            onEditPlaceholder(
                              `sub_question_placeholder_${id}`,
                              currentPlaceholder || "",
                            )
                          }
                        }}
                        title="Click to edit placeholder text"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {question_type === "select" && (
              <div className="space-y-2 pt-1.5">
                <Select
                  value={localFormData[id] || ""}
                  onValueChange={(value) => handleFieldChange(id, value)}
                  disabled={false}
                >
                  <SelectTrigger
                    className="w-full max-w-md"
                    style={getSelectStyle()}
                  >
                    <SelectValue
                      placeholder={currentPlaceholder || "Select option"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // If this is deposit_instalments and options are missing, generate them
                      if (
                        id === "deposit_instalments" &&
                        (!options || options.length === 0)
                      ) {
                        const instalmentsSetup = setupAnswers?.instalments_setup
                        let generatedOptions: Array<{
                          value: string
                          label: string
                        }> = []

                        if (instalmentsSetup === "two_always") {
                          generatedOptions = [
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                          ]
                        } else if (instalmentsSetup === "one_or_two") {
                          generatedOptions = [
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                          ]
                        } else if (instalmentsSetup === "three_plus") {
                          generatedOptions = [
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                          ]
                        } else {
                          // Default fallback
                          generatedOptions = [
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                          ]
                        }

                        return generatedOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      }

                      // Use provided options
                      return (
                        options?.map(
                          (option: { value: string; label: string }) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ),
                        ) || []
                      )
                    })()}
                  </SelectContent>
                </Select>

                {/* Show conditional currency field if this is deposit_type and user selected 'amount' */}
                {(id === "deposit_type" ||
                  id === "deposit_type_instalment_1" ||
                  id === "deposit_type_instalment_2" ||
                  id === "deposit_type_instalment_3") &&
                  localFormData[id] === "amount" &&
                  depositQuestion.conditional_currency && (
                    <div className="space-y-2">
                      {/* Amount input with currency */}
                      <div className="flex items-center gap-3">
                        <div className="relative max-w-xs flex-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Enter amount"
                            value={
                              localFormData[
                                id === "deposit_type"
                                  ? "deposit_amount"
                                  : `deposit_amount_${id.replace(
                                      "deposit_type_instalment_",
                                      "",
                                    )}`
                              ] || ""
                            }
                            onChange={(e) =>
                              handleFieldChange(
                                id === "deposit_type"
                                  ? "deposit_amount"
                                  : `deposit_amount_${id.replace(
                                      "deposit_type_instalment_",
                                      "",
                                    )}`,
                                e.target.value,
                              )
                            }
                            disabled={false}
                            className={cn(
                              editingMode ? "cursor-not-allowed" : "",
                              "w-full",
                              depositQuestion.conditional_currency.type ===
                                "display" && "pr-12", // Add padding for currency decorator
                            )}
                            style={getInputStyle()}
                          />
                          {/* Currency decorator for fixed mode (like offerAmount) */}
                          {depositQuestion.conditional_currency.type ===
                            "display" && (
                            <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                              {depositQuestion.conditional_currency.value ||
                                "N/A"}
                            </div>
                          )}
                        </div>
                        {/* Single currency dropdown (for "any" mode) */}
                        {depositQuestion.conditional_currency.type ===
                          "select" && (
                          <Select
                            value={
                              localFormData[
                                id === "deposit_type"
                                  ? "deposit_amount_currency"
                                  : `deposit_amount_${id.replace(
                                      "deposit_type_instalment_",
                                      "",
                                    )}_currency`
                              ] || ""
                            }
                            onValueChange={(value) =>
                              handleFieldChange(
                                id === "deposit_type"
                                  ? "deposit_amount_currency"
                                  : `deposit_amount_${id.replace(
                                      "deposit_type_instalment_",
                                      "",
                                    )}_currency`,
                                value,
                              )
                            }
                            disabled={false}
                          >
                            <SelectTrigger
                              className="w-full max-w-xs"
                              style={getSelectStyle()}
                            >
                              <SelectValue
                                placeholder={
                                  depositQuestion.conditional_currency
                                    .placeholder || "Currency"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {depositQuestion.conditional_currency.options?.map(
                                (option: { value: string; label: string }) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {/* Multiple currency dropdowns (for "options" mode) */}
                      {depositQuestion.conditional_currency.type ===
                        "multi_select" &&
                        depositQuestion.conditional_currency.options &&
                        depositQuestion.conditional_currency.options.length >=
                          2 && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {depositQuestion.conditional_currency.options.map(
                                (
                                  option: { value: string; label: string },
                                  index: number,
                                ) => (
                                  <div
                                    key={option.value}
                                    className="flex items-center gap-2"
                                  >
                                    <Select
                                      value={
                                        localFormData[
                                          id === "deposit_type"
                                            ? `deposit_amount_currency_${index}`
                                            : `deposit_amount_${id.replace(
                                                "deposit_type_instalment_",
                                                "",
                                              )}_currency_${index}`
                                        ] || ""
                                      }
                                      onValueChange={(value) =>
                                        handleFieldChange(
                                          id === "deposit_type"
                                            ? `deposit_amount_currency_${index}`
                                            : `deposit_amount_${id.replace(
                                                "deposit_type_instalment_",
                                                "",
                                              )}_currency_${index}`,
                                          value,
                                        )
                                      }
                                      disabled={false}
                                    >
                                      <SelectTrigger
                                        className="w-full max-w-xs"
                                        style={getSelectStyle()}
                                      >
                                        <SelectValue
                                          placeholder={
                                            depositQuestion.conditional_currency
                                              ?.placeholder || "Currency"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {depositQuestion.conditional_currency?.options?.map(
                                          (opt: {
                                            value: string
                                            label: string
                                          }) => (
                                            <SelectItem
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {index <
                                      (depositQuestion.conditional_currency
                                        ?.options?.length || 0) -
                                        1 && (
                                      <span className="text-sm text-gray-500">
                                        or
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Add another currency option
                                // This would need to be handled by the parent component
                                // For now, we'll just show the button
                              }}
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              + Add another Currency
                            </button>
                          </div>
                        )}
                    </div>
                  )}

                {/* Show conditional suffix if this is deposit_type and user selected 'percentage' */}
                {(id === "deposit_type" ||
                  id === "deposit_type_instalment_1" ||
                  id === "deposit_type_instalment_2" ||
                  id === "deposit_type_instalment_3") &&
                  localFormData[id] === "percentage" &&
                  depositQuestion.conditional_suffix && (
                    <div className="flex items-center gap-3">
                      <div className="relative max-w-xs flex-1">
                        <Input
                          placeholder="Enter percentage"
                          value={
                            localFormData[
                              id === "deposit_type"
                                ? "deposit_percentage"
                                : `deposit_percentage_${id.replace(
                                    "deposit_type_instalment_",
                                    "",
                                  )}`
                            ] || ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              id === "deposit_type"
                                ? "deposit_percentage"
                                : `deposit_percentage_${id.replace(
                                    "deposit_type_instalment_",
                                    "",
                                  )}`,
                              e.target.value,
                            )
                          }
                          disabled={false}
                          className={cn(
                            editingMode ? "cursor-not-allowed" : "",
                            "w-full",
                          )}
                          style={getInputStyle()}
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium whitespace-nowrap text-gray-700">
                          {depositQuestion.conditional_suffix}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {question_type === "calendar" && (
              <div className="max-w-md">
                <DatePicker
                  brandingConfig={brandingConfig}
                  value={
                    localFormData[id] ? new Date(localFormData[id]) : undefined
                  }
                  onChange={(date) => {
                    handleFieldChange(id, date ? date.toISOString() : null)
                  }}
                />
              </div>
            )}

            {question_type === "date" && (
              <div className="space-y-1 pt-1.5">
                <div className="relative max-w-md">
                  <DatePicker
                    brandingConfig={brandingConfig}
                    value={
                      localFormData[id]
                        ? new Date(localFormData[id])
                        : undefined
                    }
                    onChange={(date) => {
                      handleFieldChange(id, date ? date.toISOString() : null)
                    }}
                  />
                </div>
              </div>
            )}

            {question_type === "datetime" && (
              <div className="space-y-1">
                <div className="relative max-w-md">
                  {(() => {
                    // Parse datetime-local string to Date and time string
                    const datetimeValue = localFormData[id]
                    let dateValue: Date | undefined
                    let timeValue: string | undefined

                    if (datetimeValue) {
                      try {
                        const date = new Date(datetimeValue)
                        if (!isNaN(date.getTime())) {
                          dateValue = date
                          // Extract time in HH:MM format
                          const hours = date
                            .getHours()
                            .toString()
                            .padStart(2, "0")
                          const minutes = date
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")
                          timeValue = `${hours}:${minutes}`
                        }
                      } catch (e) {
                        // If parsing fails, try to parse as datetime-local format
                        const match = datetimeValue.match(
                          /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/,
                        )
                        if (match) {
                          dateValue = new Date(match[1])
                          timeValue = match[2]
                        }
                      }
                    }

                    return (
                      <DateTimePicker
                        dateValue={dateValue}
                        timeValue={timeValue}
                        onDateChange={(date) => {
                          // Combine date and time back to datetime-local format
                          if (date && timeValue) {
                            const [hours, minutes] = timeValue.split(":")
                            const combinedDate = new Date(date)
                            combinedDate.setHours(parseInt(hours || "0", 10))
                            combinedDate.setMinutes(
                              parseInt(minutes || "0", 10),
                            )
                            // Format as YYYY-MM-DDTHH:mm
                            const year = combinedDate.getFullYear()
                            const month = (combinedDate.getMonth() + 1)
                              .toString()
                              .padStart(2, "0")
                            const day = combinedDate
                              .getDate()
                              .toString()
                              .padStart(2, "0")
                            const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
                            handleFieldChange(
                              id,
                              `${year}-${month}-${day}T${formattedTime}`,
                            )
                          } else if (date) {
                            // Only date, no time
                            const year = date.getFullYear()
                            const month = (date.getMonth() + 1)
                              .toString()
                              .padStart(2, "0")
                            const day = date
                              .getDate()
                              .toString()
                              .padStart(2, "0")
                            handleFieldChange(
                              id,
                              `${year}-${month}-${day}T00:00`,
                            )
                          } else {
                            handleFieldChange(id, null)
                          }
                        }}
                        onTimeChange={(time) => {
                          // Combine date and time back to datetime-local format
                          if (dateValue && time) {
                            const [hours, minutes] = time.split(":")
                            const combinedDate = new Date(dateValue)
                            combinedDate.setHours(parseInt(hours || "0", 10))
                            combinedDate.setMinutes(
                              parseInt(minutes || "0", 10),
                            )
                            // Format as YYYY-MM-DDTHH:mm
                            const year = combinedDate.getFullYear()
                            const month = (combinedDate.getMonth() + 1)
                              .toString()
                              .padStart(2, "0")
                            const day = combinedDate
                              .getDate()
                              .toString()
                              .padStart(2, "0")
                            const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
                            handleFieldChange(
                              id,
                              `${year}-${month}-${day}T${formattedTime}`,
                            )
                          } else if (time) {
                            // Only time, use today's date
                            const today = new Date()
                            const [hours, minutes] = time.split(":")
                            const year = today.getFullYear()
                            const month = (today.getMonth() + 1)
                              .toString()
                              .padStart(2, "0")
                            const day = today
                              .getDate()
                              .toString()
                              .padStart(2, "0")
                            const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
                            handleFieldChange(
                              id,
                              `${year}-${month}-${day}T${formattedTime}`,
                            )
                          } else {
                            // Clear time but keep date if exists
                            if (dateValue) {
                              const year = dateValue.getFullYear()
                              const month = (dateValue.getMonth() + 1)
                                .toString()
                                .padStart(2, "0")
                              const day = dateValue
                                .getDate()
                                .toString()
                                .padStart(2, "0")
                              handleFieldChange(
                                id,
                                `${year}-${month}-${day}T00:00`,
                              )
                            } else {
                              handleFieldChange(id, null)
                            }
                          }
                        }}
                        style={getInputStyle()}
                        brandingConfig={brandingConfig}
                      />
                    )
                  })()}
                </div>
              </div>
            )}

            {question_type === "display" &&
              // Skip rendering display value for instalment headers (duplicate of the label above)
              !(
                id?.includes("instalment") ||
                depositQuestion.value?.includes("Instalment")
              ) && (
                <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                  {depositQuestion.value || "Display value"}
                </div>
              )}

            {question_type === "custom_due_date" && (
              <div className="space-y-2 pl-4">
                {(depositQuestion.custom_config || depositQuestion.config) &&
                  renderCustomDueDate(
                    depositQuestion.custom_config || depositQuestion.config,
                  )}
              </div>
            )}

            {question_type === "select_with_text" && (
              <div className="space-y-1 pt-1.5">
                <div className="flex max-w-md flex-wrap items-center gap-2">
                  <div className="relative w-1/2">
                    <Input
                      type="number"
                      min="0"
                      placeholder={currentPlaceholder || "Enter number"}
                      value={localFormData[id] || ""}
                      onChange={(e) => handleFieldChange(id, e.target.value)}
                      disabled={false}
                      className={cn(
                        editingMode ? "cursor-not-allowed" : "",
                        "w-full",
                      )}
                      style={{
                        ...getInputStyle(),
                        position: "relative",
                        zIndex: 1,
                      }}
                    />
                    {editingMode && (
                      <div
                        className="absolute inset-0 cursor-pointer bg-transparent"
                        style={{
                          zIndex: 2,
                        }}
                        onClick={() => {
                          if (onEditPlaceholder) {
                            onEditPlaceholder(id, currentPlaceholder)
                          }
                        }}
                        title="Click to edit placeholder text"
                      />
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {depositQuestion.select_options &&
                      depositQuestion.select_options.length > 0 && (
                        <Select
                          value={
                            localFormData[`${id}_unit`] ||
                            depositQuestion.select_options[0].value
                          }
                          onValueChange={(value) =>
                            handleFieldChange(`${id}_unit`, value)
                          }
                          disabled={false}
                        >
                          <SelectTrigger
                            className="w-auto min-w-fit"
                            style={getSelectStyle()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {depositQuestion.select_options.map(
                              (option: { value: string; label: string }) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    {depositQuestion.suffix && (
                      <span className="text-sm whitespace-nowrap text-gray-600">
                        {depositQuestion.suffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Render the deposit questions from smart question configuration */}
      {renderDepositQuestions()}
    </div>
  )
}

export default DepositForm
