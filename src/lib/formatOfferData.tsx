import {
  DepositData,
  MessageToAgentData,
  PurchaserData,
  SettlementDateData,
  SubjectToLoanApprovalData,
} from "@/types/offerData"
import { FileText } from "lucide-react"
import { extractFileName } from "./fileHelpers"
import {
  normalizeDepositData,
  formatDepositAmount,
  formatDepositDue,
} from "./depositDataHelpers"

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

  // Normalize deposit data using the helper function
  const normalized = normalizeDepositData(data)
  if (!normalized || normalized.instalments.length === 0) {
    return null
  }

  const { instalments, numInstalments } = normalized
  const hasMultipleInstalments = numInstalments > 1

  return (
    <div className="space-y-3">
      {hasMultipleInstalments ? (
        // Multiple instalments display
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">
            Deposit Information ({numInstalments} instalment
            {numInstalments !== 1 ? "s" : ""})
          </p>
          <div className="mt-2 space-y-3">
            {instalments.map((instalment, index) => (
              <div key={index} className="rounded-md border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Instalment {index + 1}
                </p>
                <div className="space-y-2 pl-4">
                  {instalment.depositType && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Deposit Type
                      </p>
                      <p className="text-sm text-gray-900 capitalize">
                        {instalment.depositType}
                      </p>
                    </div>
                  )}
                  {(instalment.amount !== undefined ||
                    instalment.percentage !== undefined) && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Amount
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDepositAmount(instalment)}
                      </p>
                    </div>
                  )}
                  {(instalment.depositDue !== undefined ||
                    instalment.depositDueText ||
                    instalment.depositDueWithin) && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Deposit Due
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDepositDue(instalment)}
                      </p>
                    </div>
                  )}
                  {instalment.depositHolding && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Deposit Holding
                      </p>
                      <p className="text-sm text-gray-900">
                        {instalment.depositHolding}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Single instalment display
        <div className="space-y-2">
          {instalments[0]?.depositType && (
            <div>
              <p className="text-xs font-medium text-gray-500">Deposit Type</p>
              <p className="text-sm text-gray-900 capitalize">
                {instalments[0].depositType}
              </p>
            </div>
          )}
          {(instalments[0]?.amount !== undefined ||
            instalments[0]?.percentage !== undefined) && (
            <div>
              <p className="text-xs font-medium text-gray-500">
                Deposit Amount
              </p>
              <p className="text-sm text-gray-900">
                {formatDepositAmount(instalments[0])}
              </p>
            </div>
          )}
          {(instalments[0]?.depositDue !== undefined ||
            instalments[0]?.depositDueText ||
            instalments[0]?.depositDueWithin) && (
            <div>
              <p className="text-xs font-medium text-gray-500">Deposit Due</p>
              <p className="text-sm text-gray-900">
                {formatDepositDue(instalments[0])}
              </p>
            </div>
          )}
          {instalments[0]?.depositHolding && (
            <div>
              <p className="text-xs font-medium text-gray-500">
                Deposit Holding
              </p>
              <p className="text-sm text-gray-900">
                {instalments[0].depositHolding}
              </p>
            </div>
          )}
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

  // Handle JSON string parsing if needed
  let purchaserData = data
  if (typeof data === "string") {
    try {
      purchaserData = JSON.parse(data)
    } catch {
      return null
    }
  }

  const dataObj = purchaserData as any
  const { method, scenario, purchasers, representatives, nameFields, idFileUrls } = dataObj

  // Handle single_field method
  if (method === "single_field") {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Purchaser Name</p>
          <p className="text-base text-gray-900">{dataObj.name || "N/A"}</p>
        </div>
        {dataObj.idFileUrl && (
          <div>
            <p className="text-sm font-medium text-gray-500">ID Document</p>
            <a
              href={dataObj.idFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
            >
              <FileText size={14} />
              {extractFileName(dataObj.idFileUrl)}
            </a>
          </div>
        )}
      </div>
    )
  }

  // Handle individual_names method
  if (method === "individual_names") {
    const purchaserEntries: Array<{ key: string; nameData: any; idFileUrl?: string }> = []
    
    // Collect purchasers from nameFields
    if (nameFields && typeof nameFields === "object") {
      Object.entries(nameFields).forEach(([key, nameData]: [string, any]) => {
        purchaserEntries.push({
          key,
          nameData,
          idFileUrl: idFileUrls?.[key],
        })
      })
    }

    // Also check for purchasers array (legacy format)
    const purchasersList = purchasers || []

  return (
    <div className="space-y-3">
      {scenario && (
        <div>
          <p className="text-sm font-medium text-gray-500">Scenario</p>
          <p className="text-base text-gray-900">{scenario}</p>
        </div>
      )}

        {purchaserEntries.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500">Purchasers</p>
            <div className="mt-2 space-y-3">
              {purchaserEntries.map((entry, index) => {
                const { nameData, idFileUrl } = entry
                const fullName = [
                  nameData?.firstName,
                  !nameData?.skipMiddleName && nameData?.middleName,
                  nameData?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")

                return (
                  <div key={entry.key || index} className="rounded-md border p-3">
                    <p className="text-sm font-medium text-gray-700">
                      Purchaser {index + 1}
                    </p>
                    {fullName && (
                      <p className="text-sm text-gray-600">Name: {fullName}</p>
                    )}
                    {nameData?.firstName && (
                      <p className="text-sm text-gray-600">
                        First Name: {nameData.firstName}
                      </p>
                    )}
                    {nameData?.middleName && !nameData?.skipMiddleName && (
                      <p className="text-sm text-gray-600">
                        Middle Name: {nameData.middleName}
                      </p>
                    )}
                    {nameData?.lastName && (
                      <p className="text-sm text-gray-600">
                        Last Name: {nameData.lastName}
                      </p>
                    )}
                    {idFileUrl && (
                      <div className="mt-2">
                        <a
                          href={idFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          <FileText size={14} />
                          {extractFileName(idFileUrl)}
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legacy purchasers array format */}
        {purchasersList.length > 0 && purchaserEntries.length === 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500">Purchasers</p>
            <div className="mt-2 space-y-3">
              {purchasersList.map((purchaser: any, index: number) => (
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
                        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <FileText size={14} />
                        {extractFileName(purchaser.idFileUrl)}
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
                        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <FileText size={14} />
                        {extractFileName(rep.idFileUrl)}
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

  return null
}

// ==================== Settlement Date Formatter ====================

export function formatSettlementDateData(
  data: SettlementDateData,
): React.JSX.Element | null {
  if (!data) return null

  // Handle JSON string parsing if needed
  let settlementData = data
  if (typeof data === "string") {
    try {
      settlementData = JSON.parse(data)
    } catch {
      return null
    }
  }

  const dataObj = settlementData as any
  const {
    date,
    time,
    location,
    dateText,
    locationText,
    settlementDate,
    settlementTime,
    settlementDateTime,
    settlementDateText,
    settlementLocation,
    settlementLocationText,
  } = dataObj

  // Helper to format date
  const formatDateValue = (dateValue: any): string => {
    if (!dateValue) return ""
    if (typeof dateValue === "string") {
      try {
        const dateObj = new Date(dateValue)
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }
      } catch {
        // Fall through
      }
      return dateValue
    }
    return String(dateValue)
  }

  return (
    <div className="space-y-3">
      {/* Handle settlementDate field (from JSON) */}
      {settlementDate && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">
            {formatDateValue(settlementDate)}
            {settlementTime && ` at ${settlementTime}`}
          </p>
        </div>
      )}

      {/* Handle settlementDateTime field */}
      {settlementDateTime && !settlementDate && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">
            {formatDateValue(settlementDateTime)}
          </p>
        </div>
      )}

      {/* Handle date field (legacy) */}
      {date && !settlementDate && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">
            {formatDateValue(date)} {time ? `at ${time}` : ""}
          </p>
        </div>
      )}

      {/* Handle text-based date */}
      {settlementDateText && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">{settlementDateText}</p>
        </div>
      )}

      {dateText && !settlementDateText && (
        <div>
          <p className="text-sm font-medium text-gray-500">Settlement Date</p>
          <p className="text-base text-gray-900">{dateText}</p>
        </div>
      )}

      {/* Handle location */}
      {settlementLocation && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Settlement Location
          </p>
          <p className="text-base text-gray-900">{settlementLocation}</p>
        </div>
      )}

      {location && !settlementLocation && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Settlement Location
          </p>
          <p className="text-base text-gray-900">{location}</p>
        </div>
      )}

      {settlementLocationText && (
        <div>
          <p className="text-sm font-medium text-gray-500">
            Settlement Location
          </p>
          <p className="text-base text-gray-900">{settlementLocationText}</p>
        </div>
      )}

      {locationText && !settlementLocationText && (
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
          <div className="mt-1 space-y-1">
            {attachmentUrls.map((url: string, index: number) => {
              const fileName = extractFileName(url)
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
  const renderFileLink = (url: string, label?: string) => {
    const fileName = extractFileName(url)
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 hover:underline"
      >
        <FileText size={14} />
        {label || fileName}
      </a>
    )
  }

  return (
    <div className="space-y-3">
      {/* Always show subject to loan status */}
      <div>
        <p className="text-sm font-medium text-gray-500">
          Status
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
                    {renderFileLink(
                      url,
                      allSupportingDocs.length > 1
                        ? `Supporting Document ${index + 1}`
                        : undefined,
                    )}
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
                {renderFileLink(
                  url,
                  allEvidenceOfFunds.length > 1
                    ? `Evidence of Funds ${index + 1}`
                    : undefined,
                )}
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
                        const fileName = extractFileName(url)
                        return (
                          <a
                            key={attIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            <FileText size={12} />
                            {fileName}
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
                        const fileName = extractFileName(url)
                        return (
                          <a
                            key={attIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                          >
                            <FileText size={12} />
                            {fileName}
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
