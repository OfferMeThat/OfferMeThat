"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

type PhoneInputProps = {
  value: string | { countryCode: string; number: string }
  onChange: (value: { countryCode: string; number: string }) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  onBlur?: () => void
  editingMode?: boolean
} & Omit<React.ComponentProps<"input">, "value" | "onChange">

// Common country codes for the dropdown
const COUNTRY_CODES = [
  { value: "+1", label: "+1" },
  { value: "+44", label: "+44" },
  { value: "+61", label: "+61" },
  { value: "+64", label: "+64" },
  { value: "+27", label: "+27" },
  { value: "+33", label: "+33" },
  { value: "+49", label: "+49" },
  { value: "+39", label: "+39" },
  { value: "+34", label: "+34" },
  { value: "+31", label: "+31" },
  { value: "+32", label: "+32" },
  { value: "+41", label: "+41" },
  { value: "+43", label: "+43" },
  { value: "+45", label: "+45" },
  { value: "+46", label: "+46" },
  { value: "+47", label: "+47" },
  { value: "+48", label: "+48" },
  { value: "+351", label: "+351" },
  { value: "+353", label: "+353" },
  { value: "+358", label: "+358" },
  { value: "+7", label: "+7" },
  { value: "+81", label: "+81" },
  { value: "+82", label: "+82" },
  { value: "+86", label: "+86" },
  { value: "+91", label: "+91" },
  { value: "+65", label: "+65" },
  { value: "+852", label: "+852" },
  { value: "+971", label: "+971" },
  { value: "+966", label: "+966" },
  { value: "+20", label: "+20" },
  { value: "+234", label: "+234" },
  { value: "+254", label: "+254" },
  { value: "+55", label: "+55" },
  { value: "+52", label: "+52" },
  { value: "+54", label: "+54" },
  { value: "+56", label: "+56" },
  { value: "+57", label: "+57" },
  { value: "+51", label: "+51" },
]

// Helper to check if a country code exists in our list
const isValidCountryCode = (code: string): boolean => {
  return COUNTRY_CODES.some((c) => c.value === code)
}

// Parse phone number to extract country code and number
// This function tries to match against actual country codes in our list
const parsePhoneNumber = (
  phone: string,
): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: "+1", number: "" }

  // If phone starts with +, try to match against known country codes
  if (phone.startsWith("+")) {
    // Sort country codes by length (longest first) to match longer codes first
    // e.g., +351 should match before +3
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.value.length - a.value.length,
    )

    // Try to find a matching country code
    for (const code of sortedCodes) {
      if (phone.startsWith(code.value)) {
        // Found a match - extract the number part
        const number = phone.slice(code.value.length).trim()
        return {
          countryCode: code.value,
          number: number,
        }
      }
    }

    // If no exact match found, try to extract a reasonable country code
    // Try to match longer codes first (up to 4 digits after +)
    for (let len = 4; len >= 2; len--) {
      if (phone.length > len) {
        const potentialCode = phone.slice(0, len + 1) // +1 to include the +
        if (isValidCountryCode(potentialCode)) {
          return {
            countryCode: potentialCode,
            number: phone.slice(potentialCode.length).trim(),
          }
        }
      }
    }

    // Last resort: extract up to 4 characters (including +) but validate it
    let countryCode = "+"
    let i = 1
    while (i < phone.length && i < 4 && /[0-9]/.test(phone[i])) {
      countryCode += phone[i]
      i++
    }
    
    // If the extracted code is valid, use it; otherwise default to +1
    if (isValidCountryCode(countryCode)) {
      return {
        countryCode,
        number: phone.slice(countryCode.length).trim(),
      }
    }
    
    // Invalid code extracted, default to +1 and put everything in the number
    return { countryCode: "+1", number: phone.slice(1).trim() }
  }

  // Default to +1 if no + found
  return { countryCode: "+1", number: phone }
}

