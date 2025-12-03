"use client"
/* eslint-disable react/prop-types */
// @ts-nocheck

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

interface LoanDueDateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: any) => void
  initialConfig?: any
}

const LoanDueDateModal = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = {},
}: LoanDueDateModalProps) => {
  const [config, setConfig] = useState({
    timeConstraint: initialConfig.timeConstraint || [],
    number: initialConfig.number || [],
    timeUnit: initialConfig.timeUnit || [],
    action: initialConfig.action || [],
    trigger: initialConfig.trigger || [],
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalField, setAddModalField] = useState("")
  const [newOptionText, setNewOptionText] = useState("")

  const [customOptions, setCustomOptions] = useState({
    timeConstraint: [],
    number: [],
    timeUnit: [],
    action: [],
    trigger: [],
  })

  const timeConstraintOptions = [
    { value: "within", label: "Within" },
    { value: "on", label: "On" },
    { value: "by", label: "By" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
  ]

  const numberOptions = Array.from({ length: 30 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString(),
  }))

  const timeUnitOptions = [
    { value: "business_days", label: "business days" },
    { value: "calendar_days", label: "calendar days" },
    { value: "weeks", label: "weeks" },
    { value: "months", label: "months" },
    { value: "hours", label: "hours" },
  ]

  const actionOptions = [
    { value: "of", label: "of" },
    { value: "from", label: "from" },
    { value: "after", label: "after" },
  ]

  const triggerOptions = [
    { value: "offer_acceptance", label: "Offer Acceptance" },
    { value: "contract_signing", label: "Contract Signing" },
    { value: "inspection_completion", label: "Inspection Completion" },
    { value: "loan_approval", label: "Loan Approval" },
    { value: "closing_date", label: "Closing Date" },
  ]

  const handleSelectionChange = (field: string, newValue: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: newValue,
    }))
  }

  const handleAddOption = (field: string) => {
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
      setCustomOptions((prev: any) => ({
        ...prev,
        [addModalField]: [...prev[addModalField], newOption],
      }))

      // Add to selected options (ticked by default)
      setConfig((prev: any) => ({
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
    const fields = ["timeConstraint", "number", "timeUnit", "action", "trigger"]
    return fields.every((field) => (config as any)[field].length > 0)
  }

  const handleSave = () => {
    if (canSave()) {
      onSave(config)
      onClose()
    }
  }

  const renderDropdown = (field: string, options: any[], label: string) => {
    const selectedCount = (config as any)[field].length
    const placeholder =
      selectedCount > 0 ? `${selectedCount} selected` : "Select"

    // Combine original options with custom options
    const allOptions = [...options, ...(customOptions as any)[field]]

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Select
          value=""
          onValueChange={(value) => {
            const newValue = (config as any)[field].includes(value)
              ? (config as any)[field].filter((v: any) => v !== value)
              : [...(config as any)[field], value]
            handleSelectionChange(field, newValue)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {allOptions.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex w-full items-center justify-between">
                  <span>{option.label}</span>
                  {(config as any)[field].includes(option.value) && (
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Approval Due Date - Create Your Own</DialogTitle>
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
                <div className="mb-2 font-medium">Loan Approval Due:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select>
                    <SelectTrigger className="h-8 w-auto min-w-[80px] text-sm">
                      <SelectValue placeholder="Within" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="within">Within</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="h-8 w-auto min-w-[60px] text-sm">
                      <SelectValue placeholder="7" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
                      <SelectValue placeholder="business days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_days">
                        business days
                      </SelectItem>
                      <SelectItem value="calendar_days">
                        calendar days
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="h-8 w-auto min-w-[60px] text-sm">
                      <SelectValue placeholder="of" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="of">of</SelectItem>
                      <SelectItem value="from">from</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm">
                      <SelectValue placeholder="Offer Acceptance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer_acceptance">
                        Offer Acceptance
                      </SelectItem>
                      <SelectItem value="contract_signing">
                        Contract Signing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span>.</span>
                </div>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>No more than</strong> [Select] business days after
                  [Select].
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {renderDropdown(
              "timeConstraint",
              timeConstraintOptions,
              "Preposition",
            )}
            {renderDropdown("number", numberOptions, "Number")}
            {renderDropdown("timeUnit", timeUnitOptions, "Time Unit")}
            {renderDropdown("action", actionOptions, "Preposition")}
            {renderDropdown("trigger", triggerOptions, "Event")}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave()}
              className="bg-green-600 hover:bg-green-700"
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
            <DialogTitle>Add Custom Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enter custom option text:
              </label>
              <Input
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Enter custom option"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancelAddOption}>
                Cancel
              </Button>
              <Button
                onClick={handleApplyNewOption}
                disabled={!newOptionText.trim()}
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

export default LoanDueDateModal
