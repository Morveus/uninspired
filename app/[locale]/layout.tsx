import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {NextIntlClientProvider} from 'next-intl';
import type { Locale } from '@/i18n/routing';
import {Link} from '@/i18n/routing';
import { ThemeProvider } from "@/components/ThemeProvider"
import { ModeToggle } from "@/components/ThemeSwitcher"
import { cookies } from 'next/headers'
import { ThemeSwitcherWithTooltip } from "@/components/ThemeSwitcherWithTooltip"


const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Uninspired",
  description: "Self-hosted wishlist with no bullshit",
};

function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Props['params']
}>) {
  const {locale} = await params
  const messages = await getMessages();
  const currentYear = new Date().getFullYear();
  
  // Get the theme from cookies
  const cookieStore = await cookies()
  const theme = cookieStore.get('uninspired-theme')?.value || 'dark'
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang="en" className={theme} style={{ colorScheme: theme }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme={theme}
            enableSystem={false}
            storageKey="uninspired-theme"
          >
            <header className="border-b">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                  <Link href="/" className="text-xl font-semibold">
                    Uninspired
                  </Link>
                  <ThemeSwitcherWithTooltip />
                </div>
              </div>
            </header>
            {children}
            <footer className="border-t py-8 mt-20">
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                  <div className="text-sm text-muted-foreground">
                    © {currentYear} Uninspired by <Link href="https://github.com/Morveus">David Balland</Link>.
                  </div>
                  <div className="flex gap-6">
                    <Link href="https://github.com/Morveus/uninspired" className="text-sm text-muted-foreground hover:text-foreground">
                      GitHub
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
