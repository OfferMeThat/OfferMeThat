"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(0 0% 100%)",
          "--normal-text": "hsl(240 10% 3.9%)",
          "--normal-border": "hsl(240 5.9% 90%)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "bg-white border-gray-200",
          title: "text-gray-900",
          description: "text-gray-600",
          success: "bg-white border-green-200",
          error: "bg-white border-red-200",
          warning: "bg-white border-yellow-200",
          info: "bg-white border-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
