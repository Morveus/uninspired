'use client'

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { WishlistItem } from "@prisma/client"

interface WishlistTableProps {
  items: WishlistItem[]
  onDelete: (id: number) => void
  showOfferedBy?: boolean
  deletingId?: number | null
}

type SortField = 'title' | 'description' | 'price' | 'priority' | 'purchasedBy'
type SortOrder = 'asc' | 'desc'

function PriorityStars({ priority }: { priority: number }) {
  if (priority === 1) return <span className="text-red-500">⭐⭐⭐</span>
  if (priority === 2) return <span className="text-amber-500">⭐⭐</span>
  if (priority === 3) return <span className="text-yellow-500">⭐</span>
  return <span className="text-muted-foreground">-</span>
}

function compareNullable<T>(a: T | null, b: T | null, cmp: (x: T, y: T) => number): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return cmp(a, b)
}

export function WishlistTable({
  items,
  onDelete,
  showOfferedBy = false,
  deletingId = null,
}: WishlistTableProps) {
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...items]
    const dir = sortOrder === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      switch (sortField) {
        case 'title':
          return dir * a.title.localeCompare(b.title)
        case 'description':
          return dir * compareNullable(a.description, b.description, (x, y) => x.localeCompare(y))
        case 'price':
          return dir * compareNullable(a.price, b.price, (x, y) => x - y)
        case 'priority':
          return dir * (a.priority - b.priority)
        case 'purchasedBy':
          return dir * compareNullable(a.purchasedBy, b.purchasedBy, (x, y) => x.localeCompare(y))
      }
    })
    return arr
  }, [items, sortField, sortOrder])

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
    return sortOrder === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 inline" />
      : <ArrowDown className="ml-1 h-3 w-3 inline" />
  }

  const SortableHead = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center font-medium hover:text-foreground/80 transition-colors"
      >
        {label}
        <SortIndicator field={field} />
      </button>
    </TableHead>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="title" label="Item Name" />
            <SortableHead field="description" label="Description" />
            <SortableHead field="price" label="Price" />
            <SortableHead field="priority" label="Priority" className="w-[110px]" />
            {showOfferedBy && <SortableHead field="purchasedBy" label="Offered By" />}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item) => (
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
              <TableCell>
                <PriorityStars priority={item.priority} />
              </TableCell>
              {showOfferedBy && <TableCell>{item.purchasedBy || '-'}</TableCell>}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-current" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
