import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export type Locale = 'en' | 'fr';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr', 'de', 'es', 'it', 'pl', 'ru', 'pt', 'zh'] as const,
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);