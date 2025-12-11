"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/types/branding"
import { Eye, Upload, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BrandingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialConfig?: Partial<BrandingConfig>
  onSave: (config: BrandingConfig) => Promise<void>
}

const BrandingModal = ({
  open,
  onOpenChange,
  initialConfig = {},
  onSave,
}: BrandingModalProps) => {
  const [config, setConfig] = useState<BrandingConfig>({
    ...DEFAULT_BRANDING_CONFIG,
    ...initialConfig,
  })
  const [uploading, setUploading] = useState<string | null>(null)

  // Reset config to initialConfig when modal opens or initialConfig changes
  useEffect(() => {
    if (open) {
      setConfig({
        ...DEFAULT_BRANDING_CONFIG,
        ...initialConfig,
      })
    }
  }, [open, initialConfig])

  const handleColorChange = (field: keyof BrandingConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (
    field: "backgroundImage" | "logo",
    file: File | null,
  ) => {
    if (!file) {
      setConfig((prev) => ({ ...prev, [field]: null }))
      return
    }

    setUploading(field)
    const supabase = createClient()

    try {
      // Determine bucket based on field type
      const bucket = field === "logo" ? "logos" : "formImages"

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)

      setConfig((prev) => ({
        ...prev,
        [field]: publicUrl,
      }))
      toast.success(
        `${field === "logo" ? "Logo" : "Background image"} uploaded successfully`,
      )
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error(
        `Failed to upload ${field === "logo" ? "logo" : "background image"}`,
      )
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    try {
      await onSave(config)
      // Don't reset config when saving - the parent will update initialConfig
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving branding config:", error)
    }
  }

  const handleCancel = () => {
    // Reset to initial config
    setConfig({
      ...DEFAULT_BRANDING_CONFIG,
      ...initialConfig,
    })
    onOpenChange(false)
  }

  // Handle clicking outside the modal (onOpenChange is called)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Modal is closing - reset config to initial values
      setConfig({
        ...DEFAULT_BRANDING_CONFIG,
        ...initialConfig,
      })
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Colors and Branding</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Background Color (outside form)
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) =>
                  handleColorChange("backgroundColor", e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 px-2 py-1"
              />
              <Input
                type="text"
                value={config.backgroundColor}
                onChange={(e) =>
                  handleColorChange("backgroundColor", e.target.value)
                }
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Background Image (outside form)
            </Label>
            <div>
              <input
                type="file"
                id="background-image"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(
                    "backgroundImage",
                    e.target.files?.[0] || null,
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("background-image")?.click()
                }
                className="w-full"
                disabled={uploading === "backgroundImage"}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading === "backgroundImage"
                  ? "Uploading..."
                  : "Upload Image"}
              </Button>
              {config.backgroundImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload("backgroundImage", null)}
                  className="mt-2 w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Logo (below profile image)
            </Label>
            <div className="space-y-2">
              <input
                type="file"
                id="logo"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload("logo", e.target.files?.[0] || null)
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo")?.click()}
                  className="flex-1"
                  disabled={uploading === "logo"}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading === "logo" ? "Uploading..." : "Upload Logo"}
                </Button>
                {config.logo && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Open image in new window for viewing
                        const newWindow = window.open()
                        if (newWindow && config.logo) {
                          newWindow.document.write(
                            `<img src="${config.logo}" style="max-width: 100%; height: auto;" />`,
                          )
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleFileUpload("logo", null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Font Color (headings and questions)
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.fontColor}
                onChange={(e) => handleColorChange("fontColor", e.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 px-2 py-1"
              />
              <Input
                type="text"
                value={config.fontColor}
                onChange={(e) => handleColorChange("fontColor", e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Field Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Field Color (inputs)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.fieldColor}
                onChange={(e) =>
                  handleColorChange("fieldColor", e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 px-2 py-1"
              />
              <Input
                type="text"
                value={config.fieldColor}
                onChange={(e) =>
                  handleColorChange("fieldColor", e.target.value)
                }
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Button Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Button Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.buttonColor}
                onChange={(e) =>
                  handleColorChange("buttonColor", e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 px-2 py-1"
              />
              <Input
                type="text"
                value={config.buttonColor}
                onChange={(e) =>
                  handleColorChange("buttonColor", e.target.value)
                }
                className="flex-1"
                placeholder="#14b8a6"
              />
            </div>
          </div>

          {/* Button Text Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Button Text Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.buttonTextColor}
                onChange={(e) =>
                  handleColorChange("buttonTextColor", e.target.value)
                }
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 px-2 py-1"
              />
              <Input
                type="text"
                value={config.buttonTextColor}
                onChange={(e) =>
                  handleColorChange("buttonTextColor", e.target.value)
                }
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={uploading !== null}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BrandingModal
