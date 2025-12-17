"use client"

import { Input } from "@/components/ui/input"
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

// Parse phone number to extract country code and number
const parsePhoneNumber = (
  phone: string,
): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: "+1", number: "" }

  // If phone starts with +, extract country code (max 4 chars including +)
  if (phone.startsWith("+")) {
    // Extract country code (up to 4 characters: + and up to 3 digits)
    let countryCode = "+"
    let i = 1
    while (i < phone.length && i < 4 && /[0-9]/.test(phone[i])) {
      countryCode += phone[i]
      i++
    }
    return {
      countryCode,
      number: phone.slice(countryCode.length).trim(),
    }
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
  const [countryCode, setCountryCode] = useState<string>(parsed.countryCode)
  const [phoneNumber, setPhoneNumber] = useState<string>(parsed.number)

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = getParsedValue()
    setCountryCode(parsed.countryCode)
    setPhoneNumber(parsed.number)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newCode = e.target.value

    // Only allow + and digits
    newCode = newCode.replace(/[^+\d]/g, "")

    // Restrict country code length (max 4 characters including +)
    if (newCode.length > 4) return

    // Ensure it starts with +
    if (newCode && !newCode.startsWith("+")) {
      newCode = "+" + newCode.replace(/\+/g, "")
    }

    // Only update local state - don't call onChange yet
    setCountryCode(newCode)
  }

  const handleCountryCodeBlur = () => {
    // Save separately as object - ensure we use the latest state values
    const finalValue = {
      countryCode: countryCode || "+1",
      number: phoneNumber || "",
    }
    onChange(finalValue)
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newNumber = e.target.value

    // Handle autocomplete: if the number starts with +, it might include the country code
    // Parse it and update both country code and number
    if (newNumber.startsWith("+")) {
      const parsed = parsePhoneNumber(newNumber)
      setCountryCode(parsed.countryCode)
      setPhoneNumber(parsed.number)
      // Call onChange immediately with parsed value so parent gets correct format
      onChange({ countryCode: parsed.countryCode, number: parsed.number })
      return
    }

    // Only update local state - don't call onChange yet
    setPhoneNumber(newNumber)
  }

  // Handle autocomplete event (when browser fills the field)
  const handlePhoneNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newNumber = e.currentTarget.value

    // If autocomplete filled a number starting with +, parse it
    if (newNumber.startsWith("+")) {
      const parsed = parsePhoneNumber(newNumber)
      setCountryCode(parsed.countryCode)
      setPhoneNumber(parsed.number)
      // Call onChange immediately with parsed value so parent gets correct format
      onChange({ countryCode: parsed.countryCode, number: parsed.number })
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

  const isCountryCodeDisabled = disabled || editingMode

  // Ensure both inputs get the same style for consistency
  const inputStyle = style || {}

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={countryCode}
        onChange={handleCountryCodeChange}
        onBlur={handleCountryCodeBlur}
        disabled={isCountryCodeDisabled}
        placeholder="+1"
        className="w-[80px]"
        style={inputStyle}
        maxLength={4}
        autoComplete="tel-country-code"
      />

      <Input
        type="tel"
        name="phone"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onInput={handlePhoneNumberInput}
        onBlur={handlePhoneNumberBlur}
        disabled={disabled}
        className={className}
        style={inputStyle}
        autoComplete="tel"
        {...props}
      />
    </div>
  )
}

export default PhoneInput
