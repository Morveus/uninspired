"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { WishCard } from "@/components/wishlist/Wishcard"

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


export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('wishlist')

  useEffect(() => {
    fetch('/api/wishlist')
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
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{t('wishlist')}</h1>
            <p className="text-muted-foreground mt-2">
              {items.length} {t('itemsinthewishlist')}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading wishlist...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Wishlist Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <WishCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}