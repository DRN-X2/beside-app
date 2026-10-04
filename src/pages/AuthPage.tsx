import React, { useState } from 'react'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import OtterAvatar from '../components/OtterAvatar'
import type { OtterConfig } from '../types'

type AuthMode = 'login' | 'signup'

const DEFAULT_OTTER: OtterConfig = {
  fur: 'brown', eyes: 'happy', glasses: 'none',
  clothing: 'hoodie', accessory: 'none', background: 'cream',
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn, signUp, enterDemoMode } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let result
    if (mode === 'login') {
      result = await signIn(email, password)
    } else {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
      result = await signUp(email, password, name)
    }

    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col justify-between text-[#4C271A] select-none">
      {/* Header & Main Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-10 pb-6">
        
        {/* Beside Mascot Logo & Brand Heading */}
        <div className="flex flex-col items-center mb-7 animate-slide-up text-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#7E4228] p-1 mb-4 flex items-center justify-center shadow-[6px_6px_18px_rgba(76,39,26,0.12),-6px_-6px_18px_rgba(255,255,255,0.9)] border border-[#4C271A]/20 overflow-hidden">
            <img
              src="/beside-logo.png"
              alt="Beside Logo"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#4C271A] tracking-tight leading-tight">
            BESIDE
          </h1>
          <p className="text-[#7E4228] text-sm mt-1 font-semibold tracking-wide">
            No one should have to learn alone.
          </p>
        </div>

        {/* Neumorphic Auth Card */}
        <div className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl p-6 shadow-[6px_6px_20px_rgba(76,39,26,0.08),-6px_-6px_20px_rgba(255,255,255,0.95)] border border-white/80 animate-slide-up">
          {/* Dual Toggle Tabs */}
          <div className="flex bg-[#E5DFD9] rounded-2xl p-1 mb-5 shadow-[inset_2px_2px_5px_rgba(76,39,26,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] border border-[#7E4228]/15">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 ${
                mode === 'login'
                  ? 'bg-[#7E4228] text-white shadow-[0_2px_8px_rgba(76,39,26,0.25)]'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 ${
                mode === 'signup'
                  ? 'bg-[#7E4228] text-white shadow-[0_2px_8px_rgba(76,39,26,0.25)]'
                  : 'text-[#7E4228]/70 hover:text-[#4C271A]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
                <input
                  type="text"
                  placeholder="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-[#7E4228]/70 hover:text-[#4C271A] transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#7E4228] hover:bg-[#683620] text-white font-display font-bold text-sm rounded-2xl shadow-[0_4px_12px_rgba(126,66,40,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#7E4228]/15" />
            <span className="text-[11px] font-bold text-[#7E4228]/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#7E4228]/15" />
          </div>

          {/* Demo Mode Button (Tasteful Neumorphic Button in #4C271A / #7E4228) */}
          <button
            onClick={enterDemoMode}
            className="w-full py-3 px-4 bg-[#EAE4DF] hover:bg-[#E2DAD4] text-[#4C271A] font-display font-bold text-xs sm:text-sm rounded-2xl shadow-[3px_3px_8px_rgba(76,39,26,0.08),-3px_-3px_8px_rgba(255,255,255,0.9)] border border-white/70 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#7E4228] stroke-[2.2]" />
            <span>Try Demo as Adrian</span>
          </button>
          <p className="text-center text-[10px] sm:text-[11px] font-medium text-[#7E4228]/70 mt-2.5">
            No account needed · Competition demo mode
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 px-6">
        <p className="text-[11px] font-bold text-[#7E4228]/50 uppercase tracking-wider">
          BESIDE · Find your study partner
        </p>
      </div>
    </div>
  )
}
