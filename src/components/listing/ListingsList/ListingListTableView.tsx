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

const ListingListTableView = () => {
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
          <TableRow className="px-4">
            <TableCell className="flex flex-col gap-1">
              <span className="font-medium">101 Pine Avenue, Springfield</span>
              <span className="text-xs text-gray-700">
                Listed on Nov 12, 2025
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="success">For Sale</Badge>
            </TableCell>
            <TableCell className="text-center">1</TableCell>
            <TableCell className="text-center">1</TableCell>
            <TableCell className="text-center">1</TableCell>
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
                      className="hover: flex items-center justify-start gap-2 p-2"
                    >
                      <Pencil size={18} />
                      <span className="text-sm"> Update Listing Status</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default ListingListTableView
