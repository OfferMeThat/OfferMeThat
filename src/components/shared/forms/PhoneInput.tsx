"use client"

import { PHONE_EXTENSIONS } from "@/components/constants/forms"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PhoneInputProps = {
  value: string
  onChange: (e: string) => void
}

const PhoneInput = ({ value, onChange }: PhoneInputProps) => {
  return (
    <div className="flex items-center">
      <Select>
        <SelectTrigger className="min-w-20">
          <SelectValue placeholder="+1" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectGroup>
            {PHONE_EXTENSIONS.map((item) => (
              <SelectItem value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Input
        type="tel"
        name="phone"
        placeholder="123-456-7890"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value.trim())}
      />
    </div>
  )
}

export default PhoneInput
