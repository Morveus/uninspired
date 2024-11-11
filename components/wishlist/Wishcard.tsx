'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { WishlistItem } from '@prisma/client'
import { PurchaseDialog } from './PurchaseDialog'
import { cn } from '@/lib/utils'

export function WishCard({ item }: { item: WishlistItem }) {
  const t = useTranslations('wishlist')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePurchase = async (purchaserName: string) => {
    try {
      const response = await fetch(`/api/wishlist/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchased: true,
          purchasedBy: purchaserName,
          purchasedAt: new Date(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating item:', error)
    }
    setIsDialogOpen(false)
  }

//   const itemLink = item.url ? (
//     <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
//       {/* Content */}
//     </a>
//   ) : null

  return (
    <div className={cn(
      "bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden",
      item.purchased && "opacity-60 bg-muted"
    )}>
      {item.image && (
        <div className="relative h-48 w-full">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <img
                src={item.image}
                alt={item.title}
                className="object-cover w-full h-full"
              />
            </a>
          ) : (
            <img
              src={item.image}
              alt={item.title}
              className="object-cover w-full h-full"
            />
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <h3 className="font-semibold text-lg">{item.title}</h3>
            </a>
          ) : (
            <h3 className="font-semibold text-lg">{item.title}</h3>
          )}
          <div className="flex items-center gap-2">
            {item.priority === 1 && <span className="text-red-500">⭐⭐⭐</span>}
            {item.priority === 2 && <span className="text-amber-500">⭐⭐</span>}
            {item.priority === 3 && <span className="text-yellow-500">⭐</span>}
          </div>
        </div>
        
        {item.description && (
          <p className="text-muted-foreground mt-2">{item.description}</p>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          {item.price && (
            <p className="font-medium">
              {item.currency || '€'} {item.price.toFixed(2)}
            </p>
          )}
          {!item.purchased && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              {t('offer')}
            </button>
          )}
        </div>

        {item.purchased && (
          <div className="mt-4 text-sm text-muted-foreground text-red-500">
            {t('purchasedBy', { 
              name: item.purchasedBy || t('someone'),
              date: new Date(item.purchasedAt!).toLocaleDateString()
            })}
          </div>
        )}
      </div>

      <PurchaseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handlePurchase}
        itemTitle={item.title}
      />
    </div>
  )
}