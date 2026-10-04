import React from 'react'
import type { OtterConfig } from '../types'

// ============================================================
// OtterAvatar — BESIDE's identity system
// SVG-based customizable otter mascot
// ============================================================

interface OtterAvatarProps {
  config?: OtterConfig | any
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  animate?: boolean
  className?: string
  showBorder?: boolean
}

const SIZE_MAP: Record<string, string> = {
  xs:  'w-8 h-8',
  sm:  'w-12 h-12',
  md:  'w-16 h-16',
  lg:  'w-24 h-24',
  xl:  'w-32 h-32',
  '2xl': 'w-40 h-40',
}

const FUR_COLORS: Record<string, { body: string; belly: string; face: string; nose: string }> = {
  brown:  { body: '#8B5E3C', belly: '#D4A57A', face: '#C08A5E', nose: '#5C3A1E' },
  tan:    { body: '#C5956A', belly: '#EDD4AF', face: '#DDB896', nose: '#8B5E3C' },
  dark:   { body: '#5C3A1E', belly: '#8B5E3C', face: '#7A4E2D', nose: '#2C1810' },
  cream:  { body: '#D4B896', belly: '#F0E0C8', face: '#E8D0B4', nose: '#8B5E3C' },
  grey:   { body: '#8B8B8B', belly: '#C8C8C8', face: '#ABABAB', nose: '#5C5C5C' },
}

const BG_COLORS: Record<string, string> = {
  cream:   '#FDF6EC',
  sky:     '#E8F4FD',
  forest:  '#E8F5E9',
  library: '#F5F0E8',
  night:   '#1E2A3A',
  sunset:  '#FFF3E0',
}

