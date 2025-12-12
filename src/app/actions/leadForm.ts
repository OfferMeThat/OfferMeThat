"use server"

import {
  QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES,
  DEFAULT_LEAD_QUESTIONS,
} from "@/constants/leadFormQuestions"
import { createClient } from "@/lib/supabase/server"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"

export const getOrCreateLeadForm = async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data: existingForm } = await supabase
    .from("leadForms")
    .select("id")
    .eq("ownerId", user.id)
    .single()

  if (existingForm) {
    return existingForm.id
  }

  const { data: newForm, error: formError } = await supabase
    .from("leadForms")
    .insert({ ownerId: user.id })
    .select("id")
    .single()

  if (formError || !newForm) {
    throw new Error("Failed to create form")
  }

  const { data: page, error: pageError } = await supabase
    .from("leadFormPages")
    .insert({
      formId: newForm.id,
      title: "Lead Form",
      description: "Submit your lead",
      order: 1,
    })
    .select("id")
    .single()

  if (pageError || !page) {
    throw new Error("Failed to create page")
  }

  const questions = DEFAULT_LEAD_QUESTIONS.map((q) => ({
    formId: newForm.id,
    pageId: page.id,
    type: q.type,
    order: q.order,
    required: q.required,
    uiConfig: q.uiConfig,
    setupConfig: q.setupConfig || {},
  }))

  const { error: questionsError } = await supabase
    .from("leadFormQuestions")
    .insert(questions)

  if (questionsError) {
    throw new Error("Failed to create questions")
  }

  return newForm.id
}

export const getFormQuestions = async (formId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leadFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (error) {
    throw new Error("Failed to fetch questions")
  }

  return data
}

export const getFormPages = async (formId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (error) {
    throw new Error("Failed to fetch pages")
  }

  return data
}

export const getBrandingConfig = async (
  formId: string,
): Promise<BrandingConfig> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data: form, error } = await supabase
    .from("leadForms")
    .select("brandingConfig, ownerId")
    .eq("id", formId)
    .single()

  if (error) {
    console.error("Error fetching branding config:", error)
    throw new Error("Failed to fetch branding config")
  }

  if (!form || form.ownerId !== user.id) {
    throw new Error("Unauthorized access to form")
  }

  // Return branding config or default if null
  if (form.brandingConfig) {
    return form.brandingConfig as unknown as BrandingConfig
  }

  return DEFAULT_BRANDING_CONFIG
}

/**
 * Public version of getBrandingConfig - doesn't require authentication
 * Used for public form views where users access the form
 */
export const getPublicBrandingConfig = async (
  formId: string,
): Promise<BrandingConfig> => {
  const supabase = await createClient()

  const { data: form, error } = await supabase
    .from("leadForms")
    .select("brandingConfig")
    .eq("id", formId)
    .single()

  if (error) {
    console.error("Error fetching public branding config:", error)
    // Return default config instead of throwing error for public access
    return DEFAULT_BRANDING_CONFIG
  }

  // Return branding config or default if null
  if (form?.brandingConfig) {
    return form.brandingConfig as unknown as BrandingConfig
  }

  return DEFAULT_BRANDING_CONFIG
}

/**
 * Get the owner's profile picture URL from the form
 * Works for both authenticated and public access
 */
export const getFormOwnerProfilePicture = async (
  formId: string,
): Promise<string | null> => {
  const supabase = await createClient()

  const { data: form, error: formError } = await supabase
    .from("leadForms")
    .select("ownerId")
    .eq("id", formId)
    .single()

  if (formError || !form) {
    console.error("Error fetching form owner:", formError)
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatarUrl")
    .eq("id", form.ownerId)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching owner profile:", profileError)
    return null
  }

  return profile.avatarUrl
}

/**
 * Get form data by username (public access)
 * Returns form ID, questions, pages, branding, profile picture, and owner name
 */
export const getFormByUsername = async (username: string) => {
  const supabase = await createClient()

  // First, get the profile by username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, fullName, avatarUrl")
    .eq("username", username)
    .single()

  if (profileError || !profile) {
    return null // Username doesn't exist
  }

  // Get the form for this user
  const { data: form, error: formError } = await supabase
    .from("leadForms")
    .select("id, brandingConfig")
    .eq("ownerId", profile.id)
    .single()

  if (formError || !form) {
    // User exists but no form - return default form structure
    return {
      formId: null,
      ownerId: profile.id,
      questions: [],
      pages: [],
      brandingConfig: DEFAULT_BRANDING_CONFIG,
      profilePictureUrl: profile.avatarUrl,
      ownerName: profile.fullName,
    }
  }

  // Get questions and pages
  const [questionsResult, pagesResult] = await Promise.all([
    supabase
      .from("leadFormQuestions")
      .select("*")
      .eq("formId", form.id)
      .order("order", { ascending: true }),
    supabase
      .from("leadFormPages")
      .select("*")
      .eq("formId", form.id)
      .order("order", { ascending: true }),
  ])

  const questions = questionsResult.data || []
  const pages = pagesResult.data || []

  // Get branding config
  const brandingConfig = form.brandingConfig
    ? (form.brandingConfig as unknown as BrandingConfig)
    : DEFAULT_BRANDING_CONFIG

  return {
    formId: form.id,
    ownerId: profile.id,
    questions,
    pages,
    brandingConfig,
    profilePictureUrl: profile.avatarUrl,
    ownerName: profile.fullName,
  }
}

export const saveBrandingConfig = async (
  formId: string,
  config: BrandingConfig,
): Promise<void> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Verify ownership
  const { data: form } = await supabase
    .from("leadForms")
    .select("ownerId")
    .eq("id", formId)
    .single()

  if (!form || form.ownerId !== user.id) {
    throw new Error("Unauthorized access to form")
  }

  // Save branding config
  const { error } = await supabase
    .from("leadForms")
    .update({
      brandingConfig:
        config as unknown as Database["public"]["Tables"]["leadForms"]["Row"]["brandingConfig"],
    })
    .eq("id", formId)

  if (error) {
    console.error("Error saving branding config:", error)
    throw new Error("Failed to save branding config")
  }
}

