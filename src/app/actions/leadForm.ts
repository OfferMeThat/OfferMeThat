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

  // Normalize setupConfig for questions that need it
  if (data) {
    return data.map((question) => {
      const setupConfig = (question.setupConfig as Record<string, any>) || {}
      
      // Ensure multiChoiceSelect arrays are properly formatted
      if (question.type === "areYouInterested" && setupConfig.options) {
        // Ensure options is an array
        if (!Array.isArray(setupConfig.options)) {
          setupConfig.options = []
        }
      }
      
      return {
        ...question,
        setupConfig,
      }
    })
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

export const addQuestion = async (
  formId: string,
  questionType: QuestionType,
  afterOrder: number,
  setupConfig?: Record<string, any>,
  uiConfigOverride?: Record<string, any>,
) => {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Verify form ownership
  const { data: form, error: formError } = await supabase
    .from("leadForms")
    .select("ownerId")
    .eq("id", formId)
    .single()

  if (formError || !form) {
    throw new Error("Form not found")
  }

  if (form.ownerId !== user.id) {
    throw new Error("Unauthorized access to form")
  }

  // Get all questions to determine new order
  const { data: allQuestions } = await supabase
    .from("leadFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allQuestions) {
    throw new Error("Failed to fetch questions")
  }

  // Find the question after which we're inserting
  const afterQuestion = allQuestions.find((q) => q.order === afterOrder)

  if (!afterQuestion) {
    throw new Error("Question not found")
  }

  // Get the page for the new question
  const newPageId = afterQuestion.pageId

  if (!newPageId) {
    throw new Error("Question page ID is null")
  }

  // Increment order of all questions after the insertion point
  // We need to update in reverse order to avoid conflicts
  const questionsToUpdate = allQuestions
    .filter((q) => q.order > afterOrder)
    .sort((a, b) => b.order - a.order) // Sort descending to update from highest to lowest

  // Update all orders first, starting from the highest to avoid conflicts
  for (const question of questionsToUpdate) {
    const { error: updateError } = await supabase
      .from("leadFormQuestions")
      .update({ order: question.order + 1 })
      .eq("id", question.id)

    if (updateError) {
      console.error("Error updating question order:", updateError)
      throw new Error(`Failed to update question order: ${updateError.message}`)
    }
  }

  // Get default UI config from constants
  const defaultLabel = QUESTION_TYPE_TO_LABEL[questionType] || questionType
  const defaultUIConfig = {
    label: defaultLabel,
    ...uiConfigOverride,
  }

  // Insert new question
  const insertData = {
    formId,
    pageId: newPageId,
    type: questionType,
    order: afterOrder + 1,
    required: REQUIRED_QUESTION_TYPES.includes(questionType),
    uiConfig: defaultUIConfig as any,
    setupConfig: (setupConfig || {}) as any,
  }

  const { data: newQuestion, error: insertError } = await supabase
    .from("leadFormQuestions")
    .insert(insertData)
    .select()
    .single()

  if (insertError) {
    console.error("Error inserting lead form question:", insertError)
    console.error("Insert data:", JSON.stringify(insertData, null, 2))
    throw new Error(`Failed to add question: ${insertError.message}`)
  }

  if (!newQuestion) {
    console.error("No question returned from insert")
    console.error("Insert data:", JSON.stringify(insertData, null, 2))
    throw new Error("Failed to add question: No data returned")
  }

  return newQuestion
}

export const updateQuestionOrder = async (
  questionId: string,
  newOrder: number,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from("leadFormQuestions")
    .update({ order: newOrder })
    .eq("id", questionId)

  if (error) {
    throw new Error("Failed to update question order")
  }
}

export const deleteQuestion = async (questionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from("leadFormQuestions")
    .delete()
    .eq("id", questionId)

  if (error) {
    throw new Error("Failed to delete question")
  }
}

export const updateQuestion = async (
  questionId: string,
  updates: Record<string, any>,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from("leadFormQuestions")
    .update(updates)
    .eq("id", questionId)

  if (error) {
    throw new Error("Failed to update question")
  }
}

export const resetFormToDefault = async (formId: string) => {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Verify form ownership
  const { data: form, error: formError } = await supabase
    .from("leadForms")
    .select("ownerId")
    .eq("id", formId)
    .single()

  if (formError || !form) {
    throw new Error("Form not found")
  }

  if (form.ownerId !== user.id) {
    throw new Error("Unauthorized access to form")
  }

  // Get all pages for this form
  const { data: allPages } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allPages || allPages.length === 0) {
    throw new Error("Failed to find form pages")
  }

  // Get the first page (the one without breakIndex)
  const firstPage = allPages.find((p) => p.breakIndex === null)

  if (!firstPage) {
    throw new Error("Failed to find first page")
  }

  // Delete all existing questions FIRST (this is important to avoid order conflicts)
  const { error: deleteQuestionsError } = await supabase
    .from("leadFormQuestions")
    .delete()
    .eq("formId", formId)

  if (deleteQuestionsError) {
    console.error("Error deleting questions:", deleteQuestionsError)
    throw new Error(
      `Failed to delete existing questions: ${deleteQuestionsError.message}`,
    )
  }

  // Delete all page breaks (pages with breakIndex) AFTER deleting questions
  // This ensures foreign key constraints are satisfied
  const pageBreaksToDelete = allPages.filter((p) => p.breakIndex !== null)

  if (pageBreaksToDelete.length > 0) {
    const pageBreakIds = pageBreaksToDelete.map((p) => p.id)

    const { data: deleteData, error: deletePageError } = await supabase
      .from("leadFormPages")
      .delete()
      .in("id", pageBreakIds)
      .select()

    if (deletePageError) {
      console.error("Error deleting page breaks:", deletePageError)
      throw new Error(
        `Failed to delete page breaks: ${deletePageError.message}`,
      )
    }

    if (!deleteData || deleteData.length === 0) {
      console.warn("No page breaks were deleted - possible RLS issue")
    }
  }

  // Reset the first page's order to 1 (in case it was changed)
  const { error: resetPageError } = await supabase
    .from("leadFormPages")
    .update({ order: 1 })
    .eq("id", firstPage.id)

  if (resetPageError) {
    console.error("Error resetting page order:", resetPageError)
    throw new Error(`Failed to reset page order: ${resetPageError.message}`)
  }

  // Insert default questions (all assigned to first page)
  // Ensure orders are sequential starting from 1
  const questions = DEFAULT_LEAD_QUESTIONS.map((q) => ({
    formId: formId,
    pageId: firstPage.id,
    type: q.type,
    order: q.order, // These should be 1, 2, 3, 4, 5, 6
    required: q.required,
    uiConfig: q.uiConfig,
    setupConfig: q.setupConfig || {},
  }))

  const { error: insertError } = await supabase
    .from("leadFormQuestions")
    .insert(questions)

  if (insertError) {
    console.error("Error inserting default questions:", insertError)
    console.error("Questions data:", JSON.stringify(questions, null, 2))
    throw new Error(
      `Failed to create default questions: ${insertError.message}`,
    )
  }

  return true
}

