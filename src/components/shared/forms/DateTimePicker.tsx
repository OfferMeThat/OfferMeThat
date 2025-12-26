"use client"

import { CalendarIcon, Clock } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrandingConfig } from "@/types/branding"

export type DateTimePickerProps = {
  dateValue?: Date
  timeValue?: string // HH:MM format
  onDateChange?: (date: Date | undefined) => void
  onTimeChange?: (time: string | undefined) => void
  disabled?: boolean
  datePlaceholder?: string
  timePlaceholder?: string
  style?: React.CSSProperties
  brandingConfig?: BrandingConfig
  disablePastDates?: boolean
  dateLabel?: string
  timeLabel?: string
}

const DateTimePicker = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
  datePlaceholder = "Select date",
  timePlaceholder = "Select time",
  style,
  brandingConfig,
  disablePastDates = true,
  dateLabel,
  timeLabel,
}: DateTimePickerProps) => {
  const [dateOpen, setDateOpen] = React.useState(false)
  const [timeOpen, setTimeOpen] = React.useState(false)
  const [hours, setHours] = React.useState(timeValue?.split(":")[0] || "12")
  const [minutes, setMinutes] = React.useState(timeValue?.split(":")[1] || "00")

  // Get today's date at midnight for consistent comparison
  const today = React.useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Update hours/minutes when timeValue changes
  React.useEffect(() => {
    if (timeValue) {
      const [h, m] = timeValue.split(":")
      setHours(h || "12")
      setMinutes(m || "00")
    }
  }, [timeValue])

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

  const getInputStyle = () => {
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
        borderWidth: "1px",
        borderStyle: "solid",
      }
    }
    // Use default transparent background like other inputs
    return {}
  }

  const getButtonStyle = () => {
    if (!brandingConfig) return {}
    return {
      backgroundColor: brandingConfig.buttonColor,
      color: brandingConfig.buttonTextColor,
    }
  }

  const handleTimeApply = () => {
    const timeString = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
    onTimeChange?.(timeString)
    setTimeOpen(false)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString()
  }

  return (
    <div className="flex gap-2">
      {/* Date Picker */}
      <div className="flex-1">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                readOnly
                value={dateValue ? formatDate(dateValue) : ""}
                placeholder={datePlaceholder}
                disabled={disabled}
                className={cn(
                  "w-full pl-10 cursor-pointer",
                  !dateValue && "text-gray-500",
                )}
                style={getFieldStyle()}
                onClick={() => !disabled && setDateOpen(true)}
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
              selected={dateValue}
              captionLayout="dropdown"
              onSelect={(date) => {
                onDateChange?.(date)
                setDateOpen(false)
              }}
              disabled={disablePastDates ? (date) => date < today : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker */}
      <div className="flex-1">
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                readOnly
                value={timeValue || ""}
                placeholder={timePlaceholder}
                disabled={disabled}
                className={cn(
                  "w-full pl-10 cursor-pointer",
                  !timeValue && "text-gray-500",
                )}
                style={getFieldStyle()}
                onClick={() => !disabled && setTimeOpen(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-4"
            align="start"
            style={
              brandingConfig?.fieldColor
                ? {
                    backgroundColor: brandingConfig.fieldColor,
                  }
                : undefined
            }
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Hours
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (val >= 0 && val <= 23) {
                        setHours(e.target.value)
                      }
                    }}
                    className="text-center"
                    style={getInputStyle()}
                  />
                </div>
                <span className="mt-5 text-xl font-bold">:</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (val >= 0 && val <= 59) {
                        setMinutes(e.target.value)
                      }
                    }}
                    className="text-center"
                    style={getInputStyle()}
                  />
                </div>
              </div>
              <Button onClick={handleTimeApply} className="w-full" style={getButtonStyle()}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default DateTimePicker

