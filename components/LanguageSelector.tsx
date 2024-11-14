'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { languages, type SupportedLocale } from '@/lib/languages'
import { usePathname } from '@/i18n/routing'
import { Button } from './ui/button'
import { useTranslations } from 'next-intl'

export function LanguageSelector({ currentLocale }: { currentLocale: SupportedLocale }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('wishlist')

  const handleLanguageChange = (locale: SupportedLocale) => {
    // Get the path after the current locale
    const pathWithoutLocale = pathname.replace(/^\/[^\/]+/, '')
    // Redirect to the same path with new locale
    window.location.href = `/${locale}${pathWithoutLocale}`
    setIsOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-lg"
        aria-label={t('changeLanguage')}
      >
        {languages[currentLocale].flag}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-center mb-4">
            {t('selectLanguage')}
          </DialogTitle>
          
          <div className="grid grid-cols-3 gap-4 p-4">
            {(Object.entries(languages) as [SupportedLocale, typeof languages[SupportedLocale]][]).map(([locale, { flag, name }]) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale)}
                className={`flex flex-col items-center p-4 rounded-lg hover:bg-accent transition-colors ${
                  currentLocale === locale ? 'bg-accent border-2 border-primary' : ''
                }`}
                aria-current={currentLocale === locale ? 'true' : undefined}
              >
                <span className="text-2xl" aria-hidden="true">{flag}</span>
                <span className="text-sm mt-2">{name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 