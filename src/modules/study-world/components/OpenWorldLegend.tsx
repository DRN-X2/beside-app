import React from 'react'

interface OpenWorldLegendProps {
  className?: string
  neuShadow?: string
  neuInset?: string
  neuBase?: string
}

const NEU_BASE = '#2B1C13'
const NEU_DARK = '#180D08'
const NEU_LIGHT = '#3E2A1E'
const NEU_SHADOW = `4px 4px 10px ${NEU_DARK}, -3px -3px 8px ${NEU_LIGHT}`

export const OpenWorldLegend: React.FC<OpenWorldLegendProps> = ({
  className = '',
  neuShadow = NEU_SHADOW,
  neuBase = NEU_BASE,
}) => {
  const statuses = [
    { color: '#22c55e', label: 'Available', glow: 'rgba(34,197,94,0.5)' },
    { color: '#3b82f6', label: 'In Duo', glow: 'rgba(59,130,246,0.5)' },
    { color: '#8b5cf6', label: 'In Squad', glow: 'rgba(139,92,246,0.5)' },
    { color: '#f59e0b', label: 'Away', glow: 'rgba(245,158,11,0.5)' },
    { color: '#6b7280', label: 'Offline', glow: 'rgba(107,114,128,0.3)' },
  ]

  return (
    <div
      className={`p-3 ${className}`}
      style={{
        background: neuBase,
        boxShadow: neuShadow,
        borderRadius: '18px',
        minWidth: '140px',
      }}
    >
      <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-2">Status</p>
      <div className="space-y-1.5">
        {statuses.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border-2 flex-shrink-0"
              style={{ borderColor: s.color, boxShadow: `0 0 5px ${s.glow}` }}
            />
            <span className="text-[10px] font-semibold text-[#F5E8D0]/80">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(74,48,34,0.5)' }}>
        <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-1.5">Connection</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C68642]" />
            <svg width="14" height="4" viewBox="0 0 14 4">
              <line x1="0" y1="2" x2="14" y2="2" stroke="#C68642" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <div className="w-1.5 h-1.5 rounded-full bg-[#C68642]" />
          </div>
          <span className="text-[10px] font-semibold text-[#F5E8D0]/80">Connected</span>
        </div>
      </div>
    </div>
  )
}
