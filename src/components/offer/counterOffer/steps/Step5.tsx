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
}

export const Step5 = ({
  originalFormValues,
  counterFormValues,
  renderField,
}: Step5Props) => {
  const getMessageDisplay = (messageData: any) => {
    if (!messageData) return "N/A"
    if (typeof messageData === "string") return messageData
    if (typeof messageData === "object" && messageData.message) {
      return messageData.message
    }
    return JSON.stringify(messageData)
  }

  return (
    <div className="space-y-6">
      {renderField(
        "Message to Agent",
        "messageToAgent",
        (value, onChange) => (
          <Textarea
            value={typeof value === "string" ? value : value?.message || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter message to agent"
            rows={6}
            className="w-full"
          />
        ),
        getMessageDisplay,
        originalFormValues.messageToAgent,
        counterFormValues.messageToAgent,
      )}
    </div>
  )
}

