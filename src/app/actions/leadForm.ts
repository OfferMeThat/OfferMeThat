"use server"

import {
  QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES,
  DEFAULT_LEAD_QUESTIONS,
} from "@/constants/leadFormQuestions"
import { createClient } from "@/lib/supabase/server"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { QuestionType } from "@/types/form"
import { Listing } from "@/types/listing"
import { LeadWithListing } from "@/types/lead"
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

export const swapQuestionOrders = async (
  questionId1: string,
  order1: number,
  questionId2: string,
  order2: number,
) => {
  const supabase = await createClient()

  // Use a temporary order value to avoid conflicts
  // Use a very large number that's unlikely to conflict
  const tempOrder = 999999

  // First, move question1 to temporary order
  const { error: error1 } = await supabase
    .from("leadFormQuestions")
    .update({ order: tempOrder })
    .eq("id", questionId1)

  if (error1) {
    throw new Error("Failed to update question order")
  }

  // Then, move question2 to its final order
  const { error: error2 } = await supabase
    .from("leadFormQuestions")
    .update({ order: order2 })
    .eq("id", questionId2)

  if (error2) {
    // Try to restore question1 if question2 update fails
    await supabase
      .from("leadFormQuestions")
      .update({ order: order1 })
      .eq("id", questionId1)
    throw new Error("Failed to update question order")
  }

  // Finally, move question1 to its final order
  const { error: error3 } = await supabase
    .from("leadFormQuestions")
    .update({ order: order1 })
    .eq("id", questionId1)

  if (error3) {
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

  // Validation: ensure we don't go beyond the last regular question (exclude submit button)
  // breakIndex represents the question ORDER value after which the break occurs
  // We need to compare against the maximum ORDER value, not the count of questions
  const regularQuestions = allQuestions.filter(
    (q) => q.type !== "submitButton",
  )
  
  if (regularQuestions.length === 0) {
    throw new Error("No regular questions found")
  }
  
  // Find the maximum order value among regular questions
  const maxRegularOrder = Math.max(...regularQuestions.map((q) => q.order))
  
  // Ensure there's at least one question after the break
  if (newBreakIndex >= maxRegularOrder) {
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

type Question = Database["public"]["Tables"]["leadFormQuestions"]["Row"]

export const getFormOwnerListings = async (
  formIdOrOwnerId: string,
  isTestMode: boolean = false,
  isOwnerId: boolean = false,
) => {
  const supabase = await createClient()

  let ownerId: string

  if (isOwnerId) {
    // Direct owner ID provided
    ownerId = formIdOrOwnerId
  } else {
    // Get the form to find the owner
    const { data: form, error: formError } = await supabase
      .from("leadForms")
      .select("ownerId")
      .eq("id", formIdOrOwnerId)
      .single()

    if (formError || !form) {
      throw new Error("Failed to fetch form")
    }

    ownerId = form.ownerId
  }

  // Build query to get listings for the owner, filtering by isTest status
  let query = supabase
    .from("listings")
    .select("id, address, status, isTest")
    .eq("createdBy", ownerId)
    .order("createdAt", { ascending: false })

  // Filter by isTest based on mode
  if (isTestMode) {
    // Test mode: show only test listings
    query = query.eq("isTest", true)
  } else {
    // Real mode: show only non-test listings (null or false)
    query = query.or("isTest.is.null,isTest.eq.false")
  }

  const { data: listings, error: listingsError } = await query

  if (listingsError) {
    console.error("Failed to fetch listings:", listingsError)
    throw new Error("Failed to fetch listings")
  }

  return listings || []
}

interface SaveLeadParams {
  formData: Record<string, any>
  questions: Question[]
  formId: string
}

// Helper to get a random uuid (works in most recent Node/Browser)
const getTempId = () => {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Saves a lead to the database with all form data
 * Handles file uploads to Supabase Storage
 */
export const saveLead = async ({
  formData,
  questions,
  formId,
}: SaveLeadParams): Promise<{
  success: boolean
  leadId?: string
  error?: string
}> => {
  try {
    const supabase = await createClient()
    const { transformFormDataToLead } = await import("@/lib/transformLeadData")
    const { uploadFileToStorage, uploadMultipleFilesToStorage } = await import(
      "@/lib/supabase/storage"
    )
    
    // Generate temp leadId for storage file path before DB insert
    const tempLeadId = getTempId()

    // Transform form data to database schema
    // Note: Files should already be uploaded client-side and replaced with URLs
    const leadData = transformFormDataToLead(formData, questions, formId)

    // Insert lead into database
    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select("id")
      .single()

    if (error) {
      console.error("Error saving lead:", error)
      return { success: false, error: error.message }
    }

    if (!lead) {
      return { success: false, error: "Failed to create lead" }
    }

    return { success: true, leadId: lead.id }
  } catch (error: any) {
    console.error("Error in saveLead:", error)
    return { success: false, error: error.message || "Failed to save lead" }
  }
}

export type LeadFilters = {
  nameSearch: string
  listingId: string | null
  dateRange: { from: string | null; to: string | null }
}

export async function getAllListingsForLeads(): Promise<Listing[] | null> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Only fetch listings created by the current user
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("createdBy", user.id)
    .order("address", { ascending: true })

  if (!listings || error) {
    console.error("Error fetching listings:", error)
    return null
  }

  return listings
}

export async function getFilteredLeads(
  filters: LeadFilters,
): Promise<LeadWithListing[] | null> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Get user's lead form(s)
  const { data: userForms, error: formsError } = await supabase
    .from("leadForms")
    .select("id")
    .eq("ownerId", user.id)

  if (formsError || !userForms || userForms.length === 0) {
    // User has no forms, return empty array
    return []
  }

  const userFormIds = userForms.map((form) => form.id)

  // Start building the query with listing join
  let query = supabase.from("leads").select("*, listings(*)")

  // Filter by user's formIds
  query = query.in("formId", userFormIds)

  // Apply listing filter
  if (filters.listingId) {
    query = query.eq("listingId", filters.listingId)
  }

  // Apply date range filter (on createdAt)
  if (filters.dateRange.from) {
    query = query.gte("createdAt", filters.dateRange.from)
  }
  if (filters.dateRange.to) {
    query = query.lte("createdAt", filters.dateRange.to)
  }

  // Execute the query
  const { data: leads, error } = await query.order("createdAt", {
    ascending: false,
  })

  if (!leads || error) {
    console.error("Error fetching filtered leads:", error)
    return null
  }

  // Transform the data to match LeadWithListing type
  let transformedLeads = leads.map((lead: any) => ({
    ...lead,
    listing: Array.isArray(lead.listings)
      ? lead.listings[0] || null
      : lead.listings || null,
  })) as LeadWithListing[]

  // Apply name search client-side (searches in listing address, custom listing address, submitter name, and email)
  if (filters.nameSearch) {
    const searchLower = filters.nameSearch.toLowerCase()
    transformedLeads = transformedLeads.filter((lead) => {
      const listingAddress = (lead.listing?.address || "").toLowerCase()
      const customAddress = (lead.customListingAddress || "").toLowerCase()
      const submitterName = `${lead.submitterFirstName || ""} ${lead.submitterLastName || ""}`.toLowerCase()
      const submitterEmail = (lead.submitterEmail || "").toLowerCase()
      return (
        listingAddress.includes(searchLower) ||
        customAddress.includes(searchLower) ||
        submitterName.includes(searchLower) ||
        submitterEmail.includes(searchLower)
      )
    })
  }

  return transformedLeads
}

export async function getUnassignedLeads(): Promise<
  LeadWithListing[] | null
> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("User not authenticated")
    return null
  }

  // Get user's lead form(s)
  const { data: userForms, error: formsError } = await supabase
    .from("leadForms")
    .select("id")
    .eq("ownerId", user.id)

  if (formsError || !userForms || userForms.length === 0) {
    // User has no forms, return empty array
    return []
  }

  const userFormIds = userForms.map((form) => form.id)

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*, listings(*)")
    .is("listingId", null)
    .in("formId", userFormIds)
    .order("createdAt", { ascending: false })

  if (!leads || error) {
    console.error("Error fetching unassigned leads:", error)
    return null
  }

  // Transform the data to match LeadWithListing type
  const transformedLeads = leads.map((lead: any) => ({
    ...lead,
    listing: Array.isArray(lead.listings)
      ? lead.listings[0] || null
      : lead.listings || null,
  })) as LeadWithListing[]

  return transformedLeads
}

