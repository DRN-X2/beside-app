import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

type AuthMode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const { signIn, signUp } = useAuthStore()

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('beside_remember_email')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch { /* ignore */ }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.')
        return
      }
    }

    setLoading(true)

    // Handle Remember Me storage
    try {
      if (rememberMe && email.trim()) {
        localStorage.setItem('beside_remember_email', email.trim())
      } else {
        localStorage.removeItem('beside_remember_email')
      }
    } catch { /* ignore */ }

    if (mode === 'login') {
      const result = await signIn(email.trim(), password)
      if (result?.error) {
        const msg = result.error.toLowerCase()
        if (
          msg.includes('invalid login') ||
          msg.includes('invalid credentials') ||
          msg.includes('user not found') ||
          msg.includes('no user')
        ) {
          setError('No account found with this email. Please create an account first.')
        } else if (msg.includes('email not confirmed')) {
          setError('Please confirm your email address before signing in.')
        } else {
          setError('Incorrect email or password. Please try again.')
        }
        setLoading(false)
        return
      }
    } else {
      // Create Account (display name is collected in Onboarding Step 1: "What should we call you?")
      const result = await signUp(email.trim(), password)
      if (result?.error) {
        const msg = result.error.toLowerCase()
        if (
          msg.includes('already registered') ||
          msg.includes('already exists') ||
          msg.includes('user already')
        ) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(result.error)
        }
        setLoading(false)
        return
      }
    }

    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.')
      return
    }
    setResetLoading(true)
    setResetError(null)
    setResetSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin + '/auth',
      })
      if (error) {
        setResetError(error.message)
      } else {
        setResetSuccess(true)
      }
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send password reset request.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex flex-col justify-between text-[#4C271A] select-none">
      {/* Header & Main Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-6">
        
        {/* Beside Mascot Logo */}
        <div className="flex flex-col items-center mb-6 animate-slide-up text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#7E4228] p-1.5 mb-3 flex items-center justify-center shadow-[6px_6px_18px_rgba(76,39,26,0.12),-6px_-6px_18px_rgba(255,255,255,0.9)] border border-[#4C271A]/20 overflow-hidden">
            <img
              src="/beside-logo.png"
              alt="Beside Mascot"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Dynamic Title & Subtitle based on active mode */}
          {mode === 'login' ? (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-[#4C271A] tracking-tight leading-tight">
                Welcome back to BESIDE
              </h1>
              <p className="text-[#7E4228] text-xs sm:text-sm mt-1 font-semibold tracking-wide">
                Continue your learning journey.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-[#4C271A] tracking-tight leading-tight">
                Join BESIDE
              </h1>
              <p className="text-[#7E4228] text-xs sm:text-sm mt-1 font-semibold tracking-wide">
                Find people to learn with.
              </p>
            </>
          )}
        </div>

        {/* Neumorphic Auth Card */}
        <div className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl p-6 shadow-[6px_6px_20px_rgba(76,39,26,0.08),-6px_-6px_20px_rgba(255,255,255,0.95)] border border-white/80 animate-slide-up">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#4C271A] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#4C271A] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
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
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Only for Create Account) */}
            {mode === 'signup' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-[#4C271A] mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-3.5 text-[#7E4228]/70 hover:text-[#4C271A] transition-colors"
                    title={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Checkbox (Sign In mode) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-[#7E4228]/30 text-[#7E4228] focus:ring-[#7E4228] accent-[#7E4228] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#4C271A]">Remember me</span>
                </label>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5 text-xs text-red-600 font-medium flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#7E4228] hover:bg-[#683620] text-white font-display font-bold text-sm rounded-2xl shadow-[0_4px_12px_rgba(126,66,40,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
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

          {/* Bottom Navigation Links */}
          <div className="mt-5 pt-4 border-t border-[#7E4228]/10">
            {mode === 'login' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-[#7E4228]">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email)
                    setResetError(null)
                    setResetSuccess(false)
                    setShowForgotPassword(true)
                  }}
                  className="hover:text-[#4C271A] hover:underline transition-colors"
                >
                  Forgot password?
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[#7E4228]/70 font-medium">Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup')
                      setError(null)
                    }}
                    className="text-[#4C271A] hover:underline font-black"
                  >
                    Create one
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs font-medium text-[#7E4228]">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                  }}
                  className="text-[#4C271A] hover:underline font-black"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-[#F1F1F1] rounded-3xl p-6 shadow-[6px_6px_25px_rgba(0,0,0,0.2)] border border-white/90 text-[#4C271A] animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-8 h-8 rounded-full neu-btn-circle-light flex items-center justify-center text-[#4C271A] active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <h3 className="font-display font-black text-base text-[#4C271A]">Reset Password</h3>
              <div className="w-8" />
            </div>

            {resetSuccess ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="font-display font-bold text-base text-[#4C271A]">Check your email</h4>
                <p className="text-xs text-[#7E4228] font-medium leading-relaxed">
                  We sent a password reset link to <span className="font-bold">{resetEmail}</span>.
                </p>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-3 bg-[#7E4228] hover:bg-[#683620] text-white font-bold text-xs rounded-2xl shadow-md active:scale-95 transition-all mt-3 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-[#7E4228] font-medium leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-[#4C271A] mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7E4228]/70" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-[#F1F1F1] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-[#4C271A] placeholder-[#7E4228]/50 shadow-[inset_2px_2px_4px_rgba(76,39,26,0.07),inset_-2px_-2px_4px_rgba(255,255,255,0.85)] border border-[#7E4228]/20 focus:outline-none focus:border-[#7E4228] focus:ring-2 focus:ring-[#7E4228]/15 transition-all"
                      required
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 px-4 bg-[#7E4228] hover:bg-[#683620] text-white font-display font-bold text-xs sm:text-sm rounded-2xl shadow-[0_4px_12px_rgba(126,66,40,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pb-6 px-6">
        <p className="text-[11px] font-bold text-[#7E4228]/50 uppercase tracking-wider">
          BESIDE · Find your study partner
        </p>
      </div>
    </div>
  )
}
