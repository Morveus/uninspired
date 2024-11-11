"use client"
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {Link} from '@/i18n/routing';

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border transition-all hover:shadow-lg">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Home() {
  const t = useTranslations('wishlist');
  const userName = process.env.NEXT_PUBLIC_USER_NAME

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">

        {/* Hero Section */}
        <main className="flex flex-col items-center text-center space-y-8 py-20">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Uninspired
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {t('description')}
            </p>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-[600px]">
            {t('fulldescription')}
          </p>

          <div className="flex gap-4 mt-8">
            {/* <Button size="lg" className="font-medium">
              {t('login')}
            </Button> */}
            <Button 
              size="lg" 
              variant="outline" 
              className="font-medium animate-bounce bg-gradient-to-r from-red-500 to-green-500 hover:from-green-500 hover:to-red-500 hover:text-yellow-200 text-white border-none text-xl py-6"
            >
              <Link href="/wishlist">
                {t('viewwishlist', {username: userName})}
              </Link>
            </Button>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title={t('selfhosted')}
              description={t('selfhosteddescription')}
              icon="🏠"
            />
            <FeatureCard 
              title={t('sharecarefully')}
              description={t('sharecarefullydescription')}
              icon="🤫"
            />
            <FeatureCard 
              title={t('staysimple')}
              description={t('staysimpledescription')}
              icon="✨"
            />
          </div>
        </section>
      </div>
    </div>
  );
}