import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SlidersHorizontal, Search, X, Globe, Eye, EyeOff, RefreshCw, Users, MapPin } from 'lucide-react'
import { LeafletWorldMap } from './components/LeafletWorldMap'
import { OpenWorldLegend } from './components/OpenWorldLegend'
import { DiscoveryCard } from './components/DiscoveryCard'
import { ConnectedProfileModal } from './components/ConnectedProfileModal'
import { useAuthStore } from '../../store/authStore'
import {
  fetchOpenWorldLearners,
  updateOpenWorldVisibility,
} from '../../services/openWorldService'
import type { OpenWorldUser } from '../../services/openWorldService'
import type { ClusterGroup } from './components/LeafletWorldMap'
import { supabase } from '../../lib/supabase'

// ─── Neumorphism helpers ────────────────────────────────────────────────
const NEU_BASE = '#2B1C13'
const NEU_DARK = '#180D08'
const NEU_LIGHT = '#3E2A1E'
const NEU_SHADOW = `4px 4px 10px ${NEU_DARK}, -3px -3px 8px ${NEU_LIGHT}`
const NEU_INSET = `inset 3px 3px 7px ${NEU_DARK}, inset -2px -2px 6px ${NEU_LIGHT}`
// ────────────────────────────────────────────────────────────────────────

