"use client"

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

type PhoneInputProps = {
  value: string
  onChange: (value: string) => void
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
  const parsed = parsePhoneNumber(value || "")
  const [countryCode, setCountryCode] = useState<string>(parsed.countryCode)
  const [phoneNumber, setPhoneNumber] = useState<string>(parsed.number)

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = parsePhoneNumber(value || "")
    setCountryCode(parsed.countryCode)
    setPhoneNumber(parsed.number)
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

    setCountryCode(newCode)
    // Combine and call onChange
    const combined = newCode + phoneNumber
    onChange(combined)
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value
    setPhoneNumber(newNumber)
    // Combine and call onChange
    const combined = countryCode + newNumber
    onChange(combined)
  }

  const handlePhoneNumberBlur = () => {
    // Trim the phone number on blur
    const trimmed = phoneNumber.trim()
    setPhoneNumber(trimmed)
    const combined = countryCode + trimmed
    onChange(combined)
    onBlur?.()
  }

  const isCountryCodeDisabled = disabled || editingMode

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={countryCode}
        onChange={handleCountryCodeChange}
        disabled={isCountryCodeDisabled}
        placeholder="+1"
        className="w-[80px]"
        style={style}
        maxLength={4}
      />

      <Input
        type="tel"
        name="phone"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        onBlur={handlePhoneNumberBlur}
        disabled={disabled}
        className={className}
        style={style}
        {...props}
      />
    </div>
  )
}

export default PhoneInput
