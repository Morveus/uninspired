import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from 'next-intl';

interface CheckboxWithTooltipProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const CheckboxWithTooltip = ({ checked, onChange, label }: CheckboxWithTooltipProps) => {
  const t = useTranslations('wishlist')
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('has-seen-purchased-tooltip');
    if (hasSeenTooltip) {
      setShowTooltip(false);
    } else {
      localStorage.setItem('has-seen-purchased-tooltip', 'true');
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} defaultOpen>
        <TooltipTrigger asChild>
          <label 
            className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
            onMouseEnter={() => setShowTooltip(false)}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            {label}
          </label>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p>{t('showPurchasedTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 