export async function deleteLeads(
  leadIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("leads").delete().in("id", leadIds)

    if (error) {
      console.error("Error deleting leads:", error)
      return {
        success: false,
        error: error.message || "Failed to delete leads",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteLeads:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function assignLeadsToListing(
  leadIds: string[],
  listingId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // First, verify the listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .single()

    if (listingError || !listing) {
      return {
        success: false,
        error: "Listing not found",
      }
    }

    // Update leads: set listingId, clear customListingAddress
    const { error } = await supabase
      .from("leads")
      .update({
        listingId: listingId,
        customListingAddress: null,
      })
      .in("id", leadIds)

    if (error) {
      console.error("Error assigning leads to listing:", error)
      return {
        success: false,
        error: error.message || "Failed to assign leads to listing",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in assignLeadsToListing:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred",
    }
  }
}

export async function getLeadById(
  leadId: string,
): Promise<LeadWithListing | null> {
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*, listings(*)")
    .eq("id", leadId)
    .single()

  if (!lead || error) {
    console.error("Error fetching lead:", error)
    return null
  }

  // Transform the data to match LeadWithListing type
  const transformedLead = {
    ...lead,
    listing: Array.isArray(lead.listings)
      ? lead.listings[0] || null
      : lead.listings || null,
  } as LeadWithListing

  return transformedLead
}

