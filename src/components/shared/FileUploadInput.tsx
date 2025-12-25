"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { ReactNode } from "react"

interface FileUploadInputProps {
  id: string
  label: string
  required?: boolean
  accept?: string
  multiple?: boolean
  disabled?: boolean
  value?: File | File[] | null
  fileNames?: string[]
  error?: string
  onChange: (files: File | File[] | null) => void
  onRemove?: (index?: number) => void
  maxFiles?: number
  maxSize?: number // in bytes
  className?: string
  showFileList?: boolean
  children?: ReactNode
}

export function FileUploadInput({
  id,
  label,
  required = false,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = false,
  disabled = false,
  value,
  fileNames,
  error,
  onChange,
  onRemove,
  maxFiles,
  maxSize,
  className,
  showFileList = true,
  children,
}: FileUploadInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      onChange(null)
      return
    }

    // Validate file count
    if (maxFiles && files.length > maxFiles) {
      // This will be handled by the parent component's validation
      onChange(multiple ? files : files[0])
      return
    }

    // Validate file sizes
    if (maxSize) {
      const invalidFiles = files.filter((file) => file.size > maxSize)
      if (invalidFiles.length > 0) {
        // This will be handled by the parent component's validation
        onChange(multiple ? files : files[0])
        return
      }
    }

    onChange(multiple ? files : files[0])
  }

  const handleRemove = (index?: number) => {
    if (onRemove) {
      onRemove(index)
    } else {
      // Default remove behavior
      if (multiple && Array.isArray(value)) {
        const newFiles = [...value]
        if (index !== undefined) {
          newFiles.splice(index, 1)
          onChange(newFiles.length > 0 ? newFiles : null)
        } else {
          onChange(null)
        }
      } else {
        onChange(null)
        const fileInput = document.getElementById(id) as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
      }
    }
  }

  const hasFiles = () => {
    if (fileNames && fileNames.length > 0) return true
    if (value) {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return true
    }
    return false
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-2">
        {/* Only render label if it's not empty */}
        {label && label.trim() !== "" && (
          <Label htmlFor={id} className="text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </Label>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            id={id}
            className="hidden"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={handleFileChange}
          />
          <label
            htmlFor={id}
            className={cn(
              "border-input cursor-pointer rounded-md border bg-transparent px-3 py-1.5 text-sm font-medium text-gray-900 shadow-2xs transition-colors",
              disabled && "cursor-not-allowed opacity-50",
              !disabled && "hover:bg-gray-50",
            )}
          >
            Choose file
          </label>
        </div>
      </div>

      {showFileList && hasFiles() && (
        <div className="space-y-2">
          {fileNames && fileNames.length > 0 ? (
            fileNames.map((fileName, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-600">{fileName}</p>
              </div>
            ))
          ) : value && !Array.isArray(value) ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove()}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="text-xs text-gray-600">{value.name}</p>
            </div>
          ) : value && Array.isArray(value) ? (
            value.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-600">{file.name}</p>
              </div>
            ))
          ) : null}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {children}
    </div>
  )
}
