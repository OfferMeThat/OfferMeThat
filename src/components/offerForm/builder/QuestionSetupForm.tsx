/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { FileUploadInput } from "@/components/shared/FileUploadInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { currencyNames } from "@/constants/forms"
import { QUESTION_DEFINITIONS as OFFER_QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { validateMultipleFiles } from "@/lib/offerFormValidation"
import { getQuestionRequiredFromSetup } from "@/lib/questionHelpers"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { QuestionSetupConfig, QuestionUIConfig } from "@/types/questionConfig"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import DepositDueDateModal from "./DepositDueDateModal"
import SmartQuestionSetup from "./SmartQuestionSetup"

interface QuestionSetupFormProps {
  questionType: QuestionType
  initialSetupConfig?: QuestionSetupConfig
  initialUIConfig?: QuestionUIConfig
  onComplete: (
    setupConfig: QuestionSetupConfig,
    uiConfig?: QuestionUIConfig,
    requiredOverride?: boolean,
    uiConfigUpdates?: Record<string, any>,
  ) => void
  onCancel: () => void
  hideButtons?: boolean
  mode?: "add" | "edit"
  questionDefinitions?: Partial<Record<QuestionType, any>>
  currentQuestionRequired?: boolean
}

const QuestionSetupForm = ({
  questionType,
  initialSetupConfig = {},
  initialUIConfig = {},
  onComplete,
  onCancel,
  hideButtons = false,
  mode = "add",
  questionDefinitions = OFFER_QUESTION_DEFINITIONS,
  currentQuestionRequired,
}: QuestionSetupFormProps) => {
  // Initialize setupConfig with defaults for offerAmount
  const initialConfig = useMemo(() => {
    const config = { ...initialSetupConfig } as Record<string, any>

    // Convert legacy comma-separated select_options string to array format
    if (questionType === "custom" && config.select_options) {
      if (typeof config.select_options === "string") {
        // Convert comma-separated string to array
        config.select_options = config.select_options
          .split(",")
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt !== "")
        // Ensure at least 2 empty options if array is empty
        if (config.select_options.length === 0) {
          config.select_options = ["", ""]
        }
      }
    }

    // Clear currency-related fields when starting fresh (not in edit mode)
    // Only keep them if they're explicitly in initialSetupConfig
    if (Object.keys(initialSetupConfig).length === 0) {
      // For custom questions, don't initialize currency fields
      if (questionType === "custom") {
        delete config.currency_stipulation
        delete config.currency_options
        delete config.currency_fixed
      }
      // For offerAmount, we'll set defaults below
    }

    // Set default currency_mode to "any" for offerAmount if not set
    if (questionType === "offerAmount" && !config.currency_mode) {
      config.currency_mode = "any"
      // Also set default fixed_currency if switching to fixed mode later
      if (!config.fixed_currency) {
        config.fixed_currency = "USD"
      }
    }

    return config
  }, [initialSetupConfig, questionType])

  const [setupConfig, setSetupConfig] =
    useState<Record<string, any>>(initialConfig)
  // Initialize with one empty condition if none exist
  const initialConditions = (initialSetupConfig as any)?.conditions || []
  const [conditions, setConditions] = useState<
    Array<{
      name: string
      details: string
      attachments?: Array<{
        url: string
        fileName: string
        fileSize?: number
        uploadedAt?: string
      }>
    }>
  >(
    initialConditions.length > 0
      ? initialConditions
      : [{ name: "", details: "" }],
  )

  // State for file uploads per condition (temporary File objects before upload)
  const [conditionFileUploads, setConditionFileUploads] = useState<
    Record<number, { files: File[]; fileNames: string[] }>
  >({})

  // State for settlement date modal
  const [showSettlementDateModal, setShowSettlementDateModal] = useState(false)

  // Use ref to track previous config to avoid infinite loops
  const prevConfigRef = useRef<string>("")
  const questionTypeRef = useRef<QuestionType | null>(null)

  // Update state when initial config changes (for edit mode)
  // Only update if the serialized config actually changed or question type changed
  useEffect(() => {
    const currentConfigString = JSON.stringify(initialSetupConfig)
    const questionTypeChanged = questionTypeRef.current !== questionType

    // Only update if config actually changed or question type changed
    if (currentConfigString !== prevConfigRef.current || questionTypeChanged) {
      const configToSet = { ...initialSetupConfig } as Record<string, any>

      // Convert legacy comma-separated select_options string to array format
      if (questionType === "custom" && configToSet.select_options) {
        if (typeof configToSet.select_options === "string") {
          // Convert comma-separated string to array
          configToSet.select_options = configToSet.select_options
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt !== "")
          // Ensure at least 2 empty options if array is empty
          if (configToSet.select_options.length === 0) {
            configToSet.select_options = ["", ""]
          }
        }
      }

      // Clear currency-related fields when switching question types or starting fresh
      // Only keep them if they're explicitly in initialSetupConfig (edit mode)
      if (questionTypeChanged || Object.keys(initialSetupConfig).length === 0) {
        // For custom questions, only keep currency fields if they're in initialSetupConfig
        if (questionType === "custom") {
          const customConfig = initialSetupConfig as any
          if (!customConfig.currency_stipulation) {
            delete configToSet.currency_stipulation
            delete configToSet.currency_options
            delete configToSet.currency_fixed
          }
        }
        // For offerAmount, only keep currency fields if they're in initialSetupConfig
        if (questionType === "offerAmount") {
          const offerAmountConfig = initialSetupConfig as any
          if (!offerAmountConfig.currency_mode) {
            delete configToSet.currency_mode
            delete configToSet.currency_options
            delete configToSet.fixed_currency
          }
        }
      }

      // Set default currency_mode to "any" for offerAmount if not set
      if (questionType === "offerAmount" && !configToSet.currency_mode) {
        configToSet.currency_mode = "any"
        // Also set default fixed_currency if switching to fixed mode later
        if (!configToSet.fixed_currency) {
          configToSet.fixed_currency = "USD"
        }
      }

      setSetupConfig(configToSet)
      if (configToSet?.conditions && configToSet.conditions.length > 0) {
        setConditions(
          configToSet.conditions.map((c: any) => ({
            name: c.name || "",
            details: c.details || "",
            attachments: c.attachments || [],
          })),
        )
      } else if (questionType === "specialConditions") {
        // Initialize with one empty condition for special conditions
        setConditions([{ name: "", details: "" }])
      }
      prevConfigRef.current = JSON.stringify(configToSet)
      questionTypeRef.current = questionType
    }
  }, [initialSetupConfig, questionType])

  const handleConfigChange = (questionId: string, value: any) => {
    setSetupConfig((prev) => {
      const newConfig = { ...prev, [questionId]: value }

      // When answer_type changes, clear all dependent fields
      if (questionType === "custom" && questionId === "answer_type") {
        // Clear all fields that depend on answer_type
        delete newConfig.number_type
        delete newConfig.currency_stipulation
        delete newConfig.currency_options
        delete newConfig.currency_fixed
        delete newConfig.time_date_type
        delete newConfig.allow_unsure
        delete newConfig.select_options
        delete newConfig.add_tickbox
        delete newConfig.tickbox_text

        // Initialize select_options as array when switching to single_select or multi_select
        if (value === "single_select" || value === "multi_select") {
          newConfig.select_options = ["", ""]
        }
      }

      // When number_type changes (and it's not money), clear currency fields
      if (
        questionType === "custom" &&
        questionId === "number_type" &&
        value !== "money"
      ) {
        delete newConfig.currency_stipulation
        delete newConfig.currency_options
        delete newConfig.currency_fixed
      }

      // When add_tickbox changes (and it's "no"), clear tickbox fields
      if (
        questionType === "custom" &&
        questionId === "add_tickbox" &&
        value === "no"
      ) {
        delete newConfig.tickbox_text
      }

      return newConfig
    })

    // Auto-open settlement date modal when "CYO" is selected
    if (
      questionType === "settlementDate" &&
      questionId === "settlement_date_type" &&
      value === "CYO"
    ) {
      setShowSettlementDateModal(true)
    }
  }

  const handleSettlementDateConfig = (config: any) => {
    setSetupConfig((prev) => ({
      ...prev,
      settlement_date_config: config,
    }))
    setShowSettlementDateModal(false)
  }

  const handleAddCondition = () => {
    if (conditions.length < 15) {
      setConditions([...conditions, { name: "", details: "" }])
    }
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const handleConditionChange = (
    index: number,
    field: "name" | "details",
    value: string,
  ) => {
    const updated = [...conditions]
    updated[index][field] = value
    setConditions(updated)
  }

  const handleConditionFileUpload = (
    conditionIndex: number,
    files: File | File[] | null,
  ) => {
    if (!files) {
      setConditionFileUploads((prev) => {
        const updated = { ...prev }
        delete updated[conditionIndex]
        return updated
      })
      return
    }

    const fileArray = Array.isArray(files) ? files : [files]
    const fileError = validateMultipleFiles(fileArray, 10, 50 * 1024 * 1024) // Max 10 files, 50MB total

    if (fileError) {
      toast.error(fileError)
      return
    }

    setConditionFileUploads((prev) => ({
      ...prev,
      [conditionIndex]: {
        files: fileArray,
        fileNames: fileArray.map((f) => f.name),
      },
    }))
  }

  const handleRemoveConditionFile = (
    conditionIndex: number,
    fileIndex: number,
  ) => {
    // Check if it's a new file (in conditionFileUploads) or existing attachment (in conditions)
    const currentUploads = conditionFileUploads[conditionIndex]
    const condition = conditions[conditionIndex]

    // If it's a newly uploaded file (in conditionFileUploads)
    if (currentUploads && fileIndex < currentUploads.files.length) {
      setConditionFileUploads((prev) => {
        const current = prev[conditionIndex]
        if (!current) return prev

        const newFiles = [...current.files]
        const newFileNames = [...current.fileNames]
        newFiles.splice(fileIndex, 1)
        newFileNames.splice(fileIndex, 1)

        if (newFiles.length === 0) {
          const updated = { ...prev }
          delete updated[conditionIndex]
          return updated
        }

        return {
          ...prev,
          [conditionIndex]: {
            files: newFiles,
            fileNames: newFileNames,
          },
        }
      })
    } else if (condition?.attachments && condition.attachments.length > 0) {
      // It's an existing attachment - remove it from the condition
      const attachmentIndex = fileIndex - (currentUploads?.files.length || 0)
      if (
        attachmentIndex >= 0 &&
        attachmentIndex < condition.attachments.length
      ) {
        const updated = [...conditions]
        if (updated[conditionIndex]) {
          updated[conditionIndex] = {
            ...updated[conditionIndex],
            attachments:
              updated[conditionIndex].attachments?.filter(
                (_: any, idx: number) => idx !== attachmentIndex,
              ) || [],
          }
          setConditions(updated)
        }
      }
    }
  }

  // Validation function to check if setup is complete
  const validateSetup = useCallback(() => {
    const definition = questionDefinitions[questionType]
    if (!definition?.setupQuestions) return true // No setup required

    // Check all visible setup questions
    for (const question of definition.setupQuestions) {
      // Check dependencies
      if (question.dependsOn) {
        const dependentValue = setupConfig[question.dependsOn.questionId]
        const requiredValue = question.dependsOn.value
        const isMet = Array.isArray(requiredValue)
          ? requiredValue.includes(dependentValue)
          : dependentValue === requiredValue
        if (!isMet) continue // Skip this question if dependency not met
      }

      // Check if required field is filled (most setup questions are required by default)
      const isRequired = (question as any).required !== false
      if (isRequired) {
        const value = setupConfig[question.id]
        // For multiChoiceSelect, check if array is empty
        if (question.type === "multiChoiceSelect") {
          if (!Array.isArray(value) || value.length === 0) {
            toast.error(
              `Please complete all required fields: ${question.label}`,
            )
            return false
          }
        } else if (value === undefined || value === "" || value === null) {
          toast.error(`Please complete all required fields: ${question.label}`)
          return false
        }
      }
    }

    // Special validation for Special Conditions
    if (questionType === "specialConditions") {
      for (const condition of conditions) {
        if (!condition.name || condition.name.trim() === "") {
          toast.error("Please provide a name for all conditions.")
          return false
        }
      }
    }

    // Special validation for Offer Amount
    if (questionType === "offerAmount") {
      if (setupConfig.currency_mode === "options") {
        const validCurrencies = Array.isArray(setupConfig.currency_options)
          ? setupConfig.currency_options.filter(
              (opt: string) => opt && opt !== "",
            )
          : []
        if (validCurrencies.length < 2) {
          toast.error(
            "Please select at least 2 currencies for the currency options mode.",
          )
          return false
        }
      }
    }

    // Special validation for Custom questions with select options
    if (questionType === "custom") {
      if (
        (setupConfig.answer_type === "single_select" ||
          setupConfig.answer_type === "multi_select") &&
        setupConfig.select_options
      ) {
        // Handle both array format (new) and comma-separated string (legacy)
        let validOptions: string[] = []
        if (Array.isArray(setupConfig.select_options)) {
          validOptions = setupConfig.select_options.filter(
            (opt: string) => opt && opt.trim() !== "",
          )
        } else if (typeof setupConfig.select_options === "string") {
          validOptions = setupConfig.select_options
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt !== "")
        }
        if (validOptions.length < 2) {
          toast.error("Please provide at least 2 options for the select list.")
          return false
        }
      }
    }

    return true
  }, [setupConfig, conditions, questionType])

  const handleComplete = useCallback(() => {
    // Validate setup before completing
    if (!validateSetup()) {
      return // Prevent saving if validation fails
    }

    // For Special Conditions, include the conditions array in setupConfig
    // Note: Files will be uploaded in the save action after question is created/updated
    let finalConfig =
      questionType === "specialConditions"
        ? {
            ...setupConfig,
            conditions: conditions.map((condition, index) => ({
              name: condition.name,
              details: condition.details,
              attachments: condition.attachments || [],
              // Include temporary files that need to be uploaded
              __pendingFiles: conditionFileUploads[index]?.files || [],
            })),
          }
        : { ...setupConfig }

    // For Offer Amount with currency_options mode, filter out empty values
    if (questionType === "offerAmount") {
      const offerAmountConfig = finalConfig as Record<string, any>
      if (offerAmountConfig.currency_mode === "options") {
        if (Array.isArray(offerAmountConfig.currency_options)) {
          offerAmountConfig.currency_options =
            offerAmountConfig.currency_options.filter(
              (opt: string) => opt && opt !== "",
            )
        }
      }
      finalConfig = offerAmountConfig
    }

    // For Custom questions with select_options, filter out empty values and keep as array
    if (questionType === "custom") {
      const customConfig = finalConfig as Record<string, any>
      if (
        (customConfig.answer_type === "single_select" ||
          customConfig.answer_type === "multi_select") &&
        customConfig.select_options
      ) {
        if (Array.isArray(customConfig.select_options)) {
          // Filter out empty options
          customConfig.select_options = customConfig.select_options.filter(
            (opt: string) => opt && opt.trim() !== "",
          )
        } else if (typeof customConfig.select_options === "string") {
          // Convert legacy comma-separated string to array
          customConfig.select_options = customConfig.select_options
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt !== "")
        }
      }
      finalConfig = customConfig
    }

    // For lead form questions, clean up conditional fields that aren't applicable
    const definition = questionDefinitions[questionType]
    if (definition?.setupQuestions) {
      const cleanedConfig = { ...finalConfig } as Record<string, any>

      // Remove conditional fields that don't meet their dependencies
      for (const setupQuestion of definition.setupQuestions) {
        if (setupQuestion.dependsOn) {
          const dependentValue =
            cleanedConfig[setupQuestion.dependsOn.questionId]
          const requiredValue = setupQuestion.dependsOn.value
          const isMet = Array.isArray(requiredValue)
            ? requiredValue.includes(dependentValue)
            : dependentValue === requiredValue

          if (!isMet && cleanedConfig[setupQuestion.id] !== undefined) {
            // Remove the field if dependency is not met
            delete cleanedConfig[setupQuestion.id]
          }
        }
      }

      finalConfig = cleanedConfig
    }

    // For custom questions (except statement type), build uiConfig with label from question_text
    // Statement type has separate fields: uiConfig.label (main label) and setupConfig.question_text (statement text)
    let finalUIConfig = initialUIConfig
    if (questionType === "custom") {
      const customConfig = finalConfig as Record<string, any>
      if (
        customConfig.question_text &&
        customConfig.answer_type !== "statement"
      ) {
        finalUIConfig = {
          ...initialUIConfig,
          label: customConfig.question_text,
        }
      }
    }

    // Check if setup config determines the required status
    const requiredFromSetup = getQuestionRequiredFromSetup(
      questionType,
      finalConfig,
    )

    onComplete(finalConfig, finalUIConfig, requiredFromSetup ?? undefined)
  }, [
    setupConfig,
    conditions,
    questionType,
    initialUIConfig,
    onComplete,
    validateSetup,
  ])

  // Add event listener for external save trigger
  // Skip for deposit questions as they use SmartQuestionSetup which has its own handler
  useEffect(() => {
    if (questionType === "deposit") {
      return // Deposit questions use SmartQuestionSetup which handles the event
    }

    const handleExternalSave = () => {
      // Validate before saving
      if (validateSetup()) {
        handleComplete()
      }
    }

    window.addEventListener("smartQuestionSave", handleExternalSave)
    return () => {
      window.removeEventListener("smartQuestionSave", handleExternalSave)
    }
  }, [handleComplete, questionType])

  // Special handling for deposit question using SmartQuestionSetup
  if (questionType === "deposit") {
    return (
      <SmartQuestionSetup
        questionId={questionType}
        initialSetupConfig={initialSetupConfig}
        initialUIConfig={initialUIConfig}
        onComplete={(generated, answers, requiredOverride, uiConfigUpdates) => {
          onComplete(answers, generated, requiredOverride, uiConfigUpdates)
        }}
        onCancel={onCancel}
        hideButtons={hideButtons}
        mode={mode}
        currentQuestionRequired={currentQuestionRequired}
      />
    )
  }

  const definition = questionDefinitions[questionType]
  if (!definition?.setupQuestions) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        No setup required for this question type.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {definition.setupQuestions.map((question: any) => {
        // Check dependencies
        if (question.dependsOn) {
          const dependentValue = setupConfig[question.dependsOn.questionId]
          const requiredValue = question.dependsOn.value
          const isMet = Array.isArray(requiredValue)
            ? requiredValue.includes(dependentValue)
            : dependentValue === requiredValue

          if (!isMet) return null
        }

        return (
          <div key={question.id} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {question.label}
            </h4>

            {/* Radio buttons */}
            {question.type === "radio" && question.options && (
              <div className="space-y-2">
                {question.options.map((option: any) => {
                  const isSelected = setupConfig[question.id] === option.value
                  return (
                    <div
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3"
                      onClick={() => {
                        handleConfigChange(question.id, option.value)
                        // Initialize currency_options when switching to "options" mode (for custom questions)
                        if (
                          question.id === "currency_stipulation" &&
                          option.value === "options"
                        ) {
                          // Clear currency_fixed when switching to options mode
                          if (setupConfig.currency_fixed) {
                            handleConfigChange("currency_fixed", undefined)
                          }
                          // Initialize currency_options if not already set
                          if (!setupConfig.currency_options) {
                            handleConfigChange("currency_options", ["", ""])
                          }
                        }
                        // Initialize currency_fixed when switching to "fixed" mode (for custom questions)
                        if (
                          question.id === "currency_stipulation" &&
                          option.value === "fixed"
                        ) {
                          // Clear currency_options when switching to fixed mode
                          if (setupConfig.currency_options) {
                            handleConfigChange("currency_options", undefined)
                          }
                          // Always set to USD if not already set, or ensure it's set
                          if (!setupConfig.currency_fixed) {
                            handleConfigChange("currency_fixed", "USD")
                          }
                        }
                        // Initialize currency_options when switching to "options" mode (for offerAmount)
                        if (
                          question.id === "currency_mode" &&
                          option.value === "options"
                        ) {
                          // Clear fixed_currency when switching to options mode
                          if (setupConfig.fixed_currency) {
                            handleConfigChange("fixed_currency", undefined)
                          }
                          // Initialize currency_options if not already set
                          if (!setupConfig.currency_options) {
                            handleConfigChange("currency_options", ["", ""])
                          }
                        }
                        // Initialize fixed_currency when switching to "fixed" mode (for offerAmount)
                        if (
                          question.id === "currency_mode" &&
                          option.value === "fixed"
                        ) {
                          // Clear currency_options when switching to fixed mode
                          if (setupConfig.currency_options) {
                            handleConfigChange("currency_options", undefined)
                          }
                          // Always set to USD if not already set, or ensure it's set
                          if (!setupConfig.fixed_currency) {
                            handleConfigChange("fixed_currency", "USD")
                          }
                        }
                      }}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-300",
                          isSelected && "border-blue-600",
                        )}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Custom currency select for currency_fixed (use all currencies) */}
            {question.id === "currency_fixed" && question.type === "select" && (
              <div className="space-y-2">
                <Select
                  value={setupConfig[question.id] || ""}
                  onValueChange={(value) =>
                    handleConfigChange(question.id, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(currencyNames).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Select dropdown */}
            {question.type === "select" &&
              question.options &&
              question.id !== "currency_fixed" && (
                <div className="space-y-2">
                  <Select
                    value={setupConfig[question.id] || ""}
                    onValueChange={(value) =>
                      handleConfigChange(question.id, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {question.options.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show Configure Custom Settlement Date button when CYO is selected */}
                  {questionType === "settlementDate" &&
                    question.id === "settlement_date_type" &&
                    setupConfig[question.id] === "CYO" && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          onClick={() => setShowSettlementDateModal(true)}
                        >
                          {!setupConfig.settlement_date_config ||
                          Object.keys(setupConfig.settlement_date_config || {})
                            .length === 0 ||
                          !Object.values(
                            setupConfig.settlement_date_config || {},
                          ).some(
                            (selections) =>
                              Array.isArray(selections) &&
                              selections.length > 0,
                          )
                            ? "Create Custom Settlement Date"
                            : "View/Edit Custom Settlement Date"}
                        </Button>

                        {/* Show warning if no configuration has been made */}
                        {(!setupConfig.settlement_date_config ||
                          Object.keys(setupConfig.settlement_date_config || {})
                            .length === 0 ||
                          !Object.values(
                            setupConfig.settlement_date_config || {},
                          ).some(
                            (selections) =>
                              Array.isArray(selections) &&
                              selections.length > 0,
                          )) && (
                          <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                            <p className="text-sm text-yellow-800">
                              ⚠️ You must configure your custom settlement date
                              options before proceeding.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}

            {/* Select Options Builder (for single_select and multi_select) */}
            {question.id === "select_options" && question.type === "text" && (
              <div className="space-y-3">
                {(() => {
                  // Handle both array format (new) and comma-separated string (legacy)
                  let currentOptions: string[] = []
                  if (setupConfig[question.id]) {
                    if (Array.isArray(setupConfig[question.id])) {
                      currentOptions = setupConfig[question.id]
                    } else if (typeof setupConfig[question.id] === "string") {
                      // Legacy format: comma-separated string
                      currentOptions = setupConfig[question.id]
                        .split(",")
                        .map((opt: string) => opt.trim())
                        .filter((opt: string) => opt !== "")
                    }
                  }

                  // Initialize with 2 empty options if empty
                  if (currentOptions.length === 0) {
                    currentOptions = ["", ""]
                  }

                  const maxOptions = 25

                  return (
                    <>
                      {currentOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-24 text-sm font-medium text-gray-700">
                            Option {index + 1}:
                          </span>
                          <Input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentOptions]
                              newOptions[index] = e.target.value
                              handleConfigChange(question.id, newOptions)
                            }}
                            placeholder={`Enter option ${index + 1}`}
                            className="flex-1"
                          />
                          {currentOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = currentOptions.filter(
                                  (_, i) => i !== index,
                                )
                                handleConfigChange(question.id, newOptions)
                              }}
                              className="cursor-pointer text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}

                      {currentOptions.length < maxOptions && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleConfigChange(question.id, [
                              ...currentOptions,
                              "",
                            ])
                          }}
                          className="mt-2"
                        >
                          + Add another Option
                        </Button>
                      )}

                      <p className="text-xs text-gray-500">
                        Maximum {maxOptions} options allowed
                      </p>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Text input */}
            {question.type === "text" && question.id !== "select_options" && (
              <Input
                type="text"
                value={setupConfig[question.id] || ""}
                onChange={(e) =>
                  handleConfigChange(question.id, e.target.value)
                }
                placeholder={question.placeholder}
              />
            )}

            {/* Number input */}
            {question.type === "number" && (
              <Input
                type="number"
                value={setupConfig[question.id] || ""}
                onChange={(e) =>
                  handleConfigChange(question.id, e.target.value)
                }
                placeholder={question.placeholder}
              />
            )}

            {/* Multi-choice select (checkboxes) */}
            {question.type === "multiChoiceSelect" && question.options && (
              <div className="space-y-2">
                {question.options.map((option: any) => {
                  const selectedValues =
                    setupConfig[question.id] || ([] as string[])
                  const isSelected = Array.isArray(selectedValues)
                    ? selectedValues.includes(option.value)
                    : false

                  return (
                    <div
                      key={option.value}
                      className="flex cursor-pointer items-start gap-3"
                      onClick={() => {
                        const currentValues =
                          (setupConfig[question.id] as string[]) || []
                        const newValues = isSelected
                          ? currentValues.filter((v) => v !== option.value)
                          : [...currentValues, option.value]
                        handleConfigChange(question.id, newValues)
                      }}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300",
                          isSelected && "border-blue-600 bg-blue-600",
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Currency Options (for custom questions) */}
            {question.type === "currency_options" && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Select at least 2 currencies
                    </span>
                  </div>

                  {(() => {
                    const currentOptions = (setupConfig[
                      question.id
                    ] as string[]) || ["", ""]
                    const validOptions = currentOptions.filter(
                      (opt) => opt !== "",
                    )
                    const needsMore = validOptions.length < 2

                    return (
                      <>
                        {currentOptions.map((currency, index) => {
                          const latestOptions = (setupConfig[
                            question.id
                          ] as string[]) || ["", ""]
                          return (
                            <div
                              key={`currency-${index}-${currency || "empty"}`}
                              className="flex items-center gap-2"
                            >
                              <span className="w-32 text-xs font-medium text-gray-700">
                                Currency Option {index + 1}:
                              </span>
                              <Select
                                key={`select-${index}-${currency || "empty"}`}
                                value={currency || ""}
                                onValueChange={(value) => {
                                  const freshOptions = (setupConfig[
                                    question.id
                                  ] as string[]) || ["", ""]
                                  const newOptions = [...freshOptions]
                                  newOptions[index] = value
                                  handleConfigChange(question.id, newOptions)
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {(() => {
                                    // Get all currently selected currencies (excluding the current one)
                                    const latestOptions = (setupConfig[
                                      question.id
                                    ] as string[]) || ["", ""]
                                    const selectedCurrencies = latestOptions
                                      .map((opt, idx) =>
                                        idx === index ? null : opt,
                                      )
                                      .filter(
                                        (opt) => opt && opt !== "",
                                      ) as string[]

                                    // Filter out already selected currencies
                                    return Object.entries(currencyNames)
                                      .filter(([code]) => {
                                        // Allow the currently selected value for this dropdown
                                        if (code === currency) {
                                          return true
                                        }
                                        // Filter out if it's already selected in another dropdown
                                        return !selectedCurrencies.includes(
                                          code,
                                        )
                                      })
                                      .map(([code, name]) => (
                                        <SelectItem key={code} value={code}>
                                          {code} - {name}
                                        </SelectItem>
                                      ))
                                  })()}
                                </SelectContent>
                              </Select>
                              {latestOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = latestOptions.filter(
                                      (_, i) => i !== index,
                                    )
                                    handleConfigChange(question.id, newOptions)
                                  }}
                                  className="cursor-pointer text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          )
                        })}

                        {needsMore && (
                          <p className="text-xs text-amber-600">
                            Please select at least 2 currencies for buyers to
                            choose from.
                          </p>
                        )}

                        {currentOptions.length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              const latestOptions = (setupConfig[
                                question.id
                              ] as string[]) || ["", ""]
                              handleConfigChange(question.id, [
                                ...latestOptions,
                                "",
                              ])
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
            )}
          </div>
        )
      })}

      {/* Special handling for Special Conditions - Dynamic Condition Builder */}
      {questionType === "specialConditions" && (
        <div className="mt-6 space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Predefined Conditions
            </h4>
            <span className="text-xs text-gray-500">
              {conditions.length}/15
            </span>
          </div>

          {conditions.map((condition, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <h5 className="text-sm font-medium text-gray-700">
                  Condition {index + 1}
                </h5>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(index)}
                  className="cursor-pointer text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Name for Condition {index + 1} *
                </label>
                <Input
                  type="text"
                  value={condition.name}
                  onChange={(e) =>
                    handleConditionChange(index, "name", e.target.value)
                  }
                  placeholder="e.g., Subject to Building Inspection"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Additional details (optional)
                </label>
                <Textarea
                  value={condition.details}
                  onChange={(e) =>
                    handleConditionChange(index, "details", e.target.value)
                  }
                  placeholder="Enter additional details (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Attachments (optional, max 10 files, 50MB total)
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Upload attachments that SUBMITTERS can review for this
                  condition
                </p>
                <FileUploadInput
                  id={`condition_${index}_attachments`}
                  label=""
                  required={false}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  multiple
                  disabled={false}
                  value={
                    conditionFileUploads[index]?.files ||
                    condition.attachments
                      ?.map((att) => {
                        // Create a dummy File object for display if we have URLs
                        // In a real implementation, you'd fetch these files or display them differently
                        return null
                      })
                      .filter(Boolean) ||
                    []
                  }
                  fileNames={[
                    ...(conditionFileUploads[index]?.fileNames || []),
                    ...(condition.attachments?.map((att) => att.fileName) ||
                      []),
                  ]}
                  error={undefined}
                  maxFiles={10}
                  maxSize={50 * 1024 * 1024}
                  onChange={(files) => handleConditionFileUpload(index, files)}
                  onRemove={(fileIndex) =>
                    handleRemoveConditionFile(index, fileIndex || 0)
                  }
                />
                {/* Display existing attachments from setupConfig */}
                {condition.attachments &&
                  condition.attachments.length > 0 &&
                  conditionFileUploads[index]?.files.length === 0 && (
                    <div className="mt-2 space-y-1">
                      {condition.attachments.map((att, attIndex) => (
                        <div
                          key={attIndex}
                          className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-2 text-xs"
                        >
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {att.fileName}
                          </a>
                          <span className="text-gray-500">
                            {att.fileSize
                              ? `${(att.fileSize / 1024).toFixed(1)} KB`
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {conditions.length < 15 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCondition}
              className="w-full"
            >
              + Add another condition
            </Button>
          )}
        </div>
      )}

      {/* Special handling for Offer Amount - Dynamic Currency Selection */}
      {questionType === "offerAmount" && (
        <>
          {/* Currency Options Builder (when mode is 'options') */}
          {setupConfig.currency_mode === "options" && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Currency Options
                  </label>
                  <span className="text-xs text-gray-500">
                    Select at least 2 currencies
                  </span>
                </div>

                {(() => {
                  const currentOptions =
                    (setupConfig.currency_options as string[]) || ["", ""]
                  const validOptions = currentOptions.filter(
                    (opt) => opt !== "",
                  )
                  const needsMore = validOptions.length < 2

                  return (
                    <>
                      {currentOptions.map((currency, index) => {
                        // Always read from latest setupConfig to avoid closure issues
                        const latestOptions =
                          (setupConfig.currency_options as string[]) || ["", ""]
                        return (
                          <div
                            key={`currency-${index}-${currency || "empty"}`}
                            className="flex items-center gap-2"
                          >
                            <span className="w-32 text-xs font-medium text-gray-700">
                              Currency Option {index + 1}:
                            </span>
                            <Select
                              key={`select-${index}-${currency || "empty"}`}
                              value={currency || ""}
                              onValueChange={(value) => {
                                // Read fresh from setupConfig to avoid stale closure
                                const freshOptions =
                                  (setupConfig.currency_options as string[]) || [
                                    "",
                                    "",
                                  ]
                                const newOptions = [...freshOptions]
                                newOptions[index] = value
                                handleConfigChange(
                                  "currency_options",
                                  newOptions,
                                )
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Currency" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {(() => {
                                  // Get all currently selected currencies (excluding the current one)
                                  const latestOptions =
                                    (setupConfig.currency_options as string[]) || [
                                      "",
                                      "",
                                    ]
                                  const selectedCurrencies = latestOptions
                                    .map((opt, idx) =>
                                      idx === index ? null : opt,
                                    )
                                    .filter(
                                      (opt) => opt && opt !== "",
                                    ) as string[]

                                  // Filter out already selected currencies
                                  return Object.entries(currencyNames)
                                    .filter(([code]) => {
                                      // Allow the currently selected value for this dropdown
                                      if (code === currency) {
                                        return true
                                      }
                                      // Filter out if it's already selected in another dropdown
                                      return !selectedCurrencies.includes(code)
                                    })
                                    .map(([code, name]) => (
                                      <SelectItem key={code} value={code}>
                                        {code} - {name}
                                      </SelectItem>
                                    ))
                                })()}
                              </SelectContent>
                            </Select>
                            {latestOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = latestOptions.filter(
                                    (_, i) => i !== index,
                                  )
                                  handleConfigChange(
                                    "currency_options",
                                    newOptions,
                                  )
                                }}
                                className="cursor-pointer text-xs text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {needsMore && (
                        <p className="text-xs text-amber-600">
                          Please select at least 2 currencies for buyers to
                          choose from.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const latestOptions =
                            (setupConfig.currency_options as string[]) || [
                              "",
                              "",
                            ]
                          handleConfigChange("currency_options", [
                            ...latestOptions,
                            "",
                          ])
                        }}
                        className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        + Add another Currency
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Fixed Currency Selector (when mode is 'fixed') */}
          {setupConfig.currency_mode === "fixed" && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="w-32 text-sm font-medium text-gray-900">
                  Choose Currency:
                </span>
                <Select
                  key={`fixed-currency-${setupConfig.fixed_currency || "USD"}`}
                  value={setupConfig.fixed_currency || "USD"}
                  onValueChange={(value) => {
                    handleConfigChange("fixed_currency", value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(currencyNames).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </>
      )}

      {!hideButtons && (
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            {mode === "edit" ? "Save Changes" : "Add Question"}
          </Button>
        </div>
      )}

      {/* Settlement Date Configuration Modal */}
      {questionType === "settlementDate" && (
        <DepositDueDateModal
          isOpen={showSettlementDateModal}
          onClose={() => setShowSettlementDateModal(false)}
          onSave={handleSettlementDateConfig}
          initialConfig={setupConfig.settlement_date_config || {}}
          title="Settlement Date"
        />
      )}
    </div>
  )
}

export default QuestionSetupForm
