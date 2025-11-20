"use client"

import { LayoutGrid, TableOfContents } from "lucide-react"
import { useState } from "react"
import { Button } from "../../ui/button"
import ListingListTableView from "./ListingListTableView"
import ListingListTileView from "./ListingListTileView"

const ListingsList = () => {
  const [viewStyle, setViewStyle] = useState<"table" | "tile">("table")

  return (
    <>
      <div className="mb-4 flex w-fit items-center gap-1 overflow-hidden rounded-full shadow-sm">
        <Button
          variant="ghost"
          active={viewStyle === "table"}
          onClick={() => setViewStyle("table")}
        >
          <TableOfContents size={18} />
          Table View
        </Button>
        <Button
          variant="ghost"
          active={viewStyle === "tile"}
          onClick={() => setViewStyle("tile")}
        >
          <LayoutGrid size={18} />
          Tile View
        </Button>
      </div>

      {viewStyle === "table" ? (
        <ListingListTableView />
      ) : (
        <ListingListTileView />
      )}
    </>
  )
}

export default ListingsList
