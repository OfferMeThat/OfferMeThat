import { getFormOwnerListings } from "@/app/actions/offerForm"
import DepositPreview from "@/components/offerForm/DepositPreview"
import DatePicker from "@/components/shared/forms/DatePicker"
import PhoneInput from "@/components/shared/forms/PhoneInput"
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
import { validateFileSize } from "@/lib/offerFormValidation"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"
import {
  getSubQuestionLabel,
  getSubQuestionPlaceholder,
  parseUIConfig,
  QuestionUIConfig,
} from "@/types/questionUIConfig"
import { Database } from "@/types/supabase"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]

interface QuestionRendererProps {
  question: Question
  disabled?: boolean
  editingMode?: boolean
  onUpdateQuestion?: (questionId: string, updates: Record<string, any>) => void
  onEditPlaceholder?: (fieldKey: string, currentText?: string) => void
  onEditLabel?: (fieldKey: string, currentText?: string) => void
  formId?: string
  ownerId?: string
  brandingConfig?: BrandingConfig
  value?: any
  onChange?: (value: any) => void
  onBlur?: () => void
  error?: string
  isTestMode?: boolean
}

// PersonNameFields component extracted to prevent re-creation on every render
interface PersonNameFieldsProps {
  prefix: string
  questionId: string
  nameFields: Record<
    string,
    {
      firstName: string
      middleName: string
      lastName: string
      skipMiddleName?: boolean
    }
  >
  setNameFields: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        {
          firstName: string
          middleName: string
          lastName: string
          skipMiddleName?: boolean
        }
      >
    >
  >
  fileUploads: Record<string, { file: File | null; fileName: string }>
  setFileUploads: React.Dispatch<
    React.SetStateAction<
      Record<string, { file: File | null; fileName: string }>
    >
  >
  collectMiddleNames: string
  collectId: string
  uiConfig: QuestionUIConfig
  disabled: boolean
  editingMode: boolean
  renderLabelOverlay: (
    fieldId: string,
    currentText: string,
  ) => React.ReactElement | null
  renderEditOverlay: (
    fieldId: string,
    currentText: string,
  ) => React.ReactElement | null
  brandingConfig?: BrandingConfig
}

