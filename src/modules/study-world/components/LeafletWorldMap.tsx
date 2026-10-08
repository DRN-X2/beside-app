import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { OpenWorldUser } from '../../../services/openWorldService'
import { renderToString } from 'react-dom/server'
import { getCityLatLng } from '../../../data/worldLocations'
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

const STATUS_COLORS: Record<string, { ring: string; bg: string; glow: string }> = {
  available: { ring: '#22c55e', bg: '#15803d', glow: '0 0 10px rgba(34,197,94,0.7)' },
  online:    { ring: '#22c55e', bg: '#15803d', glow: '0 0 10px rgba(34,197,94,0.7)' },
  studying:  { ring: '#3b82f6', bg: '#1d4ed8', glow: '0 0 10px rgba(59,130,246,0.7)' },
  looking:   { ring: '#8b5cf6', bg: '#6d28d9', glow: '0 0 10px rgba(139,92,246,0.7)' },
  away:      { ring: '#f59e0b', bg: '#b45309', glow: '0 0 10px rgba(245,158,11,0.7)' },
  offline:   { ring: '#6b7280', bg: '#374151', glow: 'none' },
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
    const [lat, lng] = getCityLatLng(city, country)
    if (!groups[key]) {
      groups[key] = { city, country, lat, lng, users: [] }
    }
    groups[key].users.push(user)
  }
  return Object.values(groups)
}

