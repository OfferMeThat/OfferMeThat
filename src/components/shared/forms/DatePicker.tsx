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
import { BrandingConfig } from "@/types/branding"
import { cn } from "@/lib/utils"

export type DatePickerProps = {
  label?: string
  btnClassName?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  style?: React.CSSProperties
  brandingConfig?: BrandingConfig
}

const DatePicker = ({
  label,
  btnClassName,
  value,
  onChange,
  disabled = false,
  style,
  brandingConfig,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false)

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
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
