/**
 * Branding configuration for offer forms
 */
export interface BrandingConfig {
  backgroundColor: string
  backgroundImage: string | null // URL to image in formImages bucket
  logo: string | null // URL to image in logos bucket
  fontColor: string
  fieldColor: string
  buttonColor: string
  buttonTextColor: string
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  backgroundColor: "#ffffff",
  backgroundImage: null,
  logo: null,
  fontColor: "#000000",
  fieldColor: "#ffffff",
  buttonColor: "#14b8a6", // teal-500
  buttonTextColor: "#000000",
}

