"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPage() {
  const router = useRouter()
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

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

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
          priority: parseInt(formData.priority)
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
      router.push('/wishlist')

    } catch (error) {
      console.error('Error creating wish:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
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
    </div>
  )
} 