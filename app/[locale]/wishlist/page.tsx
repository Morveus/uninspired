"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { WishCard } from "@/components/wishlist/Wishcard"
import { SortSelector } from "@/components/wishlist/SortSelector"
import { CheckboxWithTooltip } from "@/components/wishlist/CheckboxWithTooltip"

interface WishlistItem {
  id: number
  title: string
  description: string | null
  url: string | null
  image: string | null
  currency: string | null
  price: number | null
  priority: number
  purchased: boolean
  purchasedAt: Date | null
  purchasedBy: string | null
  createdAt: Date
  updatedAt: Date
}

type SortOption = 'priority-asc' | 'priority-desc' | 'price-asc' | 'price-desc'

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>('price-asc')
  const [showPurchased, setShowPurchased] = useState(false)
  const t = useTranslations('wishlist')
  const userName = process.env.NEXT_PUBLIC_USER_NAME

  useEffect(() => {
    fetch(`/api/wishlist?sort=${sort}`)
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching wishlist items:', err)
        setError('Failed to load wishlist items')
        setLoading(false)
      })
  }, [sort])

  const displayedItems = showPurchased 
    ? items 
    : items.filter(item => !item.purchased)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header with decorative elements */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('wishlist', {username: userName})}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
            <p className="text-muted-foreground">
              {items.filter(item => !item.purchased).length} {t('itemsinthewishlist')}
            </p>
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <SortSelector value={sort} onChange={(value: SortOption) => setSort(value)} />
            <CheckboxWithTooltip
              checked={showPurchased}
              onChange={setShowPurchased}
              label={t('showPurchased')}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('loadingwishlist')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Wishlist Grid with animation */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {displayedItems.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <WishCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}