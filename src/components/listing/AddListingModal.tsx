"use client"

import { createClient } from "@/lib/supabase/client"
import { ListingStatus } from "@/types/listing"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import * as yup from "yup"
import { LISTING_STATUSES } from "../../constants/listings"
import PhoneInput from "../shared/forms/PhoneInput"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface AddListingModalProps {
  children: React.ReactNode
  onListingCreated?: (listing: any) => void
}

interface SellerData {
  firstName: string
  lastName: string
  email: string
  mobile: string | { countryCode: string; number: string }
  sendUpdateByEmail?: boolean
}

interface FormData {
  address: string
  status: string
  seller1: SellerData
  sendEmailUpdates: boolean
  addSecondSeller: boolean
  seller2: SellerData
}

const initialSellerData: SellerData = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: { countryCode: "+1", number: "" },
}

const initialFormData: FormData = {
  address: "",
  status: "",
  seller1: { ...initialSellerData },
  sendEmailUpdates: false,
  addSecondSeller: false,
  seller2: { ...initialSellerData },
}

const sellerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(1, "First name is required"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(1, "Last name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email address",
    ),
  mobile: yup.lazy((value) => {
    if (typeof value === "object" && value !== null && "countryCode" in value) {
      return yup.object().shape({
        countryCode: yup
          .string()
          .matches(/^\+[0-9]{1,3}$/, "This number is invalid")
          .required("This number is invalid"),
        number: yup
          .string()
          .matches(/^[0-9\s\-\(\)]+$/, "This number is invalid")
          .test("phone-format", "This number is invalid", (val) => {
            if (!val || typeof val !== "string") return false
            // Remove spaces, dashes, and parentheses for validation
            const cleaned = val.replace(/[\s\-\(\)]/g, "")
            // Minimum 4 digits (shortest valid phone numbers globally)
            return /^[0-9]+$/.test(cleaned) && cleaned.length >= 4
          })
          .required("This number is invalid"),
      })
    }
    return yup
      .string()
      .matches(/^\+?[0-9\s\-\(\)]+$/, "This number is invalid")
      .test("phone-format", "This number is invalid", (val) => {
        if (!val || typeof val !== "string") return false
        // Remove spaces, dashes, and parentheses for validation
        const cleaned = val.replace(/[\s\-\(\)]/g, "")
        // Minimum 4 digits (shortest valid phone numbers globally)
        return /^[0-9]+$/.test(cleaned) && cleaned.length >= 4
      })
      .required("This number is invalid")
  }),
})

const validationSchema = yup.object().shape({
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters"),
  status: yup.string().required("Status is required"),
  seller1: sellerSchema,
  sendEmailUpdates: yup.boolean(),
  addSecondSeller: yup.boolean(),
  seller2: yup.object().when("addSecondSeller", {
    is: true,
    then: (schema) => sellerSchema,
    otherwise: (schema) =>
      yup.object().shape({
        firstName: yup.string().nullable(),
        lastName: yup.string().nullable(),
        email: yup.string().nullable(),
        mobile: yup.mixed().nullable(),
      }),
  }),
})

