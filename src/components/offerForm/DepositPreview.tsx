"use client"
/* eslint-disable react/prop-types */

import { CurrencySelect } from "@/components/shared/CurrencySelect"
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
import { getCurrencyPlaceholder } from "@/lib/currencyUtils"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"
import {
  getSubQuestionLabel,
  getSubQuestionPlaceholder,
  parseUIConfig,
} from "@/types/questionUIConfig"
import React, { useEffect, useMemo, useState } from "react"

interface DepositQuestion {
  id: string
  question_text: string
  question_type: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  suffix?: string // For percentage inputs: "% of purchase price"
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

  // Initialize default values for deposit_type fields (buyer_choice scenarios)
  useEffect(() => {
    if (question.deposit_questions) {
      const updates: Record<string, any> = {}
      question.deposit_questions.forEach((q: DepositQuestion) => {
        // Check if this is a deposit_type question with conditional_currency (buyer_choice)
        if (
          (q.id === "deposit_type" ||
            q.id?.startsWith("deposit_type_instalment_")) &&
          q.conditional_currency &&
          !localFormData[q.id]
        ) {
          // Set default to "amount" if not already set
          updates[q.id] = "amount"
        }
      })
      if (Object.keys(updates).length > 0) {
        setLocalFormData((prev) => ({ ...prev, ...updates }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.deposit_questions])

  // Helper: Prevent invalid characters in number inputs (e, E, +, -)
  const handleNumberInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Prevent e, E, +, - from being entered
    if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
      e.preventDefault()
    }
  }

  // Helper: Filter out invalid characters from number input values (for paste protection)
  const sanitizeNumberInput = (value: string): string => {
    // Remove e, E, +, - characters
    return value.replace(/[eE\+\-]/g, "")
  }

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

  // Note: Currency pairs initialization removed - we now use single select for "options" mode

  // Helper function to map question ID to data field name according to schema
  // This ensures data collection matches the schema field naming conventions
  const getDataFieldName = (
    questionId: string,
    fieldType: "amount" | "due" | "holding" | "type" | "currency" = "amount",
  ): string => {
    // For base question IDs (deposit_amount, deposit_due, etc.), use as-is
    if (
      questionId === "deposit_amount" ||
      questionId === "deposit_due" ||
      questionId === "deposit_holding" ||
      questionId === "deposit_type"
    ) {
      if (fieldType === "currency") {
        return `${questionId}_currency`
      }
      return questionId
    }

    // For instalment-specific question IDs, use the ID directly
    // This matches the schema: deposit_amount_instalment_X, deposit_due_instalment_X, etc.
    if (questionId.includes("_instalment_")) {
      if (fieldType === "currency") {
        return `${questionId}_currency`
      }
      return questionId
    }

    // Fallback: use question ID as field name
    if (fieldType === "currency") {
      return `${questionId}_currency`
    }
    return questionId
  }

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
        q.id?.includes("deposit_amount_3") ||
        q.id?.includes("deposit_amount_instalment_"),
    )
    if (hasInstalmentQuestions) return []

    const depositSmartQuestion = getSmartQuestion("deposit")
    if (!depositSmartQuestion) return []

    // Use smartQuestions.generateInstalmentQuestions for consistent generation
    // This ensures all variants are handled correctly according to the schema
    const generatedQuestions =
      depositSmartQuestion.generateInstalmentQuestions?.(
        setupAnswers,
        instalmentsValue,
      ) || []

    return generatedQuestions
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

  // Render edit overlay for placeholder editing (same pattern as name of purchaser)
  const renderEditOverlay = (
    fieldId: string,
    currentText: string,
  ): React.ReactElement | null => {
    if (!editingMode || !onEditPlaceholder) return null

    return (
      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onEditPlaceholder(fieldId, currentText)
        }}
        title="Click to edit placeholder"
      />
    )
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

        // Get currency placeholder if currency field is fixed (display type)
        const currencyPlaceholder =
          depositQuestion.currency_field?.type === "display" &&
          depositQuestion.currency_field.value
            ? getCurrencyPlaceholder(depositQuestion.currency_field.value)
            : depositQuestion.currency_field?.type === "select"
              ? getCurrencyPlaceholder(localFormData[`${id}_currency`] || "USD")
              : null

        // Determine if this question type has a corresponding field
        // If question_type is undefined, skip rendering (question not properly configured)
        if (!question_type) {
          return null
        }

        const hasField =
          question_type === "text" ||
          question_type === "select" ||
          question_type === "date" ||
          question_type === "datetime" ||
          question_type === "calendar" ||
          question_type === "display" ||
          question_type === "custom_due_date" ||
          question_type === "select_with_text" ||
          question_type === "within_days"

