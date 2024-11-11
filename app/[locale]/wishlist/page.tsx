"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { WishCard } from "@/components/wishlist/Wishcard"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

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
  const userName = process.env.NEXT_PUBLIC_USER_NAME

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
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              {t('backToHome')}
            </Button>
          </Link>
        </nav>

        {/* Header with decorative elements */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('wishlist', {username: userName})}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
            <p className="text-muted-foreground">
              {items.length} {t('itemsinthewishlist')}
            </p>
            <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
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
            {items.map((item, index) => (
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