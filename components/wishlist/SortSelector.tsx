import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"

type SortOption = 'priority-asc' | 'priority-desc' | 'price-asc' | 'price-desc'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortSelector({ value = 'price-asc', onChange }: SortSelectorProps) {
  const t = useTranslations('wishlist')

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder={t('sortBy')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="priority-desc">{t('priorityHighToLow')}</SelectItem>
        <SelectItem value="priority-asc">{t('priorityLowToHigh')}</SelectItem>
        <SelectItem value="price-desc">{t('priceHighToLow')}</SelectItem>
        <SelectItem value="price-asc">{t('priceLowToHigh')}</SelectItem>
      </SelectContent>
    </Select>
  )
}