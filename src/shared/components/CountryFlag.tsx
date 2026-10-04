import React from 'react'

interface CountryFlagProps {
  countryCode?: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode = 'DE',
  size = 'xs',
  className = '',
}) => {
  const code = countryCode.toUpperCase()
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
  }

  // Renders vector SVG flags for clean pixel-perfect display
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden border border-white shadow-sm flex-shrink-0 ${sizeClasses[size]} ${className}`}
      title={code}
    >
      {code === 'DE' && (
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#000" d="M0 0h640v160H0z" />
          <path fill="#D00" d="M0 160h640v160H0z" />
          <path fill="#FFCE00" d="M0 320h640v160H0z" />
        </svg>
      )}
      {code === 'FR' && (
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#002395" d="M0 0h213.3v480H0z" />
          <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
          <path fill="#ed2939" d="M426.7 0H640v480H426.7z" />
        </svg>
      )}
      {code === 'PH' && (
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#0038A8" d="M0 0h640v240H0z" />
          <path fill="#CE1126" d="M0 240h640v240H0z" />
          <polygon points="0,0 280,240 0,480" fill="#fff" />
          <circle cx="90" cy="240" r="30" fill="#FCD116" />
        </svg>
      )}
      {code === 'SG' && (
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#ED2939" d="M0 0h640v240H0z" />
          <path fill="#fff" d="M0 240h640v240H0z" />
          <circle cx="120" cy="120" r="45" fill="#fff" />
          <circle cx="135" cy="120" r="45" fill="#ED2939" />
        </svg>
      )}
      {code === 'US' && (
        <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
          <path fill="#bd3d44" d="M0 0h640v480H0z" />
          <path stroke="#fff" strokeWidth="37" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
          <path fill="#192f5d" d="M0 0h260v260H0z" />
        </svg>
      )}
      {code !== 'DE' && code !== 'FR' && code !== 'PH' && code !== 'SG' && code !== 'US' && (
        <div className="w-full h-full bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
          {code.slice(0, 2)}
        </div>
      )}
    </div>
  )
}
