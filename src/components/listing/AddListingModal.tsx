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
  fullName: string
  email: string
  mobile: string | { countryCode: string; number: string }
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
  fullName: "",
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
  fullName: yup
    .string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters"),
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
        countryCode: yup.string().required("Country code is required"),
        number: yup
          .string()
          .required("Mobile number is required")
          .matches(/^[0-9\s\-\(\)]+$/, "Please enter a valid phone number")
          .min(6, "Phone number must be at least 6 digits"),
      })
    }
    return yup
      .string()
      .required("Mobile number is required")
      .matches(/^[0-9\s\-\(\)]+$/, "Please enter a valid phone number")
      .min(6, "Phone number must be at least 6 digits")
  }) as unknown as yup.StringSchema,
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
        fullName: yup.string(),
        email: yup.string(),
        mobile: yup.string(),
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

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
        return
      }

      const { data: newListing, error: listingError } = await supabase
        .from("listings")
        .insert({
          address: formData.address,
          status:
            (Object.keys(LISTING_STATUSES) as ListingStatus[]).find(
              (key) => LISTING_STATUSES[key] === formData.status,
            ) || "forSale",
          createdBy: user.id,
        })
        .select()
        .single()

      if (listingError) {
        console.error("Error creating listing:", listingError)
        setErrors({ submit: "Failed to create listing. Please try again." })
        return
      }

      // Transform phone from object to string if needed
      const seller1Phone =
        typeof formData.seller1.mobile === "object" &&
        formData.seller1.mobile !== null &&
        "countryCode" in formData.seller1.mobile
          ? (formData.seller1.mobile.countryCode || "") +
            (formData.seller1.mobile.number || "")
          : formData.seller1.mobile

      const { error: seller1Error } = await supabase
        .from("listingSellers")
        .insert({
          fullName: formData.seller1.fullName,
          email: formData.seller1.email,
          phone: seller1Phone,
          sendUpdateByEmail: formData.sendEmailUpdates,
        })

      if (seller1Error) {
        console.error("Error creating seller 1:", seller1Error)
        setErrors({
          submit: "Failed to create seller information. Please try again.",
        })
        return
      }

      if (formData.addSecondSeller) {
        // Transform phone from object to string if needed
        const seller2Phone =
          typeof formData.seller2.mobile === "object" &&
          formData.seller2.mobile !== null &&
          "countryCode" in formData.seller2.mobile
            ? (formData.seller2.mobile.countryCode || "") +
              (formData.seller2.mobile.number || "")
            : formData.seller2.mobile

        const { error: seller2Error } = await supabase
          .from("listingSellers")
          .insert({
            fullName: formData.seller2.fullName,
            email: formData.seller2.email,
            phone: seller2Phone,
            sendUpdateByEmail: false,
          })

        if (seller2Error) {
          console.error("Error creating seller 2:", seller2Error)
          setErrors({
            submit:
              "Failed to create second seller information. Please try again.",
          })
          return
        }
      }

      setOpen(false)
      setFormData(initialFormData)

      toast.success("Listing has been created")

      // Call the callback to update the parent component's state
      if (onListingCreated && newListing) {
        onListingCreated(newListing)
      }
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const validationErrors: Record<string, string> = {}
        err.inner.forEach((error) => {
          if (error.path) {
            validationErrors[error.path] = error.message
          }
        })
        setErrors(validationErrors)
      } else {
        console.error("Unexpected error:", err)
        setErrors({ submit: "An unexpected error occurred. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    value: string | { countryCode: string; number: string },
  ) => {
    setFormData((prev) => ({
      ...prev,
      seller2: { ...prev.seller2, [field]: value },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              onChange={(e) => updateFormData("address", e.target.value)}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateFormData("status", value)}
            >
              <SelectTrigger
                id="status"
                className={`min-w-52 ${errors.status ? "border-red-500" : ""}`}
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
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Seller 1</h3>

            <div className="space-y-2">
              <Label htmlFor="seller1-name">Full Name</Label>
              <Input
                id="seller1-name"
                placeholder="Enter full name"
                value={formData.seller1.fullName}
                onChange={(e) => updateSeller1("fullName", e.target.value)}
                className={errors["seller1.fullName"] ? "border-red-500" : ""}
              />
              {errors["seller1.fullName"] && (
                <p className="text-sm text-red-500">
                  {errors["seller1.fullName"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller1-email">Email</Label>
              <Input
                id="seller1-email"
                type="email"
                placeholder="Enter email"
                value={formData.seller1.email}
                onChange={(e) => updateSeller1("email", e.target.value)}
                className={errors["seller1.email"] ? "border-red-500" : ""}
              />
              {errors["seller1.email"] && (
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
                onChange={(value) => updateSeller1("mobile", value)}
              />
              {errors["seller1.mobile"] && (
                <p className="text-sm text-red-500">
                  {errors["seller1.mobile"]}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-updates"
                checked={formData.sendEmailUpdates}
                onCheckedChange={(checked) =>
                  updateFormData("sendEmailUpdates", checked as boolean)
                }
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
              onCheckedChange={(checked) =>
                updateFormData("addSecondSeller", checked as boolean)
              }
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

              <div className="space-y-2">
                <Label htmlFor="seller2-name">Full Name</Label>
                <Input
                  id="seller2-name"
                  placeholder="Enter full name"
                  value={formData.seller2.fullName}
                  onChange={(e) => updateSeller2("fullName", e.target.value)}
                  className={errors["seller2.fullName"] ? "border-red-500" : ""}
                />
                {errors["seller2.fullName"] && (
                  <p className="text-sm text-red-500">
                    {errors["seller2.fullName"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller2-email">Email</Label>
                <Input
                  id="seller2-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.seller2.email}
                  onChange={(e) => updateSeller2("email", e.target.value)}
                  className={errors["seller2.email"] ? "border-red-500" : ""}
                />
                {errors["seller2.email"] && (
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
                  onChange={(value) => updateSeller2("mobile", value)}
                />
                {errors["seller2.mobile"] && (
                  <p className="text-sm text-red-500">
                    {errors["seller2.mobile"]}
                  </p>
                )}
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
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