export const StudyWorldPage: React.FC = () => {
  const { profile } = useAuthStore()

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
  const [owVisible, setOwVisible] = useState<boolean>(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dismissNoLearners, setDismissNoLearners] = useState(false)
  const [visibilityToast, setVisibilityToast] = useState<string | null>(null)

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

  useEffect(() => { loadData() }, [loadData, refreshKey])

  useEffect(() => {
    if (profile) {
      setOwVisible(profile.openworld_visible !== false && profile.otter_config?.openworld_visible !== false)
    }
  }, [profile])

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase.channel('openworld_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        setRefreshKey(k => k + 1)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        setRefreshKey(k => k + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleToggleVisibility = async () => {
    if (!profile?.id) return
    const next = !owVisible
    setOwVisible(next)

    // Synchronize local auth store profile immediately
    const updatedProfile = {
      ...profile,
      openworld_visible: next,
      otter_config: { ...profile.otter_config, openworld_visible: next },
    }
    useAuthStore.getState().setProfile(updatedProfile)

    setVisibilityToast(next ? "You are now visible to learners on OpenWorld" : "You are now hidden from learners on OpenWorld")
    setTimeout(() => setVisibilityToast(null), 3000)

    await updateOpenWorldVisibility(profile.id, next)
  }

  const handleRefresh = () => {
    setDismissNoLearners(false)
    setRefreshKey(k => k + 1)
  }

  const filteredLearners = useMemo(() => {
    let list = learners
    if (filterStatus !== 'all') {
      list = list.filter(l => {
        if (filterStatus === 'available') return ['available', 'online'].includes(l.online_status || '')
        if (filterStatus === 'studying') return l.online_status === 'studying'
        if (filterStatus === 'offline') return l.online_status === 'offline'
        return true
      })
    }
    if (filterCountry !== 'all') list = list.filter(l => l.country === filterCountry)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(l =>
        l.display_name.toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q) ||
        (l.country || '').toLowerCase().includes(q) ||
        (l.degree_program || '').toLowerCase().includes(q) ||
        (l.learning_interests || []).some(i => i.toLowerCase().includes(q))
      )
    }
    return list
  }, [learners, filterStatus, filterCountry, searchQuery])

  const availableCountries = useMemo(() => {
    const set = new Set<string>()
    for (const l of learners) if (l.country) set.add(l.country)
    return Array.from(set).sort()
  }, [learners])

  const handleSelectUser = (user: OpenWorldUser) => { setSelectedCluster(null); setSelectedUser(user) }
  const handleSelectCluster = (cluster: ClusterGroup) => { setSelectedUser(null); setSelectedCluster(cluster) }
  const handleCloseModal = () => { setSelectedUser(null); setSelectedCluster(null) }
  const handleConnected = () => setRefreshKey(k => k + 1)

  const stats = {
    total: learners.length,
    available: learners.filter(l => ['available', 'online'].includes(l.online_status || '')).length,
    connected: connectedIds.size,
    countries: new Set(learners.map(l => l.country).filter(Boolean)).size,
  }

  // Neumorphic button style helper
  const neuBtn = (active = false) => ({
    background: NEU_BASE,
    boxShadow: active ? NEU_INSET : NEU_SHADOW,
    borderRadius: '14px',
    border: 'none',
    transition: 'box-shadow 0.15s ease',
  } as React.CSSProperties)

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden select-none"
      style={{ background: '#1A0D07' }}>

      {/* ═══════════════════ TOP HEADER ═══════════════════ */}
      <div className="absolute top-0 inset-x-0 z-[600] pt-safe">
        <div className="mx-3 mt-3 flex items-center gap-2">

          {/* Title pill */}
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5"
            style={{ ...neuBtn(), borderRadius: '18px' }}>
            <Globe className="w-4 h-4 text-[#C68642]" />
            <div>
              <span className="font-display font-black text-[#F5E8D0] text-sm tracking-wide">OpenWorld</span>
              {!loading && (
                <span className="ml-2 text-[10px] text-[#9B7B5A] font-semibold">
                  {stats.total} learner{stats.total !== 1 ? 's' : ''} · {stats.countries} {stats.countries !== 1 ? 'countries' : 'country'}
                </span>
              )}
            </div>
          </div>

          {/* Search btn */}
          <button
            onClick={() => setShowSearch(s => !s)}
            className="w-10 h-10 flex items-center justify-center text-[#C68642] transition-all active:scale-95"
            style={neuBtn(showSearch)}
          ><Search className="w-4 h-4" /></button>

          {/* Filter btn */}
          <button
            onClick={() => setShowFilters(s => !s)}
            className="w-10 h-10 flex items-center justify-center text-[#C68642] transition-all active:scale-95"
            style={neuBtn(showFilters || filterStatus !== 'all' || filterCountry !== 'all')}
          ><SlidersHorizontal className="w-4 h-4" /></button>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mx-3 mt-2">
            <div className="flex items-center gap-2 px-4 py-2.5"
              style={{ ...neuBtn(true), borderRadius: '16px' }}>
              <Search className="w-4 h-4 text-[#C68642] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search learners, skills, cities…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#F5E8D0] text-sm font-medium placeholder-[#5A3A28] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#9B7B5A]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter panel */}
        {showFilters && (
          <div className="mx-3 mt-2 p-4"
            style={{ ...neuBtn(true), borderRadius: '20px' }}>
            <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-2">Status</p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {['all', 'available', 'studying', 'offline'].map(s => (
                <button key={s}
                  onClick={() => setFilterStatus(s)}
                  className="px-2.5 py-1 text-[10px] font-bold capitalize transition-all active:scale-95"
                  style={{
                    borderRadius: '10px',
                    background: NEU_BASE,
                    boxShadow: filterStatus === s ? NEU_INSET : NEU_SHADOW,
                    color: filterStatus === s ? '#C68642' : '#9B7B5A',
                  }}>
                  {s === 'all' ? 'All' : s === 'available' ? '🟢 Available' : s === 'studying' ? '🔵 Studying' : '⚫ Offline'}
                </button>
              ))}
            </div>
            {availableCountries.length > 0 && (
              <>
                <p className="text-[9px] font-black text-[#C68642] uppercase tracking-widest mb-2">Country</p>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', ...availableCountries.slice(0, 6)].map(c => (
                    <button key={c}
                      onClick={() => setFilterCountry(c)}
                      className="px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95"
                      style={{
                        borderRadius: '10px',
                        background: NEU_BASE,
                        boxShadow: filterCountry === c ? NEU_INSET : NEU_SHADOW,
                        color: filterCountry === c ? '#C68642' : '#9B7B5A',
                      }}>
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════ MAP ═══════════════════ */}
      <div className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#1A0D07' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#C68642] border-t-transparent animate-spin" />
              <p className="text-[#9B7B5A] text-xs font-semibold">Mapping the learning world…</p>
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

        {!loading && filteredLearners.length === 0 && !dismissNoLearners && (
          <div className="absolute top-24 inset-x-4 z-[600] max-w-xs mx-auto animate-fade-in">
            <div className="relative p-5 text-center" style={{ ...neuBtn(), borderRadius: '20px' }}>
              <button
                onClick={() => setDismissNoLearners(true)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[#9B7B5A] hover:text-[#F5E8D0] hover:bg-[#3E2A1E] transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {!owVisible ? (
                <>
                  <EyeOff className="w-7 h-7 text-[#9B7B5A] mx-auto mb-2" />
                  <p className="text-[#F5E8D0] text-xs font-bold">Buddies-Only Mode Active</p>
                  <p className="text-[#9B7B5A] text-[10px] mt-1">
                    You are hidden from strangers. Only connected study buddies can see your pin on the map.
                  </p>
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      onClick={handleToggleVisibility}
                      className="px-3.5 py-1.5 rounded-full text-[10px] font-bold text-white bg-[#7E4228] hover:bg-[#924D30] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Turn Visible
                    </button>
                    <button
                      onClick={() => setDismissNoLearners(true)}
                      className="px-3.5 py-1.5 rounded-full text-[10px] font-bold text-[#F5E8D0] bg-[#3E2A1E] hover:bg-[#4E3526] active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Keep Hidden
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Users className="w-7 h-7 text-[#C68642] mx-auto mb-2" />
                  <p className="text-[#F5E8D0] text-xs font-bold">No Learners Online</p>
                  <p className="text-[#9B7B5A] text-[10px] mt-1">
                    There are currently no other visible learners on the map. As learners log in and explore, they will appear here!
                  </p>
                  <button
                    onClick={() => setDismissNoLearners(true)}
                    className="mt-3 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#F5E8D0] bg-[#3E2A1E] hover:bg-[#4E3526] active:scale-95 transition-all cursor-pointer shadow-md inline-block"
                  >
                    Got it
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Floating Visibility Feedback Toast */}
        {visibilityToast && (
          <div className="absolute top-20 inset-x-4 z-[700] max-w-xs mx-auto flex items-center justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-[#180D08]/90 border border-[#C68642]/40 backdrop-blur-md shadow-2xl text-center">
              <span className="text-[11px] font-bold text-[#F5E8D0]">
                {visibilityToast}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════ BOTTOM CONTROLS ═══════════════════ */}
      <div className="absolute bottom-24 inset-x-3 z-[600] flex items-end justify-between pointer-events-none">

        {/* Legend toggle */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setShowLegend(s => !s)}
            className="w-9 h-9 flex items-center justify-center text-[#C68642] transition-all active:scale-95"
            style={neuBtn(showLegend)}
          >
            <span className="text-sm">🗺</span>
          </button>
          {showLegend && (
            <div className="absolute bottom-12 left-0">
              <OpenWorldLegend neuShadow={NEU_SHADOW} neuInset={NEU_INSET} neuBase={NEU_BASE} />
            </div>
          )}
        </div>

        {/* Stats + controls right side */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Live stats */}
          <div className="flex items-center gap-2 px-3 py-1.5"
            style={{ ...neuBtn(), borderRadius: '12px' }}>
            {owVisible ? (
              <>
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[10px] font-bold text-[#F5E8D0]">{stats.available} active</span>
                <span className="text-[#4A3022]">·</span>
                <Users className="w-3 h-3 text-[#C68642]" />
                <span className="text-[10px] font-bold text-[#C68642]">{stats.connected} linked</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                <span className="text-[10px] font-bold text-[#F5E8D0]">Buddies Only</span>
                <span className="text-[#4A3022]">·</span>
                <Users className="w-3 h-3 text-[#C68642]" />
                <span className="text-[10px] font-bold text-[#C68642]">{stats.connected} linked</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="w-9 h-9 flex items-center justify-center text-[#C68642] transition-all active:scale-95 cursor-pointer"
              style={neuBtn()}
              title="Refresh OpenWorld"
            ><RefreshCw className="w-4 h-4" /></button>

            {/* Visibility toggle */}
            <button
              onClick={handleToggleVisibility}
              className="flex items-center gap-2 px-3 py-2 transition-all active:scale-95 cursor-pointer"
              style={{
                ...neuBtn(owVisible),
                borderRadius: '14px',
              }}
              title={owVisible ? "You are visible to other learners on the map (Click to hide)" : "You are hidden from other learners (Click to become visible)"}
            >
              <div className={`w-2 h-2 rounded-full ${owVisible ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#6B5040]'}`} />
              {owVisible
                ? <Eye className="w-4 h-4 text-emerald-400" />
                : <EyeOff className="w-4 h-4 text-[#9B7B5A]" />}
              <span className="text-[10px] font-black uppercase tracking-wide"
                style={{ color: owVisible ? '#34d399' : '#9B7B5A' }}>
                {owVisible ? 'Visible' : 'Hidden'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ CLUSTER SHEET ═══════════════════ */}
      {selectedCluster && !selectedUser && (
        <div className="fixed inset-0 z-[700] flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={handleCloseModal}>
          <div className="w-full max-w-md overflow-hidden max-h-[70vh]"
            style={{ ...neuBtn(), borderRadius: '28px' }}
            onClick={e => e.stopPropagation()}>
            {/* Gold top bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7E4228,#C68642,#7E4228)' }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-black text-[#F5E8D0] text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C68642]" />
                    {selectedCluster.city}
                  </h3>
                  <p className="text-[10px] text-[#9B7B5A] mt-0.5">
                    {selectedCluster.users.length} learner{selectedCluster.users.length !== 1 ? 's' : ''} · {selectedCluster.country}
                  </p>
                </div>
                <button onClick={handleCloseModal}
                  className="w-8 h-8 flex items-center justify-center text-[#9B7B5A] transition-all active:scale-95"
                  style={{ ...neuBtn(), borderRadius: '50%' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-48">
                {selectedCluster.users.map(u => (
                  <button key={u.id}
                    onClick={() => { setSelectedCluster(null); setSelectedUser(u) }}
                    className="w-full flex items-center gap-3 p-3 text-left transition-all active:scale-98"
                    style={{ ...neuBtn(), borderRadius: '16px' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: u.online_status === 'studying' ? '#3b82f6'
                          : u.online_status === 'offline' ? '#6b7280' : '#22c55e'
                      }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F5E8D0] text-xs font-bold truncate">{u.display_name}</p>
                      <p className="text-[#9B7B5A] text-[10px] truncate">{u.degree_program || u.degree_code}</p>
                    </div>
                    {u.connectionStatus === 'CONNECTED' && (
                      <span className="text-[10px] text-[#C68642] font-bold">Connected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ USER MODALS ═══════════════════ */}
      {selectedUser && (
        selectedUser.connectionStatus === 'CONNECTED'
          ? <ConnectedProfileModal user={selectedUser} onClose={handleCloseModal} />
          : <DiscoveryCard user={selectedUser} onClose={handleCloseModal} onConnected={handleConnected} />
      )}
    </div>
  )
}

export default StudyWorldPage
