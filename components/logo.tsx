// Logo component for PDF to QuickBooks application - Reusable logo with fallback
'use client'

import Image from 'next/image'
import { FileText } from 'lucide-react'
import { useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9', 
    lg: 'w-10 h-10'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  if (imageError) {
    // Fallback to FileText icon if logo image fails to load
    return (
      <div className={`header-logo ${className}`}>
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25`}>
          <FileText className="h-4 w-4" />
        </div>
        {showText && (
          <span className={`${textSizes[size]} font-semibold tracking-tight`}>
            <span className="text-slate-900">PDFto</span><em className="italic" style={{background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>QuickBooks</em>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`header-logo ${className}`}>
      <Image
        src="/logo-2.png"
        alt="PDF to QuickBooks Logo"
        width={size === 'sm' ? 32 : size === 'md' ? 36 : 40}
        height={size === 'sm' ? 32 : size === 'md' ? 36 : 40}
        className="object-contain"
        onError={() => setImageError(true)}
      />
      {showText && (
        <span className={`${textSizes[size]} font-semibold tracking-tight`}>
          <span className="text-slate-900">PDFto</span><em className="italic" style={{background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>QuickBooks</em>
        </span>
      )}
    </div>
  )
}
