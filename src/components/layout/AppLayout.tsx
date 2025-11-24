import MobileSidebar from "../navigation/MobileSidebar"
import Sidebar from "../navigation/Sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen pt-8 md:pt-0">
      <Sidebar />

      <MobileSidebar />

      <div className="md:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
