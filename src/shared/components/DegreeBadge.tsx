import React from 'react'

interface DegreeBadgeProps {
  degreeCode: string
  size?: 'sm' | 'md'
  className?: string
}

export const DegreeBadge: React.FC<DegreeBadgeProps> = ({
  degreeCode,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  }

  return (
    <div
      className={`inline-flex items-center justify-center font-bold tracking-wider rounded-xl bg-[#F7EDD9] text-[#2D1B11] border-2 border-[#3D271D] shadow-sm select-none ${sizeClasses[size]} ${className}`}
    >
      {degreeCode.toUpperCase()}
    </div>
  )
}
