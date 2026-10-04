import type { RelationshipLevel } from '../types'

export function getRelationshipLevel(sessionCount: number): RelationshipLevel {
  if (sessionCount === 0) return 'New Connection'
  if (sessionCount <= 2) return 'Study Buddies'
  if (sessionCount <= 5) return 'Consistent Partners'
  if (sessionCount <= 10) return 'Learning Partners'
  return 'Trusted Study Partners'
}

export function getRelationshipColor(level: RelationshipLevel): string {
  const map: Record<RelationshipLevel, string> = {
    'New Connection': 'bg-gray-100 text-gray-600',
    'Study Buddies': 'bg-blue-100 text-blue-700',
    'Consistent Partners': 'bg-purple-100 text-purple-700',
    'Learning Partners': 'bg-caramel-light/30 text-caramel-dark',
    'Trusted Study Partners': 'bg-beside-primary/10 text-beside-primary',
  }
  return map[level] ?? 'bg-gray-100 text-gray-600'
}

export function getRelationshipProgress(sessionCount: number): number {
  if (sessionCount === 0) return 0
  if (sessionCount <= 2) return (sessionCount / 2) * 25
  if (sessionCount <= 5) return 25 + ((sessionCount - 2) / 3) * 25
  if (sessionCount <= 10) return 50 + ((sessionCount - 5) / 5) * 25
  return Math.min(100, 75 + ((sessionCount - 10) / 10) * 25)
}

export function getNextLevelInfo(sessionCount: number): { nextLevel: RelationshipLevel; sessionsNeeded: number } | null {
  if (sessionCount < 1) return { nextLevel: 'Study Buddies', sessionsNeeded: 1 }
  if (sessionCount < 3) return { nextLevel: 'Consistent Partners', sessionsNeeded: 3 - sessionCount }
  if (sessionCount < 6) return { nextLevel: 'Learning Partners', sessionsNeeded: 6 - sessionCount }
  if (sessionCount < 11) return { nextLevel: 'Trusted Study Partners', sessionsNeeded: 11 - sessionCount }
  return null
}

export function formatStudyTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
