// Tracked link component for Google Analytics tracking - handles click events in client components
'use client'

import { trackSignup } from '@/components/google-analytics'

interface TrackedLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  source: 'trial_widget' | 'landing_page' | 'header' | 'pricing_section' | 'final_cta'
}

export default function TrackedLink({ href, children, className, source }: TrackedLinkProps) {
  const handleClick = () => {
    trackSignup(source)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
