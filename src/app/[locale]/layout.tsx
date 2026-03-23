import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import ThemeRegistry from '@/components/layout/ThemeRegistry';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/lib/i18n/messages/${locale}.json`)).default;
  } catch (error) {
    console.error('[layout] Failed to load i18n messages for locale:', locale, error);
    notFound();
  }

  return (
    <html lang={locale}>
      <head>
        <meta name="theme-color" content="#1976D2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeRegistry>{children}</ThemeRegistry>
        </NextIntlClientProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
