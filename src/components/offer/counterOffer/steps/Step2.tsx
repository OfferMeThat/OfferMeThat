import { Input } from "../../../ui/input"
import { Textarea } from "../../../ui/textarea"

type FormValues = Record<string, any>

interface Step2Props {
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

export const Step2 = ({
  originalFormValues,
  counterFormValues,
  renderField,
}: Step2Props) => {
  return (
    <div className="space-y-6">
      {renderField(
        "PDF Attachment",
        "purchaseAgreementFile",
        (value, onChange) => (
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="File URL"
            disabled
            className="w-full"
          />
        ),
        (value) => {
          if (!value) return "N/A"
          if (typeof value === "string") {
            return value
          }
          return "N/A"
        },
        originalFormValues.purchaseAgreementFile,
        counterFormValues.purchaseAgreementFile,
      )}

      {renderField(
        "Offer Amount",
        "offerAmount",
        (value, onChange) => (
          <div className="space-y-2">
            <Input
              type="number"
              value={value?.amount || 0}
              onChange={(e) =>
                onChange({
                  ...value,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              className="w-full"
            />
            <Input
              value={value?.currency || "USD"}
              onChange={(e) =>
                onChange({
                  ...value,
                  currency: e.target.value,
                })
              }
              placeholder="USD"
              className="w-full"
            />
          </div>
        ),
        (value) => {
          if (!value) return "N/A"
          const amount = value.amount || 0
          const currency = value.currency || "USD"
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(amount)
        },
        originalFormValues.offerAmount,
        counterFormValues.offerAmount,
      )}
    </div>
  )
}

