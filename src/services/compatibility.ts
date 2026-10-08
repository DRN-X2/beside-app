import type { DemoUser, CompatibilityResult } from '../types'

// ============================================================
// BESIDE Compatibility Engine — Rule-based, explainable
// Scores 0-100 based on multiple weighted factors
// ============================================================

const WEIGHTS = {
  subjects:       0.30,  // Same/overlapping subjects — highest weight
  studyStyle:     0.20,  // Compatible study styles
  availability:   0.20,  // Overlapping availability
  location:       0.15,  // Same city/country
  duration:       0.10,  // Preferred session length
  accountability: 0.05,  // Similar accountability preference
}

function subjectScore(a: any, b: any): { score: number; reason?: string } {
  const aSubjects: string[] = a.subjects || []
  const aInterests: string[] = a.learning_interests || a.interests || []
  const aSkills: string[] = a.skills || []
  const bSubjects: string[] = b.subjects || []
  const bInterests: string[] = b.learning_interests || b.interests || []
  const bSkills: string[] = b.skills || []

  const aSet = new Set<string>([...aSubjects, ...aInterests, ...aSkills].map(s => s.toLowerCase()))
  const bSet = new Set<string>([...bSubjects, ...bInterests, ...bSkills].map(s => s.toLowerCase()))
  const overlap = [...aSet].filter(s => bSet.has(s))

  if (overlap.length === 0) return { score: 0 }
  if (overlap.length === 1) return { score: 60, reason: `Both share ${capitalize(overlap[0])}` }
  if (overlap.length === 2) return { score: 80, reason: `Shared interests & skills: ${overlap.slice(0,2).map(capitalize).join(' & ')}` }
  return { score: 100, reason: `${overlap.length} shared subjects & skills including ${capitalize(overlap[0])}` }
}

function studyStyleScore(a: DemoUser, b: DemoUser): { score: number; reason?: string } {
  if (a.study_style === b.study_style) {
    return { score: 100, reason: `Both prefer ${styleLabel(a.study_style)} sessions` }
  }
  // Mixed/flexible are compatible with anything
  if (a.study_style === 'mixed' || b.study_style === 'mixed' ||
      a.study_style === 'flexible' || b.study_style === 'flexible') {
    return { score: 70 }
  }
  // Quiet vs discussion — incompatible
  return { score: 20 }
}

function availabilityScore(a: any, b: any): { score: number; reason?: string } {
  const aSet = new Set<string>(a.availability || [])
  const bSet = new Set<string>(b.availability || [])
  const overlap = [...aSet].filter(s => bSet.has(s))
  const ratio = overlap.length / Math.max(aSet.size, bSet.size, 1)
  const score = Math.round(ratio * 100)
  if (score >= 60) {
    return { score, reason: 'Similar study schedule' }
  }
  return { score }
}

function locationScore(a: any, b: any): { score: number; reason?: string } {
  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) {
    return { score: 100, reason: `Same city — ${a.city}` }
  }
  if (a.country && b.country && a.country.toLowerCase() === b.country.toLowerCase()) {
    return { score: 60, reason: `Same country — ${a.country}` }
  }
  return { score: 20 }
}

function durationScore(a: DemoUser, b: DemoUser): { score: number; reason?: string } {
  if (a.preferred_duration === b.preferred_duration) {
    return { score: 100, reason: `Both prefer ${a.preferred_duration}-min sessions` }
  }
  const diff = Math.abs(a.preferred_duration - b.preferred_duration)
  return { score: diff <= 10 ? 70 : 30 }
}

function accountabilityScore(a: DemoUser, b: DemoUser): { score: number } {
  if (a.accountability_pref === b.accountability_pref) return { score: 100 }
  if (a.accountability_pref === 'flexible' || b.accountability_pref === 'flexible') return { score: 70 }
  return { score: 40 }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function styleLabel(style: string) {
  const map: Record<string, string> = {
    quiet: 'quiet focused',
    discussion: 'discussion-based',
    mixed: 'mixed-style',
    flexible: 'flexible',
  }
  return map[style] || style
}

export function calculateCompatibility(viewer: DemoUser, target: DemoUser): CompatibilityResult {
  const subj = subjectScore(viewer, target)
  const style = studyStyleScore(viewer, target)
  const avail = availabilityScore(viewer, target)
  const loc = locationScore(viewer, target)
  const dur = durationScore(viewer, target)
  const acct = accountabilityScore(viewer, target)

  const rawScore =
    subj.score * WEIGHTS.subjects +
    style.score * WEIGHTS.studyStyle +
    avail.score * WEIGHTS.availability +
    loc.score * WEIGHTS.location +
    dur.score * WEIGHTS.duration +
    acct.score * WEIGHTS.accountability

  // Clamp 0–100, round to nearest int
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  // Collect top reasons (defined ones only)
  const allReasons = [subj, style, avail, loc, dur]
    .filter(r => r.reason)
    .map(r => r.reason as string)

  // Always show 2-3 reasons
  const reasons = allReasons.slice(0, 3)
  if (reasons.length === 0) reasons.push('Compatible learning goals')

  return {
    score,
    reasons,
    breakdown: {
      subjects: subj.score,
      studyStyle: style.score,
      availability: avail.score,
      location: loc.score,
      goals: dur.score,
    },
  }
}

export function getCompatibilityLabel(score: number): string {
  if (score >= 90) return 'Excellent Match'
  if (score >= 75) return 'Great Match'
  if (score >= 60) return 'Good Match'
  if (score >= 45) return 'Decent Match'
  return 'Low Match'
}

export function getCompatibilityColor(score: number): string {
  if (score >= 85) return 'text-green-700 bg-green-50 border-green-200'
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 55) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
  return 'text-orange-700 bg-orange-50 border-orange-200'
}
