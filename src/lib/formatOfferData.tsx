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
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  } catch (e) {
    // Fall through to return string
  }
  return String(date)
}

function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  } catch (e) {
    // Fall through to return string
  }
  return String(date)
}

function renderFileLink(url: string, label?: string): React.JSX.Element {
  const fileName = label || url.split("/").pop() || "File"
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
    >
      <FileText size={14} />
      {fileName}
    </a>
  )
}

// ==================== Purchaser Data Formatter ====================

export function formatPurchaserData(data: any): React.JSX.Element | null {
  if (!data || typeof data !== "object") return null

  const purchaserData = data as PurchaserData

  // Single field method
  if (purchaserData.method === "single_field") {
    return (
      <div className="space-y-2">
        <div>
          <span className="font-medium text-gray-700">Name: </span>
          <span className="text-gray-900">{purchaserData.name}</span>
        </div>
        {purchaserData.idFileUrl && (
          <div>
            <span className="font-medium text-gray-700">Identification: </span>
            {renderFileLink(purchaserData.idFileUrl, "ID Document")}
          </div>
        )}
      </div>
    )
  }

  // Individual names method
  if (purchaserData.method === "individual_names" && purchaserData.nameFields) {
    const nameEntries = Object.entries(purchaserData.nameFields)

    return (
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700">Scenario: </span>
          <span className="text-gray-900 capitalize">
            {purchaserData.scenario?.replace(/_/g, " ")}
          </span>
        </div>
        {nameEntries.map(([key, nameData]: [string, any]) => (
          <div key={key} className="border-l-2 border-teal-500 pl-3">
            <div className="mb-1 font-medium text-gray-700">
              {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
            <div className="text-gray-900">
              {[nameData.firstName, nameData.middleName, nameData.lastName]
                .filter(Boolean)
                .join(" ")}
            </div>
            {purchaserData.idFileUrls?.[key] && (
              <div className="mt-1">
                {renderFileLink(purchaserData.idFileUrls[key], "ID Document")}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return null
}

// ==================== Deposit Data Formatter ====================

export function formatDepositData(data: any): React.JSX.Element | null {
  if (!data || typeof data !== "object") return null

  const depositData = data as DepositData

  const formatInstalmentAmount = (instalment: any): string => {
    if (!instalment) return "N/A"

    if (instalment.depositType === "amount" || instalment.amount) {
      return formatCurrency(instalment.amount, instalment.currency || "USD")
    }

    if (instalment.depositType === "percentage" || instalment.percentage) {
      return `${instalment.percentage}% of purchase price`
    }

    return "N/A"
  }

  const formatInstalmentDue = (instalment: any): string => {
    if (!instalment) return "N/A"

    if (instalment.depositDueText) {
      return instalment.depositDueText
    }

    if (instalment.depositDue) {
      return formatDate(instalment.depositDue)
    }

    if (instalment.depositDueWithin) {
      const { number, unit } = instalment.depositDueWithin
      return `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
    }

    return "N/A"
  }

  // Check if multiple instalments
  const hasMultipleInstalments =
    depositData.instalment_1 ||
    depositData.instalment_2 ||
    depositData.instalment_3

  if (hasMultipleInstalments) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((num) => {
          const instalment = depositData[
            `instalment_${num}` as keyof DepositData
          ] as any
          if (!instalment) return null

          return (
            <div key={num} className="border-l-2 border-teal-500 pl-3">
              <div className="mb-2 font-semibold text-gray-800">
                Instalment {num}
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Amount: </span>
                  <span className="text-gray-900">
                    {formatInstalmentAmount(instalment)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Due: </span>
                  <span className="text-gray-900">
                    {formatInstalmentDue(instalment)}
                  </span>
                </div>
                {instalment.depositHolding && (
                  <div>
                    <span className="font-medium text-gray-600">Held by: </span>
                    <span className="text-gray-900">
                      {instalment.depositHolding}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Single instalment
  return (
    <div className="space-y-2">
      <div>
        <span className="font-medium text-gray-700">Amount: </span>
        <span className="text-gray-900">
          {formatInstalmentAmount(depositData)}
        </span>
      </div>
      <div>
        <span className="font-medium text-gray-700">Due: </span>
        <span className="text-gray-900">
          {formatInstalmentDue(depositData)}
        </span>
      </div>
      {depositData.depositHolding && (
        <div>
          <span className="font-medium text-gray-700">Held by: </span>
          <span className="text-gray-900">{depositData.depositHolding}</span>
        </div>
      )}
    </div>
  )
}

// ==================== Settlement Date Formatter ====================

export function formatSettlementDateData(data: any): React.JSX.Element | null {
  if (!data || typeof data !== "object") return null

  const settlementData = data as SettlementDateData

  // Determine date/time display
  let dateTimeDisplay: string | null = null

  if (settlementData.settlementDateText) {
    dateTimeDisplay = settlementData.settlementDateText
  } else if (settlementData.settlementDateTime) {
    dateTimeDisplay = formatDateTime(settlementData.settlementDateTime)
  } else if (settlementData.settlementDate && settlementData.settlementTime) {
    dateTimeDisplay = `${formatDate(settlementData.settlementDate)} at ${settlementData.settlementTime}`
  } else if (settlementData.settlementDate) {
    dateTimeDisplay = formatDate(settlementData.settlementDate)
  } else if (settlementData.settlementDateWithin) {
    const { number, unit } = settlementData.settlementDateWithin
    dateTimeDisplay = `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
  }

  return (
    <div className="space-y-2">
      {dateTimeDisplay && (
        <div>
          <span className="font-medium text-gray-700">Date: </span>
          <span className="text-gray-900">{dateTimeDisplay}</span>
        </div>
      )}
      {(settlementData.settlementLocation ||
        settlementData.settlementLocationText) && (
        <div>
          <span className="font-medium text-gray-700">Location: </span>
          <span className="text-gray-900">
            {settlementData.settlementLocation ||
              settlementData.settlementLocationText}
          </span>
        </div>
      )}
    </div>
  )
}

// ==================== Message to Agent Formatter ====================

export function formatMessageToAgent(data: any): React.JSX.Element | null {
  if (!data) return null

  // Handle string message
  if (typeof data === "string") {
    return <p className="whitespace-pre-wrap text-gray-900">{data}</p>
  }

  if (typeof data !== "object") return null

  const messageData = data as MessageToAgentData
  const message = messageData.message || messageData.text

  // Collect all attachment URLs
  const attachments: string[] = []
  if (messageData.attachmentUrl) {
    attachments.push(messageData.attachmentUrl)
  }
  if (messageData.attachmentUrls) {
    attachments.push(...messageData.attachmentUrls)
  }
  if (messageData.attachments) {
    attachments.push(...messageData.attachments)
  }

  return (
    <div className="space-y-3">
      {message && (
        <div>
          <p className="whitespace-pre-wrap text-gray-900">{message}</p>
        </div>
      )}
      {attachments.length > 0 && (
        <div>
          <div className="mb-2 font-medium text-gray-700">Attachments:</div>
          <div className="space-y-1">
            {attachments.map((url, index) => (
              <div key={index}>
                {renderFileLink(url, `Attachment ${index + 1}`)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Loan Approval Formatter ====================

export function formatSubjectToLoanApproval(
  data: any,
): React.JSX.Element | null {
  // Handle JSON string if data is stored as string
  let parsedData = data
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data)
    } catch {
      // If parsing fails, treat as invalid
      return null
    }
  }

  if (!parsedData || typeof parsedData !== "object") return null

  const loanData = parsedData as SubjectToLoanApprovalData

  // Check if subject to loan approval
  const isSubjectToLoan =
    loanData.subjectToLoanApproval === "yes" ||
    loanData.subjectToLoanApproval === true

  // Format loan amount
  let loanAmountDisplay: string | null = null
  if (loanData.loanAmount) {
    loanAmountDisplay = formatCurrency(loanData.loanAmount)
  } else if (loanData.loanPercentage) {
    loanAmountDisplay = `${loanData.loanPercentage}% of purchase price`
  }

  // Format due date
  let dueDateDisplay: string | null = null
  if (loanData.loanDueText) {
    dueDateDisplay = loanData.loanDueText
  } else if (loanData.loanDueDateTime) {
    dueDateDisplay = formatDateTime(loanData.loanDueDateTime)
  } else if (loanData.loanDueDate) {
    dueDateDisplay = formatDate(loanData.loanDueDate)
  } else if (loanData.loanDueWithin) {
    const { number, unit } = loanData.loanDueWithin
    dueDateDisplay = `Within ${number} ${unit.replace(/_/g, " ")} of offer acceptance`
  }

  // Collect supporting documents
  const supportingDocs: string[] = []
  // Check all possible field names for backward compatibility
  if (loanData.supportingDocUrl) {
    supportingDocs.push(loanData.supportingDocUrl)
  }
  if (loanData.supportingDocsUrl) {
    // Current field name (singular)
    if (typeof loanData.supportingDocsUrl === "string") {
      supportingDocs.push(loanData.supportingDocsUrl)
    }
  }
  if (loanData.supportingDocUrls) {
    // Old plural field name
    if (Array.isArray(loanData.supportingDocUrls)) {
    supportingDocs.push(...loanData.supportingDocUrls)
    }
  }
  if (loanData.supportingDocsUrls) {
    // Current field name (plural)
    if (Array.isArray(loanData.supportingDocsUrls)) {
      supportingDocs.push(...loanData.supportingDocsUrls)
    }
  }
  if (loanData.preApprovalDocuments) {
    if (Array.isArray(loanData.preApprovalDocuments)) {
    supportingDocs.push(...loanData.preApprovalDocuments)
    }
  }

  // Evidence of funds (if not subject to loan)
  const evidenceOfFunds: string[] = []
  if (loanData.evidenceOfFundsUrl) {
    evidenceOfFunds.push(loanData.evidenceOfFundsUrl)
  }
  if (loanData.evidenceOfFundsUrls) {
    evidenceOfFunds.push(...loanData.evidenceOfFundsUrls)
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="font-medium text-gray-700">
          Subject to Loan Approval:{" "}
        </span>
        <span className="text-gray-900">{isSubjectToLoan ? "Yes" : "No"}</span>
      </div>

      {isSubjectToLoan && (
        <>
          {loanAmountDisplay && (
            <div>
              <span className="font-medium text-gray-700">Loan Amount: </span>
              <span className="text-gray-900">{loanAmountDisplay}</span>
            </div>
          )}

          {(loanData.lenderName || loanData.lenderDetails) && (
            <div>
              <span className="font-medium text-gray-700">Lender: </span>
              <span className="text-gray-900">
                {loanData.lenderName || loanData.lenderDetails}
              </span>
            </div>
          )}

          {loanData.lenderUnknown && (
            <div>
              <span className="font-medium text-gray-700">Lender: </span>
              <span className="text-gray-600 italic">Not yet determined</span>
            </div>
          )}

          {dueDateDisplay && (
            <div>
              <span className="font-medium text-gray-700">Due Date: </span>
              <span className="text-gray-900">{dueDateDisplay}</span>
            </div>
          )}

          {supportingDocs.length > 0 && (
            <div>
              <div className="mb-2 font-medium text-gray-700">
                Supporting Documents:
              </div>
              <div className="space-y-1">
                {supportingDocs.map((url, index) => (
                  <div key={index}>
                    {renderFileLink(url, `Pre-approval Document ${index + 1}`)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!isSubjectToLoan && evidenceOfFunds.length > 0 && (
        <div>
          <div className="mb-2 font-medium text-gray-700">
            Evidence of Funds:
          </div>
          <div className="space-y-1">
            {evidenceOfFunds.map((url, index) => (
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