const PersonNameFields = ({
  prefix,
  questionId,
  nameFields,
  setNameFields,
  fileUploads,
  setFileUploads,
  collectMiddleNames,
  collectId,
  uiConfig,
  disabled,
  editingMode,
  renderLabelOverlay,
  renderEditOverlay,
  brandingConfig,
}: PersonNameFieldsProps) => {
  const nameData = nameFields[prefix] || {
    firstName: "",
    middleName: "",
    lastName: "",
    skipMiddleName: false,
  }
  // Use top-level fileUploads state with question id prefix to avoid conflicts
  const fileData: { file: File | null; fileName: string; error?: string } =
    fileUploads[`${questionId}_${prefix}_id`] || {
      file: null,
      fileName: "",
      error: undefined,
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
  // Show middle name based on setup configuration
  const shouldShowMiddleName = collectMiddleNames === "yes"

  // State for "I don't have a middle name" checkbox
  // Check if this preference is stored in nameFields (for each person)
  const skipMiddleName = nameFields[prefix]?.skipMiddleName || false

  return (
    <div className="space-y-3">
      <div>
        <div className="relative inline-block">
          <Label className="mb-1 block text-sm">
            {getSubQuestionLabel(uiConfig, "firstNameLabel", "First Name:")}
          </Label>
          {renderLabelOverlay(
            "firstNameLabel",
            getSubQuestionLabel(uiConfig, "firstNameLabel", "First Name:"),
          )}
        </div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={getSubQuestionPlaceholder(
              uiConfig,
              "firstNamePlaceholder",
              "Enter first name",
            )}
            disabled={disabled}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            value={nameData.firstName}
            onChange={(e) => {
              const value = e.target.value
              setNameFields((prev) => {
                const current = prev[prefix] || {
                  firstName: "",
                  middleName: "",
                  lastName: "",
                  skipMiddleName: false,
                }
                return {
                  ...prev,
                  [prefix]: {
                    ...current,
                    firstName: value,
                  },
                }
              })
            }}
          />
          {renderEditOverlay(
            "firstNamePlaceholder",
            getSubQuestionPlaceholder(
              uiConfig,
              "firstNamePlaceholder",
              "Enter first name",
            ),
          )}
        </div>
      </div>
      {shouldShowMiddleName && (
        <>
          {!skipMiddleName && (
            <div>
              <div className="relative inline-block">
                <Label className="mb-1 block text-sm">
                  {getSubQuestionLabel(
                    uiConfig,
                    "middleNameLabel",
                    "Middle Name:",
                  )}
                </Label>
                {renderLabelOverlay(
                  "middleNameLabel",
                  getSubQuestionLabel(
                    uiConfig,
                    "middleNameLabel",
                    "Middle Name:",
                  ),
                )}
              </div>
              <div className="relative max-w-md">
                <Input
                  type="text"
                  placeholder={getSubQuestionPlaceholder(
                    uiConfig,
                    "middleNamePlaceholder",
                    "Enter middle name",
                  )}
                  disabled={disabled}
                  className={cn(editingMode && "cursor-not-allowed", "w-full")}
                  style={getInputStyle()}
                  value={nameData.middleName}
                  onChange={(e) => {
                    const value = e.target.value
                    setNameFields((prev) => {
                      const current = prev[prefix] || {
                        firstName: "",
                        middleName: "",
                        lastName: "",
                        skipMiddleName: false,
                      }
                      return {
                        ...prev,
                        [prefix]: {
                          ...current,
                          middleName: value,
                        },
                      }
                    })
                  }}
                />
                {renderEditOverlay(
                  "middleNamePlaceholder",
                  getSubQuestionPlaceholder(
                    uiConfig,
                    "middleNamePlaceholder",
                    "Enter middle name",
                  ),
                )}
              </div>
            </div>
          )}
          {!editingMode && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${questionId}_${prefix}_skip_middle_name`}
                checked={skipMiddleName}
                onCheckedChange={(checked) => {
                  if (!disabled) {
                    setNameFields((prev) => {
                      const current = prev[prefix] || {
                        firstName: "",
                        middleName: "",
                        lastName: "",
                        skipMiddleName: false,
                      }
                      return {
                        ...prev,
                        [prefix]: {
                          ...current,
                          skipMiddleName: checked === true,
                          // Clear middle name when checkbox is checked
                          middleName:
                            checked === true ? "" : current.middleName,
                        },
                      }
                    })
                  }
                }}
                disabled={disabled}
              />
              <Label
                htmlFor={`${questionId}_${prefix}_skip_middle_name`}
                className="cursor-pointer text-sm font-normal"
              >
                I don&apos;t have a middle name
              </Label>
            </div>
          )}
        </>
      )}
      <div>
        <div className="relative inline-block">
          <Label className="mb-1 block text-sm">
            {getSubQuestionLabel(uiConfig, "lastNameLabel", "Last Name:")}
          </Label>
          {renderLabelOverlay(
            "lastNameLabel",
            getSubQuestionLabel(uiConfig, "lastNameLabel", "Last Name:"),
          )}
        </div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={getSubQuestionPlaceholder(
              uiConfig,
              "lastNamePlaceholder",
              "Enter last name",
            )}
            disabled={disabled}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            value={nameData.lastName}
            onChange={(e) => {
              const value = e.target.value
              setNameFields((prev) => {
                const current = prev[prefix] || {
                  firstName: "",
                  middleName: "",
                  lastName: "",
                }
                return {
                  ...prev,
                  [prefix]: {
                    ...current,
                    lastName: value,
                  },
                }
              })
            }}
          />
          {renderEditOverlay(
            "lastNamePlaceholder",
            getSubQuestionPlaceholder(
              uiConfig,
              "lastNamePlaceholder",
              "Enter last name",
            ),
          )}
        </div>
      </div>
      {collectId && collectId !== "no" && (
        <div>
          <div className="relative inline-block">
            <Label className="mb-1 block text-sm">
              {getSubQuestionLabel(uiConfig, "idUploadLabel", "ID Upload")}{" "}
              {collectId === "mandatory" && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            {renderLabelOverlay(
              "idUploadLabel",
              getSubQuestionLabel(uiConfig, "idUploadLabel", "ID Upload"),
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id={`${questionId}_${prefix}_id_file`}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              disabled={editingMode}
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                const fileKey = `${questionId}_${prefix}_id`
                const fileError = file ? validateFileSize(file) : null
                setFileUploads((prev) => ({
                  ...prev,
                  [fileKey]: {
                    file,
                    fileName: file ? file.name : "",
                    error: fileError || undefined,
                  },
                }))
              }}
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${questionId}_${prefix}_id_file`}
                className={cn(
                  "cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-1 hover:bg-gray-200",
                  "text-sm transition-colors",
                )}
              >
                Choose file
              </label>
              <span className="text-sm text-gray-500">
                {fileData.fileName || "No file chosen"}
              </span>
            </div>
            {fileData.fileName && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFileUploads((prev) => ({
                    ...prev,
                    [`${questionId}_${prefix}_id`]: {
                      file: null,
                      fileName: "",
                      error: undefined,
                    },
                  }))
                  const fileInput = document.getElementById(
                    `${questionId}_${prefix}_id_file`,
                  ) as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ""
                  }
                }}
                className="h-6 w-6 p-0"
                disabled={editingMode}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {fileData.error && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {fileData.error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const QuestionRenderer = ({
  question,
  disabled = false,
  editingMode = false,
  onUpdateQuestion,
  onEditPlaceholder,
  onEditLabel,
  formId,
  ownerId,
  brandingConfig,
  value,
  onChange,
  onBlur,
  error,
  isTestMode,
}: QuestionRendererProps) => {
  // State for interactive fields (used for complex fields like dates, times, etc.)
  // Initialize from value prop if available
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, any>
    }
    // For offerAmount questions, initialize with USD as default currency
    if (question.type === "offerAmount") {
      return { currency: "USD" }
    }
    return {}
  })

  // Sync formValues with value prop when it changes
  useEffect(() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      setFormValues(value as Record<string, any>)
    } else if (value === null || value === undefined) {
      setFormValues({})
    }
  }, [value])
  // State for file uploads (keyed by question id and field name)
  const [fileUploads, setFileUploads] = useState<
    Record<string, { file: File | null; fileName: string; error?: string }>
  >({})
  // State for listings (for specifyListing question)
  const [listings, setListings] = useState<Array<{
    id: string
    address: string
  }> | null>(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [customAddress, setCustomAddress] = useState<string>("")

  // Fetch listings for specifyListing question (even in editing mode for form builder)
  useEffect(() => {
    if (question.type === "specifyListing") {
      if (listings === null) {
        // Use ownerId if available (for public forms), otherwise use formId
        const idToUse = ownerId || formId
        const useOwnerId = !!ownerId

        if (idToUse) {
          getFormOwnerListings(idToUse, isTestMode, useOwnerId)
            .then((ownerListings) => {
              setListings(ownerListings)
            })
            .catch((error) => {
              console.error("Error fetching listings:", error)
              setListings([])
            })
        } else {
          // No formId or ownerId, set empty array
          setListings([])
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, ownerId, editingMode, question.type, question.id, isTestMode])

  // Get setup configuration
  const setupConfig = (question.setupConfig as Record<string, any>) || {}
  const uiConfig = parseUIConfig(question.uiConfig)

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

  // Helper: Get button style with branding
  const getButtonStyle = () => {
    if (!brandingConfig || editingMode) return {}
    return {
      backgroundColor: brandingConfig.buttonColor,
      color: brandingConfig.buttonTextColor,
    }
  }

  // Helper: Render error message
  const renderError = (errorMessage?: string) => {
    if (!errorMessage || editingMode) return null
    return (
      <p className="mt-1 text-sm text-red-500" role="alert">
        {errorMessage}
      </p>
    )
  }

  // Helper: Handle file upload with validation
  const handleFileUpload = (
    fileKey: string,
    file: File | null,
    onFileChange?: (value: any) => void,
  ) => {
    if (!file) {
      setFileUploads((prev) => ({
        ...prev,
        [fileKey]: { file: null, fileName: "", error: undefined },
      }))
      if (onFileChange) onFileChange(null)
      return
    }

    // Validate file size
    const fileError = validateFileSize(file)
    setFileUploads((prev) => ({
      ...prev,
      [fileKey]: {
        file,
        fileName: file.name,
        error: fileError || undefined,
      },
    }))

    if (fileError) {
      // Don't call onChange if file is invalid
      return
    }

    if (onFileChange) {
      onFileChange(file)
    }
  }

  // Helper: Render edit overlay for clickable elements
  const renderEditOverlay = (fieldId: string, currentText: string) => {
    if (!editingMode || !onEditPlaceholder) return null

    return (
      <div
        className={cn(
          "absolute inset-0 z-20 cursor-pointer",
          // "rounded-md bg-transparent transition-all",
          // "hover:bg-cyan-50/10 hover:ring-2 hover:ring-cyan-400",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onEditPlaceholder(fieldId, currentText)
        }}
        title="Click to edit placeholder"
      />
    )
  }

  // Helper: Render edit overlay for labels
  const renderLabelOverlay = (fieldId: string, currentText: string) => {
    if (!editingMode || !onEditLabel) return null

    return (
      <div
        className={cn(
          "absolute inset-0 z-20 cursor-pointer",
          // "rounded-md bg-transparent transition-all",
          // "hover:bg-cyan-50/10 hover:ring-2 hover:ring-cyan-400",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onEditLabel(fieldId, currentText)
        }}
        title="Click to edit label"
      />
    )
  }

  // Specify Listing
  if (question.type === "specifyListing") {
    // Sync local state with parent value
    useEffect(() => {
      if (value && typeof value === "string") {
        // Check if it's a listing ID or custom address
        const isListingId = listings?.some((l) => l.id === value)
        if (isListingId) {
          setSelectedListingId(value)
          setShowCustomInput(false)
          setCustomAddress("")
        } else {
          setShowCustomInput(true)
          setSelectedListingId("")
          setCustomAddress(value)
        }
      }
    }, [value, listings])

    // If no listings, show simple input (even in editing mode, show dropdown if listings exist)
    if (!listings || listings.length === 0) {
      const inputValue = editingMode ? "" : (value as string) || customAddress
      return (
        <div>
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder={
                uiConfig.placeholder || "Enter listing address or ID..."
              }
              disabled={disabled}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              value={inputValue}
              onChange={(e) => {
                const newValue = e.target.value
                if (!editingMode) {
                  setCustomAddress(newValue)
                  onChange?.(newValue)
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter listing address or ID...",
            )}
          </div>
          {renderError(error)}
        </div>
      )
    }

    // Show dropdown with listings and "not here" option
    // Input appears below when "custom" is selected
    return (
      <div className="space-y-3">
        <div>
          <Select
            value={selectedListingId || (showCustomInput ? "custom" : "")}
            onValueChange={(selectValue) => {
              if (selectValue === "custom") {
                setShowCustomInput(true)
                setSelectedListingId("")
                onChange?.("")
              } else {
                setSelectedListingId(selectValue)
                setShowCustomInput(false)
                setCustomAddress("")
                // Call onChange with the listing ID - this should clear the error via handleFieldChange
                onChange?.(selectValue)
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn("w-full max-w-md")}
              style={getSelectStyle()}
              data-field-id={question.id}
            >
              <SelectValue placeholder="Select a listing..." />
            </SelectTrigger>
            <SelectContent>
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listing.address}
                </SelectItem>
              ))}
              <SelectItem value="custom">
                The Listing I want isn&apos;t here
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Show error for Select dropdown when not in custom input mode */}
          {!showCustomInput && renderError(error)}
        </div>
        {showCustomInput && (
          <div>
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder={uiConfig.placeholder || "Enter listing address..."}
                disabled={disabled}
                className="w-full"
                style={getInputStyle()}
                value={customAddress}
                onChange={(e) => {
                  const newValue = e.target.value
                  setCustomAddress(newValue)
                  onChange?.(newValue)
                }}
                onBlur={onBlur}
                data-field-id={question.id}
              />
            </div>
            {renderError(error)}
          </div>
        )}
      </div>
    )
  }

  // Submitter Role - Use Select with proper options
  if (question.type === "submitterRole") {
    // Convert camelCase (from database) to snake_case (for Select component)
    const normalizeValueForSelect = (
      val: string | null | undefined,
    ): string => {
      if (!val) return ""
      if (val === "buyerSelf") return "buyer_self"
      if (val === "buyerWithAgent") return "buyer_with_agent"
      if (val === "buyersAgent") return "buyers_agent"
      // If already in snake_case, return as is
      return val
    }

    const selectValue = normalizeValueForSelect(value as string)

    return (
      <div>
        <div className="relative max-w-md">
          <Select
            disabled={disabled}
            value={selectValue}
            onValueChange={(val) => {
              onChange?.(val)
            }}
          >
            <SelectTrigger
              className={cn("w-full")}
              style={getSelectStyle()}
              data-field-id={question.id}
            >
              <SelectValue
                placeholder={uiConfig.placeholder || "Select your role..."}
              />
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
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Submitter Name - Separate first and last name
  if (question.type === "submitterName") {
    const nameValue = (value as { firstName?: string; lastName?: string }) || {}
    return (
      <div>
        <div className="flex max-w-md gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder={uiConfig.firstNamePlaceholder || "First Name"}
              disabled={disabled}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              value={editingMode ? "" : nameValue.firstName || ""}
              onChange={(e) => {
                if (!editingMode) {
                  onChange?.({ ...nameValue, firstName: e.target.value })
                }
              }}
              onBlur={onBlur}
              data-field-id={`${question.id}_firstName`}
            />
            {renderEditOverlay(
              "firstNamePlaceholder",
              uiConfig.firstNamePlaceholder || "First Name",
            )}
          </div>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder={uiConfig.lastNamePlaceholder || "Last Name"}
              disabled={disabled}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              value={editingMode ? "" : nameValue.lastName || ""}
              onChange={(e) => {
                if (!editingMode) {
                  onChange?.({ ...nameValue, lastName: e.target.value })
                }
              }}
              onBlur={onBlur}
              data-field-id={`${question.id}_lastName`}
            />
            {renderEditOverlay(
              "lastNamePlaceholder",
              uiConfig.lastNamePlaceholder || "Last Name",
            )}
          </div>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Submitter Email - Use email input type
  if (question.type === "submitterEmail") {
    return (
      <div>
        <div className="relative max-w-md">
          <Input
            type="email"
            placeholder={uiConfig.placeholder || "Enter your email address"}
            disabled={disabled}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            value={editingMode ? "" : (value as string) || ""}
            onChange={(e) => {
              if (!editingMode) {
                onChange?.(e.target.value)
              }
            }}
            onBlur={onBlur}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "Enter your email address",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Submitter Phone - Use PhoneInput with country code
  if (question.type === "submitterPhone") {
    // Handle both string (legacy) and object (new format) values
    const phoneValue = editingMode
      ? ""
      : typeof value === "object" && value !== null && "countryCode" in value
        ? value
        : (value as string) || { countryCode: "+1", number: "" }

    return (
      <div>
        <div className="relative max-w-md">
          <PhoneInput
            value={phoneValue}
            onChange={(newValue) => {
              if (!editingMode) {
                // Save as object with separate countryCode and number
                onChange?.(newValue)
              }
            }}
            onBlur={onBlur}
            disabled={disabled}
            editingMode={editingMode}
            placeholder={uiConfig.placeholder || "555-123-4567"}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "Enter your phone number",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Offer Amount
  if (question.type === "offerAmount") {
    const currencyMode = setupConfig.currency_mode || "any"
    const currencyOptions = Array.isArray(setupConfig.currency_options)
      ? setupConfig.currency_options
      : []
    const fixedCurrency = setupConfig.fixed_currency || "USD"

    // Standard currencies for "any" mode
    const STANDARD_CURRENCIES = [
      "USD",
      "EUR",
      "GBP",
      "CAD",
      "AUD",
      "NZD",
      "SGD",
      "JPY",
      "CNY",
      "CHF",
    ]

    // Parse current value - use formValues for builder preview, value prop for actual form
    let currentAmount: string | number = ""
    let currentCurrency = "USD" // Default to USD

    // In editing mode (builder preview), use formValues for local state
    // Otherwise use the value prop
    const displayValue = editingMode && !onChange ? formValues : value

    if (typeof displayValue === "object" && displayValue !== null) {
      currentAmount =
        displayValue.amount !== undefined ? displayValue.amount : ""
      // Use currency from value if provided, otherwise keep USD default
      if (displayValue.currency) {
        currentCurrency = displayValue.currency
      }
    } else {
      currentAmount =
        displayValue !== undefined && displayValue !== null ? displayValue : ""
      // Default currency logic if not set
      if (currencyMode === "fixed") {
        currentCurrency = fixedCurrency
      } else if (currencyMode === "options" && currencyOptions.length > 0) {
        // For options mode, prefer USD if available, otherwise first option
        currentCurrency = currencyOptions.includes("USD")
          ? "USD"
          : currencyOptions[0]
      } else {
        currentCurrency = "USD"
      }
    }

    // Ensure currentCurrency is valid for the mode
    if (
      currencyMode === "options" &&
      !currencyOptions.includes(currentCurrency) &&
      currencyOptions.length > 0
    ) {
      // Prefer USD if available in options, otherwise use first option
      currentCurrency = currencyOptions.includes("USD")
        ? "USD"
        : currencyOptions[0]
    }

    // If currency is still empty or invalid, default to USD
    if (!currentCurrency) {
      currentCurrency = "USD"
    }

    const handleAmountChange = (val: string) => {
      const num = val === "" ? "" : Number(val)
      // Ensure currency is always set (use currentCurrency or default to USD)
      const currency = currentCurrency || "USD"
      const newValue = { amount: num, currency: currency }

      if (editingMode && !onChange) {
        // In builder preview, update local state
        setFormValues(newValue)
      } else {
        // In actual form, call onChange
        onChange?.(newValue)
      }
    }

    const handleCurrencyChange = (val: string) => {
      // Get the current amount from formData or formValues
      const currentAmountValue =
        editingMode && !onChange
          ? formValues.amount !== undefined
            ? formValues.amount
            : currentAmount
          : typeof value === "object" && value !== null
            ? value.amount
            : currentAmount
      const num =
        currentAmountValue === "" || currentAmountValue === undefined
          ? ""
          : Number(currentAmountValue)
      const newValue = { amount: num, currency: val }

      if (editingMode && !onChange) {
        // In builder preview, update local state
        setFormValues(newValue)
      } else {
        // In actual form, call onChange
        onChange?.(newValue)
      }
    }

    return (
      <div>
        <div className="flex gap-2">
          {/* Currency Selector */}
          {(currencyMode === "options" || currencyMode === "any") && (
            <Select
              value={currentCurrency}
              onValueChange={(val) => {
                // Allow currency changes even in editing mode (for builder preview)
                handleCurrencyChange(val)
              }}
              disabled={disabled}
            >
              <SelectTrigger
                className="w-full max-w-xs"
                style={getSelectStyle()}
              >
                <SelectValue placeholder="Curr" />
              </SelectTrigger>
              <SelectContent>
                {currencyMode === "options"
                  ? currencyOptions.map((c: string) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  : STANDARD_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          )}

          {/* Fixed Currency Display */}
          {currencyMode === "fixed" && (
            <div
              className="flex items-center justify-center rounded-md border px-3 text-sm font-medium text-gray-500"
              style={getInputStyle()}
            >
              {fixedCurrency}
            </div>
          )}

          {/* Amount Input */}
          <div className="relative max-w-md flex-1">
            <Input
              type="number"
              min="0"
              placeholder={uiConfig.placeholder || "Enter offer amount"}
              disabled={disabled}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              value={editingMode ? "" : currentAmount}
              onChange={(e) => {
                if (!editingMode) {
                  handleAmountChange(e.target.value)
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter offer amount",
            )}
          </div>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Submit Button
  if (question.type === "submitButton") {
    return (
      <Button size="lg" disabled={disabled} style={getButtonStyle()}>
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
      const singleFieldValue =
        typeof value === "string" ? value : value?.name || ""
      return (
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder={
                uiConfig.placeholder || "Enter name(s) of purchaser(s)"
              }
              disabled={disabled}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              value={editingMode ? "" : singleFieldValue}
              onChange={(e) => {
                if (!editingMode) {
                  // Store name separately from file
                  const currentFile =
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)
                      ? value.idFile
                      : undefined
                  onChange?.(
                    currentFile
                      ? { name: e.target.value, idFile: currentFile }
                      : e.target.value,
                  )
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter name(s) of purchaser(s)",
            )}
          </div>
          {collectId && collectId !== "no" && (
            <div className="mt-3 space-y-2">
              <input
                type="file"
                id={`${question.id}_single_id_upload`}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  const fileKey = `${question.id}_single_id_upload`
                  const fileError = file ? validateFileSize(file) : null
                  setFileUploads((prev) => ({
                    ...prev,
                    [fileKey]: {
                      file,
                      fileName: file ? file.name : "",
                      error: fileError || undefined,
                    },
                  }))
                  if (!fileError && file) {
                    // Store file with name
                    const currentName =
                      typeof value === "string" ? value : value?.name || ""
                    onChange?.(
                      currentName ? { name: currentName, idFile: file } : file,
                    )
                  }
                }}
              />
              <div className="flex max-w-md items-center gap-2">
                <label
                  htmlFor={`${question.id}_single_id_upload`}
                  className="flex-1 cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center"
                >
                  <p className="text-sm text-gray-500">
                    📎 Upload Identification{" "}
                    {collectId === "optional" && "(Optional)"}
                  </p>
                </label>
              </div>
              {fileUploads[`${question.id}_single_id_upload`]?.fileName && (
                <div className="flex items-center gap-2">
                  {fileUploads[`${question.id}_single_id_upload`]?.fileName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFileUploads((prev) => ({
                          ...prev,
                          [`${question.id}_single_id_upload`]: {
                            file: null,
                            fileName: "",
                            error: undefined,
                          },
                        }))
                        // Clear file but keep name
                        const currentName =
                          typeof value === "string" ? value : value?.name || ""
                        onChange?.(currentName || null)
                        const fileInput = document.getElementById(
                          `${question.id}_single_id_upload`,
                        ) as HTMLInputElement
                        if (fileInput) {
                          fileInput.value = ""
                        }
                      }}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <p className="text-xs text-gray-600">
                    {fileUploads[`${question.id}_single_id_upload`].fileName}
                  </p>
                </div>
              )}
              {fileUploads[`${question.id}_single_id_upload`]?.error && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {fileUploads[`${question.id}_single_id_upload`].error}
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    // Individual names method - complex multi-scenario UI
    // Initialize from value prop if available
    const nameOfPurchaserValue =
      value && typeof value === "object" && !Array.isArray(value) ? value : {}
    const [scenario, setScenario] = useState<string>(
      nameOfPurchaserValue.scenario || "",
    )
    const [numPurchasers, setNumPurchasers] = useState<number>(
      nameOfPurchaserValue.numPurchasers || 2,
    )
    const [numRepresentatives, setNumRepresentatives] = useState<number>(
      nameOfPurchaserValue.numRepresentatives || 1,
    )
    const [purchaserTypes, setPurchaserTypes] = useState<
      Record<number, string>
    >(nameOfPurchaserValue.purchaserTypes || {})
    const [nameFields, setNameFields] = useState<
      Record<
        string,
        {
          firstName: string
          middleName: string
          lastName: string
          skipMiddleName?: boolean
        }
      >
    >(nameOfPurchaserValue.nameFields || {})

    // Helper to sync all state changes with parent
    // Also includes ID files from fileUploads state
    const updateNameOfPurchaserData = (
      updates: Partial<{
        scenario: string
        numPurchasers: number
        numRepresentatives: number
        purchaserTypes: Record<number, string>
        nameFields: Record<
          string,
          {
            firstName: string
            middleName: string
            lastName: string
            skipMiddleName?: boolean
          }
        >
        idFiles?: Record<string, File>
      }>,
    ) => {
      // Extract ID files from fileUploads state
      const idFiles: Record<string, File> = {}
      Object.entries(fileUploads).forEach(([key, fileData]) => {
        if (
          key.startsWith(`${question.id}_`) &&
          key.endsWith("_id") &&
          fileData.file
        ) {
          const prefix = key.replace(`${question.id}_`, "").replace("_id", "")
          idFiles[prefix] = fileData.file
        }
      })

      const newData = {
        scenario,
        numPurchasers,
        numRepresentatives,
        purchaserTypes,
        nameFields,
        ...(Object.keys(idFiles).length > 0 ? { idFiles } : {}),
        ...updates,
      }
      onChange?.(newData)
    }

    // Wrapper functions that update state and sync with parent
    const handleScenarioChange = (val: string) => {
      setScenario(val)
      updateNameOfPurchaserData({ scenario: val })
    }
    const handleNumPurchasersChange = (val: number) => {
      setNumPurchasers(val)
      updateNameOfPurchaserData({ numPurchasers: val })
    }
    const handleNumRepresentativesChange = (val: number) => {
      setNumRepresentatives(val)
      updateNameOfPurchaserData({ numRepresentatives: val })
    }
    const handlePurchaserTypesChange = (updates: Record<number, string>) => {
      setPurchaserTypes(updates)
      updateNameOfPurchaserData({ purchaserTypes: updates })
    }
    const handleNameFieldsChange: React.Dispatch<
      React.SetStateAction<
        Record<
          string,
          { firstName: string; middleName: string; lastName: string }
        >
      >
    > = (updates) => {
      const newNameFields =
        typeof updates === "function" ? updates(nameFields) : updates
      setNameFields(newNameFields)
      // Also sync ID files when name fields change
      updateNameOfPurchaserData({ nameFields: newNameFields })
    }

    // Sync ID files when they change in fileUploads
    useEffect(() => {
      if (!editingMode) {
        updateNameOfPurchaserData({})
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileUploads])

    return (
      <div className="space-y-4">
        {/* Main scenario selector */}
        <div>
          <Select value={scenario} onValueChange={handleScenarioChange}>
            <SelectTrigger className="w-full max-w-md" style={getSelectStyle()}>
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
            <PersonNameFields
              prefix="single"
              questionId={question.id}
              nameFields={nameFields}
              setNameFields={handleNameFieldsChange}
              fileUploads={fileUploads}
              setFileUploads={setFileUploads}
              collectMiddleNames={collectMiddleNames}
              collectId={collectId}
              uiConfig={uiConfig}
              disabled={disabled}
              editingMode={editingMode}
              renderLabelOverlay={renderLabelOverlay}
              renderEditOverlay={renderEditOverlay}
              brandingConfig={brandingConfig}
            />
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
                onValueChange={(val) =>
                  handleNumPurchasersChange(parseInt(val))
                }
              >
                <SelectTrigger
                  className="w-full max-w-md"
                  style={getSelectStyle()}
                >
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
                  <PersonNameFields
                    prefix={`purchaser-${num}`}
                    questionId={question.id}
                    nameFields={nameFields}
                    setNameFields={handleNameFieldsChange}
                    fileUploads={fileUploads}
                    setFileUploads={setFileUploads}
                    collectMiddleNames={collectMiddleNames}
                    collectId={collectId}
                    uiConfig={uiConfig}
                    disabled={disabled}
                    editingMode={editingMode}
                    renderLabelOverlay={renderLabelOverlay}
                    renderEditOverlay={renderEditOverlay}
                    brandingConfig={brandingConfig}
                  />
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
              <div className="max-w-md">
                <Input
                  type="text"
                  placeholder="Enter corporation name"
                  disabled={disabled}
                  className="w-full"
                  style={getInputStyle()}
                />
              </div>
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
                    <PersonNameFields
                      prefix={`rep-${num}`}
                      questionId={question.id}
                      nameFields={nameFields}
                      setNameFields={handleNameFieldsChange}
                      fileUploads={fileUploads}
                      setFileUploads={setFileUploads}
                      collectMiddleNames={collectMiddleNames}
                      collectId={collectId}
                      uiConfig={uiConfig}
                      disabled={disabled}
                      editingMode={editingMode}
                      renderLabelOverlay={renderLabelOverlay}
                      renderEditOverlay={renderEditOverlay}
                      brandingConfig={brandingConfig}
                    />
                  </div>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleNumRepresentativesChange(numRepresentatives + 1)
                }
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
                        handlePurchaserTypesChange({
                          ...purchaserTypes,
                          [num]: val,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full max-w-md"
                        style={getSelectStyle()}
                      >
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Person</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {purchaserTypes[num] === "person" && (
                    <PersonNameFields
                      prefix={`other-person-${num}`}
                      questionId={question.id}
                      nameFields={nameFields}
                      setNameFields={handleNameFieldsChange}
                      fileUploads={fileUploads}
                      setFileUploads={setFileUploads}
                      collectMiddleNames={collectMiddleNames}
                      collectId={collectId}
                      uiConfig={uiConfig}
                      disabled={disabled}
                      editingMode={editingMode}
                      renderLabelOverlay={renderLabelOverlay}
                      renderEditOverlay={renderEditOverlay}
                      brandingConfig={brandingConfig}
                    />
                  )}

                  {purchaserTypes[num] === "corporation" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-1 block text-sm">
                          Corporation Name:
                        </Label>
                        <div className="max-w-md">
                          <Input
                            type="text"
                            placeholder="Enter corporation name"
                            disabled={disabled}
                            className="w-full"
                            style={getInputStyle()}
                          />
                        </div>
                      </div>
                      <h5 className="text-sm font-medium">
                        Corporation Representative:
                      </h5>
                      <PersonNameFields
                        prefix={`other-corp-${num}-rep`}
                        questionId={question.id}
                        nameFields={nameFields}
                        setNameFields={handleNameFieldsChange}
                        fileUploads={fileUploads}
                        setFileUploads={setFileUploads}
                        collectMiddleNames={collectMiddleNames}
                        collectId={collectId}
                        uiConfig={uiConfig}
                        disabled={disabled}
                        editingMode={editingMode}
                        renderLabelOverlay={renderLabelOverlay}
                        renderEditOverlay={renderEditOverlay}
                        brandingConfig={brandingConfig}
                      />
                    </div>
                  )}
                </div>
              ),
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleNumPurchasersChange(numPurchasers + 1)}
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
    const fileData = fileUploads[`${question.id}_purchase_agreement`] || {
      file: null,
      fileName: "",
      error: undefined,
    }

    return (
      <div>
        <div className="space-y-2">
          <input
            type="file"
            id={`${question.id}_purchase_agreement_file`}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              const fileKey = `${question.id}_purchase_agreement`
              const fileError = file ? validateFileSize(file) : null
              setFileUploads((prev) => ({
                ...prev,
                [fileKey]: {
                  file,
                  fileName: file ? file.name : "",
                  error: fileError || undefined,
                },
              }))
              if (!fileError && file) {
                onChange?.(file)
              }
            }}
            data-field-id={question.id}
          />
          <div className="flex max-w-md items-center gap-2">
            <label
              htmlFor={`${question.id}_purchase_agreement_file`}
              className="flex-1 cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center"
            >
              <p className="text-sm text-gray-500">
                📎 Upload Purchase Agreement {!isRequired && "(Optional)"}
              </p>
            </label>
          </div>
          {fileData.fileName && (
            <div className="flex items-center gap-2">
              {fileData.fileName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileUploads((prev) => ({
                      ...prev,
                      [`${question.id}_purchase_agreement`]: {
                        file: null,
                        fileName: "",
                        error: undefined,
                      },
                    }))
                    onChange?.(null)
                    const fileInput = document.getElementById(
                      `${question.id}_purchase_agreement_file`,
                    ) as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ""
                    }
                  }}
                  className="h-8 w-8 p-0"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <p className="text-xs text-gray-600">{fileData.fileName}</p>
            </div>
          )}
          <span className="text-xs text-gray-500">
            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 10MB each)
          </span>
        </div>
        {renderError(fileData.error || error)}
      </div>
    )
  }

  // Offer Expiry - Use DatePicker and TimePicker
  if (question.type === "offerExpiry") {
    const isOptional = setupConfig.expiry_requirement === "optional"
    const expiryValue =
      (value as {
        hasExpiry?: string
        expiryDate?: Date
        expiryTime?: string
      }) || {}
    const hasExpiry = expiryValue.hasExpiry === "yes"

    return (
      <div className="space-y-3">
        {isOptional && (
          <RadioGroup
            value={expiryValue.hasExpiry || ""}
            onValueChange={(val) => {
              if (!editingMode) {
                onChange?.({ ...expiryValue, hasExpiry: val })
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="expiry-yes" />
              <Label htmlFor="expiry-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="expiry-no" />
              <Label htmlFor="expiry-no">No</Label>
            </div>
          </RadioGroup>
        )}

        {(!isOptional || hasExpiry) && (
          <div className="flex max-w-md gap-2">
            <div className="min-w-0 flex-1">
              <DatePicker
                label={uiConfig.dateLabel || "Select date"}
                value={expiryValue.expiryDate}
                onChange={(date) => {
                  if (!editingMode) {
                    onChange?.({ ...expiryValue, expiryDate: date })
                  }
                }}
                brandingConfig={brandingConfig}
                data-field-id={question.id}
                btnClassName="w-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <TimePicker
                label={uiConfig.timeLabel || "Select time"}
                value={expiryValue.expiryTime}
                onChange={(time) => {
                  if (!editingMode) {
                    onChange?.({ ...expiryValue, expiryTime: time })
                  }
                }}
                brandingConfig={brandingConfig}
                data-field-id={question.id}
                btnClassName="w-full"
              />
            </div>
          </div>
        )}
        {renderError(error)}
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
      // Include uiConfig and setupConfig from the original question so edits are preserved
      uiConfig: question.uiConfig,
      setupConfig: question.setupConfig,
    }

    // Create a key that includes the uiConfig to force re-render when it changes
    const questionKey = `${question.id}-${JSON.stringify(question.uiConfig || {})}`

    return (
      <DepositPreview
        key={questionKey}
        question={previewQuestion}
        setupAnswers={setupConfig}
        editingMode={editingMode}
        onEditQuestion={(id, text) => {
          if (onEditLabel) {
            onEditLabel(id, text)
          }
        }}
        onEditPlaceholder={onEditPlaceholder}
        brandingConfig={brandingConfig}
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

    const loanValue = (value as Record<string, any>) || {}
    const isSubjectToLoan = loanValue.subjectToLoan === "yes"
    const knowsLenderDetails = !loanValue.unknownLender

    return (
      <div className="space-y-4">
        {/* Main question as dropdown */}
        <div>
          <div className="relative inline-block">
            <Label className="mb-2 block text-sm font-medium">
              Is your Offer subject to Loan Approval?
              <span className="font-bold text-red-500"> *</span>
            </Label>
            {renderLabelOverlay(
              "loanApprovalQuestionLabel",
              "Is your Offer subject to Loan Approval?",
            )}
          </div>
          <Select
            value={loanValue.subjectToLoan || ""}
            onValueChange={(val) => {
              onChange?.({ ...loanValue, subjectToLoan: val })
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full max-w-md" style={getSelectStyle()}>
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
                <div className="relative inline-block">
                  <Label className="mb-2 block text-sm font-medium">
                    {getSubQuestionLabel(
                      uiConfig,
                      "loanAmountLabel",
                      "What is your Loan Amount?",
                    )}{" "}
                    <span className="font-bold text-red-500">*</span>
                  </Label>
                  {renderLabelOverlay(
                    "loanAmountLabel",
                    getSubQuestionLabel(
                      uiConfig,
                      "loanAmountLabel",
                      "What is your Loan Amount?",
                    ),
                  )}
                </div>
                <div className="relative max-w-md">
                  <Input
                    type="text"
                    placeholder={getSubQuestionPlaceholder(
                      uiConfig,
                      "loanAmountPlaceholder",
                      "Enter amount",
                    )}
                    className={cn(
                      "w-full",
                      editingMode && "cursor-not-allowed",
                    )}
                    disabled={disabled}
                    style={getInputStyle()}
                    value={loanValue.loanAmount || ""}
                    onChange={(e) => {
                      if (!editingMode) {
                        onChange?.({ ...loanValue, loanAmount: e.target.value })
                      }
                    }}
                  />
                  {renderEditOverlay(
                    "loanAmountPlaceholder",
                    getSubQuestionPlaceholder(
                      uiConfig,
                      "loanAmountPlaceholder",
                      "Enter amount",
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Company Name with checkbox */}
            {lenderDetails && lenderDetails !== "not_required" && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="relative inline-block">
                    <Label className="w-32 pt-2 text-sm font-medium">
                      {getSubQuestionLabel(
                        uiConfig,
                        "companyNameLabel",
                        "Company Name:",
                      )}
                    </Label>
                    {renderLabelOverlay(
                      "companyNameLabel",
                      getSubQuestionLabel(
                        uiConfig,
                        "companyNameLabel",
                        "Company Name:",
                      ),
                    )}
                  </div>
                  <div className="relative max-w-md flex-1">
                    <Input
                      type="text"
                      placeholder={getSubQuestionPlaceholder(
                        uiConfig,
                        "companyNamePlaceholder",
                        `Enter company name or "I don't know yet"`,
                      )}
                      disabled={disabled}
                      className={cn(
                        editingMode && "cursor-not-allowed",
                        "w-full",
                      )}
                      style={getInputStyle()}
                      value={loanValue.companyName || ""}
                      onChange={(e) => {
                        if (!editingMode) {
                          onChange?.({
                            ...loanValue,
                            companyName: e.target.value,
                          })
                        }
                      }}
                    />
                    {renderEditOverlay(
                      "companyNamePlaceholder",
                      getSubQuestionPlaceholder(
                        uiConfig,
                        "companyNamePlaceholder",
                        `Enter company name or "I don't know yet"`,
                      ),
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-36">
                  <Checkbox
                    id="unknown-lender"
                    checked={loanValue.unknownLender || false}
                    onCheckedChange={(checked) => {
                      if (!editingMode) {
                        onChange?.({ ...loanValue, unknownLender: checked })
                      }
                    }}
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
                    <div className="relative inline-block">
                      <Label className="w-32 text-sm font-medium">
                        {getSubQuestionLabel(
                          uiConfig,
                          "contactNameLabel",
                          "Contact Name:",
                        )}
                      </Label>
                      {renderLabelOverlay(
                        "contactNameLabel",
                        getSubQuestionLabel(
                          uiConfig,
                          "contactNameLabel",
                          "Contact Name:",
                        ),
                      )}
                    </div>
                    <div className="relative max-w-md flex-1">
                      <Input
                        type="text"
                        placeholder={getSubQuestionPlaceholder(
                          uiConfig,
                          "contactNamePlaceholder",
                          `Enter contact name or "I don't know yet"`,
                        )}
                        disabled={disabled}
                        className={cn(
                          "w-full",
                          editingMode && "cursor-not-allowed",
                        )}
                        style={getInputStyle()}
                        value={loanValue.contactName || ""}
                        onChange={(e) => {
                          if (!editingMode) {
                            onChange?.({
                              ...loanValue,
                              contactName: e.target.value,
                            })
                          }
                        }}
                      />
                      {renderEditOverlay(
                        "contactNamePlaceholder",
                        getSubQuestionPlaceholder(
                          uiConfig,
                          "contactNamePlaceholder",
                          `Enter contact name or "I don't know yet"`,
                        ),
                      )}
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="flex items-center gap-3">
                    <div className="relative inline-block">
                      <Label className="w-32 text-sm font-medium">
                        {getSubQuestionLabel(
                          uiConfig,
                          "contactPhoneLabel",
                          "Contact Phone:",
                        )}
                      </Label>
                      {renderLabelOverlay(
                        "contactPhoneLabel",
                        getSubQuestionLabel(
                          uiConfig,
                          "contactPhoneLabel",
                          "Contact Phone:",
                        ),
                      )}
                    </div>
                    <div className="relative max-w-md flex-1">
                      <Input
                        type="tel"
                        placeholder={getSubQuestionPlaceholder(
                          uiConfig,
                          "contactPhonePlaceholder",
                          `Enter phone number or "I don't know yet"`,
                        )}
                        disabled={disabled}
                        className={cn(
                          "w-full",
                          editingMode && "cursor-not-allowed",
                        )}
                        style={getInputStyle()}
                        value={loanValue.contactPhone || ""}
                        onChange={(e) => {
                          if (!editingMode) {
                            onChange?.({
                              ...loanValue,
                              contactPhone: e.target.value,
                            })
                          }
                        }}
                      />
                      {renderEditOverlay(
                        "contactPhonePlaceholder",
                        getSubQuestionPlaceholder(
                          uiConfig,
                          "contactPhonePlaceholder",
                          `Enter phone number or "I don't know yet"`,
                        ),
                      )}
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="flex items-center gap-3">
                    <div className="relative inline-block">
                      <Label className="w-32 text-sm font-medium">
                        {getSubQuestionLabel(
                          uiConfig,
                          "contactEmailLabel",
                          "Contact Email:",
                        )}
                      </Label>
                      {renderLabelOverlay(
                        "contactEmailLabel",
                        getSubQuestionLabel(
                          uiConfig,
                          "contactEmailLabel",
                          "Contact Email:",
                        ),
                      )}
                    </div>
                    <div className="relative max-w-md flex-1">
                      <Input
                        type="email"
                        placeholder={getSubQuestionPlaceholder(
                          uiConfig,
                          "contactEmailPlaceholder",
                          `Enter email address or "I don't know yet"`,
                        )}
                        disabled={disabled}
                        className={cn(
                          "w-full",
                          editingMode && "cursor-not-allowed",
                        )}
                        style={getInputStyle()}
                        value={loanValue.contactEmail || ""}
                        onChange={(e) => {
                          if (!editingMode) {
                            onChange?.({
                              ...loanValue,
                              contactEmail: e.target.value,
                            })
                          }
                        }}
                      />
                      {renderEditOverlay(
                        "contactEmailPlaceholder",
                        getSubQuestionPlaceholder(
                          uiConfig,
                          "contactEmailPlaceholder",
                          `Enter email address or "I don't know yet"`,
                        ),
                      )}
                    </div>
                  </div>
                </>
              )}

            {/* Supporting Documents */}
            {attachments && attachments !== "not_required" && (
              <div>
                <div className="relative inline-block">
                  <Label className="mb-2 block text-sm font-medium">
                    Supporting Documents:
                    {question.required && isSubjectToLoan && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </Label>
                  {renderLabelOverlay(
                    "supportingDocumentsLabel",
                    "Supporting Documents:",
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    id={`${question.id}_supporting_docs`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={disabled}
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      // Validate all files
                      let fileError: string | undefined = undefined
                      for (const file of files) {
                        const error = validateFileSize(file)
                        if (error) {
                          fileError = error
                          break
                        }
                      }
                      const fileNames = files.map((f) => f.name).join(", ")
                      setFileUploads((prev) => ({
                        ...prev,
                        [`${question.id}_supporting_docs`]: {
                          file: files[0] || null,
                          fileName: fileNames || "",
                          error: fileError,
                        },
                      }))
                      if (!fileError && files.length > 0) {
                        // Store files in the loanValue object for validation
                        onChange?.({ ...loanValue, supportingDocs: files })
                      }
                    }}
                    data-field-id={question.id}
                  />
                  <div className="flex max-w-md items-center gap-2">
                    <label
                      htmlFor={`${question.id}_supporting_docs`}
                      className="flex-1 cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center"
                    >
                      <p className="text-sm text-gray-500">
                        Upload pre-approval documents or supporting evidence
                      </p>
                    </label>
                  </div>
                  {fileUploads[`${question.id}_supporting_docs`]?.fileName && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFileUploads((prev) => ({
                            ...prev,
                            [`${question.id}_supporting_docs`]: {
                              file: null,
                              fileName: "",
                              error: undefined,
                            },
                          }))
                          onChange?.({ ...loanValue, supportingDocs: null })
                          // Reset the file input
                          const fileInput = document.getElementById(
                            `${question.id}_supporting_docs`,
                          ) as HTMLInputElement
                          if (fileInput) {
                            fileInput.value = ""
                          }
                        }}
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <p className="text-xs text-gray-600">
                        {fileUploads[`${question.id}_supporting_docs`].fileName}
                      </p>
                    </div>
                  )}
                  {fileUploads[`${question.id}_supporting_docs`]?.error && (
                    <p className="mt-1 text-sm text-red-500" role="alert">
                      {fileUploads[`${question.id}_supporting_docs`].error}
                    </p>
                  )}
                  {renderError(error)}
                </div>
              </div>
            )}

            {/* Loan Approval Due */}
            {loanApprovalDue && loanApprovalDue !== "no_due_date" && (
              <div>
                <div className="relative inline-block">
                  <Label className="mb-2 block text-sm font-medium">
                    Loan Approval Due:{" "}
                    <span className="font-bold text-red-500">*</span>
                  </Label>
                  {renderLabelOverlay(
                    "loanApprovalDueLabel",
                    "Loan Approval Due:",
                  )}
                </div>
                <div className="max-w-md">
                  <Input
                    type="text"
                    placeholder="Enter due date details"
                    disabled={disabled}
                    className="w-full"
                    style={getInputStyle()}
                    value={loanValue.loanDueDate || ""}
                    onChange={(e) => {
                      if (!editingMode) {
                        onChange?.({
                          ...loanValue,
                          loanDueDate: e.target.value,
                        })
                      }
                    }}
                  />
                </div>
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
                  value={loanValue.financeSpecialist || ""}
                  onValueChange={(val) => {
                    if (!editingMode) {
                      onChange?.({ ...loanValue, financeSpecialist: val })
                    }
                  }}
                >
                  <SelectTrigger
                    className="w-full max-w-md"
                    style={getSelectStyle()}
                  >
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
        {renderError(error)}
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
            <div className="relative inline-block">
              <Label className="mb-2 block text-sm font-medium">
                {getSubQuestionLabel(
                  uiConfig,
                  "customConditionLabel",
                  "Add Custom Condition",
                )}
              </Label>
              {renderLabelOverlay(
                "customConditionLabel",
                getSubQuestionLabel(
                  uiConfig,
                  "customConditionLabel",
                  "Add Custom Condition",
                ),
              )}
            </div>
            <div className="relative w-full">
              <Textarea
                placeholder={getSubQuestionPlaceholder(
                  uiConfig,
                  "customConditionPlaceholder",
                  "Type your custom condition here...",
                )}
                disabled={disabled}
                className={cn(
                  "max-h-[300px] min-h-[100px] w-full",
                  editingMode && "cursor-not-allowed",
                )}
                style={getInputStyle()}
              />
              {renderEditOverlay(
                "customConditionPlaceholder",
                getSubQuestionPlaceholder(
                  uiConfig,
                  "customConditionPlaceholder",
                  "Enter your custom condition...",
                ),
              )}
            </div>
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
          {dateType === "calendar" && (
            <div className="relative max-w-md">
              <DatePicker
                style={getInputStyle()}
                value={formValues.settlementDate}
                onChange={(date) => {
                  const newValues = { ...formValues, settlementDate: date }
                  setFormValues(newValues)
                  onChange?.(newValues)
                }}
                brandingConfig={brandingConfig}
              />
            </div>
          )}
          {dateType === "datetime" && (
            <div className="flex max-w-md gap-2">
              <div className="relative flex-1">
                <DatePicker
                  style={getInputStyle()}
                  value={formValues.settlementDate}
                  onChange={(date) => {
                    const newValues = { ...formValues, settlementDate: date }
                    setFormValues(newValues)
                    onChange?.(newValues)
                  }}
                  brandingConfig={brandingConfig}
                />
              </div>
              <div className="relative flex-1">
                <TimePicker
                  style={getInputStyle()}
                  value={formValues.settlementTime}
                  onChange={(time) => {
                    const newValues = { ...formValues, settlementTime: time }
                    setFormValues(newValues)
                    onChange?.(newValues)
                  }}
                  brandingConfig={brandingConfig}
                />
              </div>
            </div>
          )}
          {dateType === "buyer_text" && (
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder={uiConfig.placeholder || "Enter settlement date"}
                disabled={disabled}
                className={cn(editingMode && "cursor-not-allowed", "w-full")}
                style={getInputStyle()}
                value={editingMode ? "" : formValues.settlementDateText || ""}
                onChange={(e) => {
                  if (!editingMode) {
                    const newValues = {
                      ...formValues,
                      settlementDateText: e.target.value,
                    }
                    setFormValues(newValues)
                    onChange?.(newValues)
                  }
                }}
                onBlur={onBlur}
                data-field-id={question.id}
              />
              {renderEditOverlay(
                "placeholder",
                uiConfig.placeholder || "Enter settlement date",
              )}
            </div>
          )}
          {dateType === "seller_text" && (
            <p className="text-sm text-gray-600">
              {setupConfig.settlement_date_text || "Settlement date text"}
            </p>
          )}
          {dateType === "within_days" && (
            <div className="flex max-w-md gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  placeholder={getSubQuestionPlaceholder(
                    uiConfig,
                    "daysPlaceholder",
                    "Number of days",
                  )}
                  disabled={disabled}
                  className={cn(editingMode && "cursor-not-allowed", "w-full")}
                  style={getInputStyle()}
                  value={editingMode ? "" : formValues.settlementDays || ""}
                  onChange={(e) => {
                    if (!editingMode) {
                      const newValues = {
                        ...formValues,
                        settlementDays: e.target.value
                          ? Number(e.target.value)
                          : "",
                      }
                      setFormValues(newValues)
                      onChange?.(newValues)
                    }
                  }}
                  onBlur={onBlur}
                  data-field-id={question.id}
                />
                {renderEditOverlay(
                  "daysPlaceholder",
                  getSubQuestionPlaceholder(
                    uiConfig,
                    "daysPlaceholder",
                    "Number of days",
                  ),
                )}
              </div>
              <span className="flex items-center text-sm text-gray-600">
                days after acceptance
              </span>
            </div>
          )}
          {dateType === "CYO" && (
            <div className="relative max-w-md">
              <Input
                type="text"
                placeholder={uiConfig.placeholder || "Enter settlement date"}
                disabled={disabled}
                className={cn(editingMode && "cursor-not-allowed", "w-full")}
                style={getInputStyle()}
                value={editingMode ? "" : formValues.settlementDateCYO || ""}
                onChange={(e) => {
                  if (!editingMode) {
                    const newValues = {
                      ...formValues,
                      settlementDateCYO: e.target.value,
                    }
                    setFormValues(newValues)
                    onChange?.(newValues)
                  }
                }}
                onBlur={onBlur}
                data-field-id={question.id}
              />
              {renderEditOverlay(
                "placeholder",
                uiConfig.placeholder || "Enter settlement date",
              )}
            </div>
          )}
        </div>

        {location && location !== "not_required" && (
          <div>
            <div className="relative inline-block">
              <Label className="mb-2 block text-sm font-medium">
                {getSubQuestionLabel(
                  uiConfig,
                  "settlementLocationLabel",
                  "Settlement Location",
                )}
              </Label>
              {renderLabelOverlay(
                "settlementLocationLabel",
                getSubQuestionLabel(
                  uiConfig,
                  "settlementLocationLabel",
                  "Settlement Location",
                ),
              )}
            </div>
            {location === "buyer_text" && (
              <div className="relative max-w-md">
                <Input
                  type="text"
                  placeholder={getSubQuestionPlaceholder(
                    uiConfig,
                    "locationPlaceholder",
                    "Enter settlement location",
                  )}
                  disabled={disabled}
                  className={cn(editingMode && "cursor-not-allowed", "w-full")}
                  style={getInputStyle()}
                />
                {renderEditOverlay(
                  "locationPlaceholder",
                  getSubQuestionPlaceholder(
                    uiConfig,
                    "locationPlaceholder",
                    "Enter settlement location",
                  ),
                )}
              </div>
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
    // Check both allow_attachments (offer form) and allowAttachments (lead form)
    const allowAttachments =
      setupConfig.allow_attachments === "yes" ||
      setupConfig.allowAttachments === "yes"
    const attachmentData = fileUploads[
      `${question.id}_message_attachments`
    ] || {
      file: null,
      fileName: "",
      error: undefined,
    }

    // Separate textarea value from file attachments
    // Value should be a string for the textarea, files are stored separately
    const messageValue =
      typeof value === "string" ? value : value?.message || ""

    return (
      <div className="space-y-3">
        <div>
          <div className="relative w-full">
            <Textarea
              placeholder={uiConfig.placeholder || "Type your message here..."}
              disabled={disabled}
              className={cn(
                "max-h-[300px] min-h-[150px] w-full",
                editingMode && "cursor-not-allowed",
              )}
              style={getInputStyle()}
              value={editingMode ? "" : messageValue}
              onChange={(e) => {
                if (!editingMode) {
                  // Store message text separately from files
                  const currentFiles =
                    typeof value === "object" &&
                    value !== null &&
                    !Array.isArray(value)
                      ? value.attachments
                      : undefined
                  onChange?.(
                    currentFiles
                      ? { message: e.target.value, attachments: currentFiles }
                      : e.target.value,
                  )
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Type your message here...",
            )}
          </div>
          {renderError(error)}
        </div>
        {allowAttachments && (
          <div className="space-y-2">
            <input
              type="file"
              id={`${question.id}_message_attachments`}
              className="hidden"
              disabled={disabled}
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                // Validate all files
                let fileError: string | undefined = undefined
                for (const file of files) {
                  const error = validateFileSize(file)
                  if (error) {
                    fileError = error
                    break
                  }
                }

                const fileNames = files.map((f) => f.name).join(", ")
                setFileUploads((prev) => ({
                  ...prev,
                  [`${question.id}_message_attachments`]: {
                    file: files[0] || null,
                    fileName: fileNames || "",
                    error: fileError,
                  },
                }))
                if (!fileError && files.length > 0) {
                  // Store files separately from message text
                  const currentMessage =
                    typeof value === "string" ? value : value?.message || ""
                  onChange?.({ message: currentMessage, attachments: files })
                }
              }}
            />
            <div className="flex max-w-md items-center gap-2">
              <label
                htmlFor={`${question.id}_message_attachments`}
                className="flex-1 cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center transition-colors hover:bg-gray-200"
              >
                <p className="text-sm">📎 Attach files (Optional)</p>
              </label>
            </div>
            {attachmentData.fileName && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileUploads((prev) => ({
                      ...prev,
                      [`${question.id}_message_attachments`]: {
                        file: null,
                        fileName: "",
                        error: undefined,
                      },
                    }))
                    // Clear files but keep message text
                    const currentMessage =
                      typeof value === "string" ? value : value?.message || ""
                    onChange?.(currentMessage || null)
                    const fileInput = document.getElementById(
                      `${question.id}_message_attachments`,
                    ) as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ""
                    }
                  }}
                  className="h-8 w-8 p-0"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-600">
                  {attachmentData.fileName}
                </p>
              </div>
            )}
            {attachmentData.error && (
              <p className="text-xs text-red-500" role="alert">
                {attachmentData.error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Lead Form Questions

  // Listing Interest
  if (question.type === "listingInterest") {
    return (
      <div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={uiConfig.placeholder || "Specify the listing here..."}
            disabled={disabled}
            className="w-full"
            style={getInputStyle()}
            value={(value as string) || ""}
            onChange={(e) => {
              onChange?.(e.target.value)
            }}
            onBlur={onBlur}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "Specify the listing here...",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Name (Lead Form)
  if (question.type === "name") {
    const nameValue = (value as { firstName?: string; lastName?: string }) || {}
    return (
      <div>
        <div className="flex max-w-md gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder={uiConfig.placeholder || "Enter your first name"}
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
              value={nameValue.firstName || ""}
              onChange={(e) => {
                onChange?.({
                  ...nameValue,
                  firstName: e.target.value,
                })
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter your first name",
            )}
          </div>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter your last name"
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
              value={nameValue.lastName || ""}
              onChange={(e) => {
                onChange?.({
                  ...nameValue,
                  lastName: e.target.value,
                })
              }}
              onBlur={onBlur}
              data-field-id={`${question.id}_lastName`}
            />
          </div>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Email (Lead Form)
  if (question.type === "email") {
    return (
      <div>
        <div className="relative max-w-md">
          <Input
            type="email"
            placeholder={uiConfig.placeholder || "example@email.com"}
            disabled={disabled}
            className="w-full"
            style={getInputStyle()}
            value={(value as string) || ""}
            onChange={(e) => {
              onChange?.(e.target.value)
            }}
            onBlur={onBlur}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "example@email.com",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Tel (Lead Form)
  if (question.type === "tel") {
    // Handle both string (legacy) and object (new format) values
    const phoneValue =
      typeof value === "object" && value !== null && "countryCode" in value
        ? value
        : (value as string) || { countryCode: "+1", number: "" }

    return (
      <div>
        <div className="relative max-w-md">
          <PhoneInput
            value={phoneValue}
            onChange={(newValue) => {
              onChange?.(newValue)
            }}
            onBlur={onBlur}
            disabled={disabled}
            editingMode={false}
            placeholder={uiConfig.placeholder || "555-123-4567"}
            className="w-full"
            style={getInputStyle()}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "Enter your phone number",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Are You Interested?
  if (question.type === "areYouInterested") {
    // Get selected options from setupConfig
    const selectedOptions = (setupConfig.options as string[]) || []
    // Map to option labels
    const optionLabels: Record<string, string> = {
      yesVeryInterested: "Yes, very interested",
      yes: "Yes",
      no: "No",
      maybe: "Maybe",
    }

    // Filter to only show selected options
    const availableOptions = selectedOptions
      .map((opt) => ({
        value: opt,
        label: optionLabels[opt] || opt,
      }))
      .filter((opt) => opt.label)

    if (availableOptions.length === 0) {
      // Fallback if no options configured
      return (
        <div>
          <div className="relative max-w-md">
            <Select
              disabled={disabled}
              value={(value as string) || ""}
              onValueChange={(val) => onChange?.(val)}
            >
              <SelectTrigger className="w-full" style={getSelectStyle()}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderError(error)}
        </div>
      )
    }

    return (
      <div>
        <div className="relative max-w-md">
          <Select
            disabled={disabled}
            value={(value as string) || ""}
            onValueChange={(val) => {
              onChange?.(val)
            }}
          >
            <SelectTrigger
              className="w-full"
              style={getSelectStyle()}
              data-field-id={question.id}
            >
              <SelectValue
                placeholder={uiConfig.placeholder || "Select an option..."}
              />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Follow All Listings?
  if (question.type === "followAllListings") {
    return (
      <div>
        <div className="relative max-w-md">
          <Select
            disabled={disabled}
            value={(value as string) || ""}
            onValueChange={(val) => {
              onChange?.(val)
            }}
          >
            <SelectTrigger
              className="w-full"
              style={getSelectStyle()}
              data-field-id={question.id}
            >
              <SelectValue
                placeholder={uiConfig.placeholder || "Select an option..."}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisAndFuture">
                Yes, follow this listing and all future listings
              </SelectItem>
              <SelectItem value="thisOnly">
                Yes, follow this listing only
              </SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Opinion of Sale Price
  if (question.type === "opinionOfSalePrice") {
    const answerType = setupConfig.answerType || "text"

    if (answerType === "number") {
      return (
        <div>
          <div className="relative max-w-md">
            <Input
              type="number"
              placeholder={uiConfig.placeholder || "Enter a number"}
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
              value={(value as string) || ""}
              onChange={(e) => {
                onChange?.(e.target.value)
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter a number",
            )}
          </div>
          {renderError(error)}
        </div>
      )
    }

    // Default to text
    return (
      <div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={uiConfig.placeholder || "Enter your opinion"}
            disabled={disabled}
            className="w-full"
            style={getInputStyle()}
            value={(value as string) || ""}
            onChange={(e) => {
              onChange?.(e.target.value)
            }}
            onBlur={onBlur}
            data-field-id={question.id}
          />
          {renderEditOverlay(
            "placeholder",
            uiConfig.placeholder || "Enter your opinion",
          )}
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Capture Finance Leads
  if (question.type === "captureFinanceLeads") {
    return (
      <div>
        <div className="relative max-w-md">
          <Select
            disabled={disabled}
            value={(value as string) || ""}
            onValueChange={(val) => {
              onChange?.(val)
            }}
          >
            <SelectTrigger
              className="w-full"
              style={getSelectStyle()}
              data-field-id={question.id}
            >
              <SelectValue
                placeholder={uiConfig.placeholder || "Select an option..."}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {renderError(error)}
      </div>
    )
  }

  // Custom Question
  if (question.type === "custom") {
    const answerType = setupConfig.answer_type

    if (answerType === "short_text") {
      return (
        <div>
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder={uiConfig.placeholder || "Enter text..."}
              disabled={disabled}
              className={cn("w-full", editingMode && "cursor-not-allowed")}
              style={getInputStyle()}
              value={editingMode ? "" : (value as string) || ""}
              onChange={(e) => {
                if (!editingMode) {
                  onChange?.(e.target.value)
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter your answer",
            )}
          </div>
          {renderError(error)}
        </div>
      )
    }

    if (answerType === "long_text") {
      return (
        <div>
          <div className="relative w-full">
            <Textarea
              placeholder={uiConfig.placeholder || "Enter your answer"}
              disabled={disabled}
              rows={4}
              className={cn(
                "max-h-[300px] min-h-[100px] w-full",
                editingMode && "cursor-not-allowed",
              )}
              style={getInputStyle()}
              value={editingMode ? "" : (value as string) || ""}
              onChange={(e) => {
                if (!editingMode) {
                  onChange?.(e.target.value)
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter your answer",
            )}
          </div>
          {renderError(error)}
        </div>
      )
    }

    if (answerType === "date") {
      return (
        <div className="relative max-w-md">
          <DatePicker
            style={getInputStyle()}
            value={formValues[`${question.id}_date`]}
            onChange={(date) =>
              setFormValues((prev) => ({
                ...prev,
                [`${question.id}_date`]: date,
              }))
            }
            brandingConfig={brandingConfig}
          />
        </div>
      )
    }

    if (answerType === "time") {
      return (
        <div className="relative max-w-md">
          <TimePicker
            style={getInputStyle()}
            value={formValues[`${question.id}_time`]}
            onChange={(time) =>
              setFormValues((prev) => ({
                ...prev,
                [`${question.id}_time`]: time,
              }))
            }
            brandingConfig={brandingConfig}
          />
        </div>
      )
    }

    if (answerType === "number_amount") {
      const numberType = setupConfig.number_type

      if (numberType === "money") {
        const currencyStip = setupConfig.currency_stipulation
        return (
          <div className="flex gap-2">
            {currencyStip === "fixed" && (
              <span className="flex items-center text-sm text-gray-600">
                {setupConfig.currency_fixed}
              </span>
            )}
            <div className="relative max-w-md flex-1">
              <Input
                type="number"
                min="0"
                placeholder={uiConfig.amountPlaceholder || "Enter amount"}
                disabled={disabled}
                className="w-full"
                style={getInputStyle()}
              />
              {renderEditOverlay(
                "amountPlaceholder",
                uiConfig.amountPlaceholder || "Enter amount",
              )}
            </div>
            {currencyStip === "options" && (
              <Select disabled={disabled}>
                <SelectTrigger
                  className="w-full max-w-xs"
                  style={getSelectStyle()}
                >
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
              <div className="relative max-w-xs flex-1">
                <Input
                  type="text"
                  placeholder={uiConfig.currencyPlaceholder || "Currency"}
                  disabled={disabled}
                  className="w-full"
                  style={getInputStyle()}
                />
                {renderEditOverlay(
                  "currencyPlaceholder",
                  uiConfig.currencyPlaceholder || "Currency",
                )}
              </div>
            )}
          </div>
        )
      } else if (numberType === "phone") {
        return (
          <div className="relative max-w-md">
            <Input
              type="tel"
              placeholder={uiConfig.phonePlaceholder || "Enter phone number"}
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
            />
            {renderEditOverlay(
              "phonePlaceholder",
              uiConfig.phonePlaceholder || "Enter phone number",
            )}
          </div>
        )
      } else if (numberType === "percentage") {
        return (
          <div className="flex max-w-md gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min="0"
                placeholder={
                  uiConfig.percentagePlaceholder || "Enter percentage"
                }
                disabled={disabled}
                className="w-full"
                style={getInputStyle()}
              />
              {renderEditOverlay(
                "percentagePlaceholder",
                uiConfig.percentagePlaceholder || "Enter percentage",
              )}
            </div>
            <span className="flex items-center text-sm text-gray-600">%</span>
          </div>
        )
      } else {
        return (
          <div className="relative max-w-md">
            <Input
              type="number"
              placeholder={uiConfig.numberPlaceholder || "Enter amount"}
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
            />
            {renderEditOverlay(
              "numberPlaceholder",
              uiConfig.numberPlaceholder || "Enter amount",
            )}
          </div>
        )
      }
    } else if (answerType === "file_upload") {
      const fileData = fileUploads[`${question.id}_file`] || {
        file: null,
        fileName: "",
        error: undefined,
      }

      return (
        <div className="space-y-2">
          <input
            type="file"
            id={`${question.id}_file_input`}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              const fileKey = `${question.id}_file`
              const fileError = file ? validateFileSize(file) : null
              setFileUploads((prev) => ({
                ...prev,
                [fileKey]: {
                  file,
                  fileName: file ? file.name : "",
                  error: fileError || undefined,
                },
              }))
              if (!fileError && file) {
                onChange?.(file)
              }
            }}
            data-field-id={question.id}
          />
          <div className="flex max-w-md items-center gap-2">
            <label
              htmlFor={`${question.id}_file_input`}
              className="flex-1 cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center transition-colors hover:bg-gray-200"
            >
              <p className="text-sm">📎 Upload files</p>
            </label>
          </div>
          {fileData.fileName && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFileUploads((prev) => ({
                    ...prev,
                    [`${question.id}_file`]: {
                      file: null,
                      fileName: "",
                      error: undefined,
                    },
                  }))
                  onChange?.(null)
                  const fileInput = document.getElementById(
                    `${question.id}_file_input`,
                  ) as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ""
                  }
                }}
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="text-xs text-gray-600">{fileData.fileName}</p>
            </div>
          )}
          {renderError(fileData.error || error)}
        </div>
      )
    } else if (answerType === "time_date") {
      const timeType = setupConfig.time_date_type
      if (timeType === "date") {
        return (
          <div className="max-w-md">
            <DatePicker
              style={getInputStyle()}
              value={formValues[`${question.id}_date`]}
              onChange={(date) =>
                setFormValues((prev) => ({
                  ...prev,
                  [`${question.id}_date`]: date,
                }))
              }
              brandingConfig={brandingConfig}
            />
          </div>
        )
      } else if (timeType === "time") {
        return (
          <div className="max-w-md">
            <Input
              type="time"
              disabled={disabled}
              className="w-full"
              style={getInputStyle()}
            />
          </div>
        )
      } else if (timeType === "datetime") {
        return (
          <div className="flex max-w-md gap-2">
            <div className="flex-1">
              <DatePicker
                style={getInputStyle()}
                value={formValues[`${question.id}_date`]}
                onChange={(date) =>
                  setFormValues((prev) => ({
                    ...prev,
                    [`${question.id}_date`]: date,
                  }))
                }
                brandingConfig={brandingConfig}
              />
            </div>
            <div className="flex-1">
              <TimePicker
                style={getInputStyle()}
                value={formValues[`${question.id}_time`]}
                onChange={(time) =>
                  setFormValues((prev) => ({
                    ...prev,
                    [`${question.id}_time`]: time,
                  }))
                }
                brandingConfig={brandingConfig}
              />
            </div>
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
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0) || []
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
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0) || []
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
      const showTickbox = setupConfig.add_tickbox === "yes"
      // Only disable checkbox in editing mode, not in form preview/user-facing form
      const tickboxDisabled = editingMode || !showTickbox
      const isRequired = setupConfig.tickbox_requirement === "essential"
      const isOptional = !isRequired

      return (
        <div className="space-y-2">
          {/* Statement text is now shown as the main label in OfferFormInteractiveView */}
          {/* Only show tickbox here */}
          {showTickbox && (
            <div className="flex items-center gap-2">
              <Checkbox
                disabled={tickboxDisabled}
                checked={editingMode ? false : (value as boolean) || false}
                onCheckedChange={(checked) => {
                  if (!editingMode) {
                    onChange?.(checked)
                  }
                }}
              />
              <div className="relative inline-block">
                <span
                  className={cn(
                    "text-sm",
                    !showTickbox ? "text-gray-400" : "text-gray-700",
                  )}
                >
                  {setupConfig.tickbox_text || "I agree"}
                  {isRequired && <span className="text-red-500"> *</span>}
                  {isOptional && (
                    <span className="text-gray-500"> (Optional)</span>
                  )}
                </span>
                {renderLabelOverlay(
                  "tickboxText",
                  setupConfig.tickbox_text || "I agree",
                )}
              </div>
            </div>
          )}
          {!showTickbox && (
            <div className="relative inline-block">
              <p className="text-sm text-gray-700">
                {setupConfig.question_text}
              </p>
              {renderLabelOverlay(
                "statementText",
                setupConfig.question_text || "Statement text",
              )}
            </div>
          )}
        </div>
      )
    } else if (answerType === "phone") {
      // Handle both string (legacy) and object (new format) values
      const phoneValue = editingMode
        ? ""
        : typeof value === "object" && value !== null && "countryCode" in value
          ? value
          : (value as string) || { countryCode: "+1", number: "" }

      return (
        <div>
          <div className="relative max-w-md">
            <PhoneInput
              value={phoneValue}
              onChange={(newValue) => {
                if (!editingMode) {
                  // Save as object with separate countryCode and number
                  onChange?.(newValue)
                }
              }}
              onBlur={onBlur}
              disabled={disabled || editingMode}
              editingMode={editingMode}
              placeholder={uiConfig.placeholder || "555-123-4567"}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              data-field-id={question.id}
            />
            {renderEditOverlay(
              "placeholder",
              uiConfig.placeholder || "Enter your phone number",
            )}
          </div>
          {renderError(error)}
        </div>
      )
    }
  }

  // Default fallback
  return (
    <div className="relative max-w-md">
      <Input
        type="text"
        placeholder={uiConfig.placeholder || "Enter value..."}
        disabled={disabled}
        className={cn(editingMode && "cursor-not-allowed", "w-full")}
        style={getInputStyle()}
      />
      {renderEditOverlay(
        "placeholder",
        uiConfig.placeholder || "Enter value...",
      )}
    </div>
  )
}