export const AddListingModal = ({
  children,
  onListingCreated,
}: AddListingModalProps) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  const markFieldAsTouched = (fieldPath: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldPath))
  }

  const shouldShowError = (fieldPath: string) => {
    return touchedFields.has(fieldPath) && errors[fieldPath]
  }

  const handleSubmit = async () => {
    try {
      setErrors({})
      setIsSubmitting(true)

      await validationSchema.validate(formData, { abortEarly: false })

      const supabase = createClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setErrors({ submit: "You must be logged in to create a listing" })
        setIsSubmitting(false)
        return
      }

      const { data: newListing, error: listingError } = await supabase
        .from("listings")
        .insert({
          address: formData.address,
          status: (() => {
            const statusKeys: ListingStatus[] = [
              "forSale",
              "underContract",
              "sold",
              "withdrawn",
              "unassigned",
            ]
            const statusKey = statusKeys.find(
              (key) => LISTING_STATUSES[key] === formData.status,
            )
            return statusKey || "forSale"
          })(),
          createdBy: user.id,
        })
        .select()
        .single()

      if (listingError) {
        console.error("Error creating listing:", listingError)
        setErrors({ submit: "Failed to create listing. Please try again." })
        setIsSubmitting(false)
        return
      }

      if (!newListing) {
        setErrors({ submit: "Failed to create listing. Please try again." })
        setIsSubmitting(false)
        return
      }

      // Transform phone from object to string if needed
      const seller1Phone =
        typeof formData.seller1.mobile === "object" &&
        formData.seller1.mobile !== null &&
        "countryCode" in formData.seller1.mobile
          ? `${formData.seller1.mobile.countryCode || ""}${formData.seller1.mobile.number || ""}`.trim()
          : String(formData.seller1.mobile || "").trim()

      // Combine firstName and lastName into fullName for database
      const seller1FullName =
        `${formData.seller1.firstName} ${formData.seller1.lastName}`.trim()

      const { data: seller1Data, error: seller1Error } = await supabase
        .from("listingSellers")
        .insert({
          fullName: seller1FullName,
          email: formData.seller1.email,
          phone: seller1Phone,
          sendUpdateByEmail: formData.sendEmailUpdates,
          listingId: newListing.id,
        })
        .select()
        .single()

      if (seller1Error) {
        console.error("Error creating seller 1:", seller1Error)
        setErrors({
          submit: "Failed to create seller information. Please try again.",
        })
        setIsSubmitting(false)
        return
      }

      if (!seller1Data) {
        console.error("No seller 1 data returned")
        setErrors({
          submit: "Failed to create seller information. Please try again.",
        })
        setIsSubmitting(false)
        return
      }

      if (formData.addSecondSeller) {
        // Transform phone from object to string if needed
        const seller2Phone =
          typeof formData.seller2.mobile === "object" &&
          formData.seller2.mobile !== null &&
          "countryCode" in formData.seller2.mobile
            ? `${formData.seller2.mobile.countryCode || ""}${formData.seller2.mobile.number || ""}`.trim()
            : String(formData.seller2.mobile || "").trim()

        // Combine firstName and lastName into fullName for database
        const seller2FullName =
          `${formData.seller2.firstName} ${formData.seller2.lastName}`.trim()

        const { data: seller2Data, error: seller2Error } = await supabase
          .from("listingSellers")
          .insert({
            fullName: seller2FullName,
            email: formData.seller2.email,
            phone: seller2Phone,
            sendUpdateByEmail: formData.seller2.sendUpdateByEmail || false,
            listingId: newListing.id,
          })
          .select()
          .single()

        if (seller2Error) {
          console.error("Error creating seller 2:", seller2Error)
          setErrors({
            submit:
              "Failed to create second seller information. Please try again.",
          })
          setIsSubmitting(false)
          return
        }

        if (!seller2Data) {
          console.error("No seller 2 data returned")
          setErrors({
            submit:
              "Failed to create second seller information. Please try again.",
          })
          setIsSubmitting(false)
          return
        }
      }

      toast.success("Listing has been created")

      // Reset form
      setFormData(initialFormData)
      setErrors({})
      setTouchedFields(new Set())
      setOpen(false)

      // Call the callback to update the parent component's state
      if (onListingCreated && newListing) {
        onListingCreated(newListing)
      }

      // Refresh the page to show the new listing
      router.refresh()
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const validationErrors: Record<string, string> = {}
        err.inner.forEach((error) => {
          if (error.path) {
            // For nested phone errors (e.g., seller1.mobile.countryCode, seller1.mobile.number),
            // show error at the parent field level (seller1.mobile)
            const pathParts = error.path.split(".")
            if (
              pathParts.length > 2 &&
              (pathParts[pathParts.length - 1] === "countryCode" ||
                pathParts[pathParts.length - 1] === "number")
            ) {
              // This is a nested phone error, use the parent path (e.g., seller1.mobile)
              const parentPath = pathParts.slice(0, -1).join(".")
              if (!validationErrors[parentPath]) {
                validationErrors[parentPath] = error.message
              }
              // Only mark fields as touched if they're not seller2 fields
              if (!parentPath.startsWith("seller2.")) {
                markFieldAsTouched(parentPath)
              }
            } else {
              validationErrors[error.path] = error.message
              // Only mark fields as touched if they're not seller2 fields
              if (!error.path.startsWith("seller2.")) {
                markFieldAsTouched(error.path)
              }
            }
          }
        })
        setErrors(validationErrors)

        // Scroll to first error
        const firstErrorField = err.inner[0]?.path
        if (firstErrorField) {
          const errorElement = document.querySelector(
            `[id="${firstErrorField.replace(/\./g, "-")}"]`,
          )
          errorElement?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      } else {
        console.error("Unexpected error:", err)
        setErrors({ submit: "An unexpected error occurred. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      // When unchecking "Add another Seller", clear seller2 errors and touched fields
      if (field === "addSecondSeller" && !value) {
        const newErrors = { ...errors }
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith("seller2.")) {
            delete newErrors[key]
          }
        })
        setErrors(newErrors)
        setTouchedFields((prevTouched) => {
          const newTouched = new Set(prevTouched)
          Array.from(newTouched).forEach((fieldPath) => {
            if (fieldPath.startsWith("seller2.")) {
              newTouched.delete(fieldPath)
            }
          })
          return newTouched
        })
      }
      return newData
    })
  }

  const updateSeller1 = (
    field: keyof SellerData,
    value: string | { countryCode: string; number: string },
  ) => {
    setFormData((prev) => ({
      ...prev,
      seller1: { ...prev.seller1, [field]: value },
    }))
  }

  const updateSeller2 = (
    field: keyof SellerData,
    value: string | { countryCode: string; number: string } | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      seller2: { ...prev.seller2, [field]: value },
    }))
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when modal closes
      setFormData(initialFormData)
      setErrors({})
      setTouchedFields(new Set())
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Listing</DialogTitle>
          <DialogDescription>
            Enter the property and seller information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter property address"
              value={formData.address}
              onChange={(e) => {
                updateFormData("address", e.target.value)
                markFieldAsTouched("address")
              }}
              onBlur={() => markFieldAsTouched("address")}
              className={shouldShowError("address") ? "border-red-500" : ""}
            />
            {shouldShowError("address") && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                updateFormData("status", value)
                markFieldAsTouched("status")
              }}
            >
              <SelectTrigger
                id="status"
                className={`min-w-52 ${shouldShowError("status") ? "border-red-500" : ""}`}
                onBlur={() => markFieldAsTouched("status")}
              >
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.values(LISTING_STATUSES).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {shouldShowError("status") && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Seller 1</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller1-firstName">First Name</Label>
                <Input
                  id="seller1-firstName"
                  placeholder="Enter first name"
                  value={formData.seller1.firstName}
                  onChange={(e) => {
                    updateSeller1("firstName", e.target.value)
                    markFieldAsTouched("seller1.firstName")
                  }}
                  onBlur={() => markFieldAsTouched("seller1.firstName")}
                  className={
                    shouldShowError("seller1.firstName") ? "border-red-500" : ""
                  }
                />
                {shouldShowError("seller1.firstName") && (
                  <p className="text-sm text-red-500">
                    {errors["seller1.firstName"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller1-lastName">Last Name</Label>
                <Input
                  id="seller1-lastName"
                  placeholder="Enter last name"
                  value={formData.seller1.lastName}
                  onChange={(e) => {
                    updateSeller1("lastName", e.target.value)
                    markFieldAsTouched("seller1.lastName")
                  }}
                  onBlur={() => markFieldAsTouched("seller1.lastName")}
                  className={
                    shouldShowError("seller1.lastName") ? "border-red-500" : ""
                  }
                />
                {shouldShowError("seller1.lastName") && (
                  <p className="text-sm text-red-500">
                    {errors["seller1.lastName"]}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller1-email">Email</Label>
              <Input
                id="seller1-email"
                type="email"
                placeholder="Enter email"
                value={formData.seller1.email}
                onChange={(e) => {
                  updateSeller1("email", e.target.value)
                  markFieldAsTouched("seller1.email")
                }}
                onBlur={() => markFieldAsTouched("seller1.email")}
                className={
                  shouldShowError("seller1.email") ? "border-red-500" : ""
                }
              />
              {shouldShowError("seller1.email") && (
                <p className="text-sm text-red-500">
                  {errors["seller1.email"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller1-mobile">Mobile</Label>
              <PhoneInput
                id="seller1-mobile"
                placeholder="123-456-7890"
                value={formData.seller1.mobile}
                onChange={(value) => {
                  updateSeller1("mobile", value)
                  // Clear error when user starts typing
                  if (errors["seller1.mobile"]) {
                    setErrors((prev) => {
                      const newErrors = { ...prev }
                      delete newErrors["seller1.mobile"]
                      return newErrors
                    })
                  }
                }}
                onBlur={() => markFieldAsTouched("seller1.mobile")}
              />
              {shouldShowError("seller1.mobile") && (
                <p className="text-sm text-red-500">
                  {errors["seller1.mobile"]}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-updates"
                checked={formData.sendEmailUpdates}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") {
                    updateFormData("sendEmailUpdates", checked)
                  }
                }}
              />
              <Label
                htmlFor="email-updates"
                className="cursor-pointer text-sm font-normal"
              >
                Send automatic updates by email
              </Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-seller"
              checked={formData.addSecondSeller}
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  updateFormData("addSecondSeller", checked)
                  // Clear seller2 errors when unchecking
                  if (!checked) {
                    setErrors((prev) => {
                      const newErrors = { ...prev }
                      Object.keys(newErrors).forEach((key) => {
                        if (key.startsWith("seller2.")) {
                          delete newErrors[key]
                        }
                      })
                      return newErrors
                    })
                  }
                }
              }}
            />
            <Label
              htmlFor="add-seller"
              className="cursor-pointer text-sm font-normal"
            >
              Add another Seller
            </Label>
          </div>

          {formData.addSecondSeller && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Seller 2</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seller2-firstName">First Name</Label>
                  <Input
                    id="seller2-firstName"
                    placeholder="Enter first name"
                    value={formData.seller2.firstName}
                    onChange={(e) => {
                      updateSeller2("firstName", e.target.value)
                      // Clear error when user starts typing
                      if (errors["seller2.firstName"]) {
                        setErrors((prev) => {
                          const newErrors = { ...prev }
                          delete newErrors["seller2.firstName"]
                          return newErrors
                        })
                      }
                    }}
                    onBlur={() => markFieldAsTouched("seller2.firstName")}
                    className={
                      shouldShowError("seller2.firstName")
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {shouldShowError("seller2.firstName") && (
                    <p className="text-sm text-red-500">
                      {errors["seller2.firstName"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller2-lastName">Last Name</Label>
                  <Input
                    id="seller2-lastName"
                    placeholder="Enter last name"
                    value={formData.seller2.lastName}
                    onChange={(e) => {
                      updateSeller2("lastName", e.target.value)
                      // Clear error when user starts typing
                      if (errors["seller2.lastName"]) {
                        setErrors((prev) => {
                          const newErrors = { ...prev }
                          delete newErrors["seller2.lastName"]
                          return newErrors
                        })
                      }
                    }}
                    onBlur={() => markFieldAsTouched("seller2.lastName")}
                    className={
                      shouldShowError("seller2.lastName")
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {shouldShowError("seller2.lastName") && (
                    <p className="text-sm text-red-500">
                      {errors["seller2.lastName"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller2-email">Email</Label>
                <Input
                  id="seller2-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.seller2.email}
                  onChange={(e) => {
                    updateSeller2("email", e.target.value)
                    // Clear error when user starts typing
                    if (errors["seller2.email"]) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors["seller2.email"]
                        return newErrors
                      })
                    }
                  }}
                  onBlur={() => markFieldAsTouched("seller2.email")}
                  className={
                    shouldShowError("seller2.email") ? "border-red-500" : ""
                  }
                />
                {shouldShowError("seller2.email") && (
                  <p className="text-sm text-red-500">
                    {errors["seller2.email"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller2-mobile">Mobile</Label>
                <PhoneInput
                  id="seller2-mobile"
                  placeholder="123-456-7890"
                  value={formData.seller2.mobile}
                  onChange={(value) => {
                    updateSeller2("mobile", value)
                    // Clear error when user starts typing
                    if (errors["seller2.mobile"]) {
                      setErrors((prev) => {
                        const newErrors = { ...prev }
                        delete newErrors["seller2.mobile"]
                        return newErrors
                      })
                    }
                  }}
                  onBlur={() => markFieldAsTouched("seller2.mobile")}
                />
                {shouldShowError("seller2.mobile") && (
                  <p className="text-sm text-red-500">
                    {errors["seller2.mobile"]}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-updates-seller2"
                  checked={formData.seller2.sendUpdateByEmail || false}
                  onCheckedChange={(checked) => {
                    if (typeof checked === "boolean") {
                      updateSeller2("sendUpdateByEmail", checked)
                    }
                  }}
                />
                <Label
                  htmlFor="email-updates-seller2"
                  className="cursor-pointer text-sm font-normal"
                >
                  Send automatic updates by email
                </Label>
              </div>
            </div>
          )}
        </div>

        {errors.submit && (
          <p className="text-sm text-red-500">{errors.submit}</p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
