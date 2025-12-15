import { FileText } from "lucide-react"

/**
 * Utilities for formatting lead data for display
 */

// ==================== Helper Functions ====================

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

// ==================== Enum Formatters ====================

export function formatSubmitterRole(
  role: string | null | undefined,
): string {
  if (!role) return "N/A"
  
  // Map enum values to labels
  if (role === "buyerSelf") {
    return "Lead"
  }
  if (role === "buyerWithAgent") {
    return "Lead & Agent"
  }
  if (role === "buyersAgent") {
    return "Agent"
  }
  
  // Fallback for any other values
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Get badge variant for submitter role
 */
export function getRoleBadgeVariant(
  role: string | null | undefined,
): "default" | "secondary" | "outline" | "destructive" | "success" {
  if (!role) return "outline"
  
  if (role === "buyerSelf") {
    return "success" // Blue/primary color for "Lead"
  }
  if (role === "buyerWithAgent") {
    return "secondary" // Purple/secondary color for "Lead & Agent"
  }
  if (role === "buyersAgent") {
    return "secondary" // Purple/secondary color for "Agent"
  }
  
  return "outline"
}

export function formatAreYouInterested(
  interested: string | null | undefined,
): string {
  if (!interested) return "N/A"
  
  // Map enum values to human-readable strings
  if (interested === "yesVeryInterested") {
    return "Yes, very interested"
  }
  if (interested === "yes") {
    return "Yes"
  }
  if (interested === "no") {
    return "No"
  }
  if (interested === "maybe") {
    return "Maybe"
  }
  
  // Fallback for any other values
  return interested
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function formatFollowAllListings(
  follow: string | null | undefined,
): string {
  if (!follow) return "N/A"
  if (follow === "thisAndFuture") {
    return "Yes, follow this listing and all future listings"
  }
  if (follow === "thisOnly") {
    return "Yes, follow this listing only"
  }
  return follow
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function formatFinanceInterest(
  interest: string | null | undefined,
): string {
  if (!interest) return "N/A"
  return interest.charAt(0).toUpperCase() + interest.slice(1)
}

// ==================== Message to Agent Formatter ====================

export function formatMessageToAgent(data: any): React.JSX.Element | null {
  if (!data) return null

  // Handle string message
  if (typeof data === "string") {
    return <p className="whitespace-pre-wrap text-gray-900">{data}</p>
  }

  if (typeof data !== "object") return null

  const messageData = data as { message?: string; attachmentUrls?: string[] }
  const message = messageData.message

  // Collect all attachment URLs
  const attachments: string[] = []
  if (messageData.attachmentUrls) {
    attachments.push(...messageData.attachmentUrls)
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

