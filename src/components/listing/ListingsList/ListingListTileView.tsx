import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SquarePen } from "lucide-react"

const ListingListTileView = () => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-1 flex flex-col gap-2 rounded-lg border border-gray-100 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <Badge variant="success">For Sale</Badge>
          <Button variant="ghost">
            <SquarePen size={18} />
          </Button>
        </div>

        <span className="text-xl font-bold">101 Pine Avenue, Springfield</span>

        <div className="my-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Pending Offer
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Active Offers
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Total Offers
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">Leads</span>
          </div>
        </div>

        <span className="text-sm font-medium text-gray-700">
          Listed: Oct 29, 2025
        </span>
      </div>

      <div className="col-span-1 flex flex-col gap-2 rounded-lg border border-gray-100 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <Badge variant="success">For Sale</Badge>
          <Button variant="ghost">
            <SquarePen size={18} />
          </Button>
        </div>

        <span className="text-xl font-bold">101 Pine Avenue, Springfield</span>

        <div className="my-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Pending Offer
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Active Offers
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">
              Total Offers
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">1</span>
            <span className="text-center text-sm text-gray-700">Leads</span>
          </div>
        </div>

        <span className="text-sm font-medium text-gray-700">
          Listed: Oct 29, 2025
        </span>
      </div>
    </div>
  )
}

export default ListingListTileView