export const createPageBreak = async (
  formId: string,
  afterQuestionOrder: number,
) => {
  const supabase = await createClient()

  // Get all questions for this form
  const { data: allQuestions } = await supabase
    .from("leadFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allQuestions || allQuestions.length === 0) {
    throw new Error("No questions found")
  }

  // Find the question at the specified order
  const currentQuestion = allQuestions.find(
    (q) => q.order === afterQuestionOrder,
  )

  if (!currentQuestion) {
    throw new Error(`Question not found at order ${afterQuestionOrder}`)
  }

  // Get all pages for this form
  const { data: pages } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!pages || pages.length === 0) {
    throw new Error("No pages found")
  }

  // Check if a page break already exists at this index
  const existingBreakAtIndex = pages.find(
    (p) => p.breakIndex === afterQuestionOrder,
  )

  if (existingBreakAtIndex) {
    console.error("A page break already exists at this position")
    return false
  }

  // Find the current page
  const currentPage = pages.find((p) => p.id === currentQuestion.pageId)

  if (!currentPage) {
    throw new Error("Current page not found")
  }

  const newPageOrder = currentPage.order + 1

  // Increment order of all pages after the current one
  for (const page of pages) {
    if (page.order >= newPageOrder) {
      await supabase
        .from("leadFormPages")
        .update({ order: page.order + 1 })
        .eq("id", page.id)
    }
  }

  // Create new page with breakIndex set to the question order
  const { data: newPage, error: pageError } = await supabase
    .from("leadFormPages")
    .insert({
      formId,
      title: `Page ${newPageOrder}`,
      description: null,
      order: newPageOrder,
      breakIndex: afterQuestionOrder,
    })
    .select("id")
    .single()

  if (pageError || !newPage) {
    console.error("Page creation error:", pageError)
    throw new Error("Failed to create page")
  }

  // Move all questions after the break to the new page
  const questionsToMove = allQuestions.filter(
    (q) => q.order > afterQuestionOrder,
  )

  if (questionsToMove.length > 0) {
    const questionIds = questionsToMove.map((q) => q.id)

    const { error: moveError } = await supabase
      .from("leadFormQuestions")
      .update({ pageId: newPage.id })
      .in("id", questionIds)

    if (moveError) {
      console.error("Error moving questions:", moveError)
      throw new Error(`Failed to move questions: ${moveError.message}`)
    }
  }

  return newPage.id
}

