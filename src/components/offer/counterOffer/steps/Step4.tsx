import { Input } from "../../../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select"

type FormValues = Record<string, any>

interface Step4Props {
  originalFormValues: FormValues
  counterFormValues: FormValues
  renderField: (
    label: string,
    fieldKey: string,
    renderInput: (value: any, onChange: (value: any) => void) => React.ReactElement,
    renderDisplay: (value: any) => string,
    originalValue: any,
    counterValue: any,
  ) => React.ReactElement
}

export const Step4 = ({
  originalFormValues,
  counterFormValues,
  renderField,
}: Step4Props) => {
  return (
    <div className="space-y-6">
      {renderField(
        "Payment Way",
        "paymentWay",
        (value, onChange) => (
          <Select value={value || "cash"} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        ),
        (value) => {
          if (!value) return "N/A"
          return value === "cash" ? "Cash" : "Finance"
        },
        originalFormValues.paymentWay,
        counterFormValues.paymentWay,
      )}

      {renderField(
        "Offer Expires",
        "offerExpiry",
        (value, onChange) => (
          <div className="space-y-2">
            <Input
              type="date"
              value={value?.date || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  date: e.target.value,
                })
              }
              placeholder="Date"
              className="w-full"
            />
            <Input
              type="time"
              value={value?.time || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  time: e.target.value,
                })
              }
              placeholder="Time"
              className="w-full"
            />
          </div>
        ),
        (value) => {
          if (!value || !value.date) return "N/A"
          const date = new Date(value.date)
          const dateStr = date.toLocaleDateString()
          const timeStr = value.time || ""
          return timeStr ? `${dateStr} ${timeStr}` : dateStr
        },
        originalFormValues.offerExpiry,
        counterFormValues.offerExpiry,
      )}
    </div>
  )
}

