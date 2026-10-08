import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { getCityCoords } from '../../../data/worldLocations'
import OtterAvatar from '../../../components/OtterAvatar'

interface ClusterGroup {
  city: string
  country: string
  x: number
  y: number
  users: OpenWorldUser[]
}

interface OpenWorldMapProps {
  learners: OpenWorldUser[]
  currentUser: OpenWorldUser | null
  connectedIds: Set<string>
  onSelectUser: (user: OpenWorldUser) => void
  onSelectCluster: (cluster: ClusterGroup) => void
}

const STATUS_COLORS: Record<string, { ring: string; glow: string }> = {
  available: { ring: '#22c55e', glow: 'rgba(34,197,94,0.45)' },
  online: { ring: '#22c55e', glow: 'rgba(34,197,94,0.45)' },
  studying: { ring: '#3b82f6', glow: 'rgba(59,130,246,0.45)' },
  looking: { ring: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' },
  away: { ring: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  offline: { ring: '#6b7280', glow: 'rgba(107,114,128,0.3)' },
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.offline
}

function clusterLearners(learners: OpenWorldUser[]): ClusterGroup[] {
  const groups: Record<string, ClusterGroup> = {}
  for (const user of learners) {
    const city = user.city || 'Unknown'
    const country = user.country || 'Unknown'
    const key = `${city}__${country}`
    const coords = getCityCoords(city, country)
    if (!groups[key]) {
      groups[key] = { city, country, x: coords.x, y: coords.y, users: [] }
    }
    groups[key].users.push(user)
  }
  return Object.values(groups)
}

// SVG viewBox dimensions
const VB_W = 1000
const VB_H = 600

export const OpenWorldMap: React.FC<OpenWorldMapProps> = ({
  learners,
  currentUser,
  connectedIds,
  onSelectUser,
  onSelectCluster,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Cluster at scale < 2.5, individual at scale >= 2.5
  const CLUSTER_THRESHOLD = 2.5

  const clusters = clusterLearners(learners)

  // Connected pairs for drawing lines (current user ↔ connected)
  const connectedLearners = learners.filter(u => connectedIds.has(u.id))

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top),
    }
  }, [])

  // --- Wheel zoom (non-passive via useEffect to allow preventDefault) ---
  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.001
    setTransform(prev => {
      const newScale = Math.max(0.6, Math.min(8, prev.scale + delta * prev.scale))
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return { ...prev, scale: newScale }
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const scaleDiff = newScale - prev.scale
      const nx = prev.x - mx * (scaleDiff / prev.scale)
      const ny = prev.y - my * (scaleDiff / prev.scale)
      return { scale: newScale, x: nx, y: ny }
    })
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', handleWheelNative)
  }, [handleWheelNative])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    const pt = getSvgPoint(e.clientX, e.clientY)
    panStart.current = { mx: pt.x, my: pt.y, tx: transform.x, ty: transform.y }
  }, [getSvgPoint, transform])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return
    const pt = getSvgPoint(e.clientX, e.clientY)
    setTransform(prev => ({
      ...prev,
      x: panStart.current!.tx + (pt.x - panStart.current!.mx),
      y: panStart.current!.ty + (pt.y - panStart.current!.my),
    }))
  }, [isPanning, getSvgPoint])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    panStart.current = null
  }, [])

  // Touch events
  const lastTouchDist = useRef<number | null>(null)
  const lastTouchPt = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    } else if (e.touches.length === 1) {
      lastTouchPt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist / lastTouchDist.current
      setTransform(prev => ({
        ...prev,
        scale: Math.max(0.6, Math.min(8, prev.scale * ratio)),
      }))
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && lastTouchPt.current) {
      const dx = e.touches[0].clientX - lastTouchPt.current.x
      const dy = e.touches[0].clientY - lastTouchPt.current.y
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      lastTouchPt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null
    lastTouchPt.current = null
  }, [])

  // Mount touch handlers as non-passive so preventDefault works
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart as any, { passive: false })
    el.addEventListener('touchmove', handleTouchMove as any, { passive: false })
    el.addEventListener('touchend', handleTouchEnd as any, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart as any)
      el.removeEventListener('touchmove', handleTouchMove as any)
      el.removeEventListener('touchend', handleTouchEnd as any)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(8, prev.scale * 1.35) }))
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.6, prev.scale / 1.35) }))
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 })

  // Current user coords
  const currentCoords = currentUser
    ? getCityCoords(currentUser.city || '', currentUser.country || '')
    : null

  return (
    <div className="relative w-full h-full overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ cursor: isPanning ? 'grabbing' : 'grab', background: 'transparent' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Ocean gradient - warm cocoa/coffee tones */}
          <radialGradient id="ocean-grad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#3D2210" />
            <stop offset="100%" stopColor="#1E0F07" />
          </radialGradient>

          {/* Land gradient - warm ochre/amber matching BESIDE palette */}
          <linearGradient id="land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C68642" />
            <stop offset="60%" stopColor="#A06C2E" />
            <stop offset="100%" stopColor="#8B5E28" />
          </linearGradient>

          {/* Grid pattern */}
          <pattern id="ow-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C68642" strokeWidth="0.3" opacity="0.15" />
          </pattern>

          {/* Glow filters for status rings */}
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="marker-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
          </filter>
        </defs>

        {/* Background ocean */}
        <rect width={VB_W} height={VB_H} fill="url(#ocean-grad)" />
        {/* Grid overlay */}
        <rect width={VB_W} height={VB_H} fill="url(#ow-grid)" />

        {/* Transformable map group */}
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>

          {/* ═══════════════════════════════════════════════════
              WORLD MAP LANDMASSES — warm ochre/caramel palette
          ═══════════════════════════════════════════════════ */}
          <g fill="url(#land-grad)" stroke="#6B3410" strokeWidth="1.2" opacity="0.95">

            {/* North America */}
            <path d="M 80 95 Q 100 80 140 78 Q 200 72 250 90 Q 290 108 300 140 Q 320 170 310 210 Q 300 240 280 260 Q 260 280 240 290 Q 220 300 200 295 Q 170 290 150 270 Q 120 240 110 210 Q 95 175 80 150 Z" />
            {/* Alaska peninsula */}
            <path d="M 80 95 Q 60 100 45 115 Q 30 128 25 140 Q 22 148 30 150 Q 50 148 65 138 Q 75 128 80 115 Z" />
            {/* Greenland */}
            <path d="M 310 40 Q 360 28 390 50 Q 410 70 400 95 Q 385 115 360 118 Q 330 115 310 95 Q 295 75 310 40 Z" />
            {/* Central America */}
            <path d="M 200 295 Q 220 310 230 330 Q 240 350 245 360 Q 250 370 245 375 Q 235 378 225 365 Q 210 345 205 320 Q 200 305 200 295 Z" />
            {/* Caribbean islands */}
            <ellipse cx="262" cy="302" rx="8" ry="5" />
            <ellipse cx="278" cy="308" rx="6" ry="4" />
            <ellipse cx="290" cy="315" rx="7" ry="4" />

            {/* South America */}
            <path d="M 245 375 Q 280 380 320 400 Q 360 420 375 460 Q 385 490 370 530 Q 350 565 320 575 Q 290 578 265 555 Q 240 528 240 490 Q 238 450 250 420 Q 255 400 245 375 Z" />

            {/* Europe */}
            <path d="M 430 130 Q 470 118 510 128 Q 545 138 555 160 Q 558 180 545 200 Q 528 215 505 220 Q 475 222 450 210 Q 428 195 425 170 Q 422 148 430 130 Z" />
            {/* Scandinavia */}
            <path d="M 470 92 Q 490 80 510 88 Q 525 98 520 118 Q 510 130 493 132 Q 478 128 468 112 Q 462 100 470 92 Z" />
            {/* Iceland */}
            <ellipse cx="416" cy="105" rx="18" ry="10" />

            {/* Africa */}
            <path d="M 440 228 Q 490 222 540 240 Q 575 258 582 300 Q 588 340 575 390 Q 558 440 530 475 Q 505 500 475 505 Q 445 500 425 470 Q 405 435 405 390 Q 404 340 418 295 Q 428 260 440 228 Z" />
            {/* Madagascar */}
            <ellipse cx="580" cy="430" rx="9" ry="20" transform="rotate(-10 580 430)" />

            {/* Middle East */}
            <path d="M 555 218 Q 600 210 640 228 Q 665 240 670 268 Q 672 290 655 305 Q 635 315 605 312 Q 578 306 562 285 Q 548 262 555 218 Z" />
            {/* Arabian Peninsula */}
            <path d="M 600 268 Q 645 265 668 285 Q 685 305 675 335 Q 660 360 638 370 Q 612 372 595 352 Q 578 330 582 308 Q 586 285 600 268 Z" />

            {/* Central Asia / Russia */}
            <path d="M 530 72 Q 600 60 680 70 Q 750 78 810 90 Q 860 100 900 118 Q 930 132 925 155 Q 918 175 890 185 Q 855 192 810 185 Q 770 178 735 165 Q 700 150 665 140 Q 625 130 585 128 Q 550 128 530 138 Q 515 145 510 128 Q 512 108 530 72 Z" />
            {/* India subcontinent */}
            <path d="M 668 245 Q 700 238 730 252 Q 755 265 762 295 Q 765 325 752 348 Q 735 368 712 372 Q 688 370 670 348 Q 652 322 654 290 Q 656 262 668 245 Z" />
            {/* Sri Lanka */}
            <ellipse cx="740" cy="376" rx="6" ry="10" />

            {/* Southeast Asia */}
            <path d="M 752 280 Q 790 272 820 285 Q 845 298 848 320 Q 847 340 830 350 Q 810 358 788 350 Q 765 338 755 315 Q 748 298 752 280 Z" />
            {/* Indochina */}
            <path d="M 762 298 Q 782 285 800 292 Q 818 302 820 328 Q 818 348 800 360 Q 780 368 765 355 Q 750 340 752 318 Q 754 305 762 298 Z" />

            {/* Philippines */}
            <ellipse cx="800" cy="335" rx="8" ry="14" />
            <ellipse cx="812" cy="352" rx="6" ry="10" />
            <ellipse cx="820" cy="368" rx="7" ry="12" />
            <ellipse cx="808" cy="378" rx="5" ry="8" />
            <ellipse cx="795" cy="362" rx="4" ry="7" />

            {/* Indonesia / Malaysia */}
            <path d="M 760 358 Q 798 355 830 368 Q 858 380 862 400 Q 858 418 835 422 Q 808 424 778 410 Q 755 396 755 375 Q 756 363 760 358 Z" />
            <ellipse cx="862" cy="378" rx="14" ry="10" />
            <ellipse cx="885" cy="385" rx="10" ry="8" />
            <ellipse cx="900" cy="390" rx="8" ry="6" />
            {/* Sulawesi */}
            <path d="M 835 355 Q 850 350 858 362 Q 862 375 855 385 Q 845 390 835 380 Q 828 368 835 355 Z" />

            {/* Japan */}
            <path d="M 852 198 Q 870 192 880 205 Q 888 218 882 235 Q 873 245 860 242 Q 848 235 848 220 Q 848 207 852 198 Z" />
            <ellipse cx="866" cy="182" rx="8" ry="14" transform="rotate(-15 866 182)" />

            {/* Korea */}
            <path d="M 836 215 Q 850 210 858 222 Q 862 235 854 244 Q 843 248 834 240 Q 826 230 836 215 Z" />

            {/* Taiwan */}
            <ellipse cx="838" cy="278" rx="6" ry="9" />

            {/* Australia */}
            <path d="M 808 435 Q 855 420 905 430 Q 940 440 950 480 Q 955 515 930 545 Q 900 565 860 562 Q 820 556 798 525 Q 778 495 782 462 Q 786 440 808 435 Z" />
            {/* Tasmania */}
            <ellipse cx="875" cy="572" rx="10" ry="8" />
            {/* New Zealand */}
            <ellipse cx="955" cy="510" rx="6" ry="14" transform="rotate(-15 955 510)" />
            <ellipse cx="960" cy="530" rx="5" ry="12" transform="rotate(-15 960 530)" />
          </g>

          {/* ═══════════════════════════════════════════
              CONNECTION LINES between current user and connected learners
          ═══════════════════════════════════════════ */}
          {currentCoords && connectedLearners.map((connUser) => {
            const to = getCityCoords(connUser.city || '', connUser.country || '')
            // Curved bezier
            const cx1 = currentCoords.x + (to.x - currentCoords.x) * 0.33
            const cy1 = currentCoords.y - Math.abs(to.x - currentCoords.x) * 0.12 - 20
            const cx2 = currentCoords.x + (to.x - currentCoords.x) * 0.66
            const cy2 = to.y - Math.abs(to.x - currentCoords.x) * 0.12 - 20
            return (
              <path
                key={`conn-${connUser.id}`}
                d={`M ${currentCoords.x} ${currentCoords.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${to.x} ${to.y}`}
                stroke="#C68642"
                strokeWidth={1.2 / transform.scale}
                fill="none"
                opacity="0.55"
                strokeDasharray={`${6 / transform.scale} ${4 / transform.scale}`}
                style={{
                  filter: 'drop-shadow(0 0 2px rgba(198,134,66,0.6))',
                  animation: 'dash-flow 3s linear infinite',
                }}
              />
            )
          })}

          {/* ═══════════════════════════════════════════
              CLUSTER MARKERS (when zoomed out)
          ═══════════════════════════════════════════ */}
          {transform.scale < CLUSTER_THRESHOLD && clusters.map((cluster) => {
            const isMulti = cluster.users.length > 1
            const singleUser = !isMulti ? cluster.users[0] : null
            const hasConnection = cluster.users.some(u => connectedIds.has(u.id))

            if (isMulti) {
              return (
                <g
                  key={`cluster-${cluster.city}`}
                  transform={`translate(${cluster.x},${cluster.y})`}
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onSelectCluster(cluster) }}
                >
                  {/* Glow pulse for active clusters */}
                  <circle
                    r={22 / transform.scale}
                    fill="rgba(198,134,66,0.15)"
                    style={{ animation: 'pulse-ow 2s ease-in-out infinite' }}
                  />
                  {/* Main cluster bubble */}
                  <circle
                    r={16 / transform.scale}
                    fill="#7E4228"
                    stroke={hasConnection ? '#C68642' : '#4A2514'}
                    strokeWidth={hasConnection ? 2.5 / transform.scale : 1.5 / transform.scale}
                    filter="url(#marker-shadow)"
                  />
                  {/* Count text */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={`${10 / transform.scale}px`}
                    fontFamily="Outfit, Inter, sans-serif"
                    fontWeight="900"
                    fill="#F5E8D0"
                  >
                    {cluster.users.length > 99 ? '99+' : cluster.users.length}
                  </text>
                  {/* City label */}
                  <text
                    y={22 / transform.scale}
                    textAnchor="middle"
                    fontSize={`${8 / transform.scale}px`}
                    fontFamily="Outfit, Inter, sans-serif"
                    fontWeight="700"
                    fill="#F5E8D0"
                    opacity="0.8"
                  >
                    {cluster.city.length > 12 ? cluster.city.slice(0, 10) + '…' : cluster.city}
                  </text>
                </g>
              )
            }

            // Single user as avatar marker
            if (!singleUser) return null
            const sc = getStatusColor(singleUser.online_status || 'offline')
            const isConnected = connectedIds.has(singleUser.id)
            const markerSize = 14 / transform.scale
            return (
              <g
                key={`single-${singleUser.id}`}
                transform={`translate(${cluster.x},${cluster.y})`}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onSelectUser(singleUser) }}
              >
                {/* Status glow ring */}
                <circle
                  r={(markerSize + 5) / 1}
                  fill={sc.glow}
                  opacity="0.5"
                  style={{ animation: sc.ring !== '#6b7280' ? 'pulse-ow 2s ease-in-out infinite' : undefined }}
                />
                {/* Status ring */}
                <circle
                  r={markerSize + 2.5}
                  fill="none"
                  stroke={sc.ring}
                  strokeWidth={2 / transform.scale}
                />
                {/* Avatar circle background */}
                <circle r={markerSize} fill="#F5E8D0" filter="url(#marker-shadow)" />
                {/* Connected indicator */}
                {isConnected && (
                  <circle
                    cx={markerSize * 0.7}
                    cy={-markerSize * 0.7}
                    r={4 / transform.scale}
                    fill="#C68642"
                    stroke="#2A1B14"
                    strokeWidth={1 / transform.scale}
                  />
                )}
                {/* Name label */}
                <text
                  y={(markerSize + 10) / 1}
                  textAnchor="middle"
                  fontSize={`${8 / transform.scale}px`}
                  fontFamily="Outfit, Inter, sans-serif"
                  fontWeight="700"
                  fill="#F5E8D0"
                >
                  {singleUser.display_name.split(' ')[0]}
                </text>
              </g>
            )
          })}

          {/* ═══════════════════════════════════════════
              INDIVIDUAL MARKERS (when zoomed in)
          ═══════════════════════════════════════════ */}
          {transform.scale >= CLUSTER_THRESHOLD && learners.map((user, idx) => {
            const coords = getCityCoords(user.city || '', user.country || '')
            // Slightly scatter within city to avoid overlap
            const jitter = ((idx * 7919) % 13) - 6
            const jitterY = ((idx * 6271) % 11) - 5
            const x = coords.x + jitter
            const y = coords.y + jitterY
            const sc = getStatusColor(user.online_status || 'offline')
            const isConnected = connectedIds.has(user.id)
            const ms = 12 / transform.scale
            return (
              <g
                key={`user-${user.id}`}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onSelectUser(user) }}
              >
                <circle r={(ms + 5) / 1} fill={sc.glow} opacity="0.45"
                  style={{ animation: sc.ring !== '#6b7280' ? 'pulse-ow 2.5s ease-in-out infinite' : undefined }}
                />
                <circle r={ms + 2.5} fill="none" stroke={sc.ring} strokeWidth={2 / transform.scale} />
                <circle r={ms} fill="#F5E8D0" filter="url(#marker-shadow)" />
                {isConnected && (
                  <circle cx={ms * 0.65} cy={-ms * 0.65} r={3.5 / transform.scale}
                    fill="#C68642" stroke="#2A1B14" strokeWidth={0.8 / transform.scale} />
                )}
                <text y={(ms + 9) / 1} textAnchor="middle"
                  fontSize={`${7 / transform.scale}px`}
                  fontFamily="Outfit, Inter, sans-serif"
                  fontWeight="700" fill="#F5E8D0">
                  {user.display_name.split(' ')[0]}
                </text>
              </g>
            )
          })}

          {/* ═══════════════════════════════════════════
              CURRENT USER MARKER (always shown, special)
          ═══════════════════════════════════════════ */}
          {currentCoords && currentUser && (() => {
            const sc = getStatusColor(currentUser.online_status || 'online')
            const ms = 16 / transform.scale
            return (
              <g
                key="current-user"
                transform={`translate(${currentCoords.x},${currentCoords.y})`}
              >
                {/* YOU label */}
                <rect
                  x={-18 / transform.scale}
                  y={(-ms - 18) / transform.scale * transform.scale}
                  width={36 / transform.scale}
                  height={12 / transform.scale}
                  rx={4 / transform.scale}
                  fill="#7E4228"
                />
                <text
                  y={(-ms - 10) / transform.scale * transform.scale}
                  textAnchor="middle"
                  fontSize={`${7 / transform.scale}px`}
                  fontFamily="Outfit, Inter, sans-serif"
                  fontWeight="900"
                  fill="#F5E8D0"
                >
                  YOU
                </text>
                {/* Glow */}
                <circle r={(ms + 8) / 1} fill="#C68642" opacity="0.15"
                  style={{ animation: 'pulse-ow 1.8s ease-in-out infinite' }} />
                {/* Golden outer ring */}
                <circle r={ms + 4} fill="none" stroke="#C68642" strokeWidth={2.5 / transform.scale} />
                {/* Status ring */}
                <circle r={ms + 1} fill="none" stroke={sc.ring} strokeWidth={2 / transform.scale} />
                {/* Avatar bg */}
                <circle r={ms} fill="#F5E8D0" filter="url(#marker-shadow)" />
              </g>
            )
          })()}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        <button
          onClick={zoomIn}
          className="w-8 h-8 rounded-xl bg-[#2B1C13]/90 backdrop-blur-sm border border-[#4A3022] text-[#D89A53] flex items-center justify-center font-black text-base hover:bg-[#3D271D] transition-all shadow-lg"
        >+</button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-xl bg-[#2B1C13]/90 backdrop-blur-sm border border-[#4A3022] text-[#D89A53] flex items-center justify-center text-[10px] font-black hover:bg-[#3D271D] transition-all shadow-lg"
        >⊙</button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 rounded-xl bg-[#2B1C13]/90 backdrop-blur-sm border border-[#4A3022] text-[#D89A53] flex items-center justify-center font-black text-base hover:bg-[#3D271D] transition-all shadow-lg"
        >−</button>
      </div>

      <style>{`
        @keyframes pulse-ow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  )
}
