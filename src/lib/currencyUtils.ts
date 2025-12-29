/**
 * Utility functions for currency formatting and display
 */

/**
 * Get currency symbol for a given currency code
 * Returns the symbol that should be used in placeholders and displays
 */
export function getCurrencySymbol(currency: string): string {
  // Use Intl.NumberFormat to get the currency symbol
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    
    // Format a sample number to extract the symbol
    const parts = formatter.formatToParts(1)
    const symbolPart = parts.find((part) => part.type === "currency")
    return symbolPart?.value || currency
  } catch {
    // Fallback to currency code if formatting fails
    return currency
  }
}

/**
 * Get formatted placeholder for currency input
 * Returns placeholder like "$0.00" for USD, "€0.00" for EUR, etc.
 */
export function getCurrencyPlaceholder(currency: string = "USD"): string {
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(0)
  } catch {
    // Fallback to USD format if currency is invalid
    return "$0.00"
  }
}

/**
 * Format a number as currency
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string = "USD",
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback formatting
    return `${currency} ${amount.toLocaleString()}`
  }
}

