'use client'

import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/ThemeSwitcher"
import { useTranslations } from 'next-intl';

export const ThemeSwitcherWithTooltip = () => {
  const t = useTranslations('wishlist')
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('has-seen-theme-tooltip');
    if (hasSeenTooltip) {
      setShowTooltip(false);
    } else {
      localStorage.setItem('has-seen-theme-tooltip', 'true');
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} defaultOpen>
        <TooltipTrigger asChild>
          <div onMouseEnter={() => setShowTooltip(false)}>
            <ModeToggle />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('switchTheme')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 