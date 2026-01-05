import { ArrowRight, Trash2 } from "lucide-react"
import { Button } from "../../../ui/button"
import { Label } from "../../../ui/label"
import { Textarea } from "../../../ui/textarea"

type FormValues = Record<string, any>

interface Step5Props {
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
  handleCopyValue: (fieldKey: string) => void
  handleRemoveValue: (fieldKey: string) => void
  handleValueChange: (fieldKey: string, value: any) => void
}

export const Step5 = ({
  originalFormValues,
  counterFormValues,
  renderField,
  handleCopyValue,
  handleRemoveValue,
  handleValueChange,
}: Step5Props) => {
  const getMessageText = (messageData: any): string => {
    if (!messageData) return "N/A"
    if (typeof messageData === "string") {
      try {
        const parsed = JSON.parse(messageData)
        return parsed.message || parsed.text || messageData
      } catch {
        return messageData
      }
    }
    if (typeof messageData === "object" && messageData.message) {
      return messageData.message
    }
    if (typeof messageData === "object" && messageData.text) {
      return messageData.text
    }
    return "N/A"
  }

  const originalMessageData = originalFormValues.messageToAgent || null
  const counterMessageData = counterFormValues.messageToAgent
  const originalMessageText = getMessageText(originalMessageData)

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-6 md:space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Label className="text-sm font-medium text-gray-700">
            Message to Agent
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-4">
          <div className="w-full">
            <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap break-words">
              {originalMessageText}
            </div>
          </div>

          <div className="flex justify-center pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rotate-90 p-0 md:rotate-0"
              onClick={() => handleCopyValue("messageToAgent")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Textarea
                value={
                  typeof counterMessageData === "string"
                    ? counterMessageData
                    : counterMessageData?.message || ""
                }
                onChange={(e) => handleValueChange("messageToAgent", e.target.value)}
                placeholder="Enter message to agent"
                rows={6}
                className="w-full"
              />
            </div>
            {counterMessageData !== undefined &&
              counterMessageData !== null &&
              counterMessageData !== "" &&
              (typeof counterMessageData === "string"
                ? counterMessageData.trim() !== ""
                : (counterMessageData?.message || "").trim() !== "") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveValue("messageToAgent")}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
