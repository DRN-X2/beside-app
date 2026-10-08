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
  const size = 40 // Uniform size for all avatars on OpenWorld
  const otterHtml = renderToString(<OtterAvatar config={user.otter_config || user.otter} size="xs" animate={false} />)
  const flagCode = (user.country_code || '').toLowerCase()

  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      cursor:pointer;
    ">
      <!-- Minimal status ring without pulsating animation -->
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
        box-shadow:0 2px 8px rgba(126,66,40,0.3);
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

      <!-- YOU badge for current user -->
      ${isCurrent ? `
        <div style="
          position:absolute;
          bottom:-18px;
          left:50%;
          transform:translateX(-50%);
          background:#7E4228;
          color:#FFFFFF;
          font-size:9px;
          font-weight:900;
          font-family:Outfit,sans-serif;
          padding:1px 6px;
          border-radius:6px;
          white-space:nowrap;
          letter-spacing:0.04em;
          box-shadow:0 2px 4px rgba(0,0,0,0.3);
          border:1px solid #FAF2E6;
        ">YOU</div>
      ` : ''}
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, isCurrent ? size + 20 : size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

function makeClusterIcon(cluster: ClusterGroup, hasConnection: boolean): L.DivIcon {
  const count = cluster.users.length
  const size = Math.min(50, 38 + Math.log2(count) * 3.5)
  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      cursor:pointer;
    ">
      <!-- Minimal clean ring -->
      <div style="
        position:absolute;
        inset:-3px;
        border-radius:50%;
        border:2px solid ${hasConnection ? '#E05242' : '#7E4228'};
        opacity:0.4;
      "></div>
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:linear-gradient(135deg,#7E4228,#924D30);
        border:2px solid #FAF2E6;
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Outfit,Inter,sans-serif;
        font-weight:900;
        font-size:${count > 9 ? 12 : 13}px;
        color:#FFFFFF;
        box-shadow:0 3px 10px rgba(126,66,40,0.35);
      ">${count > 99 ? '99+' : count}</div>
      <div style="
        position:absolute;
        bottom:-17px;
        left:50%;
        transform:translateX(-50%);
        font-size:10px;
        font-weight:800;
        font-family:Outfit,sans-serif;
        color:#4C271A;
        white-space:nowrap;
        text-shadow:0 1px 2px rgba(255,255,255,0.8);
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

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

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

  // Update markers and glowing red network lines
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

    // Draw glowing red network lines between connected study buddies
    if (currentUser) {
      const [curLat, curLng] = getCityLatLng(currentUser.city || '', currentUser.country || '')

      connectedLearners.forEach(cu => {
        const [lat, lng] = getCityLatLng(cu.city || '', cu.country || '')

        // Soft outer glow polyline
        const glowLine = L.polyline([[curLat, curLng], [lat, lng]], {
          color: '#E05242',
          weight: 6,
          opacity: 0.28,
        }).addTo(map)
        linesRef.current.push(glowLine)

        // Core glowing red line
        const coreLine = L.polyline([[curLat, curLng], [lat, lng]], {
          color: '#E05242',
          weight: 2.4,
          opacity: 0.9,
          dashArray: '6 4',
        }).addTo(map)
        linesRef.current.push(coreLine)
      })
    }

    // Render clusters or individual markers
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
    <div className="relative w-full h-full select-none bg-[#FAF2E6]">
      <style>{`
        .beside-warm-map-tiles {
          filter: sepia(0.28) saturate(0.85) contrast(0.96) brightness(0.99) !important;
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
