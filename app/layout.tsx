import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import GoogleAnalytics from "@/components/google-analytics"
import "../styles/globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Save 5+ Hours Weekly - PDF to QuickBooks Converter Free",
  description:
    "Free PDF to QuickBooks converter. Convert PDF receipts to QuickBooks-ready CSV files in minutes. Automated receipt processing saves bookkeepers 5+ hours weekly.",
  keywords: "pdf to quickbooks, pdf to qbo converter free, receipt processing, bookkeeping automation, quickbooks csv import",
  generator: "v0.app",
  icons: {
    icon: '/logo-2.png',
    shortcut: '/logo-2.png',
    apple: '/logo-2.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PDF to QuickBooks Converter",
    "description": "Free PDF to QuickBooks converter. Convert PDF receipts to QuickBooks-ready CSV files in minutes. Automated receipt processing saves bookkeepers 5+ hours weekly.",
    "url": "https://pdftoquickbooks.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free during feedback phase"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500"
    },
    "featureList": [
      "PDF to QuickBooks conversion",
      "Automated receipt processing", 
      "QuickBooks CSV export",
      "Batch processing up to 10 files",
      "AI-powered data extraction"
    ]
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <GoogleAnalytics measurementId="G-G0DE5J73WP" />
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
