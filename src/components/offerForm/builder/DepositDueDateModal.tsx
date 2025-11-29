"use client"
/* eslint-disable react/prop-types */
// @ts-nocheck
// Note: Using @ts-nocheck due to complex dynamic object access patterns in legacy code
// Prop interfaces are properly typed for component boundary type safety

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check } from "lucide-react"
import { useState } from "react"

type Option = { value: string; label: string }

interface DepositConfig {
  timeConstraint: string[]
  number: string[]
  timeUnit: string[]
  action: string[]
  trigger: string[]
}

interface CustomOptions {
  timeConstraint: Option[]
  number: Option[]
  timeUnit: Option[]
  action: Option[]
  trigger: Option[]
}

interface DepositDueDateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: DepositConfig) => void
  initialConfig?: Partial<DepositConfig>
  title?: string
}

const DepositDueDateModal = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = {},
  title = "Deposit Due Date",
}: DepositDueDateModalProps) => {
  const [config, setConfig] = useState<DepositConfig>(() => ({
    timeConstraint: initialConfig.timeConstraint || [],
    number: initialConfig.number || [],
    timeUnit: initialConfig.timeUnit || [],
    action: initialConfig.action || [],
    trigger: initialConfig.trigger || [],
  }))

  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalField, setAddModalField] = useState<keyof DepositConfig | "">(
    "",
  )
  const [newOptionText, setNewOptionText] = useState("")

  const [customOptions, setCustomOptions] = useState<CustomOptions>({
    timeConstraint: [] as Option[],
    number: [] as Option[],
    timeUnit: [] as Option[],
    action: [] as Option[],
    trigger: [] as Option[],
  })

  const timeConstraintOptions: Option[] = [
    { value: "within", label: "Within" },
    { value: "on", label: "On" },
    { value: "by", label: "By" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
  ]

  const numberOptions: Option[] = Array.from({ length: 30 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }))

  const timeUnitOptions: Option[] = [
    { value: "business_days", label: "business days" },
    { value: "calendar_days", label: "calendar days" },
    { value: "weeks", label: "weeks" },
    { value: "months", label: "months" },
    { value: "hours", label: "hours" },
  ]

  const actionOptions: Option[] = [
    { value: "of", label: "of" },
    { value: "from", label: "from" },
    { value: "after", label: "after" },
  ]

  const triggerOptions: Option[] = [
    { value: "offer_acceptance", label: "Offer Acceptance" },
    { value: "contract_signing", label: "Contract Signing" },
    { value: "inspection_completion", label: "Inspection Completion" },
    { value: "loan_approval", label: "Loan Approval" },
    { value: "closing_date", label: "Closing Date" },
  ]

  const handleSelectionChange = (
    field: keyof DepositConfig,
    value: string[],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddOption = (field: keyof DepositConfig) => {
    setAddModalField(field)
    setNewOptionText("")
    setShowAddModal(true)
  }

  const handleApplyNewOption = () => {
    const text = newOptionText.trim()
    if (text && addModalField) {
      const newOption = {
        value: text,
        label: text,
      }

      // Add to custom options
      setCustomOptions((prev) => ({
        ...prev,
        [addModalField]: [...prev[addModalField], newOption],
      }))

      // Add to selected options (ticked by default)
      setConfig((prev) => ({
        ...prev,
        [addModalField]: [...prev[addModalField], newOption.value],
      }))

      // Close modal and clear state
      setShowAddModal(false)
      setNewOptionText("")
      setAddModalField("")
    }
  }

  const handleCancelAddOption = () => {
    setShowAddModal(false)
    setNewOptionText("")
    setAddModalField("")
  }

  const canSave = () => {
    // Check if all 5 dropdowns have at least one selection
    const fields: (keyof DepositConfig)[] = [
      "timeConstraint",
      "number",
      "timeUnit",
      "action",
      "trigger",
    ]
    return fields.every((field) => config[field].length > 0)
  }

  const handleSave = () => {
    if (canSave()) {
      onSave(config)
      onClose()
    }
  }

  const renderDropdown = (
    field: keyof DepositConfig,
    options: Option[],
    label: string,
  ) => {
    const selectedCount = config[field].length

    // Combine original options with custom options
    const allOptions = [...options, ...customOptions[field]]

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Select
          onValueChange={(value) => {
            const newValue = config[field].includes(value)
              ? config[field].filter((v) => v !== value)
              : [...config[field], value]
            handleSelectionChange(field, newValue)
          }}
        >
          <SelectTrigger className="w-full">
            {selectedCount > 0 ? (
              <span className="text-gray-700">{selectedCount} selected</span>
            ) : (
              <SelectValue placeholder="Select" />
            )}
          </SelectTrigger>
          <SelectContent>
            {allOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex w-full items-center justify-between">
                  <span>{option.label}</span>
                  {config[field].includes(option.value) && (
                    <Check className="ml-2 h-4 w-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => handleAddOption(field)}
          className="text-xs text-green-600 hover:text-green-700"
        >
          + Add another option
        </button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} - Create Your Own</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm text-gray-600">
              The due date answer comprises of 5 individual sections.
            </p>
            <p className="mb-3 text-sm text-gray-600">
              For each section, you can select one option, or multiple options.
              Where multiple options have been selected, Buyers will choose
              their preferred option from a dropdown menu.
            </p>
            <div className="text-sm text-gray-600">
              <strong>For example:</strong>
              <br />
              <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3">
                <div className="mb-2 font-medium">
                  {title === "Settlement Date"
                    ? "Settlement to occur:"
                    : "Deposit Due:"}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>No more than</span>
                  <Select>
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>business days after</span>
                  <Select>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer_submission">
                        Offer Submission
                      </SelectItem>
                      <SelectItem value="offer_acceptance">
                        Offer Acceptance
                      </SelectItem>
                      <SelectItem value="contract_date">
                        Contract Date
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span>.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {renderDropdown(
              "timeConstraint",
              timeConstraintOptions,
              "Time Constraint",
            )}
            {renderDropdown("number", numberOptions, "Number")}
            {renderDropdown("timeUnit", timeUnitOptions, "Time Unit")}
            {renderDropdown("action", actionOptions, "Preposition")}
            {renderDropdown("trigger", triggerOptions, "Event")}
          </div>

          <div className="flex justify-end space-x-3 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave()}
              className={`${canSave() ? "bg-green-600 hover:bg-green-700" : "cursor-not-allowed bg-gray-400"}`}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add Option Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add a new{" "}
              {addModalField === "timeConstraint"
                ? "Time Constraint"
                : addModalField === "number"
                  ? "Number"
                  : addModalField === "timeUnit"
                    ? "Time Unit"
                    : addModalField === "action"
                      ? "Preposition"
                      : addModalField === "trigger"
                        ? "Event"
                        : "Option"}
              :
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder={`Enter new ${
                addModalField === "timeConstraint"
                  ? "time constraint"
                  : addModalField === "number"
                    ? "number"
                    : addModalField === "timeUnit"
                      ? "time unit"
                      : addModalField === "action"
                        ? "preposition"
                        : addModalField === "trigger"
                          ? "event"
                          : "option"
              }`}
              className="w-full"
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelAddOption}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApplyNewOption}
                className="bg-green-600 hover:bg-green-700"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default DepositDueDateModal
