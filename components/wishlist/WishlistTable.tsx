'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { WishlistItem } from "@prisma/client"

interface WishlistTableProps {
  items: WishlistItem[]
  onDelete: (id: number) => void
  showOfferedBy?: boolean
}

export function WishlistTable({ 
  items, 
  onDelete, 
  showOfferedBy = false
}: WishlistTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            {showOfferedBy && <TableHead>Offered By</TableHead>}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium max-w-[100px] truncate">
                {item.title}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.description || '-'}
              </TableCell>
              <TableCell>
                {item.price 
                  ? `${item.price} ${item.currency || 'EUR'}`
                  : '-'
                }
              </TableCell>
              {showOfferedBy && <TableCell>{item.purchasedBy || '-'}</TableCell>}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}