"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCY_OPTIONS } from "@/constants/offerFormQuestions"
import { cn } from "@/lib/utils"

interface CurrencySelectProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  /**
   * Optional: Filter to only show specific currency codes
   * If not provided, shows all currencies
   */
  allowedCurrencies?: string[]
}

/**
 * Reusable currency select component that displays all available currencies
 * with labels in the format "USD - US Dollar" but values are just "USD"
 */
export function CurrencySelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select currency",
  className,
  style,
  allowedCurrencies,
}: CurrencySelectProps) {
  // Filter currencies if allowedCurrencies is provided
  const currenciesToShow = allowedCurrencies
    ? CURRENCY_OPTIONS.filter((option) =>
        allowedCurrencies.includes(option.value),
      )
    : CURRENCY_OPTIONS

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full", className)} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currenciesToShow.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

