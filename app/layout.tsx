import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { ContributorProvider } from '@/components/ContributorProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Family Tree',
    template: '%s · Family Tree',
  },
  description: 'A private family genealogy system',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Family Tree',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf5ee' },
    { media: '(prefers-color-scheme: dark)',  color: '#0c0907' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: the ThemeToggle adds/removes `dark` on the
    // client, causing a mismatch the server can't predict — this suppresses
    // the harmless hydration warning.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Flash-prevention script ─────────────────────────────────────
            Runs synchronously before first paint. If the user previously
            chose dark mode, we add the class immediately so there's no
            flash of light content. Default (no stored preference) = light.
        ────────────────────────────────────────────────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body
        className={`
          ${inter.variable} ${cormorant.variable} font-sans antialiased min-h-screen
          bg-zinc-50 text-zinc-900
          dark:bg-zinc-950 dark:text-zinc-100
        `}
      >
        {/* Safe-area padding for notched devices */}
        <div className="min-h-screen flex flex-col pb-safe">
          <ContributorProvider />
          {children}
        </div>

        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
