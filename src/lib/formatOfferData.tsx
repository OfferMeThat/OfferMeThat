import {
  DepositData,
  MessageToAgentData,
  PurchaserData,
  SettlementDateData,
  SubjectToLoanApprovalData,
} from "@/types/offerData"
import { FileText } from "lucide-react"

/**
 * Utilities for formatting offer additional data for display
 */

// ==================== Helper Functions ====================

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ==================== Deposit Data Formatter ====================

export function formatDepositData(data: DepositData): React.JSX.Element | null {
  if (!data) return null

  const {
    depositType,
    depositAmount,
    depositCurrency,
    depositDue,
    depositHolding,
    instalments,
    instalmentData,
  } = data

  return (
    <div className="space-y-3">
      {depositType && (
        <div>
          <p className="text-sm font-medium text-gray-500">Deposit Type</p>
          <p className="text-base text-gray-900">{depositType}</p>
        </div>
      )}

      {depositAmount && (
        <div>
          <p className="text-sm font-medium text-gray-500">Deposit Amount</p>
          <p className="text-base text-gray-900">
            {formatCurrency(depositAmount, depositCurrency)}
          </p>
        </div>
      )}

      {depositDue && (
        <div>
          <p className="text-sm font-medium text-gray-500">Deposit Due</p>
          <p className="text-base text-gray-900">
            {typeof depositDue === "string"
              ? depositDue
              : depositDue instanceof Date
                ? depositDue.toLocaleDateString()
                : String(depositDue)}
          </p>
        </div>
      )}

      {depositHolding && (
        <div>
          <p className="text-sm font-medium text-gray-500">Deposit Holding</p>
          <p className="text-base text-gray-900">{depositHolding}</p>
        </div>
      )}

      {instalments &&
        (typeof instalments === "number"
          ? instalments > 1
          : Number(instalments) > 1) &&
        instalmentData && (
          <div>
            <p className="text-sm font-medium text-gray-500">
              Instalment Details
            </p>
            <div className="mt-2 space-y-2">
              {instalmentData.map((instalment: any, index: number) => (
                <div key={index} className="rounded-md border p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Instalment {index + 1}
                  </p>
                  {instalment.amount && (
                    <p className="text-sm text-gray-600">
                      Amount:{" "}
                      {formatCurrency(instalment.amount, instalment.currency)}
                    </p>
                  )}
                  {instalment.due && (
                    <p className="text-sm text-gray-600">
                      Due: {instalment.due}
                    </p>
                  )}
                  {instalment.holding && (
                    <p className="text-sm text-gray-600">
                      Holding: {instalment.holding}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}

// ==================== Purchaser Data Formatter ====================

export function formatPurchaserData(
  data: PurchaserData,
): React.JSX.Element | null {
  if (!data) return null

  const purchaserData = data as any
  const { scenario, purchasers, representatives } = purchaserData

  return (
    <div className="space-y-4">
      {scenario && (
        <div>
          <p className="text-sm font-medium text-gray-500">Scenario</p>
          <p className="text-base text-gray-900">{scenario}</p>
        </div>
      )}

      {purchasers && purchasers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500">Purchasers</p>
          <div className="mt-2 space-y-3">
            {purchasers.map((purchaser: any, index: number) => (
              <div key={index} className="rounded-md border p-3">
                <p className="text-sm font-medium text-gray-700">
                  Purchaser {index + 1}
                </p>
                {purchaser.firstName && (
                  <p className="text-sm text-gray-600">
                    First Name: {purchaser.firstName}
                  </p>
                )}
                {purchaser.middleName && (
                  <p className="text-sm text-gray-600">
                    Middle Name: {purchaser.middleName}
                  </p>
                )}
                {purchaser.lastName && (
                  <p className="text-sm text-gray-600">
                    Last Name: {purchaser.lastName}
                  </p>
                )}
                {purchaser.idFileUrl && (
                  <div className="mt-2">
                    <a
                      href={purchaser.idFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      View ID Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {representatives && representatives.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500">Representatives</p>
          <div className="mt-2 space-y-3">
            {representatives.map((rep: any, index: number) => (
              <div key={index} className="rounded-md border p-3">
                <p className="text-sm font-medium text-gray-700">
                  Representative {index + 1}
                </p>
                {rep.firstName && (
                  <p className="text-sm text-gray-600">
                    First Name: {rep.firstName}
                  </p>
                )}
                {rep.middleName && (
                  <p className="text-sm text-gray-600">
                    Middle Name: {rep.middleName}
                  </p>
                )}
                {rep.lastName && (
                  <p className="text-sm text-gray-600">
                    Last Name: {rep.lastName}
                  </p>
                )}
                {rep.idFileUrl && (
                  <div className="mt-2">
                    <a
                      href={rep.idFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      View ID Document
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Settlement Date Formatter ====================

export function formatSettlementDateData(
  data: SettlementDateData,
): React.JSX.Element | null {
  if (!data) return null

  const { date, time, location, dateText, locationText } = data

  return (
    <div className="space-y-3">
      {date && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">
            {date} {time ? `at ${time}` : ""}
          </p>
        </div>
      )}

      {dateText && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">{dateText}</p>
        </div>
      )}

      {location && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Settlement Location
          </p>
          <p className="text-base text-gray-900">{location}</p>
        </div>
      )}

      {locationText && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Settlement Location
          </p>
          <p className="text-base text-gray-900">{locationText}</p>
        </div>
      )}
    </div>
  )
}

// ==================== Message to Agent Formatter ====================

export function formatMessageToAgent(
  data: MessageToAgentData,
): React.JSX.Element | null {
  if (!data) return null

  const { message, attachmentUrls } = data

  return (
    <div className="space-y-3">
      {message && (
        <div>
          <p className="text-sm font-medium text-gray-500">Message</p>
          <p className="text-base whitespace-pre-wrap text-gray-900">
            {message}
          </p>
        </div>
      )}

      {attachmentUrls && attachmentUrls.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500">Attachments</p>
          <div className="mt-2 space-y-1">
            {attachmentUrls.map((url: string, index: number) => {
              const fileName = url.split("/").pop() || "Attachment"
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  <FileText size={14} />
                  {fileName}
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Subject to Loan Approval Formatter ====================

export function formatSubjectToLoanApproval(
  data: SubjectToLoanApprovalData,
): React.JSX.Element | null {
  if (!data) return null

  // Handle JSON string parsing if needed
  let loanData = data
  if (typeof data === "string") {
    try {
      loanData = JSON.parse(data)
    } catch {
      return null
    }
  }

  const {
    isSubjectToLoan,
    loanAmount,
    loanDueDate,
    lenderDetails,
    supportingDocsUrl,
    supportingDocsUrls,
    supportingDocUrl,
    supportingDocUrls,
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    unknownLender,
    evidenceOfFundsUrl,
    evidenceOfFundsUrls,
  } = loanData as any

  // Check for both current and old field names for supporting documents
  const supportingDocs = supportingDocsUrls || supportingDocUrls || []
  const supportingDoc = supportingDocsUrl || supportingDocUrl

  // Combine single and multiple supporting docs
  const allSupportingDocs = supportingDoc
    ? [supportingDoc, ...supportingDocs]
    : supportingDocs

  // Handle evidence of funds (can be single URL or array)
  const evidenceOfFunds = evidenceOfFundsUrls || []
  const evidenceOfFundsSingle = evidenceOfFundsUrl
  const allEvidenceOfFunds = evidenceOfFundsSingle
    ? [evidenceOfFundsSingle, ...evidenceOfFunds]
    : evidenceOfFunds

  // Helper function to render file links
  const renderFileLink = (url: string, label: string) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
    >
      <FileText size={14} />
      {label}
    </a>
  )

  return (
    <div className="space-y-3">
      {/* Always show subject to loan status */}
      <div>
        <p className="text-sm font-medium text-gray-500">
          Subject to Loan Approval
        </p>
        <p className="text-base text-gray-900">
          {isSubjectToLoan === "yes" ? "Yes" : "No"}
        </p>
      </div>

      {/* Only show loan details if subject to loan */}
      {isSubjectToLoan === "yes" && (
        <>
          {loanAmount && (
            <div>
              <p className="text-sm font-medium text-gray-500">Loan Amount</p>
              <p className="text-base text-gray-900">{loanAmount}</p>
            </div>
          )}

          {loanDueDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">Loan Due Date</p>
              <p className="text-base text-gray-900">{loanDueDate}</p>
            </div>
          )}

          {/* Lender Details */}
          {lenderDetails === "required" && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                Lender Details
              </p>
              <div className="mt-2 space-y-1">
                {unknownLender ? (
                  <p className="text-sm text-gray-600">Unknown Lender</p>
                ) : (
                  <>
                    {companyName && (
                      <p className="text-sm text-gray-600">
                        Company: {companyName}
                      </p>
                    )}
                    {contactName && (
                      <p className="text-sm text-gray-600">
                        Contact: {contactName}
                      </p>
                    )}
                    {contactEmail && (
                      <p className="text-sm text-gray-600">
                        Email: {contactEmail}
                      </p>
                    )}
                    {contactPhone && (
                      <p className="text-sm text-gray-600">
                        Phone: {contactPhone}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          {allSupportingDocs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">
                Supporting Documents
              </p>
              <div className="mt-2 space-y-1">
                {allSupportingDocs.map((url: string, index: number) => (
                  <div key={index}>
                    {renderFileLink(url, `Supporting Document ${index + 1}`)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Evidence of Funds (shown regardless of loan status) */}
      {allEvidenceOfFunds.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500">Evidence of Funds</p>
          <div className="mt-2 space-y-1">
            {allEvidenceOfFunds.map((url: string, index: number) => (
              <div key={index}>
                {renderFileLink(url, `Evidence of Funds ${index + 1}`)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Special Conditions Formatter ====================

export function formatSpecialConditions(
  data: any,
  setupConfig?: any,
): React.JSX.Element | null {
  if (!data) return null

  // Handle legacy string format
  if (typeof data === "string") {
    return <p className="whitespace-pre-wrap text-gray-900">{data}</p>
  }

  // Handle new object format
  if (typeof data !== "object") return null

  const specialConditionsData = data as {
    selectedConditions?: number[]
    customCondition?: string
    conditionAttachmentUrls?: Record<number, string[]>
  }

  const conditions =
    (setupConfig?.conditions as Array<{
      name: string
      details?: string
    }>) || []

  const selectedConditions = specialConditionsData.selectedConditions || []
  const customCondition = specialConditionsData.customCondition || ""
  const conditionAttachmentUrls =
    specialConditionsData.conditionAttachmentUrls || {}

  // Check if there are any attachments even without selected conditions
  const hasAttachments = Object.keys(conditionAttachmentUrls).length > 0

  // If no conditions selected, no custom condition, and no attachments, return null
  if (selectedConditions.length === 0 && !customCondition && !hasAttachments) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Selected predefined conditions */}
      {selectedConditions.length > 0 && (
        <div className="space-y-2">
          {selectedConditions.map((conditionIndex) => {
            const condition = conditions[conditionIndex]
            if (!condition) return null

            const attachments = conditionAttachmentUrls[conditionIndex] || []

            return (
              <div key={conditionIndex} className="space-y-1">
                <div>
                  <span className="font-medium text-gray-700">
                    {condition.name}
                  </span>
                  {condition.details && (
                    <p className="text-sm text-gray-600">{condition.details}</p>
                  )}
                </div>
                {/* Display attachments for this condition */}
                {attachments.length > 0 && (
                  <div className="ml-4 space-y-1">
                    <p className="text-xs font-medium text-gray-600">
                      Attachments:
                    </p>
                    <div className="flex flex-col gap-1">
                      {attachments.map((url: string, attIdx: number) => {
                        // Extract file name from URL, handling query parameters
                        const urlWithoutParams = url.split("?")[0]
                        const fileName =
                          urlWithoutParams.split("/").pop() || "Attachment"
                        // Clean up filename (remove timestamps if present, e.g., "1766054403462-0-filename.jpg" -> "filename.jpg")
                        const cleanFileName = fileName.replace(/^\d+-\d+-/, "")
                        return (
                          <a
                            key={attIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            <FileText size={12} />
                            {cleanFileName}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Show attachments for conditions that have attachments but weren't in selectedConditions */}
      {Object.keys(conditionAttachmentUrls).length > 0 && (
        <div className="space-y-2">
          {Object.entries(conditionAttachmentUrls).map(
            ([conditionIndexStr, attachments]) => {
              const conditionIndex = parseInt(conditionIndexStr, 10)
              // Only show if not already displayed in selectedConditions
              if (selectedConditions.includes(conditionIndex)) return null

              const condition = conditions[conditionIndex]
              const attachmentArray = Array.isArray(attachments)
                ? attachments
                : []

              if (attachmentArray.length === 0) return null

              return (
                <div key={conditionIndex} className="space-y-1">
                  {condition && (
                    <div>
                      <span className="font-medium text-gray-700">
                        {condition.name}
                      </span>
                      {condition.details && (
                        <p className="text-sm text-gray-600">
                          {condition.details}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Display attachments */}
                  <div className={condition ? "ml-4 space-y-1" : "space-y-1"}>
                    <p className="text-xs font-medium text-gray-600">
                      Attachments:
                    </p>
                    <div className="space-y-1">
                      {attachmentArray.map((url: string, attIdx: number) => {
                        // Extract file name from URL, handling query parameters
                        const urlWithoutParams = url.split("?")[0]
                        const fileName =
                          urlWithoutParams.split("/").pop() || "Attachment"
                        // Clean up filename (remove timestamps if present, e.g., "1766054403462-0-filename.jpg" -> "filename.jpg")
                        const cleanFileName = fileName.replace(/^\d+-\d+-/, "")
                        return (
                          <a
                            key={attIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            <FileText size={12} />
                            {cleanFileName}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            },
          )}
        </div>
      )}

      {/* Custom condition */}
      {customCondition && (
        <div className="border-t pt-2">
          <p className="mb-1 text-sm font-medium text-gray-700">
            Custom Condition:
          </p>
          <p className="text-sm whitespace-pre-wrap text-gray-900">
            {customCondition}
          </p>
        </div>
      )}
    </div>
  )
}
