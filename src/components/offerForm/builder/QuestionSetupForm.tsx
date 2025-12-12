/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

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
import { QUESTION_DEFINITIONS } from "@/constants/offerFormQuestions"
import { currencyNames } from "@/constants/forms"
import { getQuestionRequiredFromSetup } from "@/lib/questionHelpers"
import { cn } from "@/lib/utils"
import { QuestionType } from "@/types/form"
import { QuestionSetupConfig, QuestionUIConfig } from "@/types/questionConfig"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import SmartQuestionSetup from "./SmartQuestionSetup"

interface QuestionSetupFormProps {
  questionType: QuestionType
  initialSetupConfig?: QuestionSetupConfig
  initialUIConfig?: QuestionUIConfig
  onComplete: (
    setupConfig: QuestionSetupConfig,
    uiConfig?: QuestionUIConfig,
    requiredOverride?: boolean,
  ) => void
  onCancel: () => void
  hideButtons?: boolean
  mode?: "add" | "edit"
}

const QuestionSetupForm = ({
  questionType,
  initialSetupConfig = {},
  initialUIConfig = {},
  onComplete,
  onCancel,
  hideButtons = false,
  mode = "add",
}: QuestionSetupFormProps) => {
  // Initialize setupConfig with defaults for offerAmount
  const initialConfig = useMemo(() => {
    const config = { ...initialSetupConfig }
    
    // Set default currency_mode to "any" for offerAmount if not set
    if (
      questionType === "offerAmount" &&
      !config.currency_mode
    ) {
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
  const [conditions, setConditions] = useState<
    Array<{ name: string; details: string }>
  >((initialSetupConfig as any)?.conditions || [])

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
      const configToSet = { ...initialSetupConfig }
      
      // Set default currency_mode to "any" for offerAmount if not set
      if (
        questionType === "offerAmount" &&
        !configToSet.currency_mode
      ) {
        configToSet.currency_mode = "any"
        // Also set default fixed_currency if switching to fixed mode later
        if (!configToSet.fixed_currency) {
          configToSet.fixed_currency = "USD"
        }
      }
      
      setSetupConfig(configToSet)
      if ((configToSet as any)?.conditions) {
        setConditions((configToSet as any).conditions)
      }
      prevConfigRef.current = JSON.stringify(configToSet)
      questionTypeRef.current = questionType
    }
  }, [initialSetupConfig, questionType])

  const handleConfigChange = (questionId: string, value: any) => {
    setSetupConfig((prev) => ({
      ...prev,
      [questionId]: value,
    }))
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

  // Validation function to check if setup is complete
  const validateSetup = useCallback(() => {
    const definition = QUESTION_DEFINITIONS[questionType]
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

      // Check if required field is filled
      if (question.required !== false) {
        const value = setupConfig[question.id]
        if (value === undefined || value === "" || value === null) {
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
          ? setupConfig.currency_options.filter((opt: string) => opt && opt !== "")
          : []
        if (validCurrencies.length < 2) {
          toast.error("Please select at least 2 currencies for the currency options mode.")
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
    let finalConfig =
      questionType === "specialConditions"
        ? { ...setupConfig, conditions }
        : { ...setupConfig }

    // For Offer Amount with currency_options mode, filter out empty values
    if (
      questionType === "offerAmount" &&
      finalConfig.currency_mode === "options"
    ) {
      if (Array.isArray(finalConfig.currency_options)) {
        finalConfig.currency_options = finalConfig.currency_options.filter(
          (opt: string) => opt && opt !== "",
        )
      }
    }

    // For custom questions (except statement type), build uiConfig with label from question_text
    // Statement type has separate fields: uiConfig.label (main label) and setupConfig.question_text (statement text)
    let finalUIConfig = initialUIConfig
    if (
      questionType === "custom" &&
      finalConfig.question_text &&
      finalConfig.answer_type !== "statement"
    ) {
      finalUIConfig = {
        ...initialUIConfig,
        label: finalConfig.question_text,
      }
    }

    // Check if setup config determines the required status
    const requiredFromSetup = getQuestionRequiredFromSetup(
      questionType,
      finalConfig,
    )

    onComplete(finalConfig, finalUIConfig, requiredFromSetup ?? undefined)
  }, [setupConfig, conditions, questionType, initialUIConfig, onComplete, validateSetup])

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
        onComplete={(generated, answers, requiredOverride) => {
          onComplete(answers, generated, requiredOverride)
        }}
        onCancel={onCancel}
        hideButtons={hideButtons}
        mode={mode}
      />
    )
  }

  const definition = QUESTION_DEFINITIONS[questionType]
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
                        // Initialize currency_options when switching to "options" mode
                        if (
                          question.id === "currency_mode" &&
                          option.value === "options" &&
                          !setupConfig.currency_options
                        ) {
                          handleConfigChange("currency_options", ["", ""])
                        }
                        // Initialize fixed_currency when switching to "fixed" mode
                        if (
                          question.id === "currency_mode" &&
                          option.value === "fixed"
                        ) {
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

            {/* Select dropdown */}
            {question.type === "select" && question.options && (
              <Select
                value={setupConfig[question.id] || ""}
                onValueChange={(value) =>
                  handleConfigChange(question.id, value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Text input */}
            {question.type === "text" && (
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
                  className="text-sm text-red-600 hover:text-red-700"
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
                  const validOptions = currentOptions.filter((opt) => opt !== "")
                  const needsMore = validOptions.length < 2

                  return (
                    <>
                      {currentOptions.map((currency, index) => {
                        // Always read from latest setupConfig to avoid closure issues
                        const latestOptions = (setupConfig.currency_options as string[]) || ["", ""]
                        return (
                          <div key={`currency-${index}-${currency || "empty"}`} className="flex items-center gap-2">
                            <span className="w-32 text-xs font-medium text-gray-700">
                              Currency Option {index + 1}:
                            </span>
                            <Select
                              key={`select-${index}-${currency || "empty"}`}
                              value={currency || ""}
                              onValueChange={(value) => {
                                // Read fresh from setupConfig to avoid stale closure
                                const freshOptions = (setupConfig.currency_options as string[]) || ["", ""]
                                const newOptions = [...freshOptions]
                                newOptions[index] = value
                                handleConfigChange("currency_options", newOptions)
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Currency" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {Object.entries(currencyNames).map(
                                  ([code, name]) => (
                                    <SelectItem key={code} value={code}>
                                      {code} - {name}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            {latestOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = latestOptions.filter(
                                    (_, i) => i !== index,
                                  )
                                  handleConfigChange("currency_options", newOptions)
                                }}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {needsMore && (
                        <p className="text-xs text-amber-600">
                          Please select at least 2 currencies for buyers to choose
                          from.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const latestOptions = (setupConfig.currency_options as string[]) || [
                            "",
                            "",
                          ]
                          handleConfigChange("currency_options", [
                            ...latestOptions,
                            "",
                          ])
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
    </div>
  )
}

export default QuestionSetupForm
