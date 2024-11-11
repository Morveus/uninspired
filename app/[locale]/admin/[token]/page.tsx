"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WishlistTable } from '@/components/wishlist/WishlistTable'
import { WishlistItem } from '@prisma/client'

type Props = {
  params: {
    token: string
  }
}

export default function AdminPage({ params }: Props) {
  const t = useTranslations('admin')
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    price: "",
    currency: "EUR",
    priority: "3"
  })
  const [items, setItems] = useState<WishlistItem[]>([])
  const [token, setToken] = useState("")

  useEffect(() => {
    const getParams = async () => {
      const paramToken = await params.token
      setToken(paramToken)
    }
    getParams()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          priority: parseInt(formData.priority),
          token: token
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create wish')
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        url: "",
        image: "",
        price: "",
        currency: "EUR",
        priority: "3"
      })

      // Optional: Show success message or redirect
      // router.push('/wishlist')

    } catch (error) {
      console.error('Error creating wish:', error)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
      })

      if (!response.ok) throw new Error('Failed to delete item')
      
      // Refresh the list after deletion
      fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('addWish')}</CardTitle>
          <CardDescription>{t('addWishDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder={t('title')}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder={t('description')}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder={t('url')}
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder={t('image')}
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <Input
                placeholder={t('price')}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({...formData, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('highPriority')}</SelectItem>
                  <SelectItem value="2">{t('mediumPriority')}</SelectItem>
                  <SelectItem value="3">{t('lowPriority')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">{t('addWishButton')}</Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Wishlist Items</h2>
        <WishlistTable items={items} onDelete={handleDelete} />
      </div>
    </div>
  )
} 