const PhoneInput = ({
  value,
  onChange,
  disabled,
  placeholder = "555-123-4567",
  className,
  style,
  onBlur,
  editingMode = false,
  ...props
}: PhoneInputProps) => {
  // Parse value - can be string (legacy) or object (new format)
  const getParsedValue = () => {
    if (typeof value === "object" && value !== null && "countryCode" in value) {
      return {
        countryCode: value.countryCode || "+1",
        number: value.number || "",
      }
    }
    return parsePhoneNumber((value as string) || "")
  }

  const parsed = getParsedValue()
  // Ensure initial country code is valid
  const initialCountryCode = isValidCountryCode(parsed.countryCode)
    ? parsed.countryCode
    : "+1"
  const [countryCode, setCountryCode] = useState<string>(initialCountryCode)
  const [phoneNumber, setPhoneNumber] = useState<string>(parsed.number)

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = getParsedValue()
    // Ensure country code is valid before setting state
    const validCountryCode = isValidCountryCode(parsed.countryCode)
      ? parsed.countryCode
      : "+1"
    setCountryCode(validCountryCode)
    setPhoneNumber(parsed.number)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode)
    // Immediately update parent with new country code
    const finalValue = {
      countryCode: newCode || "+1",
      number: phoneNumber || "",
    }
    onChange(finalValue)
  }

  // Helper function to parse and update phone number with country code
  const parseAndUpdatePhoneNumber = (inputValue: string) => {
    // If the input starts with +, it likely includes the country code
    if (inputValue.startsWith("+")) {
      const parsed = parsePhoneNumber(inputValue)
      // Ensure the parsed country code is valid
      const validCountryCode = isValidCountryCode(parsed.countryCode)
        ? parsed.countryCode
        : "+1"
      
      setCountryCode(validCountryCode)
      setPhoneNumber(parsed.number)
      // Call onChange immediately with parsed value so parent gets correct format
      onChange({ countryCode: validCountryCode, number: parsed.number })
      return true // Indicates we parsed the country code
    }
    return false // No country code found
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newNumber = e.target.value

    // Handle autocomplete: if the number starts with +, it might include the country code
    // Parse it and update both country code and number
    if (parseAndUpdatePhoneNumber(newNumber)) {
      return // Already handled by parseAndUpdatePhoneNumber
    }

    // Only update local state - don't call onChange yet
    setPhoneNumber(newNumber)
  }

  // Handle autocomplete event (when browser fills the field)
  // This is triggered when autocomplete fills the field
  const handlePhoneNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newNumber = e.currentTarget.value

    // Try to parse if it includes a country code
    parseAndUpdatePhoneNumber(newNumber)
  }

  // Handle paste events (autocomplete might trigger paste)
  const handlePhoneNumberPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Get the pasted value
    const pastedValue = e.clipboardData.getData("text")

    // If pasted value starts with +, parse it
    if (pastedValue.startsWith("+")) {
      // Prevent default paste behavior
      e.preventDefault()
      parseAndUpdatePhoneNumber(pastedValue)
    }
  }

  const handlePhoneNumberBlur = () => {
    // Trim the phone number on blur
    const trimmed = phoneNumber.trim()
    setPhoneNumber(trimmed)
    // Save separately as object - ensure we use the latest state values
    const finalValue = { countryCode: countryCode || "+1", number: trimmed }
    onChange(finalValue)
    onBlur?.()
  }

  // Ensure both inputs get the same style for consistency
  const inputStyle = style || {}

  // Get select style to match input
  const getSelectStyle = () => {
    return inputStyle
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <Select
          value={isValidCountryCode(countryCode) ? countryCode : "+1"}
          onValueChange={handleCountryCodeChange}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-[100px]"
            style={getSelectStyle()}
          >
            <SelectValue placeholder="+1" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map((code) => (
              <SelectItem key={code.value} value={code.value}>
                {code.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex-1">
        <Input
          type="tel"
          name="phone"
          placeholder={placeholder}
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          onInput={handlePhoneNumberInput}
          onPaste={handlePhoneNumberPaste}
          onBlur={handlePhoneNumberBlur}
          disabled={disabled}
          className={className}
          style={inputStyle}
          autoComplete="tel"
          {...props}
        />
      </div>
    </div>
  )
}

export default PhoneInput
