"use client"

import {
  addQuestion,
  createPageBreak,
  deletePageBreak,
  deleteQuestion,
  getBrandingConfig,
  getFormOwnerProfilePicture,
  getFormPages,
  getFormQuestions,
  getOrCreateOfferForm,
  movePageBreak,
  resetFormToDefault,
  updateQuestion,
  updateQuestionOrder,
} from "@/app/actions/offerForm"
import Heading from "@/components/shared/typography/Heading"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  QUESTION_DEFINITIONS,
  QUESTION_TYPE_TO_LABEL,
  REQUIRED_QUESTION_TYPES,
} from "@/constants/offerFormQuestions"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { QuestionType } from "@/types/form"
import { Database } from "@/types/supabase"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { OfferFormInteractiveView } from "../OfferFormInteractiveView"
import AddQuestionModal from "./AddQuestionModal"
import PageBreak from "./PageBreak"
import QuestionCard from "./QuestionCard"
import RestrictionModal from "./RestrictionModal"

type Question = Database["public"]["Tables"]["offerFormQuestions"]["Row"]
type Page = Database["public"]["Tables"]["offerFormPages"]["Row"]

const OfferFormBuilderPageContent = () => {
  const [formId, setFormId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [addQuestionAfterOrder, setAddQuestionAfterOrder] = useState<
    number | null
  >(null)
  const [viewMode, setViewMode] = useState<"builder" | "preview">("builder")
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    DEFAULT_BRANDING_CONFIG,
  )
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  )
  const [profileName, setProfileName] = useState<string | null>(null)
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)

  useEffect(() => {
    const initializeForm = async () => {
      try {
        const id = await getOrCreateOfferForm()
        setFormId(id)

        const [
          fetchedQuestions,
          fetchedPages,
          fetchedBranding,
          fetchedProfilePicture,
        ] = await Promise.all([
          getFormQuestions(id),
          getFormPages(id),
          getBrandingConfig(id),
          getFormOwnerProfilePicture(id),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
        setBrandingConfig(fetchedBranding)
        setProfilePictureUrl(fetchedProfilePicture)
      } catch (error) {
        console.error("Error initializing form:", error)
        toast.error("Failed to load form")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("fullName")
          .eq("id", user.id)
          .single()

        if (profile?.fullName) {
          setProfileName(profile.fullName)
        }
      }
    }

    initializeForm()
    fetchUserProfile()
  }, [])

  const handleMoveUp = (
    questionId: string,
    currentOrder: number,
    questionType: QuestionType,
  ) => {
    // Prevent moving submit button
    if (questionType === "submitButton") {
      return
    }
    // Check if "Specify Listing" exists and is at position 1
    const specifyListingQuestion = questions.find(
      (q) => q.type === "specifyListing",
    )
    const isSpecifyListingAtPosition1 = specifyListingQuestion?.order === 1

    // Check if "Submitter Role" exists and is at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // First question can never move up
    if (currentOrder === 1) {
      setShowRestrictionModal(true)
      return
    }

    // If submitterRole is at position 2:
    if (isSubmitterRoleAtPosition2) {
      // The 2nd question (submitterRole) cannot be moved
      if (currentOrder === 2 && questionType === "submitterRole") {
        setShowRestrictionModal(true)
        return
      }
      // The 3rd question cannot move upward
      if (currentOrder === 3) {
        setShowRestrictionModal(true)
        return
      }
    }

    // Prevent other questions from moving into position 1 (locked by specifyListing)
    // If submitterRole is deleted, position 1 is still locked, but position 2 is free
    const targetPosition = currentOrder - 1
    if (targetPosition === 1 && isSpecifyListingAtPosition1) {
      if (questionType !== "specifyListing") {
        setShowRestrictionModal(true)
        return
      }
    }
    // If submitterRole is NOT at position 2 (deleted), position 2 is free to move into

    startTransition(async () => {
      try {
        // Find the question above
        const questionAbove = questions.find(
          (q) => q.order === currentOrder - 1,
        )
        if (!questionAbove) return

        // Check if the question above is locked in its position
        if (
          questionAbove.type === "specifyListing" &&
          questionAbove.order === 1
        ) {
          setShowRestrictionModal(true)
          return
        }
        // If submitterRole is at position 2, it's locked
        if (
          questionAbove.type === "submitterRole" &&
          questionAbove.order === 2 &&
          isSubmitterRoleAtPosition2
        ) {
          setShowRestrictionModal(true)
          return
        }

        // Swap orders
        await updateQuestionOrder(questionId, currentOrder - 1)
        await updateQuestionOrder(questionAbove.id, currentOrder)

        // Update local state
        setQuestions((prev) =>
          prev
            .map((q) => {
              if (q.id === questionId) return { ...q, order: currentOrder - 1 }
              if (q.id === questionAbove.id)
                return { ...q, order: currentOrder }
              return q
            })
            .sort((a, b) => a.order - b.order),
        )

        toast.success("Question moved up")
      } catch (error) {
        console.error("Error moving question:", error)
        toast.error("Failed to move question")
      }
    })
  }

  const handleMoveDown = (
    questionId: string,
    currentOrder: number,
    questionType: QuestionType,
  ) => {
    // Prevent moving submit button
    if (questionType === "submitButton") {
      return
    }
    if (currentOrder === questions.length) return

    // Check if "Submitter Role" exists and is at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // First question can never move down
    if (currentOrder === 1) {
      setShowRestrictionModal(true)
      return
    }

    // If submitterRole is at position 2:
    if (isSubmitterRoleAtPosition2) {
      // The 2nd question (submitterRole) cannot be moved
      if (currentOrder === 2 && questionType === "submitterRole") {
        setShowRestrictionModal(true)
        return
      }
      // Prevent moving into position 2 if it's locked by submitterRole
      const targetPosition = currentOrder + 1
      if (targetPosition === 2 && questionType !== "submitterRole") {
        setShowRestrictionModal(true)
        return
      }
    }

    startTransition(async () => {
      try {
        // Find the question below
        const questionBelow = questions.find(
          (q) => q.order === currentOrder + 1,
        )
        if (!questionBelow) return

        // Check if moving would put this question into a locked position
        const targetPosition = currentOrder + 1
        // Position 1 is always locked (unless it's specifyListing)
        if (targetPosition === 1 && questionType !== "specifyListing") {
          setShowRestrictionModal(true)
          return
        }
        // Position 2 is locked only if submitterRole is there
        if (
          targetPosition === 2 &&
          isSubmitterRoleAtPosition2 &&
          questionType !== "submitterRole"
        ) {
          setShowRestrictionModal(true)
          return
        }

        // Swap orders
        await updateQuestionOrder(questionId, currentOrder + 1)
        await updateQuestionOrder(questionBelow.id, currentOrder)

        // Update local state
        setQuestions((prev) =>
          prev
            .map((q) => {
              if (q.id === questionId) return { ...q, order: currentOrder + 1 }
              if (q.id === questionBelow.id)
                return { ...q, order: currentOrder }
              return q
            })
            .sort((a, b) => a.order - b.order),
        )

        toast.success("Question moved down")
      } catch (error) {
        console.error("Error moving question:", error)
        toast.error("Failed to move question")
      }
    })
  }

  const handleDelete = (questionId: string) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await deleteQuestion(questionId)

        // Fetch fresh data from database to ensure consistency
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Question deleted")
      } catch (error) {
        console.error("Error deleting question:", error)
        toast.error("Failed to delete question")
      }
    })
  }

  const handleResetForm = () => {
    if (!formId) return

    startTransition(async () => {
      try {
        await resetFormToDefault(formId)

        // Fetch fresh data from database (both questions and pages)
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        setShowResetDialog(false)
        toast.success("Form reset to default successfully")
      } catch (error) {
        console.error("Error resetting form:", error)
        toast.error("Failed to reset form")
      }
    })
  }

  const handleAddPageBreak = (afterQuestionOrder: number) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await createPageBreak(formId, afterQuestionOrder)

        // Fetch fresh data from database
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Page break added")
      } catch (error) {
        console.error("Error adding page break:", error)
        toast.error("Failed to add page break")
      }
    })
  }

  const handleDeletePageBreak = (pageId: string) => {
    if (!formId) return

    startTransition(async () => {
      try {
        await deletePageBreak(pageId, formId)

        // Fetch fresh data
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success("Page break deleted")
      } catch (error) {
        console.error("Error deleting page break:", error)
        toast.error("Failed to delete page break")
      }
    })
  }

  const handleMovePageBreak = (pageId: string, direction: "up" | "down") => {
    if (!formId) return

    startTransition(async () => {
      try {
        await movePageBreak(pageId, formId, direction)

        // Fetch fresh data (both questions and pages)
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)

        toast.success(`Page break moved ${direction}`)
      } catch (error) {
        console.error("Error moving page break:", error)
        toast.error("Failed to move page break")
      }
    })
  }

  const handleOpenAddQuestionModal = (afterOrder: number) => {
    // Check if "Specify Listing" exists at position 1
    const specifyListingQuestion = questions.find(
      (q) => q.type === "specifyListing",
    )
    const isSpecifyListingAtPosition1 = specifyListingQuestion?.order === 1

    // Check if "Submitter Role" exists at position 2
    const submitterRoleQuestion = questions.find(
      (q) => q.type === "submitterRole",
    )
    const isSubmitterRoleAtPosition2 = submitterRoleQuestion?.order === 2

    // Prevent adding questions between position 1 and 2
    // If adding after position 1, the new question would be at position 2
    if (
      afterOrder === 1 &&
      isSpecifyListingAtPosition1 &&
      isSubmitterRoleAtPosition2
    ) {
      toast.error(
        "Cannot add questions between 'Specify Listing' and 'Submitter Role'",
      )
      return
    }

    setAddQuestionAfterOrder(afterOrder)
    setShowAddQuestionModal(true)
  }

  const handleAddQuestion = async (
    questionType: QuestionType,
    config?: Record<string, any>,
    uiConfig?: Record<string, any>,
  ) => {
    if (!formId || addQuestionAfterOrder === null) return

    startTransition(async () => {
      try {
        // Extract requiredOverride if it exists in config
        const requiredOverride = config?.__requiredOverride
        const cleanConfig = config ? { ...config } : undefined
        if (cleanConfig && "__requiredOverride" in cleanConfig) {
          delete cleanConfig.__requiredOverride
        }

        // Extract pending files for Special Conditions (they'll be uploaded after question creation)
        let pendingFilesMap: Record<number, File[]> | null = null
        if (questionType === "specialConditions" && cleanConfig?.conditions) {
          pendingFilesMap = {}
          cleanConfig.conditions = cleanConfig.conditions.map(
            (condition: any, index: number) => {
              if (
                condition.__pendingFiles &&
                condition.__pendingFiles.length > 0
              ) {
                pendingFilesMap![index] = condition.__pendingFiles
                const { __pendingFiles, ...rest } = condition
                return rest
              }
              return condition
            },
          )
        }

        const questionId = await addQuestion(
          formId,
          questionType,
          addQuestionAfterOrder,
          cleanConfig,
          uiConfig,
        )

        // Upload files for Special Conditions if any
        if (pendingFilesMap && Object.keys(pendingFilesMap).length > 0) {
          const { uploadSpecialConditionsSetupFiles } = await import(
            "@/lib/questionSetupFileUpload"
          )

          const updatedConditions = [...(cleanConfig.conditions || [])]
          for (const [indexStr, files] of Object.entries(pendingFilesMap)) {
            const conditionIndex = parseInt(indexStr, 10)
            try {
              const uploadedFiles = await uploadSpecialConditionsSetupFiles(
                formId,
                questionId,
                conditionIndex,
                files,
              )

              // Merge with existing attachments
              const existingAttachments =
                updatedConditions[conditionIndex]?.attachments || []
              updatedConditions[conditionIndex] = {
                ...updatedConditions[conditionIndex],
                attachments: [...existingAttachments, ...uploadedFiles],
              }
            } catch (error) {
              console.error(
                `Error uploading files for condition ${conditionIndex}:`,
                error,
              )
              toast.error(
                `Failed to upload some attachments for condition ${conditionIndex + 1}`,
              )
            }
          }

          // Update question with uploaded file URLs
          await updateQuestion(questionId, {
            setupConfig: {
              ...cleanConfig,
              conditions: updatedConditions,
            },
          })
        }

        // If we have a requiredOverride, we need to update the question after creation
        if (requiredOverride !== undefined) {
          await updateQuestion(questionId, { required: requiredOverride })
        }

        // Fetch fresh data
        const [fetchedQuestions, fetchedPages] = await Promise.all([
          getFormQuestions(formId),
          getFormPages(formId),
        ])

        setQuestions(fetchedQuestions)
        setPages(fetchedPages)
        setShowAddQuestionModal(false)
        setAddQuestionAfterOrder(null)

        toast.success("Question added successfully")
      } catch (error) {
        console.error("Error adding question:", error)
        toast.error("Failed to add question")
      }
    })
  }

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    if (!formId) return

    startTransition(async () => {
      try {
        // Handle Special Conditions file uploads
        if (
          updates.setupConfig?.conditions &&
          typeof updates.setupConfig.conditions === "object"
        ) {
          const pendingFilesMap: Record<number, File[]> = {}
          const processedConditions = updates.setupConfig.conditions.map(
            (condition: any, index: number) => {
              if (
                condition.__pendingFiles &&
                condition.__pendingFiles.length > 0
              ) {
                pendingFilesMap[index] = condition.__pendingFiles
                const { __pendingFiles, ...rest } = condition
                return rest
              }
              return condition
            },
          )

          // If there are pending files, upload them first
          if (Object.keys(pendingFilesMap).length > 0) {
            const { uploadSpecialConditionsSetupFiles } = await import(
              "@/lib/questionSetupFileUpload"
            )

            const updatedConditions = [...processedConditions]
            for (const [indexStr, files] of Object.entries(pendingFilesMap)) {
              const conditionIndex = parseInt(indexStr, 10)
              try {
                const uploadedFiles = await uploadSpecialConditionsSetupFiles(
                  formId,
                  questionId,
                  conditionIndex,
                  files,
                )

                // Merge with existing attachments
                const existingAttachments =
                  updatedConditions[conditionIndex]?.attachments || []
                updatedConditions[conditionIndex] = {
                  ...updatedConditions[conditionIndex],
                  attachments: [...existingAttachments, ...uploadedFiles],
                }
              } catch (error) {
                console.error(
                  `Error uploading files for condition ${conditionIndex}:`,
                  error,
                )
                toast.error(
                  `Failed to upload some attachments for condition ${conditionIndex + 1}`,
                )
              }
            }

            updates.setupConfig = {
              ...updates.setupConfig,
              conditions: updatedConditions,
            }
          } else {
            updates.setupConfig = {
              ...updates.setupConfig,
              conditions: processedConditions,
            }
          }
        }

        await updateQuestion(questionId, updates)

        // Fetch fresh data
        const [fetchedQuestions] = await Promise.all([getFormQuestions(formId)])

        setQuestions(fetchedQuestions)
        toast.success("Question updated")
      } catch (error) {
        console.error("Error updating question:", error)
        toast.error("Failed to update question")
      }
    })
  }

  if (isLoading) {
    return (
      <main className="px-6 py-8">
        <div className="flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </main>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-6 border-b bg-white px-6 pt-14 pb-6 lg:py-6">
        <div>
          <Heading as="h1" size="large" weight="bold">
            {viewMode === "builder" ? "Customize Offer Form" : "Form Preview"}
          </Heading>
          <p className="mt-1 text-sm text-gray-600">
            {viewMode === "builder" ? (
              <>
                Add, remove and edit questions to build your Offer Form. <br />
                <Link
                  href="#"
                  className="font-medium text-teal-500 hover:text-teal-700"
                >
                  Learn more by clicking here.
                </Link>
              </>
            ) : (
              "This is how your offer form will appear to buyers."
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {viewMode === "builder" && (
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
            >
              Reset Form
            </Button>
          )}
          <Button
            onClick={() =>
              setViewMode(viewMode === "builder" ? "preview" : "builder")
            }
          >
            {viewMode === "builder" ? "View Form" : "Customize Form"}
          </Button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <div
          className="min-h-[600px] rounded-2xl"
          style={{
            backgroundColor: brandingConfig.backgroundColor,
            backgroundImage: brandingConfig.backgroundImage
              ? `url(${brandingConfig.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            padding: "2rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* White form card - fixed width, centered */}
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <OfferFormInteractiveView
              questions={questions}
              pages={pages}
              isLoading={false}
              title={
                profileName
                  ? `Submit an Offer to ${profileName}`
                  : "Submit an Offer"
              }
              description="Please provide details about your offer"
              brandingConfig={brandingConfig}
              profilePictureUrl={profilePictureUrl}
              formId={formId || undefined}
              isPreviewMode={true}
            />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mx-auto max-w-7xl space-y-6">
            {(() => {
              // Separate submit button from regular questions
              const regularQuestions = questions
                .sort((a, b) => a.order - b.order)
                .filter((q) => q.type !== "submitButton")
              const submitButtonQuestion = questions.find(
                (q) => q.type === "submitButton",
              )

              // Calculate total pages (1 + number of page breaks)
              const totalPages =
                1 + pages.filter((p) => p.breakIndex !== null).length
              const hasPageBreaks = totalPages > 1

              // Helper function to calculate which page a question belongs to
              const getPageNumber = (questionOrder: number): number => {
                const allBreaks = pages
                  .filter((p) => p.breakIndex !== null)
                  .sort((a, b) => (a.breakIndex || 0) - (b.breakIndex || 0))

                // Count how many breaks come before this question
                const breaksBefore = allBreaks.filter(
                  (p) => p.breakIndex !== null && p.breakIndex < questionOrder,
                ).length

                // Page number is 1 + number of breaks before
                return breaksBefore + 1
              }

              // Helper function to calculate which page content after a break belongs to
              const getPageNumberAfterBreak = (breakIndex: number): number => {
                const allBreaks = pages
                  .filter((p) => p.breakIndex !== null)
                  .sort((a, b) => (a.breakIndex || 0) - (b.breakIndex || 0))

                // Count how many breaks come before or at this break
                const breaksBeforeOrAt = allBreaks.filter(
                  (p) => p.breakIndex !== null && p.breakIndex <= breakIndex,
                ).length

                // Page number after break is 1 + number of breaks before or at
                return breaksBeforeOrAt + 1
              }

              // Group questions by page
              const questionsByPage: Record<number, typeof regularQuestions> =
                {}
              regularQuestions.forEach((question) => {
                const pageNum = getPageNumber(question.order)
                if (!questionsByPage[pageNum]) {
                  questionsByPage[pageNum] = []
                }
                questionsByPage[pageNum].push(question)
              })

              return (
                <>
                  {Object.entries(questionsByPage)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([pageNumStr, pageQuestions], pageIndex) => {
                      const pageNum = Number(pageNumStr)
                      const isFirstPage = pageNum === 1

                      return (
                        <div key={`page-${pageNum}`}>
                          {/* Page label - positioned above the container, between pages */}
                          {hasPageBreaks && (
                            <div className="mb-2">
                              <span className="text-sm font-bold text-gray-700">
                                Page {pageNum} of {totalPages}
                              </span>
                            </div>
                          )}

                          {/* Page container */}
                          <div
                            className={cn(
                              "rounded-lg border-2 border-gray-200 bg-gray-50 p-6",
                              hasPageBreaks && pageIndex > 0 && "mt-0",
                            )}
                          >
                            {/* Questions for this page */}
                            {pageQuestions.map((question, index) => {
                              const globalIndex =
                                regularQuestions.indexOf(question)
                              // Find if there's a page break after this question
                              const pageBreakAfter = pages.find(
                                (page) => page.breakIndex === question.order,
                              )

                              return (
                                <div key={question.id}>
                                  <QuestionCard
                                    questionsAmount={regularQuestions.length}
                                    question={question}
                                    questionNumber={globalIndex + 1}
                                    isFirst={globalIndex === 0}
                                    isLast={
                                      globalIndex ===
                                      regularQuestions.length - 1
                                    }
                                    onMoveUp={() =>
                                      handleMoveUp(
                                        question.id,
                                        question.order,
                                        question.type,
                                      )
                                    }
                                    onMoveDown={() =>
                                      handleMoveDown(
                                        question.id,
                                        question.order,
                                        question.type,
                                      )
                                    }
                                    onDelete={() => handleDelete(question.id)}
                                    onUpdateQuestion={handleUpdateQuestion}
                                    questionDefinitions={QUESTION_DEFINITIONS}
                                    questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
                                    requiredQuestionTypes={
                                      REQUIRED_QUESTION_TYPES
                                    }
                                  />

                                  <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                                    {/* Check if we can add a question here (not between position 1 and 2) */}
                                    {(() => {
                                      // Check if "Specify Listing" exists at position 1
                                      const specifyListingQuestion =
                                        questions.find(
                                          (q) => q.type === "specifyListing",
                                        )
                                      const isSpecifyListingAtPosition1 =
                                        specifyListingQuestion?.order === 1

                                      // Check if "Submitter Role" exists at position 2
                                      const submitterRoleQuestion =
                                        questions.find(
                                          (q) => q.type === "submitterRole",
                                        )
                                      const isSubmitterRoleAtPosition2 =
                                        submitterRoleQuestion?.order === 2

                                      // Show modal if adding after position 1 would place question at position 2
                                      const wouldAddAtPosition2 =
                                        question.order === 1 &&
                                        isSpecifyListingAtPosition1 &&
                                        isSubmitterRoleAtPosition2

                                      return (
                                        <Button
                                          size="sm"
                                          variant="dashed"
                                          onClick={() => {
                                            if (wouldAddAtPosition2) {
                                              setShowRestrictionModal(true)
                                            } else {
                                              handleOpenAddQuestionModal(
                                                question.order,
                                              )
                                            }
                                          }}
                                        >
                                          + Add New Question Here
                                        </Button>
                                      )
                                    })()}
                                    <Button
                                      disabled={
                                        globalIndex ===
                                        regularQuestions.length - 1
                                      }
                                      size="sm"
                                      variant="dashed"
                                      onClick={() =>
                                        handleAddPageBreak(question.order)
                                      }
                                    >
                                      + Add a Page Break Here
                                    </Button>
                                  </div>

                                  {/* Show page break if one exists after this question */}
                                  {pageBreakAfter && (
                                    <div className="my-8">
                                      {(() => {
                                        // Find if there are adjacent breaks
                                        const allBreaks = pages.filter(
                                          (p) => p.breakIndex !== null,
                                        )
                                        const currentBreakIndex =
                                          pageBreakAfter.breakIndex || 0

                                        // Check if there's a break before this one
                                        const hasBreakBefore = allBreaks.some(
                                          (p) =>
                                            p.breakIndex !== null &&
                                            p.breakIndex < currentBreakIndex,
                                        )

                                        // Check if there's a break after this one
                                        const hasBreakAfter = allBreaks.some(
                                          (p) =>
                                            p.breakIndex !== null &&
                                            p.breakIndex > currentBreakIndex,
                                        )

                                        // Can't move up if: at question 1, or would collide with previous break
                                        const canMoveUp =
                                          currentBreakIndex > 1 &&
                                          (!hasBreakBefore ||
                                            allBreaks
                                              .filter(
                                                (p) =>
                                                  p.breakIndex !== null &&
                                                  p.breakIndex <
                                                    currentBreakIndex,
                                              )
                                              .every(
                                                (p) =>
                                                  (p.breakIndex || 0) <
                                                  currentBreakIndex - 1,
                                              ))

                                        // Can't move down if: at last question, or would collide with next break
                                        const canMoveDown =
                                          currentBreakIndex <
                                            regularQuestions.length - 1 &&
                                          (!hasBreakAfter ||
                                            allBreaks
                                              .filter(
                                                (p) =>
                                                  p.breakIndex !== null &&
                                                  p.breakIndex >
                                                    currentBreakIndex,
                                              )
                                              .every(
                                                (p) =>
                                                  (p.breakIndex || 0) >
                                                  currentBreakIndex + 1,
                                              ))

                                        return (
                                          <PageBreak
                                            page={pageBreakAfter}
                                            isFirst={!canMoveUp}
                                            isLast={!canMoveDown}
                                            onMoveUp={() =>
                                              handleMovePageBreak(
                                                pageBreakAfter.id,
                                                "up",
                                              )
                                            }
                                            onMoveDown={() =>
                                              handleMovePageBreak(
                                                pageBreakAfter.id,
                                                "down",
                                              )
                                            }
                                            onDelete={() =>
                                              handleDeletePageBreak(
                                                pageBreakAfter.id,
                                              )
                                            }
                                          />
                                        )
                                      })()}

                                      {/* Add buttons after page break */}
                                      <div className="my-8 flex flex-wrap items-center justify-center gap-4">
                                        {(() => {
                                          // Check if "Specify Listing" exists at position 1
                                          const specifyListingQuestion =
                                            questions.find(
                                              (q) =>
                                                q.type === "specifyListing",
                                            )
                                          const isSpecifyListingAtPosition1 =
                                            specifyListingQuestion?.order === 1

                                          // Check if "Submitter Role" exists at position 2
                                          const submitterRoleQuestion =
                                            questions.find(
                                              (q) => q.type === "submitterRole",
                                            )
                                          const isSubmitterRoleAtPosition2 =
                                            submitterRoleQuestion?.order === 2

                                          // Hide button if adding after position 1 would place question at position 2
                                          const wouldAddAtPosition2 =
                                            question.order === 1 &&
                                            isSpecifyListingAtPosition1 &&
                                            isSubmitterRoleAtPosition2

                                          if (wouldAddAtPosition2) {
                                            return null
                                          }

                                          return (
                                            <Button
                                              size="sm"
                                              variant="dashed"
                                              onClick={() =>
                                                handleOpenAddQuestionModal(
                                                  question.order,
                                                )
                                              }
                                            >
                                              + Add New Question Here
                                            </Button>
                                          )
                                        })()}
                                        <Button
                                          disabled
                                          size="sm"
                                          variant="dashed"
                                        >
                                          + Add a Page Break Here
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            {/* Submit Button - Always at the bottom of the last page, cannot be moved */}
                            {submitButtonQuestion && pageNum === totalPages && (
                              <div className="my-8">
                                <QuestionCard
                                  questionsAmount={regularQuestions.length}
                                  question={submitButtonQuestion}
                                  questionNumber={0} // Not counted as a question
                                  isFirst={false}
                                  isLast={true}
                                  onMoveUp={() => {}} // Disabled - cannot move
                                  onMoveDown={() => {}} // Disabled - cannot move
                                  onDelete={() => {}} // Disabled - cannot delete
                                  onUpdateQuestion={handleUpdateQuestion}
                                  questionDefinitions={QUESTION_DEFINITIONS}
                                  questionTypeToLabel={QUESTION_TYPE_TO_LABEL}
                                  requiredQuestionTypes={
                                    REQUIRED_QUESTION_TYPES
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="flex items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
            <Spinner />
            <p className="text-sm font-medium text-gray-900">Updating...</p>
          </div>
        </div>
      )}

      {/* Reset Form Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Form to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete all your custom questions and restore the
              form to its default state with the 7 essential questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetForm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddQuestionModal
        open={showAddQuestionModal}
        onOpenChange={setShowAddQuestionModal}
        onAddQuestion={handleAddQuestion}
        existingQuestionTypes={questions.map((q) => q.type as QuestionType)}
        questionDefinitions={QUESTION_DEFINITIONS}
      />

      <RestrictionModal
        isOpen={showRestrictionModal}
        onClose={() => setShowRestrictionModal(false)}
      />
    </>
  )
}

export default OfferFormBuilderPageContent
