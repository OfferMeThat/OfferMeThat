"use client"

import { CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"

export type DatePickerProps = {
  label?: string
  btnClassName?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  style?: React.CSSProperties
  brandingConfig?: BrandingConfig
  disablePastDates?: boolean
}

const DatePicker = ({
  label,
  btnClassName,
  value,
  onChange,
  disabled = false,
  style,
  brandingConfig,
  disablePastDates = true,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false)

  // Get today's date at midnight for consistent comparison
  const today = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const getFieldStyle = () => {
    const baseStyle = {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#e5e7eb", // gray-200
      backgroundColor: "#ffffff",
      ...style,
    }
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        ...baseStyle,
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
      }
    }
    return baseStyle
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="cursor-pointer">
        <Button
          variant="outline"
          id="date"
          disabled={disabled}
          className={cn(
            "shrink justify-between font-normal",
            !value && "text-gray-500",
            btnClassName,
          )}
          style={getFieldStyle()}
        >
          <CalendarIcon />
          {value ? value.toLocaleDateString() : label || "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="start"
        style={
          brandingConfig?.fieldColor
            ? {
                backgroundColor: brandingConfig.fieldColor,
              }
            : undefined
        }
      >
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={disablePastDates ? (date) => date < today : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
