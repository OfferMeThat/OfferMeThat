import { LISTING_STATUSES, LISTING_TO_BADGE_MAP } from "@/constants/listings"
import { ListingWithOfferCounts } from "@/types/listing"
import {
  ArrowRight,
  ChartColumn,
  Ellipsis,
  MessageSquare,
  Pencil,
} from "lucide-react"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"

const ListingListTableView = ({
  listings,
}: {
  listings: Array<ListingWithOfferCounts> | null
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-md">
      <Table className="overflow-x-auto">
        <TableHeader>
          <TableRow className="px-4">
            <TableHead className="min-w-72 font-medium text-gray-700">
              Listing
            </TableHead>
            <TableHead className="min-w-20 font-medium text-gray-700">
              Status
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Pending Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Active Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Total Offers
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Leads
            </TableHead>
            <TableHead className="min-w-20 text-center font-medium text-gray-700">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings?.map((item) => {
            const date = new Date(item.createdAt)
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            return (
              <TableRow key={item.id} className="px-4">
                <TableCell className="flex flex-col gap-1">
                  <span className="font-medium">{item.address}</span>
                  <span className="text-xs text-gray-700">
                    Listed on {formattedDate}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={LISTING_TO_BADGE_MAP[item.status]}>
                    {LISTING_STATUSES[item.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {item.activeOffers}
                </TableCell>
                <TableCell className="text-center">
                  {item.pendingOffers}
                </TableCell>
                <TableCell className="text-center">
                  {item.totalOffers}
                </TableCell>
                <TableCell className="text-center">1</TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="mx-auto">
                        <Ellipsis size={18} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="max-w-60 p-2"
                      side="bottom"
                      collisionPadding={64}
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          className="hover: flex items-center justify-start gap-2 p-2"
                        >
                          <ArrowRight size={18} />
                          <span className="text-sm">Go to Listing</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="hover: flex items-center justify-start gap-2 p-2"
                        >
                          <MessageSquare size={18} />
                          <span className="text-sm"> Message Seller</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="hover: flex items-center justify-start gap-2 p-2"
                        >
                          <ChartColumn size={18} />
                          <span className="text-sm">
                            Generate Report for Seller
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex items-center justify-start gap-2 p-2"
                        >
                          <Pencil size={18} />
                          <span className="text-sm">
                            {" "}
                            Update Listing Status
                          </span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default ListingListTableView
