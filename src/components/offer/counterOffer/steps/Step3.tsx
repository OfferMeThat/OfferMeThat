"use client"

import DepositPreview from "@/components/offerForm/DepositPreview"
import { getSmartQuestion } from "@/data/smartQuestions"
import {
  formatDepositAmount,
  formatDepositDue,
  normalizeDepositData,
} from "@/lib/depositDataHelpers"
import { Database } from "@/types/supabase"
import { ArrowRight, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { Button } from "../../../ui/button"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]
type FormValues = Record<string, any>

interface Step3Props {
  originalFormValues: FormValues
  counterFormValues: FormValues
  renderField: (
    label: string,
    fieldKey: string,
    renderInput: (
      value: any,
      onChange: (value: any) => void,
    ) => React.ReactElement,
    renderDisplay: (value: any) => string,
    originalValue: any,
    counterValue: any,
  ) => React.ReactElement
  handleCopyValue: (fieldKey: string) => void
  handleRemoveValue: (fieldKey: string) => void
  handleValueChange: (fieldKey: string, value: any) => void
  questions: Question[]
}

export const Step3 = ({
  originalFormValues,
  counterFormValues,
  renderField,
  handleCopyValue,
  handleRemoveValue,
  handleValueChange,
  questions,
}: Step3Props) => {
  const depositQuestion = useMemo(() => {
    return questions.find((q) => q.type === "deposit") || null
  }, [questions])

  const setupConfig = useMemo(() => {
    if (!depositQuestion?.setupConfig) return {}
    try {
      return typeof depositQuestion.setupConfig === "string"
        ? JSON.parse(depositQuestion.setupConfig)
        : depositQuestion.setupConfig
    } catch {
      return {}
    }
  }, [depositQuestion])

  const generatedDepositQuestion = useMemo(() => {
    if (!depositQuestion) return null
    const depositSmartQuestion = getSmartQuestion("deposit")
    if (!depositSmartQuestion) return null

    const generated = depositSmartQuestion.generateProperties(setupConfig)
    return {
      ...generated,
      id: depositQuestion.id,
      is_essential: depositQuestion.required,
      uiConfig: depositQuestion.uiConfig,
      setupConfig: depositQuestion.setupConfig,
    }
  }, [depositQuestion, setupConfig])

  const formatOriginalDepositString = (depositData: any): string => {
    if (!depositData) return "N/A"

    try {
      const normalized = normalizeDepositData(depositData)
      if (!normalized || normalized.instalments.length === 0) {
        return "N/A"
      }

      const { instalments, numInstalments } = normalized

      if (numInstalments === 1) {
        const inst = instalments[0]
        const amount = formatDepositAmount(inst)
        const due = formatDepositDue(inst)
        const holding = inst.depositHolding
          ? ` - Held: ${inst.depositHolding}`
          : ""
        return `${amount} - Due: ${due}${holding}`
      }

      const details = instalments.map((inst, idx) => {
        const amount = formatDepositAmount(inst)
        const due = formatDepositDue(inst)
        const holding = inst.depositHolding
          ? ` - Held: ${inst.depositHolding}`
          : ""
        return `Inst ${idx + 1}: ${amount} (Due: ${due}${holding})`
      })
      return details.join("; ")
    } catch (e) {
      return "N/A"
    }
  }

  const formatDepositDueWithDefault = (
    inst: any,
    instalmentNum?: number,
  ): string => {
    const due = formatDepositDue(inst)
    if (
      due === "N/A" &&
      !inst.depositDue &&
      !inst.depositDueText &&
      !inst.depositDueWithin
    ) {
      const depositDueKey = instalmentNum
        ? `deposit_due_instalment_${instalmentNum}`
        : "deposit_due"
      const depositDueValue =
        setupConfig[depositDueKey] || setupConfig.deposit_due
      if (depositDueValue === "immediately") {
        return "Immediately upon Offer Acceptance"
      }
    }
    return due
  }

  const formatOriginalDeposit = (depositData: any): React.ReactNode => {
    if (!depositData) return "N/A"

    try {
      const normalized = normalizeDepositData(depositData)
      if (!normalized || normalized.instalments.length === 0) {
        return "N/A"
      }

      const { instalments, numInstalments } = normalized

      if (numInstalments === 1) {
        const inst = instalments[0]
        const amount = formatDepositAmount(inst)
        const due = formatDepositDueWithDefault(inst)
        return (
          <div className="space-y-1">
            <div>Amount: {amount}</div>
            <div>Due: {due}</div>
            {inst.depositHolding && <div>Held: {inst.depositHolding}</div>}
          </div>
        )
      }

      return (
        <div className="space-y-2">
          {instalments.map((inst, idx) => {
            const amount = formatDepositAmount(inst)
            const due = formatDepositDueWithDefault(inst, idx + 1)
            return (
              <div
                key={idx}
                className="space-y-1 border-b border-gray-200 pb-2 last:border-0 last:pb-0"
              >
                <div className="font-medium">Instalment {idx + 1}:</div>
                <div className="space-y-0.5 pl-2 text-xs">
                  <div>Amount: {amount}</div>
                  <div>Due: {due}</div>
                  {inst.depositHolding && (
                    <div>Held: {inst.depositHolding}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    } catch (e) {
      return "N/A"
    }
  }

  if (!depositQuestion || !generatedDepositQuestion) {
    return (
      <div className="space-y-6">
        {renderField(
          "Deposit",
          "deposit",
          (value, onChange) => (
            <Input
              value={JSON.stringify(value || {})}
              onChange={(e) => {
                try {
                  onChange(JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON
                }
              }}
              placeholder="Deposit data"
              className="w-full"
            />
          ),
          formatOriginalDepositString,
          originalFormValues.deposit,
          counterFormValues.deposit,
        )}
      </div>
    )
  }

  const originalDepositData = originalFormValues.deposit || null
  const counterDepositData = counterFormValues.deposit

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-6 md:space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Label className="text-sm font-medium text-gray-700">Deposit</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4">
          <div className="w-full">
            <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
              {formatOriginalDeposit(originalDepositData)}
            </div>
          </div>

          <div className="flex justify-center pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rotate-90 p-0 md:rotate-0"
              onClick={() => handleCopyValue("deposit")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="space-y-4">
                <DepositPreview
                  question={generatedDepositQuestion}
                  setupAnswers={setupConfig}
                  onChange={(data) => handleValueChange("deposit", data)}
                  editingMode={false}
                />
                {counterDepositData !== undefined &&
                  counterDepositData !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveValue("deposit")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