function makeAvatarIcon(user: OpenWorldUser, isConnected: boolean, isCurrent = false): L.DivIcon {
  const sc = getStatusColor(user.online_status || (isCurrent ? 'online' : 'offline'))
  const size = isCurrent ? 44 : 36
  const otterHtml = renderToString(<OtterAvatar config={user.otter_config || user.otter} size="xs" />)
  const ringW = isCurrent ? 3 : 2.5

  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      cursor:pointer;
    ">
      <!-- Glow pulse -->
      ${sc.ring !== '#6b7280' ? `<div style="
        position:absolute;
        inset:-6px;
        border-radius:50%;
        background:${sc.ring};
        opacity:0.25;
        animation:owPulse 2s ease-in-out infinite;
      "></div>` : ''}
      <!-- Status ring -->
      <div style="
        position:absolute;
        inset:-${ringW + 2}px;
        border-radius:50%;
        border:${ringW}px solid ${sc.ring};
        box-shadow:${sc.glow};
      "></div>
      ${isCurrent ? `<div style="
        position:absolute;
        inset:-${ringW + 5}px;
        border-radius:50%;
        border:2px solid #C68642;
        opacity:0.75;
      "></div>` : ''}
      <!-- Avatar circle with neumorphic shadow -->
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:linear-gradient(135deg,#3D2210,#1E0F07);
        border:2px solid ${isCurrent ? '#C68642' : '#4A3022'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Outfit,Inter,sans-serif;
        font-weight:900;
        font-size:${isCurrent ? 14 : 12}px;
        color:#F5E8D0;
        box-shadow:4px 4px 10px #120804, -3px -3px 8px #4A3022;
        overflow:hidden;
        position:relative;
      ">
        ${otterHtml}
      </div>
      <!-- Connection dot -->
      ${isConnected && !isCurrent ? `<div style="
        position:absolute;
        top:-2px;
        right:-2px;
        width:11px;
        height:11px;
        border-radius:50%;
        background:#C68642;
        border:2px solid #0F0906;
        box-shadow:0 0 8px rgba(198,134,66,0.9);
      "></div>` : ''}
      ${isCurrent ? `<div style="
        position:absolute;
        bottom:-19px;
        left:50%;
        transform:translateX(-50%);
        background:#C68642;
        color:#1E0F07;
        font-size:9px;
        font-weight:900;
        font-family:Outfit,sans-serif;
        padding:1px 6px;
        border-radius:6px;
        white-space:nowrap;
        letter-spacing:0.05em;
        box-shadow:0 2px 6px rgba(0,0,0,0.6);
      ">YOU</div>` : ''}
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, isCurrent ? size + 22 : size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

function makeClusterIcon(cluster: ClusterGroup, hasConnection: boolean): L.DivIcon {
  const count = cluster.users.length
  const size = Math.min(52, 38 + Math.log2(count) * 4)
  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      cursor:pointer;
    ">
      <div style="
        position:absolute;
        inset:-8px;
        border-radius:50%;
        background:rgba(198,134,66,0.18);
        animation:owPulse 2.5s ease-in-out infinite;
      "></div>
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:linear-gradient(135deg,#7E4228,#4A2514);
        border:${hasConnection ? '2.5px solid #C68642' : '2px solid #5A3520'};
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Outfit,Inter,sans-serif;
        font-weight:900;
        font-size:${count > 9 ? 12 : 14}px;
        color:#F5E8D0;
        box-shadow:4px 4px 12px #120804, -3px -3px 8px #5A3520;
      ">${count > 99 ? '99+' : count}</div>
      <div style="
        position:absolute;
        bottom:-17px;
        left:50%;
        transform:translateX(-50%);
        font-size:10px;
        font-weight:800;
        font-family:Outfit,sans-serif;
        color:#E8B375;
        white-space:nowrap;
        text-shadow:0 2px 4px rgba(0,0,0,0.9);
        max-width:90px;
        overflow:hidden;
        text-overflow:ellipsis;
      ">${cluster.city}</div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

export const LeafletWorldMap: React.FC<LeafletWorldMapProps> = ({
  learners,
  currentUser,
  connectedIds,
  onSelectUser,
  onSelectCluster,
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const linesRef = useRef<L.Polyline[]>([])
  const [currentZoom, setCurrentZoom] = useState<number>(3)

  const clusters = useMemo(() => clusterLearners(learners), [learners])
  const connectedLearners = useMemo(
    () => learners.filter(u => connectedIds.has(u.id)),
    [learners, connectedIds]
  )

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Center on user location if available, otherwise default to southeast asia / pacific center [15, 120]
    const defaultCenter: [number, number] = currentUser?.city && currentUser?.country
      ? getCityLatLng(currentUser.city, currentUser.country)
      : [15, 120]

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 4,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    })

    // Esri World Dark Gray Base (free, no API key required, zero watermark)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
    }).addTo(map)

    // Esri World Dark Gray Reference (clean country & city labels)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      opacity: 0.85,
    }).addTo(map)

    L.control.attribution({ position: 'bottomleft', prefix: '© Esri, HERE' }).addTo(map)

    const onZoom = () => {
      setCurrentZoom(map.getZoom())
    }
    map.on('zoomend', onZoom)

    mapRef.current = map
    return () => {
      map.off('zoomend', onZoom)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers whenever learners, connections, or zoom changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers and lines
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    linesRef.current.forEach(l => l.remove())
    linesRef.current = []

    const zoom = currentZoom
    const CLUSTER_ZOOM = 7

    // Draw connection lines
    if (currentUser) {
      const [curLat, curLng] = getCityLatLng(currentUser.city || '', currentUser.country || '')

      connectedLearners.forEach(cu => {
        const [lat, lng] = getCityLatLng(cu.city || '', cu.country || '')
        const line = L.polyline([[curLat, curLng], [lat, lng]], {
          color: '#C68642',
          weight: 2,
          opacity: 0.65,
          dashArray: '6 5',
        }).addTo(map)
        linesRef.current.push(line)
      })
    }

    // Render clusters or individual markers based on zoom level
    if (zoom < CLUSTER_ZOOM) {
      clusters.forEach(cluster => {
        const hasConn = cluster.users.some(u => connectedIds.has(u.id))
        const icon = makeClusterIcon(cluster, hasConn)
        const marker = L.marker([cluster.lat, cluster.lng], { icon })
          .addTo(map)
          .on('click', () => {
            if (cluster.users.length === 1) {
              onSelectUser(cluster.users[0])
            } else {
              map.flyTo([cluster.lat, cluster.lng], Math.min(zoom + 3, 10), { duration: 1 })
              onSelectCluster(cluster)
            }
          })
        markersRef.current.push(marker)
      })
    } else {
      learners.forEach((user, idx) => {
        const [lat, lng] = getCityLatLng(user.city || '', user.country || '')
        // Gentle jitter for multiple users in same city at high zoom
        const jLat = lat + ((idx * 0.003) % 0.012) - 0.006
        const jLng = lng + ((idx * 0.004) % 0.016) - 0.008
        const isConnected = connectedIds.has(user.id)
        const icon = makeAvatarIcon(user, isConnected)
        const marker = L.marker([jLat, jLng], { icon })
          .addTo(map)
          .on('click', () => {
            map.flyTo([jLat, jLng], Math.max(zoom, 8), { duration: 0.8 })
            onSelectUser(user)
          })
        markersRef.current.push(marker)
      })
    }

    // Current user marker (always pinned on top)
    if (currentUser) {
      const [lat, lng] = getCityLatLng(currentUser.city || '', currentUser.country || '')
      const icon = makeAvatarIcon(currentUser, false, true)
      const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .addTo(map)
        .on('click', () => {
          map.flyTo([lat, lng], 7, { duration: 0.8 })
        })
      markersRef.current.push(marker)
    }
  }, [learners, clusters, connectedLearners, connectedIds, currentUser, currentZoom, onSelectUser, onSelectCluster])

  // Neumorphic zoom controls
  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const resetView = useCallback(() => {
    if (currentUser?.city && currentUser?.country) {
      const coords = getCityLatLng(currentUser.city, currentUser.country)
      mapRef.current?.flyTo(coords, 5, { duration: 1.2 })
    } else {
      mapRef.current?.flyTo([15, 120], 4, { duration: 1.2 })
    }
  }, [currentUser])

  return (
    <div className="relative w-full h-full select-none">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Neumorphic floating controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-[500]">
        {[
          { icon: '+', action: zoomIn, label: 'Zoom In' },
          { icon: '⌖', action: resetView, label: 'Center Me', isCenter: true },
          { icon: '−', action: zoomOut, label: 'Zoom Out' },
        ].map(b => (
          <button
            key={b.label}
            onClick={b.action}
            title={b.label}
            className="w-10 h-10 flex items-center justify-center font-black text-[#D89A53] transition-all active:scale-95 hover:text-[#F5E8D0]"
            style={{
              borderRadius: '14px',
              background: '#2B1C13',
              boxShadow: '4px 4px 10px #150A05, -3px -3px 8px #452D1E',
              fontSize: b.isCenter ? '18px' : '20px',
              border: '1px solid #3E2719',
            }}
          >
            {b.icon}
          </button>
        ))}
      </div>

      {/* Styles for Leaflet dark warm styling & pulse animations */}
      <style>{`
        @keyframes owPulse {
          0%,100% { opacity:0.25; transform:scale(1); }
          50% { opacity:0.6; transform:scale(1.25); }
        }
        .leaflet-container {
          background: #150A05 !important;
          outline: none;
        }
        .leaflet-tile-pane {
          filter: brightness(0.9) contrast(1.15) sepia(0.2) hue-rotate(345deg);
        }
        .leaflet-attribution-flag { display:none !important; }
        .leaflet-control-attribution {
          background: rgba(27,15,9,0.85) !important;
          color: #7A5B45 !important;
          font-size: 9px !important;
          backdrop-filter: blur(6px);
          border-radius: 8px 0 0 0 !important;
          padding: 3px 8px !important;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-left: 1px solid rgba(255,255,255,0.05);
        }
        .leaflet-control-attribution a { color: #A67C52 !important; text-decoration: none; }
      `}</style>
    </div>
  )
}
