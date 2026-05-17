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
  // If provided, the Priority cell becomes clickable and cycles
  // 3 (1 star) → 2 (2 stars) → 1 (3 stars) → 3 on each click.
  onPriorityChange?: (id: number, newPriority: number) => void | Promise<void>
}

type SortField = 'title' | 'description' | 'price' | 'priority' | 'purchasedBy'
type SortOrder = 'asc' | 'desc'

function PriorityStars({ priority, onClick }: { priority: number; onClick?: () => void }) {
  const content =
    priority === 1 ? <span className="text-red-500">⭐⭐⭐</span> :
    priority === 2 ? <span className="text-amber-500">⭐⭐</span> :
    priority === 3 ? <span className="text-yellow-500">⭐</span> :
    <span className="text-muted-foreground">-</span>

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer hover:opacity-70 transition-opacity"
        aria-label="Cycle priority"
      >
        {content}
      </button>
    )
  }
  return content
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
  onPriorityChange,
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
                <PriorityStars
                  priority={item.priority}
                  onClick={onPriorityChange ? () => {
                    // cycle visible : 1 star (3) → 2 stars (2) → 3 stars (1) → 1 star (3)
                    const next = item.priority === 1 ? 3 : item.priority - 1
                    onPriorityChange(item.id, next)
                  } : undefined}
                />
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
