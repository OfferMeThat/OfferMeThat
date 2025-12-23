"use client"

import { CalendarIcon } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
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
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
        borderWidth: "1px",
        borderStyle: "solid",
        ...style,
      }
    }
    // Use default transparent background like other inputs
    return style || {}
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            readOnly
            value={value ? value.toLocaleDateString() : ""}
            placeholder={label || "Select date"}
            disabled={disabled}
            className={cn(
              "w-full pl-10 cursor-pointer",
              !value && "text-gray-500",
              btnClassName,
            )}
            style={getFieldStyle()}
            onClick={() => !disabled && setOpen(true)}
          />
        </div>
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
