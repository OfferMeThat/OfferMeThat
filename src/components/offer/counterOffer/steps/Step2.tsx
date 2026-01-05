import { validateMultipleFiles } from "@/lib/offerFormValidation"
import { ArrowRight, ExternalLink, Trash2 } from "lucide-react"
import { useState } from "react"
import { FileUploadInput } from "../../../shared/FileUploadInput"
import { Button } from "../../../ui/button"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"

type FormValues = Record<string, any>

interface Step2Props {
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
}

const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split("/").pop() || url
    return fileName
  } catch {
    const parts = url.split("/")
    return parts[parts.length - 1] || url
  }
}

const parseFileValue = (value: any): string[] => {
  if (!value) return []

  let parsedValue = value

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value)
    } catch {
      parsedValue = value
    }
  }

  if (typeof parsedValue === "string") {
    const cleanUrl = parsedValue.replace(/^\[|\]$/g, "").replace(/^"|"$/g, "")
    return cleanUrl ? [cleanUrl] : []
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue
      .map((v) => {
        if (typeof v === "string") {
          return v.replace(/^\[|\]$/g, "").replace(/^"|"$/g, "")
        }
        return v
      })
      .filter((v) => v && typeof v === "string")
  }

  return []
}

export const Step2 = ({
  originalFormValues,
  counterFormValues,
  renderField,
  handleCopyValue,
  handleRemoveValue,
  handleValueChange,
}: Step2Props) => {
  const originalFileUrls = parseFileValue(
    originalFormValues.purchaseAgreementFile,
  )
  const [counterFiles, setCounterFiles] = useState<File[]>([])
  const [counterFileNames, setCounterFileNames] = useState<string[]>([])
  const [fileError, setFileError] = useState<string | undefined>(undefined)

  const handleFileChange = (files: File | File[] | null) => {
    const newFiles = Array.isArray(files) ? files : files ? [files] : []

    const existingFiles = counterFiles

    const mergedFiles = [...newFiles, ...existingFiles]

    const maxFiles = 5
    const finalFiles =
      mergedFiles.length > maxFiles
        ? mergedFiles.slice(0, maxFiles)
        : mergedFiles

    const error = validateMultipleFiles(finalFiles, maxFiles, 10 * 1024 * 1024)

    setCounterFiles(finalFiles)
    setCounterFileNames(finalFiles.map((f) => f.name))
    setFileError(error || undefined)

    if (!error && finalFiles.length > 0) {
      const objectUrls = finalFiles.map((file) => URL.createObjectURL(file))
      handleValueChange(
        "purchaseAgreementFile",
        objectUrls.length === 1 ? objectUrls[0] : objectUrls,
      )
    } else if (finalFiles.length === 0) {
      handleValueChange("purchaseAgreementFile", null)
    }
  }

  const handleFileRemove = (index: number | undefined) => {
    const newFiles = [...counterFiles]
    const newFileNames = [...counterFileNames]

    if (index !== undefined) {
      newFiles.splice(index, 1)
      newFileNames.splice(index, 1)
    } else {
      newFiles.length = 0
      newFileNames.length = 0
    }

    setCounterFiles(newFiles)
    setCounterFileNames(newFileNames)
    setFileError(undefined)

    if (newFiles.length > 0) {
      const objectUrls = newFiles.map((file) => URL.createObjectURL(file))
      handleValueChange(
        "purchaseAgreementFile",
        objectUrls.length === 1 ? objectUrls[0] : objectUrls,
      )
    } else {
      handleValueChange("purchaseAgreementFile", null)
      const fileInput = document.getElementById(
        "counter-offer-pdf-upload",
      ) as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
    }
  }

  const hasCounterFiles = counterFiles.length > 0

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-6 md:space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Label className="text-sm font-medium text-gray-700">
            PDF Attachment
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4">
          <div className="flex w-full items-start gap-2">
            {originalFileUrls.length > 0 ? (
              <div className="flex w-full flex-wrap gap-2">
                {originalFileUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between gap-2 truncate rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span className="truncate">{getFileNameFromUrl(url)}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                N/A
              </div>
            )}
          </div>
          <div className="flex justify-center pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rotate-90 p-0 md:rotate-0"
              onClick={() => handleCopyValue("purchaseAgreementFile")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <FileUploadInput
                id="counter-offer-pdf-upload"
                label=""
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                value={counterFiles}
                fileNames={counterFileNames}
                error={fileError}
                onChange={handleFileChange}
                onRemove={handleFileRemove}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                showFileList={true}
              >
                <span className="text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5 files,
                  10MB total)
                </span>
              </FileUploadInput>
            </div>
            {hasCounterFiles && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 shrink-0 px-2 text-red-600 hover:text-red-700"
                onClick={() => {
                  handleFileRemove(undefined)
                  handleRemoveValue("purchaseAgreementFile")
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {renderField(
        "Offer Amount",
        "offerAmount",
        (value, onChange) => (
          <div className="space-y-2">
            <Input
              type="number"
              value={value?.amount || 0}
              onChange={(e) =>
                onChange({
                  ...value,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              className="w-full"
            />
            <Input
              value={value?.currency || "USD"}
              onChange={(e) =>
                onChange({
                  ...value,
                  currency: e.target.value,
                })
              }
              placeholder="USD"
              className="w-full"
            />
          </div>
        ),
        (value) => {
          if (!value) return "N/A"
          const amount = value.amount || 0
          const currency = value.currency || "USD"
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount)
        },
        originalFormValues.offerAmount,
        counterFormValues.offerAmount,
      )}
    </div>
  )
}
