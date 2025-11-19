import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const NUMBERS = Array.from({ length: 101 }, (_, i) => i.toString())

type NumberSelectProps = {
  placeholder?: string
  value: string
  onValueChange: (value: string) => void
  className?: string
}

const NumberSelect = ({
  placeholder,
  value,
  onValueChange,
  className,
}: NumberSelectProps) => {
  return (
    <Select onValueChange={(newValue) => onValueChange(newValue)} value={value}>
      <SelectTrigger
        className={cn(
          "w-full cursor-pointer transition-colors hover:bg-gray-100",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        <SelectGroup>
          {NUMBERS.map((num) => (
            <SelectItem key={num} value={num} className="cursor-pointer">
              {num}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default NumberSelect
