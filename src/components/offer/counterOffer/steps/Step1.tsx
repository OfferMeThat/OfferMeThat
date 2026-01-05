import { ArrowRight, Trash2 } from "lucide-react"
import { Button } from "../../../ui/button"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select"

type FormValues = Record<string, any>

interface Step1Props {
  originalFormValues: FormValues
  counterFormValues: FormValues
  renderField: (
    label: string,
    fieldKey: string,
    renderInput: (
      value: any,
      onChange: (value: any) => void,
    ) => React.ReactElement,
    renderDisplay: (value: any) => string,
    originalValue: any,
    counterValue: any,
  ) => React.ReactElement
  handleCopyValue: (fieldKey: string) => void
  handleRemoveValue: (fieldKey: string) => void
  handleValueChange: (fieldKey: string, value: any) => void
}

export const Step1 = ({
  originalFormValues,
  counterFormValues,
  renderField,
  handleCopyValue,
  handleRemoveValue,
  handleValueChange,
}: Step1Props) => {
  return (
    <div className="space-y-6">
      {renderField(
        "Property Address",
        "listingAddress",
        (value, onChange) => (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter property address"
            className="w-full"
          />
        ),
        (value) => value || "N/A",
        originalFormValues.listingAddress,
        counterFormValues.listingAddress,
      )}

      {renderField(
        "What best describes you?",
        "submitterRole",
        (value, onChange) => {
          const getSelectValue = (val: string | null | undefined) => {
            if (!val) return ""
            if (val === "buyer") return "buyer_self"
            if (val === "agent") return "buyers_agent"
            return val
          }

          return (
            <Select
              value={getSelectValue(value)}
              onValueChange={(newValue) => onChange(newValue)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer_self">
                  I am a Buyer representing myself
                </SelectItem>
                <SelectItem value="buyer_with_agent">
                  I am a Buyer and I have an Agent
                </SelectItem>
                <SelectItem value="buyers_agent">
                  I&apos;m a Buyers&apos; Agent representing a Buyer
                </SelectItem>
              </SelectContent>
            </Select>
          )
        },
        (value) => {
          if (!value) return "N/A"
          if (value === "buyer") return "I am a Buyer representing myself"
          if (value === "agent")
            return "I'm a Buyers' Agent representing a Buyer"
          if (value === "buyer_self") return "I am a Buyer representing myself"
          if (value === "buyer_with_agent")
            return "I am a Buyer and I have an Agent"
          if (value === "buyers_agent")
            return "I'm a Buyers' Agent representing a Buyer"
          return value
        },
        originalFormValues.submitterRole,
        counterFormValues.submitterRole,
      )}

      <div className="space-y-1.5 pb-6 md:space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Label className="text-sm font-medium text-gray-700">Your Name</Label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4">
          <Input
            value={
              originalFormValues.submitterName
                ? `${originalFormValues.submitterName.firstName.trim() || ""} ${originalFormValues.submitterName.lastName.trim() || ""}` ||
                  "N/A"
                : "N/A"
            }
            disabled
            className="w-full bg-gray-50 text-gray-700"
          />
          <div className="flex justify-center pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rotate-90 p-0 md:rotate-0"
              onClick={() => handleCopyValue("submitterName")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                value={counterFormValues.submitterName?.firstName || ""}
                onChange={(e) =>
                  handleValueChange("submitterName", {
                    ...(counterFormValues.submitterName || {}),
                    firstName: e.target.value,
                  })
                }
                placeholder="First Name"
                className="w-full"
              />
              <Input
                value={counterFormValues.submitterName?.lastName || ""}
                onChange={(e) =>
                  handleValueChange("submitterName", {
                    ...(counterFormValues.submitterName || {}),
                    lastName: e.target.value,
                  })
                }
                placeholder="Last Name"
                className="w-full"
              />
            </div>
            {counterFormValues.submitterName !== undefined &&
              counterFormValues.submitterName !== null &&
              (counterFormValues.submitterName.firstName ||
                counterFormValues.submitterName.lastName) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveValue("submitterName")}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
          </div>
        </div>
      </div>

      {renderField(
        "Your Email",
        "submitterEmail",
        (value, onChange) => (
          <Input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter email"
            className="w-full"
          />
        ),
        (value) => value || "N/A",
        originalFormValues.submitterEmail,
        counterFormValues.submitterEmail,
      )}

      {renderField(
        "Your Mobile Number",
        "submitterPhone",
        (value, onChange) => (
          <Input
            type="tel"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter phone number"
            className="w-full"
          />
        ),
        (value) => value || "N/A",
        originalFormValues.submitterPhone,
        counterFormValues.submitterPhone,
      )}
    </div>
  )
}
