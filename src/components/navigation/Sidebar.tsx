"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Edit,
  FileText,
  HelpCircle,
  Layers,
  MessageSquare,
  Plus,
  Settings,
  Target,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigationLinks = [
  // {
  //   section: "quick-actions",
  //   items: [
  //     { name: "Get Offers", href: "#", icon: FileText },
  //     { name: "Add Listings", href: "#", icon: Plus, action: "add-listing" },
  //   ],
  // },
  {
    section: "GO TO:",
    items: [
      { name: "My Offer Form", href: "#", icon: Settings },
      { name: "My Offers", href: "#", icon: FileText },
      { name: "My Lead Form", href: "#", icon: Edit },
      { name: "My Leads", href: "#", icon: Target },
      { name: "My Listings", href: "/", icon: Layers },
      { name: "Message Centre", href: "#", icon: MessageSquare },
    ],
  },
  {
    section: "settings",
    items: [
      { name: "My Details/Settings", href: "#", icon: Settings },
      { name: "Help", href: "#", icon: HelpCircle },
      { name: "Feedback/Suggestions", href: "#", icon: MessageSquare },
    ],
  },
]

interface SidebarContentProps {
  onLinkClick?: () => void
}

export const SidebarContent = ({ onLinkClick }: SidebarContentProps) => {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">OfferMeThat</h1>
            <p className="text-sm text-gray-600">High-Value Sales Platform</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {navigationLinks.map((section, sectionIdx) => {
          const isLast = sectionIdx === navigationLinks.length - 1
          return (
            <div
              key={section.section}
              className={cn(isLast && "flex flex-1 flex-col justify-end")}
            >
              {/* {section.section !== "quick-actions" &&
                section.section !== "settings" && (
                  <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    {section.section}
                  </p>
                )} */}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href && item.href !== "#"

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-teal-600">
            <AvatarFallback className="bg-teal-600 font-semibold text-white">
              U
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              Sales Professional
            </p>
            <p className="truncate text-xs text-gray-600">Manage your offers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Sidebar = () => {
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
      <div className="flex flex-col border-r border-gray-200 bg-white">
        <SidebarContent />
      </div>
    </aside>
  )
}

export default Sidebar
