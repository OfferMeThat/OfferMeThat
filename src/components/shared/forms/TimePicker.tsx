"use client"

import { Clock } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BrandingConfig } from "@/types/branding"
import { cn } from "@/lib/utils"

export type TimePickerProps = {
  label?: string
  btnClassName?: string
  value?: string // HH:MM format
  onChange?: (time: string | undefined) => void
  disabled?: boolean
  style?: React.CSSProperties
  brandingConfig?: BrandingConfig
}

const TimePicker = ({
  label,
  btnClassName,
  value,
  onChange,
  disabled = false,
  style,
  brandingConfig,
}: TimePickerProps) => {
  const [open, setOpen] = React.useState(false)
  const [hours, setHours] = React.useState(value?.split(":")[0] || "12")
  const [minutes, setMinutes] = React.useState(value?.split(":")[1] || "00")

  const handleApply = () => {
    const timeString = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
    onChange?.(timeString)
    setOpen(false)
  }

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

  const getInputStyle = () => {
    if (brandingConfig?.fieldColor && brandingConfig.fieldColor !== "#ffffff") {
      return {
        backgroundColor: brandingConfig.fieldColor,
        borderColor: brandingConfig.fieldColor,
        borderWidth: "1px",
        borderStyle: "solid",
      }
    }
    return {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#e5e7eb", // gray-200
      backgroundColor: "#ffffff",
    }
  }

  const getButtonStyle = () => {
    if (!brandingConfig) return {}
    return {
      backgroundColor: brandingConfig.buttonColor,
      color: brandingConfig.buttonTextColor,
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="cursor-pointer">
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "shrink justify-between font-normal",
            !value && "text-gray-500",
            btnClassName,
          )}
          style={getFieldStyle()}
        >
          <Clock className="h-4 w-4" />
          {value || label || "Select time"}
        </Button>
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
          <Button onClick={handleApply} className="w-full" style={getButtonStyle()}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default TimePicker
