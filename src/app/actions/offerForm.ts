"use server"

import { createClient } from "@/lib/supabase/server"
import { QuestionType } from "@/types/form"

interface DefaultQuestion {
  type: QuestionType
  order: number
  required: boolean
  payload: {
    label: string
    placeholder?: string
    description?: string
  }
}

const DEFAULT_QUESTIONS: DefaultQuestion[] = [
  {
    type: "specifyListing",
    order: 1,
    required: true,
    payload: {
      label: "What listing are you interested in?",
      placeholder: "Specify the listing here...",
      description: "SPECIFY LISTING",
    },
  },
  {
    type: "submitterRole",
    order: 2,
    required: true,
    payload: {
      label: "What is your role?",
      description: "SUBMITTER ROLE",
    },
  },
  {
    type: "submitterName",
    order: 3,
    required: true,
    payload: {
      label: "What is your name?",
      placeholder: "First Name",
      description: "SUBMITTER NAME",
    },
  },
  {
    type: "submitterEmail",
    order: 4,
    required: true,
    payload: {
      label: "What is your email?",
      placeholder: "Email",
      description: "SUBMITTER EMAIL",
    },
  },
  {
    type: "submitterPhone",
    order: 5,
    required: true,
    payload: {
      label: "What is your phone number?",
      placeholder: "Phone",
      description: "SUBMITTER PHONE",
    },
  },
  {
    type: "offerAmount",
    order: 6,
    required: true,
    payload: {
      label: "What is your offer amount?",
      placeholder: "$0.00",
      description: "OFFER AMOUNT",
    },
  },
  {
    type: "submitButton",
    order: 7,
    required: true,
    payload: {
      label: "Submit Offer",
      description: "SUBMIT BUTTON",
    },
  },
]

export const getOrCreateOfferForm = async () => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data: existingForm } = await supabase
    .from("offerForms")
    .select("id")
    .eq("ownerId", user.id)
    .single()

  if (existingForm) {
    return existingForm.id
  }

  const { data: newForm, error: formError } = await supabase
    .from("offerForms")
    .insert({ ownerId: user.id })
    .select("id")
    .single()

  if (formError || !newForm) {
    throw new Error("Failed to create form")
  }

  const { data: page, error: pageError } = await supabase
    .from("offerFormPages")
    .insert({
      formId: newForm.id,
      title: "Offer Form",
      description: "Submit your offer",
      order: 1,
    })
    .select("id")
    .single()

  if (pageError || !page) {
    throw new Error("Failed to create page")
  }

  const questions = DEFAULT_QUESTIONS.map((q) => ({
    formId: newForm.id,
    pageId: page.id,
    type: q.type,
    order: q.order,
    required: q.required,
    payload: q.payload,
  }))

  const { error: questionsError } = await supabase
    .from("offerFormQuestions")
    .insert(questions)

  if (questionsError) {
    throw new Error("Failed to create questions")
  }

  return newForm.id
}

export const getFormQuestions = async (formId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("offerFormQuestions")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (error) {
    throw new Error("Failed to fetch questions")
  }

  return data
}

export const updateQuestionOrder = async (
  questionId: string,
  newOrder: number,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from("offerFormQuestions")
    .update({ order: newOrder })
    .eq("id", questionId)

  if (error) {
    throw new Error("Failed to update question order")
  }
}

export const deleteQuestion = async (questionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from("offerFormQuestions")
    .delete()
    .eq("id", questionId)

  if (error) {
    throw new Error("Failed to delete question")
  }
}

export const resetFormToDefault = async (formId: string) => {
  const supabase = await createClient()

  // Get the page ID for this form
  const { data: page } = await supabase
    .from("offerFormPages")
    .select("id")
    .eq("formId", formId)
    .single()

  if (!page) {
    throw new Error("Failed to find form page")
  }

  // Delete all existing questions
  const { error: deleteError } = await supabase
    .from("offerFormQuestions")
    .delete()
    .eq("formId", formId)

  if (deleteError) {
    throw new Error("Failed to delete existing questions")
  }

  // Insert default questions
  const questions = DEFAULT_QUESTIONS.map((q) => ({
    formId: formId,
    pageId: page.id,
    type: q.type,
    order: q.order,
    required: q.required,
    payload: q.payload,
  }))

  const { error: insertError } = await supabase
    .from("offerFormQuestions")
    .insert(questions)

  if (insertError) {
    throw new Error("Failed to create default questions")
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
    .from("offerFormQuestions")
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
    .from("offerFormPages")
    .select("*")
    .eq("formId", formId)
    .order("order", { ascending: true })

  if (!pages || pages.length === 0) {
    throw new Error("No pages found")
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
        .from("offerFormPages")
        .update({ order: page.order + 1 })
        .eq("id", page.id)
    }
  }

  // Create new page with breakIndex set to the question order
  const { data: newPage, error: pageError } = await supabase
    .from("offerFormPages")
    .insert({
      formId,
      title: `Page ${newPageOrder}`,
      description: null,
      order: newPageOrder,
      breakIndex: afterQuestionOrder, // Store where the break occurs
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

  console.log("Questions to move:", questionsToMove.length)
  console.log(
    "Moving questions with orders:",
    questionsToMove.map((q) => q.order),
  )
  console.log("To new page:", newPage.id)

  if (questionsToMove.length > 0) {
    const questionIds = questionsToMove.map((q) => q.id)

    const { error: moveError } = await supabase
      .from("offerFormQuestions")
      .update({ pageId: newPage.id })
      .in("id", questionIds)

    if (moveError) {
      console.error("Error moving questions:", moveError)
      throw new Error(`Failed to move questions: ${moveError.message}`)
    }
  }

  return newPage.id
}
