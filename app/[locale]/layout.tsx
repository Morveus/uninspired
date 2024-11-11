import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {NextIntlClientProvider} from 'next-intl';
import type { Locale } from '@/i18n/routing';
import {Link} from '@/i18n/routing';

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

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <Link href="/" className="text-xl font-semibold">
                Uninspired
              </Link>
            </div>
          </header>
          {children}
          <footer className="border-t py-8 mt-20">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                <div className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Uninspired by <Link href="https://github.com/Morveus">David Balland</Link>.
                </div>
                <div className="flex gap-6">
                  <Link href="https://github.com/Morveus/uninspired" className="text-sm text-muted-foreground hover:text-foreground">
                    GitHub
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
