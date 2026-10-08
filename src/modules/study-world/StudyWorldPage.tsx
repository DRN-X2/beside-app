import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SlidersHorizontal, Search, X, Globe, RefreshCw, Users, MapPin } from 'lucide-react'
import { LeafletWorldMap } from './components/LeafletWorldMap'
import { OpenWorldLegend } from './components/OpenWorldLegend'
import { DiscoveryCard } from './components/DiscoveryCard'
import { useAuthStore } from '../../store/authStore'
import { usePresenceStore, getEffectiveOnlineStatus } from '../../store/presenceStore'
import { fetchOpenWorldLearners } from '../../services/openWorldService'
import type { OpenWorldUser } from '../../services/openWorldService'
import type { ClusterGroup } from './components/LeafletWorldMap'
import { supabase } from '../../lib/supabase'

export const StudyWorldPage: React.FC = () => {
  const { profile } = useAuthStore()
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)

  const [learners, setLearners] = useState<OpenWorldUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedUser, setSelectedUser] = useState<OpenWorldUser | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const currentUser = useMemo<OpenWorldUser | null>(() => {
    if (!profile) return null
    return { ...profile, openworld_visible: true, connectionStatus: 'NONE' }
  }, [profile])

  const connectedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const l of learners) {
      if (l.connectionStatus === 'CONNECTED') ids.add(l.id)
    }
    return ids
  }, [learners])

  const loadData = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { learners: data, error } = await fetchOpenWorldLearners(profile.id)
    if (!error) setLearners(data)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    loadData()
  }, [loadData, refreshKey])

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase
      .channel('openworld_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        setRefreshKey((k) => k + 1)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        setRefreshKey((k) => k + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  // Resolve dynamic live presence for each learner
  const resolvedLearners = useMemo(() => {
    return learners.map((l) => {
      const isOnline = onlineUserIds.has(l.id)
      const status = getEffectiveOnlineStatus(l, profile?.id, isOnline)
      return {
        ...l,
        online_status: status,
      }
    })
  }, [learners, onlineUserIds, profile?.id])

  const filteredLearners = useMemo(() => {
    let list = resolvedLearners
    if (filterStatus !== 'all') {
      list = list.filter((l) => {
        if (filterStatus === 'available') return ['available', 'online'].includes(l.online_status || '')
        if (filterStatus === 'studying') return l.online_status === 'studying'
        if (filterStatus === 'offline') return l.online_status === 'offline'
        return true
      })
    }
    if (filterCountry !== 'all') list = list.filter((l) => l.country === filterCountry)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (l) =>
          l.display_name.toLowerCase().includes(q) ||
          (l.username || '').toLowerCase().includes(q) ||
          (l.city || '').toLowerCase().includes(q) ||
          (l.country || '').toLowerCase().includes(q) ||
          (l.school || '').toLowerCase().includes(q) ||
          (l.degree_program || '').toLowerCase().includes(q) ||
          (l.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (l.learning_interests || []).some((i) => i.toLowerCase().includes(q)) ||
          (l.subjects || []).some((s) => s.toLowerCase().includes(q))
      )
    }
    return list
  }, [resolvedLearners, filterStatus, filterCountry, searchQuery])

  const availableCountries = useMemo(() => {
    const set = new Set<string>()
    for (const l of learners) if (l.country) set.add(l.country)
    return Array.from(set).sort()
  }, [learners])

  const handleSelectUser = (user: OpenWorldUser) => {
    setSelectedCluster(null)
    setSelectedUser(user)
  }
  const handleSelectCluster = (cluster: ClusterGroup) => {
    setSelectedUser(null)
    setSelectedCluster(cluster)
  }
  const handleCloseModal = () => {
    setSelectedUser(null)
    setSelectedCluster(null)
  }
  const handleConnected = () => setRefreshKey((k) => k + 1)

  const stats = {
    total: learners.length,
    available: learners.filter((l) => ['available', 'online'].includes(l.online_status || '')).length,
    connected: connectedIds.size,
    countries: new Set(learners.map((l) => l.country).filter(Boolean)).size,
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden select-none bg-[#FAF2E6]">
      {/* ═══════════════════ TOP HEADER (Beside Warm Cream Theme) ═══════════════════ */}
      <div className="absolute top-0 inset-x-0 z-[600] pt-safe pointer-events-none">
        <div className="mx-3 mt-3 flex items-center gap-2 pointer-events-auto">
          {/* Title Pill */}
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-md">
            <Globe className="w-4 h-4 text-[#7E4228]" />
            <div>
              <span className="font-display font-black text-[#2D1B11] text-sm tracking-wide">
                OpenWorld
              </span>
              {!loading && (
                <span className="ml-2 text-[10px] text-[#7E4228] font-bold">
                  {stats.total} learner{stats.total !== 1 ? 's' : ''} · {stats.countries}{' '}
                  {stats.countries !== 1 ? 'countries' : 'country'}
                </span>
              )}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setShowSearch((s) => !s)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-md cursor-pointer ${
              showSearch
                ? 'bg-[#7E4228] text-white border-[#7E4228]'
                : 'bg-[#FFF9F2] text-[#7E4228] border-[#7E4228]/20 hover:bg-[#F3E7D5]'
            }`}
            title="Search learners"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-md cursor-pointer ${
              showFilters || filterStatus !== 'all' || filterCountry !== 'all'
                ? 'bg-[#7E4228] text-white border-[#7E4228]'
                : 'bg-[#FFF9F2] text-[#7E4228] border-[#7E4228]/20 hover:bg-[#F3E7D5]'
            }`}
            title="Filter learners"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mx-3 mt-2 pointer-events-auto animate-slide-down">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-lg">
              <Search className="w-4 h-4 text-[#7E4228] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search learners by name, degree, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#2D1B11] text-xs font-bold placeholder-[#875F49]/60 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#875F49] hover:text-[#2D1B11] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="mx-3 mt-2 p-4 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-xl pointer-events-auto animate-slide-down">
            <p className="text-[9px] font-black text-[#7E4228] uppercase tracking-widest mb-2">
              Status Filter
            </p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {['all', 'available', 'studying', 'offline'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold capitalize transition-all active:scale-95 cursor-pointer border ${
                    filterStatus === s
                      ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-xs'
                      : 'bg-[#FAF2E6] text-[#4C271A] border-[#7E4228]/15 hover:bg-[#EFE6D8]'
                  }`}
                >
                  {s === 'all'
                    ? 'All'
                    : s === 'available'
                    ? '🟢 Available'
                    : s === 'studying'
                    ? '🔵 In Session'
                    : '⚫ Offline'}
                </button>
              ))}
            </div>

            {availableCountries.length > 0 && (
              <>
                <p className="text-[9px] font-black text-[#7E4228] uppercase tracking-widest mb-2">
                  Country
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', ...availableCountries.slice(0, 6)].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilterCountry(c)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer border ${
                        filterCountry === c
                          ? 'bg-[#7E4228] text-white border-[#7E4228] shadow-xs'
                          : 'bg-[#FAF2E6] text-[#4C271A] border-[#7E4228]/15 hover:bg-[#EFE6D8]'
                      }`}
                    >
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ LEAFLET MAP ═══════════════════ */}
      <div className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF2E6]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#7E4228]/20 border-t-[#7E4228] animate-spin" />
              <p className="text-[#7E4228] text-xs font-black">Exploring the learner world...</p>
            </div>
          </div>
        ) : (
          <LeafletWorldMap
            learners={filteredLearners}
            currentUser={currentUser}
            connectedIds={connectedIds}
            onSelectUser={handleSelectUser}
            onSelectCluster={handleSelectCluster}
          />
        )}
      </div>

      {/* ═══════════════════ BOTTOM CONTROLS ═══════════════════ */}
      <div className="absolute bottom-24 inset-x-3 z-[600] flex items-end justify-between pointer-events-none">
        {/* Legend Toggle */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setShowLegend((s) => !s)}
            className="w-10 h-10 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            title="Map legend"
          >
            <span className="text-sm">🗺</span>
          </button>
          {showLegend && (
            <div className="absolute bottom-12 left-0">
              <OpenWorldLegend neuShadow="0 4px 14px rgba(0,0,0,0.15)" neuInset="" neuBase="#FFF9F2" />
            </div>
          )}
        </div>

        {/* Live Active Peers Stats & Refresh Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-[#2D1B11]">
              {stats.available} active
            </span>
            <span className="text-[#875F49]/40">·</span>
            <Users className="w-3 h-3 text-[#7E4228]" />
            <span className="text-[10px] font-black text-[#7E4228]">
              {stats.connected} linked
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            title="Refresh map"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════ CLUSTER MODAL SHEET ═══════════════════ */}
      {selectedCluster && !selectedUser && (
        <div
          className="fixed inset-0 z-[700] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md bg-[#FAF2E6] rounded-3xl border-2 border-[#7E4228]/25 shadow-2xl overflow-hidden max-h-[70vh] animate-slide-up text-[#4C271A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-[#7E4228]" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-black text-[#2D1B11] text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7E4228]" />
                    {selectedCluster.city}
                  </h3>
                  <p className="text-[10px] text-[#7E4228] font-bold mt-0.5">
                    {selectedCluster.users.length} learner{selectedCluster.users.length !== 1 ? 's' : ''} ·{' '}
                    {selectedCluster.country}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full clay-btn clay-btn-circle-light flex items-center justify-center text-[#4C271A] cursor-pointer hover:bg-[#E5DFD9] transition-colors"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-56">
                {selectedCluster.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedCluster(null)
                      setSelectedUser(u)
                    }}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-2xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/15 transition-all active:scale-98 cursor-pointer shadow-2xs"
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        u.online_status === 'studying'
                          ? 'bg-blue-500'
                          : u.online_status === 'offline'
                          ? 'bg-gray-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#2D1B11] text-xs font-black truncate">
                        {u.display_name}
                      </p>
                      <p className="text-[#7E4228] text-[10px] truncate font-medium">
                        {u.degree_program || u.degree_code || 'Learner'}
                      </p>
                    </div>
                    {u.connectionStatus === 'CONNECTED' && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ APPROXIMATE LOCATION DISCLAIMER ═══════════════════ */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3.5 py-1.5 rounded-full bg-[#FFF9F2]/95 backdrop-blur-md border border-[#7E4228]/20 shadow-md flex items-center gap-1.5 text-[10px] text-[#7E4228] font-bold whitespace-nowrap">
        <MapPin className="w-3.5 h-3.5 text-[#7E4228]" />
        <span>Locations are approximate city areas for learner privacy</span>
      </div>

      {/* ═══════════════════ USER CARD MODAL ═══════════════════ */}
      {selectedUser && (
        <DiscoveryCard
          user={selectedUser}
          onClose={handleCloseModal}
          onConnected={handleConnected}
        />
      )}
    </div>
  )
}

export default StudyWorldPage