const EYE_VARIANTS: Record<string, React.ReactNode> = {
  happy: (
    <>
      <path d="M 35 38 Q 38 34 41 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 59 38 Q 62 34 65 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  curious: (
    <>
      <circle cx="38" cy="37" r="5" fill="#2C1810"/>
      <circle cx="62" cy="37" r="5" fill="#2C1810"/>
      <circle cx="40" cy="35" r="1.5" fill="white"/>
      <circle cx="64" cy="35" r="1.5" fill="white"/>
    </>
  ),
  sleepy: (
    <>
      <path d="M 33 38 Q 38 41 43 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 57 38 Q 62 41 67 38" stroke="#2C1810" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  ),
  focused: (
    <>
      <circle cx="38" cy="37" r="5" fill="#2C1810"/>
      <circle cx="62" cy="37" r="5" fill="#2C1810"/>
      <circle cx="39" cy="36" r="1.5" fill="white"/>
      <circle cx="63" cy="36" r="1.5" fill="white"/>
      <path d="M 33 31 L 43 33" stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 57 33 L 67 31" stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
  cool: (
    <>
      <circle cx="38" cy="37" r="5" fill="#2C1810"/>
      <circle cx="62" cy="37" r="5" fill="#2C1810"/>
      <circle cx="39.5" cy="35.5" r="1.5" fill="white"/>
      <circle cx="63.5" cy="35.5" r="1.5" fill="white"/>
      <path d="M 33 33 L 43 32" stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 57 32 L 67 33" stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round"/>
    </>
  ),
}

const GLASSES_VARIANTS: Record<string, React.ReactNode> = {
  none: null,
  round: (
    <g opacity="0.85">
      <circle cx="38" cy="37" r="8" fill="none" stroke="#5C3A1E" strokeWidth="2"/>
      <circle cx="62" cy="37" r="8" fill="none" stroke="#5C3A1E" strokeWidth="2"/>
      <line x1="46" y1="37" x2="54" y2="37" stroke="#5C3A1E" strokeWidth="1.5"/>
      <line x1="30" y1="35" x2="27" y2="34" stroke="#5C3A1E" strokeWidth="1.5"/>
      <line x1="70" y1="35" x2="73" y2="34" stroke="#5C3A1E" strokeWidth="1.5"/>
    </g>
  ),
  square: (
    <g opacity="0.85">
      <rect x="30" y="29" width="16" height="14" rx="2" fill="none" stroke="#2C1810" strokeWidth="2"/>
      <rect x="54" y="29" width="16" height="14" rx="2" fill="none" stroke="#2C1810" strokeWidth="2"/>
      <line x1="46" y1="36" x2="54" y2="36" stroke="#2C1810" strokeWidth="1.5"/>
    </g>
  ),
  aviator: (
    <g opacity="0.85">
      <ellipse cx="38" cy="38" rx="9" ry="7" fill="rgba(100,180,255,0.2)" stroke="#8B6914" strokeWidth="2"/>
      <ellipse cx="62" cy="38" rx="9" ry="7" fill="rgba(100,180,255,0.2)" stroke="#8B6914" strokeWidth="2"/>
      <line x1="47" y1="37" x2="53" y2="37" stroke="#8B6914" strokeWidth="1.5"/>
    </g>
  ),
  star: (
    <g opacity="0.9">
      <polygon points="38,30 39.5,35 45,35 40.5,38.5 42,44 38,40.5 34,44 35.5,38.5 31,35 36.5,35" fill="rgba(255,220,0,0.6)" stroke="#8B6914" strokeWidth="1"/>
      <polygon points="62,30 63.5,35 69,35 64.5,38.5 66,44 62,40.5 58,44 59.5,38.5 55,35 60.5,35" fill="rgba(255,220,0,0.6)" stroke="#8B6914" strokeWidth="1"/>
    </g>
  ),
}

const CLOTHING_VARIANTS: Record<string, (_colors: { body: string; belly: string }) => React.ReactNode> = {
  none: () => null,
  hoodie: (_c) => (
    <g>
      <path d="M 20 100 Q 25 80 40 75 Q 50 90 60 75 Q 75 80 80 100 Z" fill="#4A6741" opacity="0.9"/>
      <path d="M 40 75 Q 50 85 60 75 L 60 90 Q 50 95 40 90 Z" fill="#3D5735"/>
    </g>
  ),
  uniform: (_c) => (
    <g>
      <path d="M 20 100 Q 25 78 40 74 Q 50 88 60 74 Q 75 78 80 100 Z" fill="#2C3E6B" opacity="0.9"/>
      <path d="M 47 80 L 50 90 L 53 80" fill="#FFFFFF" opacity="0.7"/>
    </g>
  ),
  casual: (_c) => (
    <g>
      <path d="M 20 100 Q 25 80 40 75 Q 50 88 60 75 Q 75 80 80 100 Z" fill="#E07020" opacity="0.85"/>
    </g>
  ),
  formal: (_c) => (
    <g>
      <path d="M 20 100 Q 25 78 40 74 Q 50 88 60 74 Q 75 78 80 100 Z" fill="#2C2C2C" opacity="0.9"/>
      <path d="M 47 78 L 50 90 L 53 78 L 50 82 Z" fill="white"/>
      <rect x="48" y="80" width="4" height="2" fill="#C00000"/>
    </g>
  ),
  sweater: (_c) => (
    <g>
      <path d="M 20 100 Q 25 80 40 75 Q 50 90 60 75 Q 75 80 80 100 Z" fill="#B56B8A" opacity="0.85"/>
      <path d="M 30 82 Q 35 80 40 82 M 60 82 Q 65 80 70 82" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
    </g>
  ),
}

const ACCESSORY_VARIANTS: Record<string, React.ReactNode> = {
  none: null,
  headphones: (
    <g>
      <path d="M 24 42 Q 24 20 50 20 Q 76 20 76 42" fill="none" stroke="#2C1810" strokeWidth="3" strokeLinecap="round"/>
      <rect x="20" y="40" width="9" height="12" rx="3" fill="#4A6741"/>
      <rect x="71" y="40" width="9" height="12" rx="3" fill="#4A6741"/>
    </g>
  ),
  pencil: (
    <g transform="translate(72, 20) rotate(45)">
      <rect x="0" y="0" width="5" height="24" fill="#F5C842"/>
      <polygon points="0,24 5,24 2.5,30" fill="#FFAAAA"/>
      <rect x="0" y="20" width="5" height="3" fill="#C0C0C0"/>
      <line x1="2.5" y1="28.5" x2="2.5" y2="30" stroke="#2C1810" strokeWidth="1"/>
    </g>
  ),
  book: (
    <g transform="translate(65, 55)">
      <rect x="0" y="0" width="20" height="15" rx="1" fill="#8B3A3A"/>
      <rect x="2" y="1" width="16" height="13" rx="1" fill="#FAECD6"/>
      <line x1="5" y1="4" x2="15" y2="4" stroke="#8B3A3A" strokeWidth="1"/>
      <line x1="5" y1="6.5" x2="15" y2="6.5" stroke="#8B3A3A" strokeWidth="1"/>
      <line x1="5" y1="9" x2="12" y2="9" stroke="#8B3A3A" strokeWidth="1"/>
    </g>
  ),
  coffee: (
    <g transform="translate(64, 56)">
      <rect x="2" y="5" width="14" height="12" rx="2" fill="#E8E0D0"/>
      <path d="M 16 8 Q 22 8 22 12 Q 22 16 16 16" fill="none" stroke="#E8E0D0" strokeWidth="2" strokeLinecap="round"/>
      <rect x="4" y="0" width="10" height="5" rx="1" fill="#4A2800"/>
      <ellipse cx="9" cy="0" rx="5" ry="2" fill="#6B3A0A"/>
    </g>
  ),
  backpack: (
    <g transform="translate(62, 30)">
      <rect x="0" y="5" width="18" height="22" rx="3" fill="#4A6741"/>
      <rect x="3" y="1" width="12" height="8" rx="2" fill="#3D5735"/>
      <rect x="4" y="11" width="10" height="8" rx="2" fill="#3D5735" opacity="0.7"/>
      <path d="M 3 5 Q 1 5 1 10 L 1 25 Q 1 28 3 28" fill="none" stroke="#3D5735" strokeWidth="2"/>
      <path d="M 15 5 Q 17 5 17 10 L 17 25 Q 17 28 15 28" fill="none" stroke="#3D5735" strokeWidth="2"/>
    </g>
  ),
}

export default function OtterAvatar({
  config,
  size = 'md',
  animate = false,
  className = '',
  showBorder = false,
}: OtterAvatarProps) {
  // Support both config and config.otter or config.otter_config if a whole user was mistakenly passed
  const resolvedConfig = config?.otter_config || config?.otter || config || {}

  const safeConfig: OtterConfig = {
    fur: resolvedConfig?.fur || 'brown',
    eyes: resolvedConfig?.eyes || 'happy',
    glasses: resolvedConfig?.glasses || 'none',
    clothing: resolvedConfig?.clothing || 'hoodie',
    accessory: resolvedConfig?.accessory || 'none',
    background: resolvedConfig?.background || 'cream',
  }

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md
  const colors = FUR_COLORS[safeConfig.fur] || FUR_COLORS.brown
  const bgColor = BG_COLORS[safeConfig.background] || BG_COLORS.cream
  const ClothingEl = CLOTHING_VARIANTS[safeConfig.clothing]

  return (
    <div
      className={`
        ${sizeClass} ${className} relative flex-shrink-0
        ${animate ? 'animate-float' : ''}
        ${showBorder ? 'ring-2 ring-beside-secondary ring-offset-2' : ''}
        rounded-full overflow-hidden
      `}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background */}
        <rect width="100" height="100" fill={bgColor}/>

        {/* Ears */}
        <ellipse cx="22" cy="38" rx="11" ry="10" fill={colors.body}/>
        <ellipse cx="22" cy="38" rx="7" ry="6" fill={colors.face}/>
        <ellipse cx="78" cy="38" rx="11" ry="10" fill={colors.body}/>
        <ellipse cx="78" cy="38" rx="7" ry="6" fill={colors.face}/>

        {/* Body */}
        <ellipse cx="50" cy="72" rx="28" ry="24" fill={colors.body}/>

        {/* Belly */}
        <ellipse cx="50" cy="75" rx="18" ry="16" fill={colors.belly}/>

        {/* Clothing */}
        {ClothingEl && ClothingEl({ body: colors.body, belly: colors.belly })}

        {/* Head */}
        <ellipse cx="50" cy="45" rx="26" ry="24" fill={colors.body}/>

        {/* Face area */}
        <ellipse cx="50" cy="48" rx="18" ry="15" fill={colors.face}/>

        {/* Cheek blush */}
        <ellipse cx="33" cy="46" rx="5" ry="3" fill="#FF8C69" opacity="0.25"/>
        <ellipse cx="67" cy="46" rx="5" ry="3" fill="#FF8C69" opacity="0.25"/>

        {/* Eyes */}
        {EYE_VARIANTS[safeConfig.eyes] || EYE_VARIANTS.happy}

        {/* Nose */}
        <ellipse cx="50" cy="49" rx="4" ry="2.5" fill={colors.nose}/>

        {/* Mouth — small happy */}
        <path d="M 46 53 Q 50 57 54 53" stroke={colors.nose} strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* Whiskers */}
        <line x1="20" y1="48" x2="38" y2="50" stroke={colors.body} strokeWidth="1" opacity="0.6"/>
        <line x1="20" y1="52" x2="38" y2="52" stroke={colors.body} strokeWidth="1" opacity="0.6"/>
        <line x1="62" y1="50" x2="80" y2="48" stroke={colors.body} strokeWidth="1" opacity="0.6"/>
        <line x1="62" y1="52" x2="80" y2="52" stroke={colors.body} strokeWidth="1" opacity="0.6"/>

        {/* Glasses (on top of eyes) */}
        {GLASSES_VARIANTS[safeConfig.glasses]}

        {/* Accessories */}
        {ACCESSORY_VARIANTS[safeConfig.accessory]}
      </svg>
    </div>
  )
}
