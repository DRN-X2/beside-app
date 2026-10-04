import React from 'react'
import OtterAvatar from '../../components/OtterAvatar'
import { CountryFlag } from './CountryFlag'
import { DegreeBadge } from './DegreeBadge'
import type { OtterConfig, OnlineStatus } from '../../types'

interface OtterAvatarWithBadgeProps {
  config?: any
  countryCode?: string
  degreeCode?: string
  status?: OnlineStatus
  ringColor?: string // custom ring color or bg circle
  bgCircleColor?: 'blue' | 'red' | 'purple' | 'green' | 'amber' | 'neutral' | 'clean' | 'none'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDegree?: boolean
  className?: string
  onClick?: () => void
}

export const OtterAvatarWithBadge: React.FC<OtterAvatarWithBadgeProps> = ({
  config,
  countryCode = 'DE',
  degreeCode,
  status,
  bgCircleColor = 'blue',
  size = 'md',
  showDegree = false,
  className = '',
  onClick,
}) => {
  const bgClasses: Record<string, string> = {
    blue: 'bg-[#2952E3]',
    red: 'bg-[#E13B30]',
    purple: 'bg-[#7C3AED]',
    green: 'bg-[#10B981]',
    amber: 'bg-[#F59E0B]',
    neutral: 'bg-[#8D5B4C]',
    clean: 'bg-white/80 border border-black/10',
    none: 'bg-transparent',
  }

  const dimensionClasses: Record<string, { container: string; avatarSize: 'sm' | 'md' | 'lg' | 'xl'; flagSize: 'xs' | 'sm' | 'md' }> = {
    sm: { container: 'w-12 h-12', avatarSize: 'sm', flagSize: 'xs' },
    md: { container: 'w-16 h-16', avatarSize: 'md', flagSize: 'xs' },
    lg: { container: 'w-24 h-24', avatarSize: 'lg', flagSize: 'sm' },
    xl: { container: 'w-28 h-28', avatarSize: 'xl', flagSize: 'sm' },
  }

  const dim = dimensionClasses[size] || dimensionClasses.md

  return (
    <div className={`flex flex-col items-center gap-1 select-none ${className}`} onClick={onClick}>
      <div
        className={`relative rounded-full shadow-sm flex items-center justify-center p-1 transition-transform active:scale-95 ${dim.container} ${bgClasses[bgCircleColor]}`}
      >
        <OtterAvatar config={config} size={dim.avatarSize} />
        {countryCode && (
          <div className="absolute -bottom-1 -right-1 z-10">
            <CountryFlag countryCode={countryCode} size={dim.flagSize} />
          </div>
        )}
      </div>

      {showDegree && degreeCode && (
        <DegreeBadge degreeCode={degreeCode} size={size === 'sm' ? 'sm' : 'md'} />
      )}
    </div>
  )
}
