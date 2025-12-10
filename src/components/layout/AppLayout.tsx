import { hasTestOffers } from "@/app/actions/offers"
import MobileSidebar from "../navigation/MobileSidebar"
import Sidebar from "../navigation/Sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout = async ({ children }: AppLayoutProps) => {
  const showTestOffers = await hasTestOffers()

  return (
    <div className="min-h-screen pt-8 lg:pt-0">
      <Sidebar hasTestOffers={showTestOffers} />

      <MobileSidebar hasTestOffers={showTestOffers} />

      <div className="lg:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
