import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { renderToString } from 'react-dom/server'
import {
  getCityLatLngSync,
  geocodeCityAsync,
  PRECISE_CITY_REGISTRY,
} from '../../../services/geocodingService'
import OtterAvatar from '../../../components/OtterAvatar'

// Fix Leaflet default icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface ClusterGroup {
  city: string
  country: string
  lat: number
  lng: number
  users: OpenWorldUser[]
}

interface LeafletWorldMapProps {
  learners: OpenWorldUser[]
  currentUser: OpenWorldUser | null
  connectedIds: Set<string>
  onSelectUser: (user: OpenWorldUser) => void
  onSelectCluster: (cluster: ClusterGroup) => void
}

const STATUS_COLORS: Record<string, { ring: string; bg: string }> = {
  available: { ring: '#22c55e', bg: '#15803d' },
  online:    { ring: '#22c55e', bg: '#15803d' },
  studying:  { ring: '#3b82f6', bg: '#1d4ed8' },
  looking:   { ring: '#8b5cf6', bg: '#6d28d9' },
  away:      { ring: '#f59e0b', bg: '#b45309' },
  offline:   { ring: '#9ca3af', bg: '#6b7280' },
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.offline
}

function makeAvatarIcon(
  user: OpenWorldUser,
  isConnected: boolean,
  isCurrent = false,
  hasNodeConnection = false
): L.DivIcon {
  const sc = getStatusColor(user.online_status || (isCurrent ? 'online' : 'offline'))
  const size = 42 // Uniform size for all avatars on OpenWorld
  const otterHtml = renderToString(<OtterAvatar config={user.otter_config || user.otter} size="xs" animate={false} />)
  const flagCode = (user.country_code || '').toLowerCase()

  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      cursor:pointer;
    ">
      <!-- Node Graph Connection Anchor Glow Ring -->
      ${hasNodeConnection ? `
        <div class="beside-node-halo" style="
          position:absolute;
          inset:-7px;
          border-radius:50%;
          border:2px dashed rgba(224, 82, 66, 0.75);
          box-shadow:0 0 12px rgba(224, 82, 66, 0.4);
          pointer-events:none;
        "></div>
      ` : ''}

      <!-- Status ring -->
      <div style="
        position:absolute;
        inset:-2.5px;
        border-radius:50%;
        border:2.5px solid ${isCurrent ? '#7E4228' : sc.ring};
        background:transparent;
      "></div>

      <!-- Avatar circle -->
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:#FAF2E6;
        border:2px solid #FFF9F2;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 3px 10px rgba(126,66,40,0.3);
        overflow:hidden;
        position:relative;
      ">
        ${otterHtml}
      </div>

      <!-- Country Flag Badge -->
      ${flagCode ? `
        <div style="
          position:absolute;
          bottom:-3px;
          right:-3px;
          width:16px;
          height:16px;
          border-radius:50%;
          background:#FAF2E6;
          border:1.5px solid #7E4228;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 1px 4px rgba(0,0,0,0.25);
          overflow:hidden;
          z-index:10;
        ">
          <img
            src="https://flagcdn.com/w20/${flagCode}.png"
            alt="${user.country_code}"
            style="width:100%;height:100%;object-fit:cover;"
          />
        </div>
      ` : ''}

      <!-- Connected check badge -->
      ${isConnected && !isCurrent ? `
        <div style="
          position:absolute;
          top:-3px;
          right:-3px;
          width:13px;
          height:13px;
          border-radius:50%;
          background:#10b981;
          border:1.5px solid #FAF2E6;
          box-shadow:0 1px 3px rgba(0,0,0,0.2);
          z-index:11;
        "></div>
      ` : ''}

      <!-- Name / YOU label underneath avatar -->
      <div style="
        position:absolute;
        bottom:-20px;
        left:50%;
        transform:translateX(-50%);
        background:${isCurrent ? '#7E4228' : '#FFF9F2'};
        color:${isCurrent ? '#FFFFFF' : '#4C271A'};
        font-size:9.5px;
        font-weight:900;
        font-family:Outfit,sans-serif;
        padding:1px 6px;
        border-radius:6px;
        white-space:nowrap;
        letter-spacing:0.03em;
        box-shadow:0 2px 5px rgba(0,0,0,0.22);
        border:1px solid ${isCurrent ? '#FAF2E6' : 'rgba(126,66,40,0.25)'};
        max-width:85px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${isCurrent ? 'YOU' : (user.display_name.split(' ')[0] || user.username || 'Learner')}</div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size + 22],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