export const deletePageBreak = async (pageId: string, formId: string) => {
  const supabase = await createClient()

  // Get the page to delete
  const { data: pageToDelete } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("id", pageId)
    .single()

  if (!pageToDelete) {
    throw new Error("Page not found")
  }

  // Can't delete the first page (it has no breakIndex)
  if (!pageToDelete.breakIndex) {
    throw new Error("Cannot delete the first page")
  }

  // Get all pages for this form
  const { data: allPages } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allPages) {
    throw new Error("Failed to fetch pages")
  }

  // Find the previous page (the one before this break)
  const previousPage = allPages.find((p) => p.order === pageToDelete.order - 1)

  if (!previousPage) {
    throw new Error("Previous page not found")
  }

  // Find the next page break (if it exists)
  const nextPage = allPages.find((p) => p.order === pageToDelete.order + 1)

  // Get all questions
  const { data: allQuestions } = await supabase
    .from("leadFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allQuestions) {
    throw new Error("Failed to fetch questions")
  }

  // Determine which questions to move to the previous page
  const questionsToMove = allQuestions.filter((q) => {
    if (nextPage && nextPage.breakIndex !== null) {
      return (
        pageToDelete.breakIndex !== null &&
        q.order > pageToDelete.breakIndex &&
        q.order <= nextPage.breakIndex
      )
    } else {
      return (
        pageToDelete.breakIndex !== null && q.order > pageToDelete.breakIndex
      )
    }
  })

  // Move the questions to the previous page
  if (questionsToMove.length > 0) {
    const questionIds = questionsToMove.map((q) => q.id)

    const { error: moveError } = await supabase
      .from("leadFormQuestions")
      .update({ pageId: previousPage.id })
      .in("id", questionIds)

    if (moveError) {
      console.error("Error moving questions:", moveError)
      throw new Error(`Failed to move questions: ${moveError.message}`)
    }
  }

  // Delete the page
  const { data: deleteData, error: deleteError } = await supabase
    .from("leadFormPages")
    .delete()
    .eq("id", pageId)
    .select()

  if (deleteError) {
    throw new Error(`Failed to delete page: ${deleteError.message}`)
  }

  // Update order of remaining pages
  const remainingPages = allPages.filter((p) => p.order > pageToDelete.order)

  if (remainingPages.length > 0) {
    for (const page of remainingPages) {
      await supabase
        .from("leadFormPages")
        .update({ order: page.order - 1 })
        .eq("id", page.id)
    }
  }

  return true
}

