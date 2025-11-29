import DepositPreview from "@/components/offerForm/DepositPreview"
import DatePicker from "@/components/shared/forms/DatePicker"
import TimePicker from "@/components/shared/forms/TimePicker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSmartQuestion } from "@/data/smartQuestions"
import { Database } from "@/types/supabase"
import { useState } from "react"
/* eslint-disable @typescript-eslint/no-explicit-any */

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionRendererProps {
  question: Question
  disabled?: boolean
}

export const QuestionRenderer = ({
  question,
  disabled = false,
}: QuestionRendererProps) => {
  // State for interactive fields
  const [formValues, setFormValues] = useState<Record<string, any>>({})

  // Get setup configuration
  const setupConfig = (question.setupConfig as Record<string, any>) || {}
  const uiConfig = (question.uiConfig as Record<string, any>) || {}

  // Specify Listing
  if (question.type === "specifyListing") {
    return (
      <Input
        type="text"
        placeholder={uiConfig.placeholder || "Enter listing address or ID..."}
        disabled={disabled}
      />
    )
  }

  // Submitter Role - Use Select with proper options
  if (question.type === "submitterRole") {
    return (
      <Select disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select your role..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="buyer_self">
            I am a Buyer representing myself
          </SelectItem>
          <SelectItem value="buyer_with_agent">
            I am a Buyer and I have an Agent
          </SelectItem>
          <SelectItem value="buyers_agent">
            I&apos;m a Buyers&apos; Agent representing a Buyer
          </SelectItem>
        </SelectContent>
      </Select>
    )
  }

  // Submitter Name - Separate first and last name
  if (question.type === "submitterName") {
    return (
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="First Name"
          disabled={disabled}
          className="flex-1"
        />
        <Input
          type="text"
          placeholder="Last Name"
          disabled={disabled}
          className="flex-1"
        />
      </div>
    )
  }

  // Submitter Email - Use email input type
  if (question.type === "submitterEmail") {
    return (
      <Input
        type="email"
        placeholder="Enter your email address"
        disabled={disabled}
      />
    )
  }

  // Submitter Phone - Use tel input type
  if (question.type === "submitterPhone") {
    return (
      <Input
        type="tel"
        placeholder="Enter your phone number"
        disabled={disabled}
      />
    )
  }

  // Offer Amount
  if (question.type === "offerAmount") {
    return (
      <Input
        type="number"
        placeholder="Enter offer amount"
        disabled={disabled}
      />
    )
  }

  // Submit Button
  if (question.type === "submitButton") {
    return (
      <Button className="w-full" disabled={disabled}>
        {uiConfig.label || "Submit Offer"}
      </Button>
    )
  }

  // Name of Purchaser
  if (question.type === "nameOfPurchaser") {
    const collectionMethod = setupConfig.collection_method
    const collectMiddleNames = setupConfig.collect_middle_names
    const collectId = setupConfig.collect_identification

    // Single field method - simple text input
    if (collectionMethod === "single_field") {
      return (
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Enter name(s) of purchaser(s)"
            disabled={disabled}
          />
          {collectId && collectId !== "no" && (
            <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center">
              <p className="text-sm text-gray-500">
                📎 Upload Identification{" "}
                {collectId === "optional" && "(Optional)"}
              </p>
            </div>
          )}
        </div>
      )
    }

    // Individual names method - complex multi-scenario UI
    const [scenario, setScenario] = useState<string>("")
    const [numPurchasers, setNumPurchasers] = useState<number>(2)
    const [numRepresentatives, setNumRepresentatives] = useState<number>(1)
    const [purchaserTypes, setPurchaserTypes] = useState<
      Record<number, string>
    >({})
    const [noMiddleName, setNoMiddleName] = useState<Record<string, boolean>>(
      {},
    )

    // Helper component for person name fields
    const PersonNameFields = ({
      prefix,
      showMiddleName = collectMiddleNames,
    }: {
      prefix: string
      showMiddleName?: boolean
    }) => (
      <div className="space-y-3">
        <div>
          <Label className="mb-1 block text-sm">First Name:</Label>
          <Input
            type="text"
            placeholder="Enter first name"
            disabled={disabled}
          />
        </div>
        {showMiddleName && (
          <div>
            <Label className="mb-1 block text-sm">Middle Name:</Label>
            <Input
              type="text"
              placeholder="Enter middle name(s)"
              disabled={disabled || noMiddleName[prefix]}
            />
            <div className="mt-2 flex items-center space-x-2">
              <Checkbox
                id={`${prefix}-no-middle`}
                checked={noMiddleName[prefix] || false}
                onCheckedChange={(checked) =>
                  setNoMiddleName({
                    ...noMiddleName,
                    [prefix]: checked as boolean,
                  })
                }
                disabled={disabled}
              />
              <Label
                htmlFor={`${prefix}-no-middle`}
                className="cursor-pointer text-sm font-normal"
              >
                Does not have middle name(s)
              </Label>
            </div>
          </div>
        )}
        <div>
          <Label className="mb-1 block text-sm">Last Name:</Label>
          <Input
            type="text"
            placeholder="Enter last name"
            disabled={disabled}
          />
        </div>
        {collectId && collectId !== "no" && (
          <div>
            <Label className="mb-1 block text-sm">
              ID Upload{" "}
              {collectId === "mandatory" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                Choose file
              </Button>
              <span className="text-sm text-gray-500">No file chosen</span>
            </div>
          </div>
        )}
      </div>
    )

    return (
      <div className="space-y-4">
        {/* Main scenario selector */}
        <div>
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">1 Person is Buying</SelectItem>
              <SelectItem value="multiple">
                2 or more People are Buying
              </SelectItem>
              <SelectItem value="corporation">
                A Corporation is Buying
              </SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scenario 1: Single Person */}
        {scenario === "single" && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Who is the Purchaser?</h4>
            <PersonNameFields prefix="single" />
          </div>
        )}

        {/* Scenario 2: Multiple People */}
        {scenario === "multiple" && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-medium">
                How many people are Buying?
              </Label>
              <Select
                value={numPurchasers.toString()}
                onValueChange={(val) => setNumPurchasers(parseInt(val))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {Array.from({ length: numPurchasers }, (_, i) => i + 1).map(
              (num) => (
                <div key={num} className="space-y-3 border-t pt-4">
                  <h4 className="text-sm font-medium">
                    Purchaser {num} - Who is the Purchaser?
                  </h4>
                  <PersonNameFields prefix={`purchaser-${num}`} />
                </div>
              ),
            )}
          </div>
        )}

        {/* Scenario 3: Corporation */}
        {scenario === "corporation" && (
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block text-sm">Corporation Name:</Label>
              <Input
                type="text"
                placeholder="Enter corporation name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">
                Corporation Representative:
              </h4>

              {Array.from({ length: numRepresentatives }, (_, i) => i + 1).map(
                (num) => (
                  <div key={num} className={num > 1 ? "border-t pt-4" : ""}>
                    {num > 1 && (
                      <h5 className="mb-3 text-sm font-medium">
                        Representative {num}:
                      </h5>
                    )}
                    <PersonNameFields prefix={`rep-${num}`} />
                  </div>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNumRepresentatives(numRepresentatives + 1)}
                disabled={disabled}
              >
                + Add another Representative
              </Button>
            </div>
          </div>
        )}

        {/* Scenario 4: Other */}
        {scenario === "other" && (
          <div className="space-y-4">
            {Array.from({ length: numPurchasers }, (_, i) => i + 1).map(
              (num) => (
                <div
                  key={num}
                  className={num > 1 ? "space-y-3 border-t pt-4" : "space-y-3"}
                >
                  <div>
                    <Label className="mb-2 block text-sm font-medium">
                      Is Purchaser {num} a Person or Corporation?
                    </Label>
                    <Select
                      value={purchaserTypes[num] || ""}
                      onValueChange={(val) =>
                        setPurchaserTypes({ ...purchaserTypes, [num]: val })
                      }
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Person</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {purchaserTypes[num] === "person" && (
                    <PersonNameFields prefix={`other-person-${num}`} />
                  )}

                  {purchaserTypes[num] === "corporation" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-1 block text-sm">
                          Corporation Name:
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter corporation name"
                          disabled={disabled}
                        />
                      </div>
                      <h5 className="text-sm font-medium">
                        Corporation Representative:
                      </h5>
                      <PersonNameFields prefix={`other-corp-${num}-rep`} />
                    </div>
                  )}
                </div>
              ),
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNumPurchasers(numPurchasers + 1)}
              disabled={disabled}
            >
              + Add a{" "}
              {numPurchasers === 1
                ? "2nd"
                : numPurchasers === 2
                  ? "3rd"
                  : `${numPurchasers + 1}th`}{" "}
              Purchaser
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Attach Purchase Agreement
  if (question.type === "attachPurchaseAgreement") {
    const isRequired = setupConfig.contract_requirement === "required"
    return (
      <>
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <p className="text-sm text-gray-500">
            📎 Upload Purchase Agreement {!isRequired && "(Optional)"}
          </p>
        </div>
        <span className="text-xs text-gray-500">
          Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB each)
        </span>
      </>
    )
  }

  // Offer Expiry - Use DatePicker and TimePicker
  if (question.type === "offerExpiry") {
    return (
      <div className="flex gap-2">
        <DatePicker label="Select date" disabled={disabled} />
        <TimePicker label="Select time" disabled={disabled} />
      </div>
    )
  }

  // Deposit - delegate to legacy preview component for feature parity
  if (question.type === "deposit") {
    const depositQuestion = getSmartQuestion(question.type)
    if (!depositQuestion) {
      return (
        <div className="rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
          Deposit configuration unavailable.
        </div>
      )
    }

    const generated = depositQuestion.generateProperties(setupConfig || {})
    const previewQuestion = {
      ...generated,
      id: question.id,
      is_essential: question.required,
    }

    return (
      <DepositPreview
        question={previewQuestion}
        setupAnswers={setupConfig || {}}
        onChange={() => {}}
      />
    )
  }

  // Subject to Loan Approval
  if (question.type === "subjectToLoanApproval") {
    const loanAmountType = setupConfig.loan_amount_type
    const lenderDetails = setupConfig.lender_details
    const attachments = setupConfig.attachments
    const loanApprovalDue = setupConfig.loan_approval_due
    const financeSpecialist = setupConfig.finance_specialist_communication

    const isSubjectToLoan = formValues.subjectToLoan === "yes"
    const knowsLenderDetails = !formValues.unknownLender

    return (
      <div className="space-y-4">
        {/* Main question as dropdown */}
        <div>
          <Label className="mb-2 block text-sm font-medium">
            Is your Offer subject to Loan Approval?
            <span className="font-bold text-red-500"> *</span>
          </Label>
          <Select
            value={formValues.subjectToLoan || ""}
            onValueChange={(value) =>
              setFormValues((prev) => ({ ...prev, subjectToLoan: value }))
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show fields only when "Yes" is selected */}
        {isSubjectToLoan && (
          <>
            {/* Loan Amount */}
            {loanAmountType && loanAmountType !== "no_amount" && (
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  What is your Loan Amount?{" "}
                  <span className="font-bold text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter amount"
                  className="max-w-56"
                  disabled={disabled}
                  value={formValues.loanAmount || ""}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      loanAmount: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {/* Company Name with checkbox */}
            {lenderDetails && lenderDetails !== "not_required" && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Label className="w-32 pt-2 text-sm font-medium">
                    Company Name:
                  </Label>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={`Enter company name or "I don't know yet`}
                      disabled={disabled}
                      value={formValues.companyName || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-36">
                  <Checkbox
                    id="unknown-lender"
                    checked={formValues.unknownLender || false}
                    onCheckedChange={(checked) =>
                      setFormValues((prev) => ({
                        ...prev,
                        unknownLender: checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="unknown-lender"
                    className="text-sm font-normal"
                  >
                    I don't know Lender Details yet
                  </Label>
                </div>
              </div>
            )}

            {/* Contact fields - only show if checkbox is NOT checked */}
            {lenderDetails &&
              lenderDetails !== "not_required" &&
              knowsLenderDetails && (
                <>
                  {/* Contact Name */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32 text-sm font-medium">
                      Contact Name:
                    </Label>
                    <Input
                      type="text"
                      placeholder={`Enter contact name or "I don't know yet"`}
                      disabled={disabled}
                      className="flex-1"
                      value={formValues.contactName || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          contactName: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32 text-sm font-medium">
                      Contact Phone:
                    </Label>
                    <Input
                      type="tel"
                      placeholder={`Enter phone number or "I don't know yet"`}
                      disabled={disabled}
                      className="flex-1"
                      value={formValues.contactPhone || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          contactPhone: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="flex items-center gap-3">
                    <Label className="w-32 text-sm font-medium">
                      Contact Email:
                    </Label>
                    <Input
                      type="email"
                      placeholder={`Enter email address or "I don't know yet"`}
                      disabled={disabled}
                      className="flex-1"
                      value={formValues.contactEmail || ""}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

            {/* Supporting Documents */}
            {attachments && attachments !== "not_required" && (
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Supporting Documents:
                </Label>
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    Upload pre-approval documents or supporting evidence
                  </p>
                </div>
              </div>
            )}

            {/* Loan Approval Due */}
            {loanApprovalDue && loanApprovalDue !== "no_due_date" && (
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Loan Approval Due:{" "}
                  <span className="font-bold text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter due date details"
                  disabled={disabled}
                  value={formValues.loanDueDate || ""}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      loanDueDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {/* Finance Specialist Communication */}
            {financeSpecialist && financeSpecialist !== "not_shown" && (
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Would you like to receive communication from a Finance
                  Specialist with regard to your financing options?{" "}
                  <span className="font-bold text-red-500">*</span>
                </Label>
                <Select
                  disabled={disabled}
                  value={formValues.financeSpecialist || ""}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      financeSpecialist: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Special Conditions
  if (question.type === "specialConditions") {
    const conditions =
      (setupConfig.conditions as Array<{
        name: string
        details?: string
      }>) || []
    const allowCustom = setupConfig.allow_custom_conditions === "yes"

    return (
      <div className="space-y-3">
        {conditions.length > 0 ? (
          <div className="space-y-2">
            {conditions.map((condition, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Checkbox disabled={disabled} className="mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">
                    {condition.name}
                  </span>
                  {condition.details && (
                    <p className="text-xs text-gray-500">{condition.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No predefined conditions</p>
        )}

        {allowCustom && (
          <div className="mt-3 border-t pt-3">
            <Label className="mb-2 block text-sm font-medium">
              Add Custom Condition
            </Label>
            <Textarea
              placeholder="Enter your custom condition..."
              disabled={disabled}
              rows={3}
            />
          </div>
        )}
      </div>
    )
  }

  // Settlement Date
  if (question.type === "settlementDate") {
    const dateType = setupConfig.settlement_date_type
    const location = setupConfig.settlement_location

    return (
      <div className="space-y-3">
        <div>
          {dateType === "calendar" && <DatePicker disabled={disabled} />}
          {dateType === "datetime" && (
            <div className="flex gap-2">
              <DatePicker disabled={disabled} />
              <TimePicker disabled={disabled} />
            </div>
          )}
          {dateType === "buyer_text" && (
            <Input
              type="text"
              placeholder="Enter settlement date"
              disabled={disabled}
            />
          )}
          {dateType === "seller_text" && (
            <p className="text-sm text-gray-600">
              {setupConfig.settlement_date_text || "Settlement date text"}
            </p>
          )}
          {dateType === "within_days" && (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Number of days"
                disabled={disabled}
              />
              <span className="flex items-center text-sm text-gray-600">
                days after acceptance
              </span>
            </div>
          )}
          {dateType === "CYO" && (
            <Input
              type="text"
              placeholder="Enter settlement date"
              disabled={disabled}
            />
          )}
        </div>

        {location && location !== "not_required" && (
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Settlement Location
            </Label>
            {location === "buyer_text" && (
              <Input
                type="text"
                placeholder="Enter settlement location"
                disabled={disabled}
              />
            )}
            {location === "seller_text" && (
              <p className="text-sm text-gray-600">
                {setupConfig.settlement_location_text ||
                  "Settlement location text"}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Message to Agent
  if (question.type === "messageToAgent") {
    const allowAttachments = setupConfig.allow_attachments === "yes"

    return (
      <div className="space-y-3">
        <Textarea
          placeholder="Type your message here..."
          disabled={disabled}
          rows={4}
        />
        {allowAttachments && (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center">
            <p className="text-sm text-gray-500">📎 Attach files (Optional)</p>
          </div>
        )}
      </div>
    )
  }

  // Custom Question
  if (question.type === "custom") {
    const answerType = setupConfig.answer_type

    if (answerType === "short_text") {
      return (
        <Input
          type="text"
          placeholder="Enter your answer"
          disabled={disabled}
        />
      )
    } else if (answerType === "long_text") {
      return (
        <Textarea
          placeholder="Enter your answer"
          disabled={disabled}
          rows={4}
        />
      )
    } else if (answerType === "number_amount") {
      const numberType = setupConfig.number_type

      if (numberType === "money") {
        const currencyStip = setupConfig.currency_stipulation
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              {currencyStip === "fixed" && (
                <span className="flex items-center text-sm text-gray-600">
                  {setupConfig.currency_fixed}
                </span>
              )}
              <Input
                type="number"
                placeholder="Enter amount"
                disabled={disabled}
                className="flex-1"
              />
            </div>
            {currencyStip === "options" && (
              <Select disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {setupConfig.currency_options
                    ?.split(",")
                    .map((curr: string, idx: number) => (
                      <SelectItem key={idx} value={curr.trim()}>
                        {curr.trim()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {currencyStip === "any" && (
              <Input type="text" placeholder="Currency" disabled={disabled} />
            )}
          </div>
        )
      } else if (numberType === "phone") {
        return (
          <Input
            type="tel"
            placeholder="Enter phone number"
            disabled={disabled}
          />
        )
      } else if (numberType === "percentage") {
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter percentage"
              disabled={disabled}
            />
            <span className="flex items-center text-sm text-gray-600">%</span>
          </div>
        )
      } else {
        return (
          <Input type="number" placeholder="Enter amount" disabled={disabled} />
        )
      }
    } else if (answerType === "file_upload") {
      return (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <p className="text-sm text-gray-500">📎 Upload files</p>
        </div>
      )
    } else if (answerType === "time_date") {
      const timeType = setupConfig.time_date_type
      if (timeType === "date") {
        return <DatePicker disabled={disabled} />
      } else if (timeType === "time") {
        return <Input type="time" disabled={disabled} />
      } else if (timeType === "datetime") {
        return (
          <div className="flex gap-2">
            <DatePicker disabled={disabled} />
            <TimePicker disabled={disabled} />
          </div>
        )
      }
    } else if (answerType === "yes_no") {
      return (
        <RadioGroup disabled={disabled}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="custom-yes" />
            <Label htmlFor="custom-yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="custom-no" />
            <Label htmlFor="custom-no">No</Label>
          </div>
          {setupConfig.allow_unsure === "yes" && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unsure" id="custom-unsure" />
              <Label htmlFor="custom-unsure">Unsure</Label>
            </div>
          )}
        </RadioGroup>
      )
    } else if (answerType === "single_select") {
      const options =
        setupConfig.select_options
          ?.split(",")
          .map((opt: string) => opt.trim()) || []
      return (
        <RadioGroup disabled={disabled}>
          {options.map((opt: string, idx: number) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`option-${idx}`} />
              <Label htmlFor={`option-${idx}`}>{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    } else if (answerType === "multi_select") {
      const options =
        setupConfig.select_options
          ?.split(",")
          .map((opt: string) => opt.trim()) || []
      return (
        <div className="space-y-2">
          {options.map((opt: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Checkbox disabled={disabled} />
              <Label>{opt}</Label>
            </div>
          ))}
        </div>
      )
    } else if (answerType === "statement") {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">{setupConfig.question_text}</p>
          {setupConfig.add_tickbox === "yes" && (
            <div className="flex items-center gap-2">
              <Checkbox disabled={disabled} />
              <span className="text-sm text-gray-700">
                {setupConfig.tickbox_text || "I agree"}
                {setupConfig.tickbox_requirement === "essential" && (
                  <span className="text-red-500"> *</span>
                )}
              </span>
            </div>
          )}
        </div>
      )
    }
  }

  // Default fallback
  return <Input type="text" placeholder="Enter value..." disabled={disabled} />
}
