import React from 'react'
import { Flame, Users, CalendarCheck, ShieldCheck } from 'lucide-react'
import type { Badge } from '../../types'

interface MetallicBadgeProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
}

export const MetallicBadge: React.FC<MetallicBadgeProps> = ({
  badge,
  size = 'md',
  showLabel = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-xl',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }

  // Realistic metallic gradients
  const tierGradients = {
    gold: {
      background: 'radial-gradient(circle at 35% 35%, #FFF6CC 0%, #F5CE62 30%, #E5A93B 60%, #B87C10 100%)',
      border: 'border-[#FBF0B9]',
      glow: 'shadow-[0_4px_14px_rgba(229,169,59,0.45)]',
      iconColor: 'text-[#6A4705]',
      accent: 'border-[#8B5E0B]',
    },
    silver: {
      background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #E2E8F0 35%, #CBD5E1 65%, #94A3B8 100%)',
      border: 'border-[#F8FAFC]',
      glow: 'shadow-[0_4px_14px_rgba(148,163,184,0.4)]',
      iconColor: 'text-[#334155]',
      accent: 'border-[#64748B]',
    },
    bronze: {
      background: 'radial-gradient(circle at 35% 35%, #FFDFCA 0%, #D99B75 35%, #B8734A 65%, #8C4824 100%)',
      border: 'border-[#FFE3D1]',
      glow: 'shadow-[0_4px_14px_rgba(184,115,74,0.45)]',
      iconColor: 'text-[#4A1E08]',
      accent: 'border-[#703010]',
    },
  }

  const style = tierGradients[badge.tier] || tierGradients.gold

  const renderIcon = () => {
    const cls = `${iconSizes[size]} ${style.iconColor} drop-shadow-sm`
    if (badge.category === 'duo_streak') return <Flame className={cls} />
    if (badge.category === 'squad_streak') return <Users className={cls} />
    if (badge.category === 'daily_active') return <CalendarCheck className={cls} />
    return <ShieldCheck className={cls} />
  }

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center gap-2 select-none group cursor-pointer transition-transform active:scale-95`}
      title={`${badge.title} (${badge.tier.toUpperCase()})`}
    >
      <div
        className={`relative rounded-full flex items-center justify-center p-0.5 border-4 ${style.accent} ${style.glow} ${sizeClasses[size]}`}
        style={{ background: style.background }}
      >
        {/* Metallic rim highlight */}
        <div className="absolute inset-1 rounded-full border border-white/50 pointer-events-none" />
        
        {/* Core icon */}
        <div className="relative z-10 flex items-center justify-center">
          {renderIcon()}
        </div>

        {/* Specular light highlight */}
        <div className="absolute top-1 left-2 w-3 h-3 bg-white/40 rounded-full blur-[1px] pointer-events-none" />
      </div>

      {showLabel && (
        <div className="text-center">
          <div className="text-xs font-bold text-[#2D1B11]">{badge.title}</div>
          <div className="text-[10px] text-[#785949] capitalize">{badge.tier} Tier</div>
        </div>
      )}
    </div>
  )
}
