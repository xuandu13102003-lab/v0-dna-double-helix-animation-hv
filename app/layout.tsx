import { Analytics } from '@vercel/analytics/next'
import { Be_Vietnam_Pro } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const vietnameseFont = Be_Vietnam_Pro({
  weight: ['400', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-vietnamese',
})

export const metadata: Metadata = {
  title: 'For Bảo Ngọc — A Hand-Drawn Birthday Cake',
  description: 'A little line of magic, drawn especially for Bảo Ngọc.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${vietnameseFont.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