export const LeafletWorldMap: React.FC<LeafletWorldMapProps> = ({
  learners,
  currentUser,
  connectedIds,
  onSelectUser,
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const linesRef = useRef<L.Polyline[]>([])
  const [customCoords, setCustomCoords] = useState<Record<string, [number, number]>>({})

  // Deduplicated list of all participants (current user + other learners)
  const allParticipants = useMemo(() => {
    const map = new Map<string, OpenWorldUser>()
    if (currentUser) {
      map.set(currentUser.id, currentUser)
    }
    learners.forEach(l => {
      if (!map.has(l.id)) {
        map.set(l.id, l)
      }
    })
    return Array.from(map.values())
  }, [currentUser, learners])

  const connectedLearners = useMemo(
    () => learners.filter(u => connectedIds.has(u.id)),
    [learners, connectedIds]
  )

  // Asynchronous high-precision city geocoding for any city not in the offline registry
  useEffect(() => {
    let isMounted = true

    allParticipants.forEach(user => {
      const city = user.city?.trim()
      const country = user.country?.trim() || 'Philippines'
      if (!city) return

      const key = city.toLowerCase()
      // Skip if already in customCoords or static registry
      if (customCoords[user.id] || PRECISE_CITY_REGISTRY[key]) return

      geocodeCityAsync(city, country).then(coords => {
        if (!isMounted) return
        setCustomCoords(prev => {
          const cur = prev[user.id]
          if (cur && cur[0] === coords[0] && cur[1] === coords[1]) return prev
          return { ...prev, [user.id]: coords }
        })
      })
    })

    return () => {
      isMounted = false
    }
  }, [allParticipants, customCoords])

  // Exact node graph coordinates calculation
  // Group by base coordinate; if multiple users are in the same city, apply a tight micro-offset (~850m)
  // so they sit side-by-side cleanly without ever leaving city limits.
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number]>()
    const coordGroups: Record<string, OpenWorldUser[]> = {}

    allParticipants.forEach(user => {
      const custom = customCoords[user.id]
      const [baseLat, baseLng] = custom || getCityLatLngSync(user.city || '', user.country || '')
      const groupKey = `${baseLat.toFixed(3)}_${baseLng.toFixed(3)}`
      if (!coordGroups[groupKey]) coordGroups[groupKey] = []
      coordGroups[groupKey].push(user)
    })

    Object.values(coordGroups).forEach(group => {
      if (group.length === 1) {
        const u = group[0]
        const [lat, lng] = customCoords[u.id] || getCityLatLngSync(u.city || '', u.country || '')
        positions.set(u.id, [lat, lng])
      } else {
        // Arrange multiple learners in neat micro-orbit
        const total = group.length
        const [centerLat, centerLng] =
          customCoords[group[0].id] || getCityLatLngSync(group[0].city || '', group[0].country || '')
        const radius = 0.0085 // ~900 meters

        group.forEach((u, idx) => {
          const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
          const lat = centerLat + Math.sin(angle) * radius
          const lng = centerLng + Math.cos(angle) * (radius / Math.cos((centerLat * Math.PI) / 180 || 1))
          positions.set(u.id, [lat, lng])
        })
      }
    })

    return positions
  }, [allParticipants, customCoords])

  // Keep a ref to nodePositions for instant center/flyTo without re-renders
  const nodePositionsRef = useRef(nodePositions)
  useEffect(() => {
    nodePositionsRef.current = nodePositions
  }, [nodePositions])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initialCenter: [number, number] = currentUser?.city && currentUser?.country
      ? getCityLatLngSync(currentUser.city, currentUser.country)
      : [14.5995, 120.9842]

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 6,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    })

    // Esri Canvas Light Gray Base with warm cream styling
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      className: 'beside-warm-map-tiles',
    }).addTo(map)

    // Esri World Light Gray Reference for crisp city/country labels
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      opacity: 0.9,
    }).addTo(map)

    L.control.attribution({ position: 'bottomleft', prefix: '© Esri, HERE' }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update Markers and Node Graph Network Edges
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // 1. Clear old markers and network lines
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    linesRef.current.forEach(l => l.remove())
    linesRef.current = []

    // 2. Render Node Graph Edges (Connections between study buddies)
    // CRITICAL: We only draw edges strictly between actual resolved node positions (posA -> posB).
    if (currentUser && nodePositions.has(currentUser.id)) {
      const currentPos = nodePositions.get(currentUser.id)!

      connectedLearners.forEach(cu => {
        const buddyPos = nodePositions.get(cu.id)
        // Only connect if the buddy exists and has an active node on the map
        if (!buddyPos) return

        // Soft outer ambient glow line (wide, semi-transparent)
        const glowLine = L.polyline([currentPos, buddyPos], {
          color: '#E05242',
          weight: 6,
          opacity: 0.28,
          lineCap: 'round',
        }).addTo(map)
        linesRef.current.push(glowLine)

        // Core glowing laser line with animated pulse dash
        const coreLine = L.polyline([currentPos, buddyPos], {
          color: '#E05242',
          weight: 2.4,
          opacity: 0.95,
          dashArray: '8, 6',
          className: 'beside-node-edge-pulse',
          lineCap: 'round',
        }).addTo(map)
        linesRef.current.push(coreLine)
      })
    }

    // 3. Render Avatar Nodes
    allParticipants.forEach(user => {
      const pos = nodePositions.get(user.id)
      if (!pos) return

      const isCurrent = user.id === currentUser?.id
      const isConnected = connectedIds.has(user.id)
      const hasNodeConnection = isConnected || (isCurrent && connectedLearners.length > 0)

      const icon = makeAvatarIcon(user, isConnected, isCurrent, hasNodeConnection)
      const marker = L.marker(pos, {
        icon,
        zIndexOffset: isCurrent ? 1000 : (isConnected ? 500 : 200),
      })
        .addTo(map)
        .on('click', () => {
          map.flyTo(pos, Math.max(map.getZoom(), 7), { duration: 0.8 })
          if (!isCurrent) {
            onSelectUser(user)
          }
        })
      markersRef.current.push(marker)
    })
  }, [allParticipants, nodePositions, connectedLearners, connectedIds, currentUser, onSelectUser])

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const resetView = useCallback(() => {
    if (currentUser?.id && nodePositionsRef.current.has(currentUser.id)) {
      const coords = nodePositionsRef.current.get(currentUser.id)!
      mapRef.current?.flyTo(coords, 7, { duration: 1.0 })
    } else if (currentUser?.city && currentUser?.country) {
      const coords = getCityLatLngSync(currentUser.city, currentUser.country)
      mapRef.current?.flyTo(coords, 7, { duration: 1.0 })
    } else {
      mapRef.current?.flyTo([14.5995, 120.9842], 5, { duration: 1.0 })
    }
  }, [currentUser])

  return (
    <div className="relative w-full h-full select-none bg-[#FAF2E6]">
      <style>{`
        .beside-warm-map-tiles {
          filter: sepia(0.28) saturate(0.85) contrast(0.96) brightness(0.99) !important;
        }

        @keyframes besideLaserFlow {
          from {
            stroke-dashoffset: 28;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .beside-node-edge-pulse {
          animation: besideLaserFlow 1.8s linear infinite;
        }

        @keyframes besideHaloPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        .beside-node-halo {
          animation: besideHaloPulse 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Warm Clay Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[500]">
        {[
          { icon: '+', action: zoomIn, label: 'Zoom In' },
          { icon: '⌖', action: resetView, label: 'Center Me' },
          { icon: '−', action: zoomOut, label: 'Zoom Out' },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.action}
            title={b.label}
            className="w-10 h-10 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/25 text-[#4C271A] font-black text-lg flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {b.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