        // Only render if there's a field or it's a display type (which shows value)
        if (!hasField && question_type !== "display") {
          // Skip rendering if question type is not supported
          return null
        }

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
                {/* For buyer_choice: Check if this is deposit_amount with conditional_currency/suffix */}
                {/* This means it should be conditional based on deposit_type selection */}
                {depositQuestion.conditional_currency ||
                depositQuestion.conditional_suffix ? (
                  <div className="space-y-2">
                    {/* Get the deposit_type selection to determine what to show */}
                    {(() => {
                      // Helper function to determine instalment scenario and field names
                      const getInstalmentInfo = () => {
                        // SCENARIO 1: Single instalment (deposit_amount with deposit_type, no instalment questions)
                        if (id === "deposit_amount") {
                          // Check if there's a deposit_type question (single instalment)
                          const hasSingleDepositType =
                            question.deposit_questions?.some(
                              (q: DepositQuestion) => q.id === "deposit_type",
                            )
                          // Check if there are any instalment-specific deposit_type questions
                          const hasInstalmentType =
                            question.deposit_questions?.some(
                              (q: DepositQuestion) =>
                                q.id?.startsWith("deposit_type_instalment_"),
                            )

                          // If we have deposit_type (single) and NO instalment types, it's single instalment
                          if (hasSingleDepositType && !hasInstalmentType) {
                            return {
                              depositTypeFieldName: "deposit_type",
                              amountFieldName: "deposit_amount",
                              percentageFieldName: "deposit_percentage",
                            }
                          }

                          // SCENARIO 2: Multi-instalment Instalment 1 (deposit_amount but has instalment_1 type question)
                          // For one_or_two/three_plus: instalment 1 uses deposit_amount (no suffix) but deposit_type_instalment_1
                          if (hasInstalmentType) {
                            return {
                              depositTypeFieldName: "deposit_type_instalment_1",
                              amountFieldName: "deposit_amount",
                              percentageFieldName: "deposit_percentage",
                            }
                          }

                          // Fallback: assume single instalment if we can't determine
                          return {
                            depositTypeFieldName: "deposit_type",
                            amountFieldName: "deposit_amount",
                            percentageFieldName: "deposit_percentage",
                          }
                        }

                        // SCENARIO 3: Multi-instalment Instalment 2+ (deposit_amount_instalment_X)
                        // For two_always or instalment 2+ in one_or_two/three_plus
                        if (id.startsWith("deposit_amount_instalment_")) {
                          const instalmentMatch = id.match(
                            /deposit_amount_instalment_(\d+)/,
                          )
                          if (instalmentMatch) {
                            const instalmentNum = parseInt(
                              instalmentMatch[1],
                              10,
                            )
                            return {
                              depositTypeFieldName: `deposit_type_instalment_${instalmentNum}`,
                              amountFieldName: `deposit_amount_instalment_${instalmentNum}`,
                              percentageFieldName: `deposit_percentage_instalment_${instalmentNum}`,
                            }
                          }
                        }

                        // Fallback (should not happen)
                        return {
                          depositTypeFieldName: "deposit_type",
                          amountFieldName: "deposit_amount",
                          percentageFieldName: "deposit_percentage",
                        }
                      }

                      const {
                        depositTypeFieldName,
                        amountFieldName,
                        percentageFieldName,
                      } = getInstalmentInfo()

                      // Get the deposit_type value, defaulting to "amount" if not set
                      const depositTypeValue =
                        localFormData[depositTypeFieldName] || "amount"

                      // If amount is selected, show amount input with currency
                      if (
                        depositTypeValue === "amount" &&
                        depositQuestion.conditional_currency
                      ) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="relative w-1/2">
                              <Input
                                type="number"
                                min="0"
                                placeholder="Enter amount"
                                value={localFormData[amountFieldName] || ""}
                                onChange={(e) => {
                                  const sanitized = sanitizeNumberInput(
                                    e.target.value,
                                  )
                                  handleFieldChange(amountFieldName, sanitized)
                                }}
                                onKeyDown={handleNumberInputKeyDown}
                                disabled={false}
                                className={cn(
                                  editingMode && "cursor-not-allowed",
                                  "w-full",
                                  depositQuestion.conditional_currency.type ===
                                    "display" && "pr-12",
                                  depositQuestion.conditional_currency.type ===
                                    "select" && "pr-0",
                                )}
                                style={getInputStyle()}
                              />
                              {/* Currency decorator for fixed mode */}
                              {depositQuestion.conditional_currency.type ===
                                "display" && (
                                <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                                  {depositQuestion.conditional_currency.value ||
                                    "N/A"}
                                </div>
                              )}
                              {renderEditOverlay(
                                `sub_question_placeholder_${amountFieldName}`,
                                "Enter amount",
                              )}
                            </div>
                            {/* Currency dropdown for select mode */}
                            {depositQuestion.conditional_currency.type ===
                              "select" && (
                              <div className="w-1/2">
                                <CurrencySelect
                                  value={
                                    localFormData[
                                      `${amountFieldName}_currency`
                                    ] || ""
                                  }
                                  onValueChange={(value) =>
                                    handleFieldChange(
                                      `${amountFieldName}_currency`,
                                      value,
                                    )
                                  }
                                  disabled={false}
                                  placeholder={
                                    depositQuestion.conditional_currency
                                      ?.placeholder || "Select currency"
                                  }
                                  className="w-full"
                                  style={getSelectStyle()}
                                  allowedCurrencies={depositQuestion.conditional_currency?.options?.map(
                                    (opt: { value: string }) => opt.value,
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )
                      }

                      // If percentage is selected, show percentage input with % decorator
                      if (
                        depositTypeValue === "percentage" &&
                        depositQuestion.conditional_suffix
                      ) {
                        return (
                          <div className="space-y-2">
                            {/* First row: percentage input with % decorator and "of purchase price" text */}
                            <div className="flex items-center gap-2">
                              <div className="relative w-1/2">
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Enter percentage"
                                  value={
                                    localFormData[percentageFieldName] || ""
                                  }
                                  onChange={(e) => {
                                    const sanitized = sanitizeNumberInput(
                                      e.target.value,
                                    )
                                    handleFieldChange(
                                      percentageFieldName,
                                      sanitized,
                                    )
                                  }}
                                  onKeyDown={handleNumberInputKeyDown}
                                  disabled={false}
                                  className={cn(
                                    editingMode && "cursor-not-allowed",
                                    "w-full pr-8", // Add padding for % decorator
                                  )}
                                  style={getInputStyle()}
                                />
                                {/* Percentage decorator (% symbol) */}
                                <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                                  %
                                </div>
                                {renderEditOverlay(
                                  `sub_question_placeholder_${percentageFieldName}`,
                                  "Enter percentage",
                                )}
                              </div>
                              {/* "of purchase price" text on the same line */}
                              <span className="w-1/2 text-sm whitespace-nowrap text-gray-600">
                                {depositQuestion.conditional_suffix
                                  .replace("%", "")
                                  .trim()}
                              </span>
                            </div>
                            {/* Second row: currency selector underneath */}
                            {depositQuestion.conditional_currency && (
                              <div className="w-full">
                                <CurrencySelect
                                  value={
                                    localFormData[
                                      `${percentageFieldName}_currency`
                                    ] || ""
                                  }
                                  onValueChange={(value) =>
                                    handleFieldChange(
                                      `${percentageFieldName}_currency`,
                                      value,
                                    )
                                  }
                                  disabled={false}
                                  placeholder={
                                    depositQuestion.conditional_currency
                                      ?.placeholder || "Select currency"
                                  }
                                  className="w-full"
                                  style={getSelectStyle()}
                                  allowedCurrencies={depositQuestion.conditional_currency?.options?.map(
                                    (opt: { value: string }) => opt.value,
                                  )}
                                />
                              </div>
                            )}
                          </div>
                        )
                      }

                      // Default: show placeholder until selection is made
                      return (
                        <div className="relative w-full">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Enter amount"
                            value={localFormData[amountFieldName] || ""}
                            onChange={(e) =>
                              handleFieldChange(amountFieldName, e.target.value)
                            }
                            onKeyDown={handleNumberInputKeyDown}
                            disabled={false}
                            className={cn(
                              editingMode && "cursor-not-allowed",
                              "w-full",
                            )}
                            style={getInputStyle()}
                          />
                          {renderEditOverlay(
                            `sub_question_placeholder_${amountFieldName}`,
                            "Enter amount",
                          )}
                        </div>
                      )
                    })()}
                  </div>
                ) : depositQuestion.currency_field ? (
                  <div className="space-y-2">
                    {/* Amount input with currency */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "relative",
                          depositQuestion.currency_field.type === "select"
                            ? "w-1/2"
                            : "w-full",
                        )}
                      >
                        <Input
                          type="number"
                          min="0"
                          placeholder={
                            currentPlaceholder ||
                            currencyPlaceholder ||
                            "Enter value"
                          }
                          value={localFormData[id] || ""}
                          onChange={(e) => {
                            const sanitized = sanitizeNumberInput(
                              e.target.value,
                            )
                            handleFieldChange(id, sanitized)
                          }}
                          onKeyDown={handleNumberInputKeyDown}
                          disabled={false}
                          className={cn(
                            editingMode && "cursor-not-allowed",
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
                        {/* Percentage decorator (% symbol) - shown when suffix exists and no currency decorator */}
                        {depositQuestion.suffix &&
                          depositQuestion.currency_field.type !== "display" && (
                            <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                              %
                            </div>
                          )}
                        {renderEditOverlay(id, currentPlaceholder || "")}
                      </div>
                      {/* Single currency dropdown (for "any" mode) */}
                      {depositQuestion.currency_field.type === "select" && (
                        <div className="w-1/2">
                          <CurrencySelect
                            value={localFormData[`${id}_currency`] || ""}
                            onValueChange={(value) =>
                              handleFieldChange(`${id}_currency`, value)
                            }
                            disabled={false}
                            placeholder={
                              depositQuestion.currency_field.placeholder ||
                              "Select currency"
                            }
                            className="w-full"
                            style={getSelectStyle()}
                            allowedCurrencies={depositQuestion.currency_field.options?.map(
                              (opt: { value: string }) => opt.value,
                            )}
                          />
                        </div>
                      )}
                    </div>
                    {/* "of purchase price" text on the same line as input (when suffix exists) */}
                    {depositQuestion.suffix && (
                      <span className="text-sm whitespace-nowrap text-gray-600">
                        {depositQuestion.suffix.replace("%", "").trim()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "relative",
                        depositQuestion.suffix ? "w-1/2" : "w-full",
                      )}
                    >
                      <Input
                        placeholder={currentPlaceholder || "Enter value"}
                        value={localFormData[id] || ""}
                        onChange={(e) => handleFieldChange(id, e.target.value)}
                        disabled={false}
                        className={cn(
                          editingMode && "cursor-not-allowed",
                          "w-full",
                          depositQuestion.suffix && "pr-8", // Add padding for % decorator
                        )}
                        style={getInputStyle()}
                      />
                      {/* Percentage decorator (% symbol) */}
                      {depositQuestion.suffix && (
                        <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                          %
                        </div>
                      )}
                      {renderEditOverlay(
                        `sub_question_placeholder_${id}`,
                        currentPlaceholder || "",
                      )}
                    </div>
                    {/* "of purchase price" text on the same line as input */}
                    {depositQuestion.suffix && (
                      <span className="w-1/2 text-sm whitespace-nowrap text-gray-600">
                        {depositQuestion.suffix.replace("%", "").trim()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {question_type === "select" && (
              <div className="space-y-2 pt-1.5">
                <div className="w-1/2">
                  <Select
                    value={
                      localFormData[id] ||
                      // Default to "amount" for deposit_type questions with conditional_currency (buyer_choice)
                      (depositQuestion.conditional_currency &&
                      (id === "deposit_type" ||
                        id?.startsWith("deposit_type_instalment_"))
                        ? "amount"
                        : "")
                    }
                    onValueChange={(value) => handleFieldChange(id, value)}
                    disabled={false}
                  >
                    <SelectTrigger className="w-full" style={getSelectStyle()}>
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
                          const instalmentsSetup =
                            setupAnswers?.instalments_setup
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
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ),
                          ) || []
                        )
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {/* Note: Conditional currency and suffix for buyer_choice are now handled in the text input section above */}
              </div>
            )}

            {question_type === "calendar" && (
              <div className="w-full">
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
                <div className="relative w-full">
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
                <div className="relative w-full">
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
              // Only skip if it's specifically a header question
              !(id?.includes("instalment") && id?.includes("_header")) && (
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

            {question_type === "within_days" && (
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-sm text-gray-700">Within</span>
                <Select
                  value={localFormData[id] || ""}
                  onValueChange={(value) => handleFieldChange(id, value)}
                  disabled={false}
                >
                  <SelectTrigger
                    className="w-auto min-w-[100px]"
                    style={getSelectStyle()}
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositQuestion.options?.map(
                      (option: { value: string; label: string }) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {depositQuestion.suffix && (
                  <span className="text-sm whitespace-nowrap text-gray-600">
                    {depositQuestion.suffix}
                  </span>
                )}
              </div>
            )}

            {question_type === "select_with_text" && (
              <div className="space-y-1 pt-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative w-1/2">
                    <Input
                      type="number"
                      min="0"
                      placeholder={currentPlaceholder || "Enter number"}
                      value={localFormData[id] || ""}
                      onChange={(e) => {
                        const sanitized = sanitizeNumberInput(e.target.value)
                        handleFieldChange(id, sanitized)
                      }}
                      onKeyDown={handleNumberInputKeyDown}
                      disabled={false}
                      className={cn(
                        editingMode && "cursor-not-allowed",
                        "w-full",
                      )}
                      style={getInputStyle()}
                    />
                    {renderEditOverlay(id, currentPlaceholder || "")}
                  </div>
                  <div className="flex w-1/2 items-center gap-2">
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
                            className="w-full"
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
