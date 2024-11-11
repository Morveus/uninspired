import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from 'next-intl'

interface PurchaseDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (purchaserName: string) => void
  itemTitle: string
}

export function PurchaseDialog({ isOpen, onClose, onConfirm, itemTitle }: PurchaseDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const t = useTranslations('wishlist')

  const handleSubmit = () => {
    if (!name.trim()) {
      setError(t('nameRequired'))
      return
    }
    onConfirm(name.trim())
    setName('')
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('purchaseConfirmation')}</DialogTitle>
          <DialogDescription>
            {t('purchaseDescription', { item: itemTitle })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('enterYourName')}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('purchaseDialogCancel')}</Button>
          <Button onClick={handleSubmit}>{t('purchaseDialogButton')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}