export const movePageBreak = async (
  pageId: string,
  formId: string,
  direction: "up" | "down",
) => {
  const supabase = await createClient()

  // Get the page to move
  const { data: pageToMove } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("id", pageId)
    .single()

  if (!pageToMove || pageToMove.breakIndex === null) {
    throw new Error("Page not found or has no break index")
  }

  // Get all pages for this form
  const { data: allPages } = await supabase
    .from("leadFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allPages) {
    throw new Error("Failed to fetch pages")
  }

  // Get all questions to determine valid move range
  const { data: allQuestions } = await supabase
    .from("leadFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!allQuestions || allQuestions.length === 0) {
    throw new Error("No questions found")
  }

  const currentBreakIndex = pageToMove.breakIndex
  const newBreakIndex =
    direction === "up" ? currentBreakIndex - 1 : currentBreakIndex + 1

  // Validation: ensure minimum 1 question at the top
  if (newBreakIndex < 1) {
    throw new Error(
      "Cannot move break: must have at least 1 question at the top",
    )
  }

  // Validation: ensure we don't go beyond the last question
  if (newBreakIndex >= allQuestions.length) {
    throw new Error(
      "Cannot move break: must have at least 1 question at the bottom",
    )
  }

  // Find adjacent page breaks
  const previousBreak = allPages
    .filter((p) => p.breakIndex !== null && p.breakIndex < currentBreakIndex)
    .sort((a, b) => (b.breakIndex || 0) - (a.breakIndex || 0))[0]

  const nextBreak = allPages
    .filter((p) => p.breakIndex !== null && p.breakIndex > currentBreakIndex)
    .sort((a, b) => (a.breakIndex || 0) - (b.breakIndex || 0))[0]

  // Validation: ensure minimum 1 question between breaks
  if (
    direction === "up" &&
    previousBreak &&
    previousBreak.breakIndex !== null
  ) {
    if (newBreakIndex <= previousBreak.breakIndex) {
      throw new Error(
        "Cannot move break: must have at least 1 question between breaks",
      )
    }
  }

  if (direction === "down" && nextBreak && nextBreak.breakIndex !== null) {
    if (newBreakIndex >= nextBreak.breakIndex) {
      throw new Error(
        "Cannot move break: must have at least 1 question between breaks",
      )
    }
  }

  // Update the breakIndex
  const { data: updateData, error: updateError } = await supabase
    .from("leadFormPages")
    .update({ breakIndex: newBreakIndex })
    .eq("id", pageId)
    .select()

  if (updateError) {
    throw new Error(`Failed to update break index: ${updateError.message}`)
  }

  if (!updateData || updateData.length === 0) {
    throw new Error(
      "Failed to update break index: No rows updated (possible RLS issue)",
    )
  }

  // Now we need to move the question at the new break index to the appropriate page
  const questionAtNewIndex = allQuestions.find((q) => q.order === newBreakIndex)

  if (questionAtNewIndex) {
    if (direction === "up") {
      // Moving up: the question at newBreakIndex should stay on the previous page
      // All questions after newBreakIndex should move to pageToMove
      const questionsToMove = allQuestions.filter(
        (q) => q.order > newBreakIndex,
      )

      if (questionsToMove.length > 0) {
        const questionIds = questionsToMove.map((q) => q.id)
        await supabase
          .from("leadFormQuestions")
          .update({ pageId: pageToMove.id })
          .in("id", questionIds)
      }
    } else {
      // Moving down: the question at newBreakIndex should move to pageToMove
      // Find the previous page
      const previousPage = allPages.find(
        (p) => p.order === pageToMove.order - 1,
      )

      if (previousPage) {
        await supabase
          .from("leadFormQuestions")
          .update({ pageId: previousPage.id })
          .eq("id", questionAtNewIndex.id)
      }
    }
  }

  return true
}

