"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Edit,
  FileText,
  FormInputIcon,
  HelpCircle,
  Layers,
  MessageSquare,
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
      { name: "My Offer Form", href: "/offer-form", icon: FormInputIcon },
      { name: "My Offers", href: "/offers", icon: FileText },
      { name: "My Lead Form", href: "/lead-form", icon: Edit },
      { name: "My Leads", href: "/leads", icon: Target },
      { name: "My Listings", href: "/", icon: Layers },
      {
        name: "Message Centre",
        href: "/to-be-implemented",
        icon: MessageSquare,
      },
    ],
  },
  {
    section: "settings",
    items: [
      {
        name: "My Details/Settings",
        href: "/to-be-implemented",
        icon: Settings,
      },
      { name: "Help", href: "/to-be-implemented", icon: HelpCircle },
      {
        name: "Feedback/Suggestions",
        href: "/to-be-implemented",
        icon: MessageSquare,
      },
    ],
  },
]

interface SidebarContentProps {
  onLinkClick?: () => void
  hasTestOffers?: boolean
}

export const SidebarContent = ({
  onLinkClick,
  hasTestOffers = false,
}: SidebarContentProps) => {
  const pathname = usePathname()

  // Clone navigation links to avoid mutating the original array
  const links = [...navigationLinks]

  // Add Test Offers link if hasTestOffers is true
  if (hasTestOffers) {
    const goToSection = links.find((section) => section.section === "GO TO:")
    if (goToSection) {
      // Check if link already exists to avoid duplicates
      const hasTestLink = goToSection.items.some(
        (item) => item.href === "/test-offers",
      )
      if (!hasTestLink) {
        // Insert after "My Offers"
        const myOffersIndex = goToSection.items.findIndex(
          (item) => item.href === "/offers",
        )
        const insertIndex = myOffersIndex !== -1 ? myOffersIndex + 1 : 1

        const newItems = [...goToSection.items]
        newItems.splice(insertIndex, 0, {
          name: "My Test Offers",
          href: "/test-offers",
          icon: FileText,
        })

        // Create a new section object with updated items
        const newSection = { ...goToSection, items: newItems }
        // Replace the old section in the links array
        const sectionIndex = links.findIndex(
          (section) => section.section === "GO TO:",
        )
        links[sectionIndex] = newSection
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">OfferMeThat</h1>
            <p className="text-xs text-gray-600">High-Value Sales Platform</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        {links.map((section, sectionIdx) => {
          const isLast = sectionIdx === links.length - 1
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
                        item.href === "/test-offers"
                          ? isActive
                            ? "bg-red-100 text-red-900"
                            : "text-red-600 hover:bg-red-50 hover:text-red-900"
                          : isActive
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
          <Avatar className="h-10 w-10 bg-teal-500">
            <AvatarFallback className="bg-teal-500 font-semibold text-white">
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

interface SidebarProps {
  hasTestOffers?: boolean
}

const Sidebar = ({ hasTestOffers = false }: SidebarProps) => {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex h-screen flex-col border-r border-gray-200 bg-white">
        <SidebarContent hasTestOffers={hasTestOffers} />
      </div>
    </aside>
  )
}

export default Sidebar
