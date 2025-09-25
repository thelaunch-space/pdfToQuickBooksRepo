// Google Analytics component for PDF to QuickBooks application - handles GA4 tracking and custom events
'use client'

import Script from 'next/script'
import { useEffect } from 'react'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

interface GoogleAnalyticsProps {
  measurementId: string
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
    }
  }, [])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  )
}

// Custom event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

// Focused tracking functions for key business metrics
export const trackTrialUpload = (format: '3-column' | '4-column') => {
  trackEvent('trial_pdf_upload', {
    format,
    event_category: 'trial',
    event_label: 'PDF Upload'
  })
}

export const trackSignup = (source: 'trial_widget' | 'landing_page' | 'header' | 'pricing_section' | 'final_cta') => {
  trackEvent('signup_initiated', {
    source,
    event_category: 'conversion',
    event_label: 'User Registration'
  })
}

export const trackCSVDownload = (batchId: string, format: '3-column' | '4-column') => {
  trackEvent('csv_downloaded', {
    batch_id: batchId,
    format,
    event_category: 'conversion',
    event_label: 'CSV Export'
  })
}

// Optional: Track key user actions (uncomment if needed)
// export const trackAccountCreation = (accountName: string) => {
//   trackEvent('account_created', {
//     account_name: accountName,
//     event_category: 'user_action',
//     event_label: 'Client Account'
//   })
// }
