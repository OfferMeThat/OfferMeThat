import {
  formatDepositAmount,
  normalizeDepositData,
} from "@/lib/depositDataHelpers"
import { Textarea } from "../../../ui/textarea"

type FormValues = Record<string, any>

interface Step3Props {
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

export const Step3 = ({
  originalFormValues,
  counterFormValues,
  renderField,
}: Step3Props) => {
  const getDepositDisplay = (depositData: any) => {
    if (!depositData) return "N/A"
    try {
      const normalized = normalizeDepositData(depositData)
      if (normalized && normalized.instalments.length > 0) {
        if (normalized.numInstalments === 1) {
          return formatDepositAmount(normalized.instalments[0])
        }
        return `${normalized.numInstalments} instalments`
      }
    } catch (e) {
      // fall through
    }
    return JSON.stringify(depositData)
  }

  return (
    <div className="space-y-6">
      {renderField(
        "Total Deposit Amount",
        "deposit",
        (value, onChange) => (
          <Textarea
            value={JSON.stringify(value || {}, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder="Deposit data (JSON)"
            className="w-full font-mono text-xs"
            rows={6}
          />
        ),
        getDepositDisplay,
        originalFormValues.deposit,
        counterFormValues.deposit,
      )}
    </div>
  )
}

