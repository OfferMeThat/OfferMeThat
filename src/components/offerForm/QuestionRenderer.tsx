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
import {
  validateFileSize,
  validateMultipleFiles,
} from "@/lib/offerFormValidation"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"
import {
  getSubQuestionLabel,
  getSubQuestionPlaceholder,
  parseUIConfig,
  QuestionUIConfig,
} from "@/types/questionUIConfig"
import { Database } from "@/types/supabase"
import { FileText, X } from "lucide-react"
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
  onSubmit?: () => void // For submit button clicks
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
  fileUploads: Record<
    string,
    | { file: File | null; fileName: string; error?: string }
    | { files: File[]; fileNames: string[]; error?: string }
  >
  setFileUploads: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        | { file: File | null; fileName: string; error?: string }
        | { files: File[]; fileNames: string[]; error?: string }
      >
    >
  >
  collectMiddleNames: string
  collectId: string
  questionRequired: boolean
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
  questionRequired,
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
  const fileDataRaw = fileUploads[`${questionId}_${prefix}_id`]
  const fileData: { file: File | null; fileName: string; error?: string } =
    fileDataRaw && "file" in fileDataRaw
      ? fileDataRaw
      : fileDataRaw && "files" in fileDataRaw
        ? {
            file: fileDataRaw.files[0] || null,
            fileName: fileDataRaw.fileNames[0] || "",
            error: fileDataRaw.error,
          }
        : {
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

  // Create prefixed field IDs for repeated fields (e.g., representatives)
  // Use prefix only if it's not a single field (prefixes like "rep-1", "rep-2", etc.)
  const isRepeatedField = prefix && prefix.startsWith("rep-")
  const firstNameLabelId = isRepeatedField
    ? `${prefix}_firstNameLabel`
    : "firstNameLabel"
  const middleNameLabelId = isRepeatedField
    ? `${prefix}_middleNameLabel`
    : "middleNameLabel"
  const lastNameLabelId = isRepeatedField
    ? `${prefix}_lastNameLabel`
    : "lastNameLabel"
  const firstNamePlaceholderId = isRepeatedField
    ? `${prefix}_firstNamePlaceholder`
    : "firstNamePlaceholder"
  const middleNamePlaceholderId = isRepeatedField
    ? `${prefix}_middleNamePlaceholder`
    : "middleNamePlaceholder"
  const lastNamePlaceholderId = isRepeatedField
    ? `${prefix}_lastNamePlaceholder`
    : "lastNamePlaceholder"

  // Get labels with fallback to base labels if prefixed ones don't exist
  const getLabel = (prefixedId: string, baseId: string, fallback: string) => {
    const prefixedLabel = getSubQuestionLabel(uiConfig, prefixedId, "")
    if (prefixedLabel) return prefixedLabel
    return getSubQuestionLabel(uiConfig, baseId, fallback)
  }

  const getPlaceholder = (
    prefixedId: string,
    baseId: string,
    fallback: string,
  ) => {
    const prefixedPlaceholder = getSubQuestionPlaceholder(
      uiConfig,
      prefixedId,
      "",
    )
    if (prefixedPlaceholder) return prefixedPlaceholder
    return getSubQuestionPlaceholder(uiConfig, baseId, fallback)
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="relative inline-block">
          <Label className="mb-1 block text-sm">
            {getLabel(firstNameLabelId, "firstNameLabel", "First Name:")}
          </Label>
          {renderLabelOverlay(
            firstNameLabelId,
            getLabel(firstNameLabelId, "firstNameLabel", "First Name:"),
          )}
        </div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={getPlaceholder(
              firstNamePlaceholderId,
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
            firstNamePlaceholderId,
            getPlaceholder(
              firstNamePlaceholderId,
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
                  {getLabel(
                    middleNameLabelId,
                    "middleNameLabel",
                    "Middle Name:",
                  )}
                </Label>
                {renderLabelOverlay(
                  middleNameLabelId,
                  getLabel(
                    middleNameLabelId,
                    "middleNameLabel",
                    "Middle Name:",
                  ),
                )}
              </div>
              <div className="relative max-w-md">
                <Input
                  type="text"
                  placeholder={getPlaceholder(
                    middleNamePlaceholderId,
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
                  middleNamePlaceholderId,
                  getPlaceholder(
                    middleNamePlaceholderId,
                    "middleNamePlaceholder",
                    "Enter middle name",
                  ),
                )}
              </div>
            </div>
          )}
          {shouldShowMiddleName && (
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
                No Middle Name
              </Label>
            </div>
          )}
        </>
      )}
      <div>
        <div className="relative inline-block">
          <Label className="mb-1 block text-sm">
            {getLabel(lastNameLabelId, "lastNameLabel", "Last Name:")}
          </Label>
          {renderLabelOverlay(
            lastNameLabelId,
            getLabel(lastNameLabelId, "lastNameLabel", "Last Name:"),
          )}
        </div>
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder={getPlaceholder(
              lastNamePlaceholderId,
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
            lastNamePlaceholderId,
            getPlaceholder(
              lastNamePlaceholderId,
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
              {collectId === "mandatory" && questionRequired && (
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
  onSubmit,
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
    // For custom questions with money amount type, initialize with USD as default currency
    if (
      question.type === "custom" &&
      question.setupConfig &&
      typeof question.setupConfig === "object" &&
      "answer_type" in question.setupConfig &&
      question.setupConfig.answer_type === "number_amount" &&
      "number_type" in question.setupConfig &&
      question.setupConfig.number_type === "money"
    ) {
      const currencyStip =
        (question.setupConfig as any).currency_stipulation || "any"
      // Handle both array format (new) and comma-separated string (legacy)
      let currencyOptions: string[] = []
      if ((question.setupConfig as any).currency_options) {
        const currencyOptionsValue = (question.setupConfig as any)
          .currency_options
        if (Array.isArray(currencyOptionsValue)) {
          // New format: array of strings
          currencyOptions = currencyOptionsValue.filter(
            (c: string) => c && c.trim() !== "",
          )
        } else if (typeof currencyOptionsValue === "string") {
          // Legacy format: comma-separated string
          currencyOptions = currencyOptionsValue
            .split(",")
            .map((c: string) => c.trim())
            .filter((c: string) => c !== "")
        }
      }
      // If options mode with 2+ currencies, initialize as array
      if (
        currencyStip === "options" &&
        currencyOptions.length >= 2 &&
        Array.isArray(value)
      ) {
        return value
      }
      return { currency: "USD" }
    }
    return {}
  })

  // Sync formValues with value prop when it changes
  useEffect(() => {
    if (value && typeof value === "object") {
      // Handle arrays for multiple currency/amount pairs
      if (Array.isArray(value)) {
        setFormValues(value as any)
      } else {
        setFormValues(value as Record<string, any>)
      }
    } else if (value === null || value === undefined) {
      setFormValues({})
    }
  }, [value])
  // State for file uploads (keyed by question id and field name)
  // Can store single file or array of files
  const [fileUploads, setFileUploads] = useState<
    Record<
      string,
      | { file: File | null; fileName: string; error?: string }
      | { files: File[]; fileNames: string[]; error?: string }
    >
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

  // State for nameOfPurchaser question (must be declared at top level for hooks rules)
  const nameOfPurchaserValue: Record<string, any> =
    question.type === "nameOfPurchaser" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
      ? value
      : {}
  const [scenario, setScenario] = useState<string>(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.scenario || ""
      : "",
  )
  const [numPurchasers, setNumPurchasers] = useState<number>(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.numPurchasers || 2
      : 2,
  )
  const [numRepresentatives, setNumRepresentatives] = useState<number>(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.numRepresentatives || 1
      : 1,
  )
  const [purchaserTypes, setPurchaserTypes] = useState<Record<number, string>>(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.purchaserTypes || {}
      : {},
  )
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
  >(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.nameFields || {}
      : {},
  )
  const [corporationName, setCorporationName] = useState<string>(
    question.type === "nameOfPurchaser"
      ? nameOfPurchaserValue.corporationName || ""
      : "",
  )

  // Sync specifyListing state with value prop
  useEffect(() => {
    if (
      question.type === "specifyListing" &&
      value &&
      typeof value === "string"
    ) {
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
  }, [question.type, value, listings])

  // Sync nameOfPurchaser ID files when they change in fileUploads
  // This will be handled inside the nameOfPurchaser block by calling updateNameOfPurchaserData
  // We can't call updateNameOfPurchaserData here because it's defined inside the conditional block
  // Instead, we'll handle it by calling onChange directly when fileUploads change
  useEffect(() => {
    if (question.type === "nameOfPurchaser" && !editingMode && value) {
      // Extract ID files from fileUploads state and sync with parent
      const idFiles: Record<string, File> = {}
      Object.entries(fileUploads).forEach(([key, fileData]) => {
        if (key.startsWith(`${question.id}_`) && key.endsWith("_id")) {
          let file: File | null = null
          if ("file" in fileData && fileData.file) {
            file = fileData.file
          } else if ("files" in fileData && fileData.files.length > 0) {
            file = fileData.files[0]
          }
          if (file) {
            const prefix = key.replace(`${question.id}_`, "").replace("_id", "")
            idFiles[prefix] = file
          }
        }
      })

      // Only update if there are ID files or if we need to clear them
      if (
        Object.keys(idFiles).length > 0 ||
        Object.keys(fileUploads).some(
          (k) => k.startsWith(`${question.id}_`) && k.endsWith("_id"),
        )
      ) {
        const currentValue =
          value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {}
        onChange?.({
          ...currentValue,
          ...(Object.keys(idFiles).length > 0 ? { idFiles } : {}),
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.type, question.id, fileUploads, editingMode])

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
              placeholder={getSubQuestionPlaceholder(
                uiConfig,
                "firstNamePlaceholder",
                "First Name",
              )}
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
              getSubQuestionPlaceholder(
                uiConfig,
                "firstNamePlaceholder",
                "First Name",
              ),
            )}
          </div>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder={getSubQuestionPlaceholder(
                uiConfig,
                "lastNamePlaceholder",
                "Last Name",
              )}
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
              getSubQuestionPlaceholder(
                uiConfig,
                "lastNamePlaceholder",
                "Last Name",
              ),
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
        <div className="relative flex max-w-md items-center gap-2">
          <PhoneInput
            value={phoneValue}
            onChange={(newValue) => {
              // Allow changes in editing mode for preview (similar to offerAmount)
              onChange?.(newValue)
            }}
            onBlur={onBlur}
            disabled={disabled}
            editingMode={editingMode}
            placeholder={uiConfig.placeholder || "555-123-4567"}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            data-field-id={question.id}
          />
          {/* Edit overlay only covers the phone number input part, not the country code dropdown */}
          {/* Country code dropdown is 100px + gap-2 (8px) = 108px from left */}
          {editingMode && onEditPlaceholder && (
            <div
              className="absolute top-0 right-0 bottom-0 left-[108px] z-20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onEditPlaceholder(
                  "placeholder",
                  uiConfig.placeholder || "Enter your phone number",
                )
              }}
              title="Click to edit placeholder"
            />
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

          {/* Amount Input */}
          <div className="relative max-w-md flex-1">
            <Input
              type="number"
              min="0"
              step="any"
              placeholder={uiConfig.placeholder || "Enter offer amount"}
              disabled={disabled}
              className={cn(
                editingMode && "cursor-not-allowed",
                "w-full",
                currencyMode === "fixed" && "pr-12", // Add padding for currency decorator
              )}
              style={getInputStyle()}
              value={editingMode ? "" : currentAmount}
              onChange={(e) => {
                if (!editingMode) {
                  // Prevent "e", "E", "+", "-" characters (scientific notation and signs)
                  const value = e.target.value.replace(/[eE\+\-]/g, "")
                  handleAmountChange(value)
                }
              }}
              onKeyDown={(e) => {
                // Prevent "e", "E", "+", "-" keys
                if (
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+" ||
                  e.key === "-"
                ) {
                  e.preventDefault()
                }
              }}
              onBlur={onBlur}
              data-field-id={question.id}
            />
            {/* Currency decorator for fixed mode */}
            {currencyMode === "fixed" && (
              <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                {fixedCurrency}
              </div>
            )}
            {/* Edit overlay - adjust right padding for fixed currency mode */}
            {currencyMode === "fixed" && editingMode && onEditPlaceholder ? (
              <div
                className="absolute inset-0 right-12 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditPlaceholder(
                    "placeholder",
                    uiConfig.placeholder || "Enter offer amount",
                  )
                }}
                title="Click to edit placeholder"
              />
            ) : (
              renderEditOverlay(
                "placeholder",
                uiConfig.placeholder || "Enter offer amount",
              )
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
      <div className="space-y-3">
        {/* Terms and Conditions Checkbox */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              disabled={disabled || editingMode}
              checked={editingMode ? false : (value as boolean) || false}
              onCheckedChange={(checked) => {
                if (!editingMode) {
                  onChange?.(checked)
                }
              }}
              onBlur={onBlur}
              data-field-id={`${question.id}_terms`}
            />
            <label className="text-sm text-gray-700">
              I agree to the terms and conditions.
              <span className="text-red-500"> *</span>
            </label>
          </div>
          {/* Show validation error for T&C checkbox */}
          {error && <p className="ml-7 text-sm text-red-500">{error}</p>}
        </div>
        {/* Submit Button - Not editable */}
        <div className={editingMode ? "" : "flex justify-center"}>
          <Button
            size="lg"
            disabled={disabled}
            style={getButtonStyle()}
            className={editingMode ? "w-full" : "w-1/2"}
            onClick={editingMode ? undefined : onSubmit}
            type={editingMode ? "button" : "button"}
          >
            {uiConfig.label || "Submit Offer"}
          </Button>
        </div>
      </div>
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
                    {collectId === "mandatory" && question.required && (
                      <span className="text-red-500"> *</span>
                    )}
                  </p>
                </label>
              </div>
              {(() => {
                const fileDataRaw =
                  fileUploads[`${question.id}_single_id_upload`]
                const fileData =
                  fileDataRaw && "file" in fileDataRaw
                    ? fileDataRaw
                    : fileDataRaw && "files" in fileDataRaw
                      ? {
                          file: fileDataRaw.files[0] || null,
                          fileName: fileDataRaw.fileNames[0] || "",
                          error: fileDataRaw.error,
                        }
                      : { file: null, fileName: "", error: undefined }
                return (
                  <>
                    {fileData.fileName && (
                      <div className="flex items-center gap-2">
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
                              typeof value === "string"
                                ? value
                                : value?.name || ""
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
                        <p className="text-xs text-gray-600">
                          {fileData.fileName}
                        </p>
                      </div>
                    )}
                    {fileData.error && (
                      <p className="mt-1 text-sm text-red-500" role="alert">
                        {fileData.error}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )
    }

    // Individual names method - complex multi-scenario UI
    // State hooks are already declared at the top level

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
        corporationName?: string
        [key: string]: any // Allow dynamic keys for corporation names in "other" scenario
        idFiles?: Record<string, File>
      }>,
    ) => {
      // Extract ID files from fileUploads state
      const idFiles: Record<string, File> = {}
      Object.entries(fileUploads).forEach(([key, fileData]) => {
        if (key.startsWith(`${question.id}_`) && key.endsWith("_id")) {
          let file: File | null = null
          if ("file" in fileData && fileData.file) {
            file = fileData.file
          } else if ("files" in fileData && fileData.files.length > 0) {
            file = fileData.files[0]
          }
          if (file) {
            const prefix = key.replace(`${question.id}_`, "").replace("_id", "")
            idFiles[prefix] = file
          }
        }
      })

      const newData = {
        scenario,
        numPurchasers,
        numRepresentatives,
        purchaserTypes,
        nameFields,
        corporationName,
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
    // This is handled by calling updateNameOfPurchaserData when fileUploads change
    // We'll sync it in the top-level useEffect

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
              questionRequired={question.required}
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
                    questionRequired={question.required}
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
              <div className="relative inline-block">
                <Label className="mb-1 block text-sm">
                  {getSubQuestionLabel(
                    uiConfig,
                    "corporationNameLabel",
                    "Corporation Name:",
                  )}
                </Label>
                {renderLabelOverlay(
                  "corporationNameLabel",
                  getSubQuestionLabel(
                    uiConfig,
                    "corporationNameLabel",
                    "Corporation Name:",
                  ),
                )}
              </div>
              <div className="relative max-w-md">
                <Input
                  type="text"
                  placeholder={getSubQuestionPlaceholder(
                    uiConfig,
                    "corporationNamePlaceholder",
                    "Enter corporation name",
                  )}
                  disabled={disabled}
                  className={cn(editingMode && "cursor-not-allowed", "w-full")}
                  style={getInputStyle()}
                  value={editingMode ? "" : corporationName}
                  onChange={(e) => {
                    if (!editingMode) {
                      const newName = e.target.value
                      setCorporationName(newName)
                      updateNameOfPurchaserData({ corporationName: newName })
                    }
                  }}
                  onBlur={onBlur}
                  data-field-id={`${question.id}_corporationName`}
                />
                {renderEditOverlay(
                  "corporationNamePlaceholder",
                  getSubQuestionPlaceholder(
                    uiConfig,
                    "corporationNamePlaceholder",
                    "Enter corporation name",
                  ),
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative inline-block">
                <h4 className="text-sm font-medium">
                  {getSubQuestionLabel(
                    uiConfig,
                    "corporationRepresentativeLabel",
                    "Corporation Representative:",
                  )}
                </h4>
                {renderLabelOverlay(
                  "corporationRepresentativeLabel",
                  getSubQuestionLabel(
                    uiConfig,
                    "corporationRepresentativeLabel",
                    "Corporation Representative:",
                  ),
                )}
              </div>

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
                      questionRequired={question.required}
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
                      questionRequired={question.required}
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
                        <div className="relative inline-block">
                          <Label className="mb-1 block text-sm">
                            {getSubQuestionLabel(
                              uiConfig,
                              "corporationNameLabel",
                              "Corporation Name:",
                            )}
                          </Label>
                          {renderLabelOverlay(
                            "corporationNameLabel",
                            getSubQuestionLabel(
                              uiConfig,
                              "corporationNameLabel",
                              "Corporation Name:",
                            ),
                          )}
                        </div>
                        <div className="relative max-w-md">
                          <Input
                            type="text"
                            placeholder={getSubQuestionPlaceholder(
                              uiConfig,
                              "corporationNamePlaceholder",
                              "Enter corporation name",
                            )}
                            disabled={disabled}
                            className={cn(
                              editingMode && "cursor-not-allowed",
                              "w-full",
                            )}
                            style={getInputStyle()}
                            value={
                              editingMode
                                ? ""
                                : nameOfPurchaserValue[
                                    `corporationName_${num}`
                                  ] || ""
                            }
                            onChange={(e) => {
                              if (!editingMode) {
                                const newName = e.target.value
                                updateNameOfPurchaserData({
                                  [`corporationName_${num}`]: newName,
                                })
                              }
                            }}
                            onBlur={onBlur}
                            data-field-id={`${question.id}_corporationName_${num}`}
                          />
                          {renderEditOverlay(
                            "corporationNamePlaceholder",
                            getSubQuestionPlaceholder(
                              uiConfig,
                              "corporationNamePlaceholder",
                              "Enter corporation name",
                            ),
                          )}
                        </div>
                      </div>
                      <div className="relative inline-block">
                        <h5 className="text-sm font-medium">
                          {getSubQuestionLabel(
                            uiConfig,
                            "corporationRepresentativeLabel",
                            "Corporation Representative:",
                          )}
                        </h5>
                        {renderLabelOverlay(
                          "corporationRepresentativeLabel",
                          getSubQuestionLabel(
                            uiConfig,
                            "corporationRepresentativeLabel",
                            "Corporation Representative:",
                          ),
                        )}
                      </div>
                      <PersonNameFields
                        prefix={`other-corp-${num}-rep`}
                        questionId={question.id}
                        nameFields={nameFields}
                        setNameFields={handleNameFieldsChange}
                        fileUploads={fileUploads}
                        setFileUploads={setFileUploads}
                        collectMiddleNames={collectMiddleNames}
                        collectId={collectId}
                        questionRequired={question.required}
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
    const fileDataRaw = fileUploads[`${question.id}_purchase_agreement`]
    const fileData =
      fileDataRaw && "files" in fileDataRaw
        ? fileDataRaw
        : fileDataRaw && "file" in fileDataRaw
          ? {
              files: fileDataRaw.file ? [fileDataRaw.file] : [],
              fileNames: fileDataRaw.fileName ? [fileDataRaw.fileName] : [],
              error: fileDataRaw.error,
            }
          : { files: [], fileNames: [], error: undefined }

    return (
      <div>
        <div className="space-y-2">
          <input
            type="file"
            id={`${question.id}_purchase_agreement_file`}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={disabled}
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              const fileKey = `${question.id}_purchase_agreement`
              const fileError = validateMultipleFiles(
                files,
                3,
                10 * 1024 * 1024,
              )
              setFileUploads((prev) => ({
                ...prev,
                [fileKey]: {
                  files,
                  fileNames: files.map((f) => f.name),
                  error: fileError || undefined,
                },
              }))
              if (!fileError && files.length > 0) {
                onChange?.(files.length === 1 ? files[0] : files)
              } else if (files.length === 0) {
                onChange?.(null)
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
          {fileData.fileNames.length > 0 && (
            <div className="space-y-2">
              {fileData.fileNames.map((fileName, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = [...fileData.files]
                      const newFileNames = [...fileData.fileNames]
                      newFiles.splice(index, 1)
                      newFileNames.splice(index, 1)
                      const fileKey = `${question.id}_purchase_agreement`
                      setFileUploads((prev) => ({
                        ...prev,
                        [fileKey]:
                          newFiles.length > 0
                            ? {
                                files: newFiles,
                                fileNames: newFileNames,
                                error: undefined,
                              }
                            : {
                                files: [],
                                fileNames: [],
                                error: undefined,
                              },
                      }))
                      if (newFiles.length > 0) {
                        onChange?.(
                          newFiles.length === 1 ? newFiles[0] : newFiles,
                        )
                      } else {
                        onChange?.(null)
                        const fileInput = document.getElementById(
                          `${question.id}_purchase_agreement_file`,
                        ) as HTMLInputElement
                        if (fileInput) {
                          fileInput.value = ""
                        }
                      }
                    }}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-gray-600">{fileName}</p>
                </div>
              ))}
            </div>
          )}
          <span className="text-xs text-gray-500">
            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 3 files, 10MB
            total)
          </span>
        </div>
        {renderError(fileData.error || error)}
      </div>
    )
  }

  // Offer Expiry - Use DatePicker and TimePicker
  if (question.type === "offerExpiry") {
    const expiryValue =
      (value as {
        hasExpiry?: string
        expiryDate?: Date
        expiryTime?: string
      }) || {}
    const hasExpiry = expiryValue.hasExpiry === "yes"

    return (
      <div className="space-y-3">
        {/* Always show radio buttons */}
        <RadioGroup
          value={expiryValue.hasExpiry || ""}
          onValueChange={(val) => {
            // Allow selection in form builder too
            onChange?.({ ...expiryValue, hasExpiry: val })
          }}
          disabled={disabled}
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

        {/* Show date/time pickers only when "Yes" is selected */}
        {hasExpiry && (
          <div className="flex max-w-md gap-2">
            <div className="min-w-0 flex-1">
              <DatePicker
                label={uiConfig.dateLabel || "Select date"}
                value={expiryValue.expiryDate}
                onChange={(date) => {
                  // Allow selection in form builder too
                  onChange?.({ ...expiryValue, expiryDate: date })
                }}
                disabled={disabled}
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
                  // Allow selection in form builder too
                  onChange?.({ ...expiryValue, expiryTime: time })
                }}
                disabled={disabled}
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
              {getSubQuestionLabel(
                uiConfig,
                "loanApprovalQuestionLabel",
                "Is your Offer subject to Loan Approval?",
              )}
              <span className="font-bold text-red-500"> *</span>
            </Label>
            {renderLabelOverlay(
              "loanApprovalQuestionLabel",
              getSubQuestionLabel(
                uiConfig,
                "loanApprovalQuestionLabel",
                "Is your Offer subject to Loan Approval?",
              ),
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
                    {getSubQuestionLabel(
                      uiConfig,
                      "supportingDocumentsLabel",
                      "Supporting Documents:",
                    )}
                    {question.required && isSubjectToLoan && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </Label>
                  {renderLabelOverlay(
                    "supportingDocumentsLabel",
                    getSubQuestionLabel(
                      uiConfig,
                      "supportingDocumentsLabel",
                      "Supporting Documents:",
                    ),
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
                      const fileError = validateMultipleFiles(
                        files,
                        3,
                        10 * 1024 * 1024,
                      )
                      const fileKey = `${question.id}_supporting_docs`
                      setFileUploads((prev) => ({
                        ...prev,
                        [fileKey]: {
                          files,
                          fileNames: files.map((f) => f.name),
                          error: fileError || undefined,
                        },
                      }))
                      if (!fileError && files.length > 0) {
                        // Store files in the loanValue object for validation
                        onChange?.({ ...loanValue, supportingDocs: files })
                      } else if (files.length === 0) {
                        onChange?.({ ...loanValue, supportingDocs: null })
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
                  {(() => {
                    const fileDataRaw =
                      fileUploads[`${question.id}_supporting_docs`]
                    const fileData =
                      fileDataRaw && "files" in fileDataRaw
                        ? fileDataRaw
                        : fileDataRaw && "file" in fileDataRaw
                          ? {
                              files: fileDataRaw.file ? [fileDataRaw.file] : [],
                              fileNames: fileDataRaw.fileName
                                ? [fileDataRaw.fileName]
                                : [],
                              error: fileDataRaw.error,
                            }
                          : { files: [], fileNames: [], error: undefined }
                    return (
                      <>
                        {fileData.fileNames.length > 0 && (
                          <div className="space-y-2">
                            {fileData.fileNames.map((fileName, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newFiles = [...fileData.files]
                                    const newFileNames = [...fileData.fileNames]
                                    newFiles.splice(index, 1)
                                    newFileNames.splice(index, 1)
                                    const fileKey = `${question.id}_supporting_docs`
                                    setFileUploads((prev) => ({
                                      ...prev,
                                      [fileKey]:
                                        newFiles.length > 0
                                          ? {
                                              files: newFiles,
                                              fileNames: newFileNames,
                                              error: undefined,
                                            }
                                          : {
                                              files: [],
                                              fileNames: [],
                                              error: undefined,
                                            },
                                    }))
                                    if (newFiles.length > 0) {
                                      onChange?.({
                                        ...loanValue,
                                        supportingDocs: newFiles,
                                      })
                                    } else {
                                      onChange?.({
                                        ...loanValue,
                                        supportingDocs: null,
                                      })
                                      const fileInput = document.getElementById(
                                        `${question.id}_supporting_docs`,
                                      ) as HTMLInputElement
                                      if (fileInput) {
                                        fileInput.value = ""
                                      }
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                  disabled={disabled}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <p className="text-xs text-gray-600">
                                  {fileName}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        {fileData.error && (
                          <p className="mt-1 text-sm text-red-500" role="alert">
                            {fileData.error}
                          </p>
                        )}
                        <span className="text-xs text-gray-500">
                          Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max
                          3 files, 10MB total)
                        </span>
                      </>
                    )
                  })()}
                  {renderError(error)}
                </div>
              </div>
            )}

            {/* Loan Approval Due */}
            {loanApprovalDue && loanApprovalDue !== "no_due_date" && (
              <div>
                <div className="relative inline-block">
                  <Label className="mb-2 block text-sm font-medium">
                    {getSubQuestionLabel(
                      uiConfig,
                      "loanApprovalDueLabel",
                      "Loan Approval Due:",
                    )}{" "}
                    <span className="font-bold text-red-500">*</span>
                  </Label>
                  {renderLabelOverlay(
                    "loanApprovalDueLabel",
                    getSubQuestionLabel(
                      uiConfig,
                      "loanApprovalDueLabel",
                      "Loan Approval Due:",
                    ),
                  )}
                </div>
                <div className="relative max-w-md">
                  <Input
                    type="text"
                    placeholder={getSubQuestionPlaceholder(
                      uiConfig,
                      "loanApprovalDuePlaceholder",
                      "Enter due date details",
                    )}
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
                  {renderEditOverlay(
                    "loanApprovalDuePlaceholder",
                    getSubQuestionPlaceholder(
                      uiConfig,
                      "loanApprovalDuePlaceholder",
                      "Enter due date details",
                    ),
                  )}
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

    // Get current form value - should be an object with selectedConditions and customCondition
    const specialConditionsValueRaw =
      (value as {
        selectedConditions?: number[] | string[]
        customCondition?: string
        conditionAttachments?: Record<number | string, File[]>
      }) || {}

    // Normalize the value to ensure proper types
    const specialConditionsValue = {
      ...specialConditionsValueRaw,
      selectedConditions: Array.isArray(
        specialConditionsValueRaw.selectedConditions,
      )
        ? specialConditionsValueRaw.selectedConditions.map((idx: any) =>
            typeof idx === "string" ? parseInt(idx, 10) : idx,
          )
        : [],
      // Filter out empty objects from conditionAttachments
      conditionAttachments: specialConditionsValueRaw.conditionAttachments
        ? Object.fromEntries(
            Object.entries(
              specialConditionsValueRaw.conditionAttachments,
            ).filter(
              ([_, files]) =>
                Array.isArray(files) &&
                files.length > 0 &&
                files.every((f) => f instanceof File),
            ),
          )
        : {},
    }

    const selectedConditions = specialConditionsValue.selectedConditions || []
    const customCondition = specialConditionsValue.customCondition || ""
    const conditionAttachments =
      specialConditionsValue.conditionAttachments || {}

    // Get file upload state for condition attachments
    const getConditionFileData = (conditionIndex: number) => {
      const fileKey = `${question.id}_condition_${conditionIndex}_attachments`
      const fileDataRaw = fileUploads[fileKey]
      return fileDataRaw && "files" in fileDataRaw
        ? fileDataRaw
        : { files: [], fileNames: [], error: undefined }
    }

    const handleConditionToggle = (
      conditionIndex: number,
      checked: boolean,
    ) => {
      if (editingMode) return

      // Ensure selectedConditions contains numbers, not strings
      const currentSelected = selectedConditions.map((idx) =>
        typeof idx === "string" ? parseInt(idx, 10) : idx,
      )

      const newSelected = checked
        ? [...currentSelected, conditionIndex]
        : currentSelected.filter((idx) => idx !== conditionIndex)

      onChange?.({
        ...specialConditionsValue,
        selectedConditions: newSelected,
      })
    }

    const handleConditionFileUpload = (
      conditionIndex: number,
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      // Validate files (max 3, total 10MB)
      const fileError = validateMultipleFiles(files, 3, 10 * 1024 * 1024)

      const fileKey = `${question.id}_condition_${conditionIndex}_attachments`
      setFileUploads((prev) => ({
        ...prev,
        [fileKey]: {
          files,
          fileNames: files.map((f) => f.name),
          error: fileError || undefined,
        },
      }))

      if (!fileError && files.length > 0) {
        // Ensure we only store actual File objects
        const validFiles = files.filter((f) => f instanceof File)
        if (validFiles.length > 0) {
          // Update form value with files
          onChange?.({
            ...specialConditionsValue,
            conditionAttachments: {
              ...conditionAttachments,
              [conditionIndex]: validFiles,
            },
          })
        }
      }

      // Clear the input
      event.target.value = ""
    }

    const handleRemoveConditionFile = (
      conditionIndex: number,
      fileIndex: number,
    ) => {
      const fileKey = `${question.id}_condition_${conditionIndex}_attachments`
      const fileData = getConditionFileData(conditionIndex)
      const newFiles = [...fileData.files]
      const newFileNames = [...fileData.fileNames]
      newFiles.splice(fileIndex, 1)
      newFileNames.splice(fileIndex, 1)

      setFileUploads((prev) => ({
        ...prev,
        [fileKey]:
          newFiles.length > 0
            ? {
                files: newFiles,
                fileNames: newFileNames,
                error: undefined,
              }
            : {
                files: [],
                fileNames: [],
                error: undefined,
              },
      }))

      // Update form value - ensure only File objects are stored
      const updatedAttachments = { ...conditionAttachments }
      const validFiles = newFiles.filter((f) => f instanceof File)
      if (validFiles.length > 0) {
        updatedAttachments[conditionIndex] = validFiles
      } else {
        delete updatedAttachments[conditionIndex]
      }
      onChange?.({
        ...specialConditionsValue,
        conditionAttachments: updatedAttachments,
      })
    }

    return (
      <div className="space-y-3">
        {conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map((condition, idx) => {
              const isSelected = selectedConditions.includes(idx)
              const fileData = getConditionFileData(idx)
              const hasFiles = fileData.files.length > 0

              return (
                <div key={idx} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleConditionToggle(idx, checked === true)
                      }
                      disabled={disabled}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">
                        {condition.name}
                      </span>
                      {condition.details && (
                        <p className="text-xs text-gray-500">
                          {condition.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* File upload for this condition - always at the bottom (show if selected or in form builder for testing) */}
                  {(isSelected || editingMode) && (
                    <div className="ml-7 space-y-2">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Attachments (optional, max 3 files, 10MB total)
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() =>
                              document
                                .getElementById(
                                  `${question.id}_condition_${idx}_file_input`,
                                )
                                ?.click()
                            }
                            disabled={disabled || editingMode}
                          >
                            <FileText size={14} />
                            Choose files
                          </Button>
                          <input
                            id={`${question.id}_condition_${idx}_file_input`}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                            onChange={(e) => handleConditionFileUpload(idx, e)}
                            className="hidden"
                            disabled={disabled || editingMode}
                            data-field-id={question.id}
                          />
                        </div>

                        {/* Display uploaded files */}
                        {hasFiles && (
                          <div className="space-y-1">
                            {fileData.fileNames.map((fileName, fileIdx) => (
                              <div
                                key={fileIdx}
                                className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText
                                    size={14}
                                    className="text-gray-500"
                                  />
                                  <span className="text-xs text-gray-700">
                                    {fileName}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveConditionFile(idx, fileIdx)
                                  }
                                  disabled={disabled || editingMode}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {fileData.error && (
                          <p className="text-xs text-red-500" role="alert">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
                value={editingMode ? "" : customCondition}
                onChange={(e) => {
                  if (!editingMode) {
                    onChange?.({
                      ...specialConditionsValue,
                      customCondition: e.target.value,
                    })
                  }
                }}
                onBlur={onBlur}
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
                data-field-id={question.id}
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
    const settlementDateConfig = setupConfig.settlement_date_config

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

    // Render custom settlement date section for "Create Your Own" functionality
    const renderCustomSettlementDate = (config: any) => {
      if (!config) return null

      const { timeConstraint, number, timeUnit, action, trigger } = config

      // Helper function to render a section (static text or dropdown)
      const renderSection = (sectionData: string[]) => {
        if (!sectionData || !Array.isArray(sectionData)) return null

        if (sectionData.length === 1) {
          // Single selection - show as static text with proper formatting
          return (
            <span className="font-medium">{formatText(sectionData[0])}</span>
          )
        } else if (sectionData.length > 1) {
          // Multiple selections - show as dropdown
          const sectionValue =
            (formValues.settlementDateCYO as any)?.[
              sectionData === timeConstraint
                ? "timeConstraint"
                : sectionData === number
                  ? "number"
                  : sectionData === timeUnit
                    ? "timeUnit"
                    : sectionData === action
                      ? "action"
                      : "trigger"
            ] || ""

          return (
            <Select
              value={sectionValue}
              onValueChange={(value) => {
                if (!editingMode) {
                  const fieldName =
                    sectionData === timeConstraint
                      ? "timeConstraint"
                      : sectionData === number
                        ? "number"
                        : sectionData === timeUnit
                          ? "timeUnit"
                          : sectionData === action
                            ? "action"
                            : "trigger"
                  const newValues = {
                    ...formValues,
                    settlementDateCYO: {
                      ...((formValues.settlementDateCYO as any) || {}),
                      [fieldName]: value,
                    },
                  }
                  setFormValues(newValues)
                  onChange?.(newValues)
                }
              }}
              disabled={disabled || editingMode}
            >
              <SelectTrigger
                className="w-full max-w-xs"
                style={getInputStyle()}
              >
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
            <div className="space-y-2">
              {settlementDateConfig &&
              Object.keys(settlementDateConfig).length > 0 &&
              Object.values(settlementDateConfig).some(
                (selections) =>
                  Array.isArray(selections) && selections.length > 0,
              ) ? (
                // Render custom settlement date UI based on configuration
                renderCustomSettlementDate(settlementDateConfig)
              ) : (
                // Fallback to simple text input if no configuration
                <div className="relative max-w-md">
                  <Input
                    type="text"
                    placeholder={
                      uiConfig.placeholder || "Enter settlement date"
                    }
                    disabled={disabled}
                    className={cn(
                      editingMode && "cursor-not-allowed",
                      "w-full",
                    )}
                    style={getInputStyle()}
                    value={
                      editingMode ? "" : formValues.settlementDateCYO || ""
                    }
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
    const attachmentDataRaw = fileUploads[`${question.id}_message_attachments`]
    const attachmentData =
      attachmentDataRaw && "files" in attachmentDataRaw
        ? attachmentDataRaw
        : attachmentDataRaw && "file" in attachmentDataRaw
          ? {
              files: attachmentDataRaw.file ? [attachmentDataRaw.file] : [],
              fileNames: attachmentDataRaw.fileName
                ? [attachmentDataRaw.fileName]
                : [],
              error: attachmentDataRaw.error,
            }
          : { files: [], fileNames: [], error: undefined }

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
                const fileError = validateMultipleFiles(
                  files,
                  3,
                  10 * 1024 * 1024,
                )
                setFileUploads((prev) => ({
                  ...prev,
                  [`${question.id}_message_attachments`]: {
                    files,
                    fileNames: files.map((f) => f.name),
                    error: fileError || undefined,
                  },
                }))
                if (!fileError && files.length > 0) {
                  // Store files separately from message text
                  const currentMessage =
                    typeof value === "string" ? value : value?.message || ""
                  onChange?.({ message: currentMessage, attachments: files })
                } else if (files.length === 0) {
                  const currentMessage =
                    typeof value === "string" ? value : value?.message || ""
                  onChange?.(
                    currentMessage
                      ? currentMessage
                      : { message: "", attachments: [] },
                  )
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
            {attachmentData.fileNames.length > 0 && (
              <div className="space-y-2">
                {attachmentData.fileNames.map((fileName, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFiles = [...attachmentData.files]
                        const newFileNames = [...attachmentData.fileNames]
                        newFiles.splice(index, 1)
                        newFileNames.splice(index, 1)
                        setFileUploads((prev) => ({
                          ...prev,
                          [`${question.id}_message_attachments`]:
                            newFiles.length > 0
                              ? {
                                  files: newFiles,
                                  fileNames: newFileNames,
                                  error: undefined,
                                }
                              : {
                                  files: [],
                                  fileNames: [],
                                  error: undefined,
                                },
                        }))
                        // Update attachments in value
                        const currentMessage =
                          typeof value === "string"
                            ? value
                            : value?.message || ""
                        if (newFiles.length > 0) {
                          onChange?.({
                            message: currentMessage,
                            attachments: newFiles,
                          })
                        } else {
                          onChange?.(
                            currentMessage
                              ? currentMessage
                              : { message: "", attachments: [] },
                          )
                          const fileInput = document.getElementById(
                            `${question.id}_message_attachments`,
                          ) as HTMLInputElement
                          if (fileInput) {
                            fileInput.value = ""
                          }
                        }
                      }}
                      className="h-8 w-8 p-0"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-gray-600">{fileName}</p>
                  </div>
                ))}
              </div>
            )}
            {attachmentData.error && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {attachmentData.error}
              </p>
            )}
            <span className="text-xs text-gray-500">
              Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 3 files,
              10MB total)
            </span>
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
    const phoneValue = editingMode
      ? ""
      : typeof value === "object" && value !== null && "countryCode" in value
        ? value
        : (value as string) || { countryCode: "+1", number: "" }

    return (
      <div>
        <div className="relative flex max-w-md items-center gap-2">
          <PhoneInput
            value={phoneValue}
            onChange={(newValue) => {
              // Allow changes in editing mode for preview (similar to offerAmount)
              onChange?.(newValue)
            }}
            onBlur={onBlur}
            disabled={disabled}
            editingMode={editingMode}
            placeholder={uiConfig.placeholder || "555-123-4567"}
            className={cn(editingMode && "cursor-not-allowed", "w-full")}
            style={getInputStyle()}
            data-field-id={question.id}
          />
          {/* Edit overlay only covers the phone number input part, not the country code dropdown */}
          {/* Country code dropdown is 100px + gap-2 (8px) = 108px from left */}
          {editingMode && onEditPlaceholder && (
            <div
              className="absolute top-0 right-0 bottom-0 left-[108px] z-20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onEditPlaceholder(
                  "placeholder",
                  uiConfig.placeholder || "Enter your phone number",
                )
              }}
              title="Click to edit placeholder"
            />
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
              placeholder={getSubQuestionPlaceholder(
                uiConfig,
                "placeholder",
                "Enter text...",
              )}
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
              getSubQuestionPlaceholder(
                uiConfig,
                "placeholder",
                "Enter text...",
              ),
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
        const currencyStip = setupConfig.currency_stipulation || "any"
        // Handle both array format (new) and comma-separated string (legacy)
        let currencyOptions: string[] = []
        if (setupConfig.currency_options) {
          if (Array.isArray(setupConfig.currency_options)) {
            // New format: array of objects with value/label
            currencyOptions = setupConfig.currency_options
              .map((opt: any) => {
                if (typeof opt === "string") return opt
                return opt?.value || opt
              })
              .filter((c: string) => c && c.trim() !== "")
          } else if (typeof setupConfig.currency_options === "string") {
            // Legacy format: comma-separated string
            currencyOptions = setupConfig.currency_options
              .split(",")
              .map((c: string) => c.trim())
              .filter((c: string) => c !== "")
          }
        }
        const fixedCurrency = setupConfig.currency_fixed || "USD"

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

        // Check if we should show multiple currency/amount pairs (when options mode with 2+ currencies)
        // Disable multiple pairs mode for custom questions - they should show single currency selector
        const showMultiplePairs = false

        // Parse current value - use formValues for builder preview, value prop for actual form
        const displayValue = editingMode && !onChange ? formValues : value

        // Initialize amounts array for multiple pairs mode
        let amountsArray: Array<{ amount: string | number; currency: string }> =
          []
        if (showMultiplePairs) {
          if (Array.isArray(displayValue)) {
            amountsArray = displayValue.map((item) => ({
              amount: item?.amount !== undefined ? item.amount : "",
              currency: item?.currency || currencyOptions[0] || "USD",
            }))
          } else if (
            typeof displayValue === "object" &&
            displayValue !== null &&
            !Array.isArray(displayValue)
          ) {
            // Single object - convert to array
            amountsArray = [
              {
                amount:
                  (displayValue as any).amount !== undefined
                    ? (displayValue as any).amount
                    : "",
                currency:
                  (displayValue as any).currency || currencyOptions[0] || "USD",
              },
            ]
          } else {
            // Initialize with one empty pair
            amountsArray = [
              {
                amount: "",
                currency: currencyOptions[0] || "USD",
              },
            ]
          }
        }

        // For single pair mode, parse current value
        let currentAmount: string | number = ""
        let currentCurrency = "USD" // Default to USD

        if (!showMultiplePairs) {
          if (typeof displayValue === "object" && displayValue !== null) {
            currentAmount =
              (displayValue as any).amount !== undefined
                ? (displayValue as any).amount
                : ""
            // Use currency from value if provided, otherwise keep USD default
            if ((displayValue as any).currency) {
              currentCurrency = (displayValue as any).currency
            }
          } else {
            currentAmount =
              displayValue !== undefined && displayValue !== null
                ? displayValue
                : ""
            // Default currency logic if not set
            if (currencyStip === "fixed") {
              currentCurrency = fixedCurrency
            } else if (
              currencyStip === "options" &&
              currencyOptions.length > 0
            ) {
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
            currencyStip === "options" &&
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
        }

        const handleAmountChange = (val: string, index?: number) => {
          if (showMultiplePairs && index !== undefined) {
            const num = val === "" ? "" : Number(val)
            const newAmounts = [...amountsArray]
            newAmounts[index] = {
              ...newAmounts[index],
              amount: num,
            }

            if (editingMode && !onChange) {
              setFormValues(newAmounts)
            } else {
              onChange?.(newAmounts)
            }
          } else {
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
        }

        const handleCurrencyChange = (val: string, index?: number) => {
          if (showMultiplePairs && index !== undefined) {
            const newAmounts = [...amountsArray]
            newAmounts[index] = {
              ...newAmounts[index],
              currency: val,
            }

            if (editingMode && !onChange) {
              setFormValues(newAmounts)
            } else {
              onChange?.(newAmounts)
            }
          } else {
            // Get the current amount from formData or formValues
            const currentAmountValue =
              editingMode && !onChange
                ? formValues.amount !== undefined
                  ? formValues.amount
                  : currentAmount
                : typeof value === "object" && value !== null
                  ? (value as any).amount
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
        }

        const handleAddAnother = () => {
          const defaultCurrency = currencyOptions[0] || "USD"
          const newAmounts = [
            ...amountsArray,
            { amount: "", currency: defaultCurrency },
          ]

          if (editingMode && !onChange) {
            setFormValues(newAmounts)
          } else {
            onChange?.(newAmounts)
          }
        }

        const handleRemovePair = (index: number) => {
          const newAmounts = amountsArray.filter((_, i) => i !== index)

          if (editingMode && !onChange) {
            setFormValues(newAmounts)
          } else {
            onChange?.(newAmounts)
          }
        }

        // Render multiple currency/amount pairs
        if (showMultiplePairs) {
          return (
            <div className="space-y-3">
              {amountsArray.map((pair, index) => (
                <div key={index} className="flex gap-2">
                  {/* Currency Selector */}
                  <Select
                    value={pair.currency}
                    onValueChange={(val) => {
                      if (!editingMode) {
                        handleCurrencyChange(val, index)
                      }
                    }}
                    disabled={disabled || editingMode}
                  >
                    <SelectTrigger
                      className="w-full max-w-xs"
                      style={getSelectStyle()}
                    >
                      <SelectValue placeholder="Curr" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((c: string) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Amount Input */}
                  <div className="relative max-w-md flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={getSubQuestionPlaceholder(
                        uiConfig,
                        "amountPlaceholder",
                        "Enter amount",
                      )}
                      disabled={disabled || editingMode}
                      className={cn(
                        editingMode && "cursor-not-allowed",
                        "w-full",
                      )}
                      style={getInputStyle()}
                      value={editingMode ? "" : pair.amount}
                      onChange={(e) => {
                        if (!editingMode) {
                          // Prevent "e", "E", "+", "-" characters
                          const val = e.target.value.replace(/[eE\+\-]/g, "")
                          handleAmountChange(val, index)
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent "e", "E", "+", "-" keys
                        if (
                          e.key === "e" ||
                          e.key === "E" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault()
                        }
                      }}
                      onBlur={onBlur}
                      data-field-id={`${question.id}_${index}`}
                    />
                    {editingMode &&
                      onEditPlaceholder &&
                      renderEditOverlay(
                        "amountPlaceholder",
                        getSubQuestionPlaceholder(
                          uiConfig,
                          "amountPlaceholder",
                          "Enter amount",
                        ),
                      )}
                  </div>

                  {/* Remove button (only show if more than 1 pair) */}
                  {amountsArray.length > 1 && !editingMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePair(index)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              {/* Add Another button */}
              {!editingMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAnother}
                  disabled={disabled}
                  className="mt-2"
                >
                  Add another Currency
                </Button>
              )}

              {renderError(error)}
            </div>
          )
        }

        // Render single currency/amount pair
        return (
          <div>
            <div className="flex gap-2">
              {/* Currency Selector */}
              {(currencyStip === "options" || currencyStip === "any") && (
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
                    {currencyStip === "options"
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

              {/* Amount Input */}
              <div className="relative max-w-md flex-1">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={getSubQuestionPlaceholder(
                    uiConfig,
                    "amountPlaceholder",
                    "Enter amount",
                  )}
                  disabled={disabled}
                  className={cn(
                    editingMode && "cursor-not-allowed",
                    "w-full",
                    currencyStip === "fixed" && "pr-12", // Add padding for currency decorator
                  )}
                  style={getInputStyle()}
                  value={editingMode ? "" : currentAmount}
                  onChange={(e) => {
                    if (!editingMode) {
                      // Prevent "e", "E", "+", "-" characters (scientific notation and signs)
                      const val = e.target.value.replace(/[eE\+\-]/g, "")
                      handleAmountChange(val)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent "e", "E", "+", "-" keys
                    if (
                      e.key === "e" ||
                      e.key === "E" ||
                      e.key === "+" ||
                      e.key === "-"
                    ) {
                      e.preventDefault()
                    }
                  }}
                  onBlur={onBlur}
                  data-field-id={question.id}
                />
                {/* Currency decorator for fixed mode */}
                {currencyStip === "fixed" && (
                  <div className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-sm font-medium text-gray-500">
                    {fixedCurrency}
                  </div>
                )}
                {/* Edit overlay - adjust right padding for fixed currency mode */}
                {currencyStip === "fixed" &&
                editingMode &&
                onEditPlaceholder ? (
                  <div
                    className="absolute inset-0 right-12 z-20 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditPlaceholder(
                        "amountPlaceholder",
                        getSubQuestionPlaceholder(
                          uiConfig,
                          "amountPlaceholder",
                          "Enter amount",
                        ),
                      )
                    }}
                    title="Click to edit placeholder"
                  />
                ) : (
                  renderEditOverlay(
                    "amountPlaceholder",
                    getSubQuestionPlaceholder(
                      uiConfig,
                      "amountPlaceholder",
                      "Enter amount",
                    ),
                  )
                )}
              </div>
            </div>
            {renderError(error)}
          </div>
        )
      } else if (numberType === "phone") {
        // Handle both string (legacy) and object (new format) values
        const phoneValue = editingMode
          ? ""
          : typeof value === "object" &&
              value !== null &&
              "countryCode" in value
            ? value
            : (value as string) || { countryCode: "+1", number: "" }

        return (
          <div>
            <div className="relative flex max-w-md items-center gap-2">
              <PhoneInput
                value={phoneValue}
                onChange={(newValue) => {
                  // Allow changes in editing mode for preview (similar to offerAmount)
                  onChange?.(newValue)
                }}
                onBlur={onBlur}
                disabled={disabled}
                editingMode={editingMode}
                placeholder={uiConfig.phonePlaceholder || "555-123-4567"}
                className={cn(editingMode && "cursor-not-allowed", "w-full")}
                style={getInputStyle()}
                data-field-id={question.id}
              />
              {/* Edit overlay only covers the phone number input part, not the country code dropdown */}
              {/* Country code dropdown is 100px + gap-2 (8px) = 108px from left */}
              {editingMode && onEditPlaceholder && (
                <div
                  className="absolute top-0 right-0 bottom-0 left-[108px] z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditPlaceholder(
                      "phonePlaceholder",
                      uiConfig.phonePlaceholder || "Enter your phone number",
                    )
                  }}
                  title="Click to edit placeholder"
                />
              )}
            </div>
            {renderError(error)}
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
      const fileDataRaw = fileUploads[`${question.id}_file`]
      const fileData =
        fileDataRaw && "files" in fileDataRaw
          ? fileDataRaw
          : fileDataRaw && "file" in fileDataRaw
            ? {
                files: fileDataRaw.file ? [fileDataRaw.file] : [],
                fileNames: fileDataRaw.fileName ? [fileDataRaw.fileName] : [],
                error: fileDataRaw.error,
              }
            : { files: [], fileNames: [], error: undefined }

      return (
        <div className="space-y-2">
          <input
            type="file"
            id={`${question.id}_file_input`}
            className="hidden"
            disabled={disabled}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              const fileKey = `${question.id}_file`
              const fileError = validateMultipleFiles(
                files,
                3,
                10 * 1024 * 1024,
              )
              setFileUploads((prev) => ({
                ...prev,
                [fileKey]: {
                  files,
                  fileNames: files.map((f) => f.name),
                  error: fileError || undefined,
                },
              }))
              if (!fileError && files.length > 0) {
                onChange?.(files.length === 1 ? files[0] : files)
              } else if (files.length === 0) {
                onChange?.(null)
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
          {fileData.fileNames.length > 0 && (
            <div className="space-y-2">
              {fileData.fileNames.map((fileName, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = [...fileData.files]
                      const newFileNames = [...fileData.fileNames]
                      newFiles.splice(index, 1)
                      newFileNames.splice(index, 1)
                      const fileKey = `${question.id}_file`
                      setFileUploads((prev) => ({
                        ...prev,
                        [fileKey]:
                          newFiles.length > 0
                            ? {
                                files: newFiles,
                                fileNames: newFileNames,
                                error: undefined,
                              }
                            : {
                                files: [],
                                fileNames: [],
                                error: undefined,
                              },
                      }))
                      if (newFiles.length > 0) {
                        onChange?.(
                          newFiles.length === 1 ? newFiles[0] : newFiles,
                        )
                      } else {
                        onChange?.(null)
                        const fileInput = document.getElementById(
                          `${question.id}_file_input`,
                        ) as HTMLInputElement
                        if (fileInput) {
                          fileInput.value = ""
                        }
                      }
                    }}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-gray-600">{fileName}</p>
                </div>
              ))}
            </div>
          )}
          <span className="text-xs text-gray-500">
            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 3 files, 10MB
            total)
          </span>
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
          <div className="flex max-w-md items-center gap-3">
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
      // Handle both array format (new) and comma-separated string (legacy)
      let options: string[] = []
      if (setupConfig.select_options) {
        if (Array.isArray(setupConfig.select_options)) {
          // New format: array of strings
          options = setupConfig.select_options.filter(
            (opt: string) => opt && opt.trim() !== "",
          )
        } else if (typeof setupConfig.select_options === "string") {
          // Legacy format: comma-separated string
          options = setupConfig.select_options
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt.length > 0)
        }
      }
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
      // Handle both array format (new) and comma-separated string (legacy)
      let options: string[] = []
      if (setupConfig.select_options) {
        if (Array.isArray(setupConfig.select_options)) {
          // New format: array of strings
          options = setupConfig.select_options.filter(
            (opt: string) => opt && opt.trim() !== "",
          )
        } else if (typeof setupConfig.select_options === "string") {
          // Legacy format: comma-separated string
          options = setupConfig.select_options
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt.length > 0)
        }
      }
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
      const tickboxMode = setupConfig.add_tickbox || "no"
      const showTickbox =
        tickboxMode === "required" || tickboxMode === "optional"
      // Only disable checkbox in editing mode, not in form preview/user-facing form
      const tickboxDisabled = editingMode || !showTickbox
      // Determine if checkbox is required based on tickbox mode and question required status
      // If question is not required, make tickbox optional even if it was set to required
      const isRequired =
        tickboxMode === "required" && question.required !== false
      const isOptional = tickboxMode === "optional" || !question.required

      return (
        <div className="space-y-2">
          {/* Statement text is shown as the main label in QuestionCard when no tickbox */}
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
          {/* When no tickbox, statement text is shown as main label in QuestionCard, so nothing to render here */}
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
          <div className="relative flex max-w-md items-center gap-2">
            <PhoneInput
              value={phoneValue}
              onChange={(newValue) => {
                // Allow changes in editing mode for preview (similar to offerAmount)
                onChange?.(newValue)
              }}
              onBlur={onBlur}
              disabled={disabled}
              editingMode={editingMode}
              placeholder={uiConfig.placeholder || "555-123-4567"}
              className={cn(editingMode && "cursor-not-allowed", "w-full")}
              style={getInputStyle()}
              data-field-id={question.id}
            />
            {/* Edit overlay only covers the phone number input part, not the country code dropdown */}
            {/* Country code dropdown is 100px + gap-2 (8px) = 108px from left */}
            {editingMode && onEditPlaceholder && (
              <div
                className="absolute top-0 right-0 bottom-0 left-[108px] z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditPlaceholder(
                    "placeholder",
                    uiConfig.placeholder || "Enter your phone number",
                  )
                }}
                title="Click to edit placeholder"
              />
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
