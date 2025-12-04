import Heading from "@/components/shared/typography/Heading"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ToBeImplemented() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <Heading as="h1" size="large" weight="bold" className="text-teal-500">
          Feature Coming Soon
        </Heading>
        <p className="mt-4 text-lg text-gray-600">
          This feature is currently under development and will be available
          soon.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          We're working hard to bring you the best experience possible.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
