"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useState } from "react"
import { SidebarContent } from "./Sidebar"

interface MobileSidebarProps {
  hasTestOffers?: boolean
}

const MobileSidebar = ({ hasTestOffers = false }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="bg-white shadow-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent
            onLinkClick={() => setOpen(false)}
            hasTestOffers={hasTestOffers}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default MobileSidebar
