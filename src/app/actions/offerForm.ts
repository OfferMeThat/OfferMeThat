"use server"

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/supabase"

type QuestionType = Database["public"]["Enums"]["questionType"]

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
