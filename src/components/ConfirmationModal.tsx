import React from 'react'
import { AlertCircle, HelpCircle, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Yes, Continue',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-sm bg-[#FAF2E6] rounded-3xl border-2 border-[#7E4228]/25 shadow-2xl overflow-hidden animate-scale-up text-[#4C271A]">
        {/* Top Accent Strip */}
        <div
          className={`h-1.5 w-full ${
            variant === 'danger'
              ? 'bg-[#E0533C]'
              : variant === 'primary'
              ? 'bg-[#7E4228]'
              : 'bg-[#C68642]'
          }`}
        />

        <div className="p-6 text-center">
          {/* Icon Badge */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border ${
              variant === 'danger'
                ? 'bg-red-50 border-red-200 text-[#E0533C]'
                : variant === 'primary'
                ? 'bg-amber-50 border-amber-200 text-[#7E4228]'
                : 'bg-amber-50 border-amber-200 text-[#C68642]'
            }`}
          >
            {variant === 'danger' ? (
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            ) : (
              <HelpCircle className="w-7 h-7 stroke-[2.2]" />
            )}
          </div>

          <h3 className="font-display font-black text-xl text-[#2D1B11] mb-2 leading-snug">
            {title}
          </h3>

          <p className="text-xs text-[#7A5A46] font-medium leading-relaxed mb-6 px-2">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="py-3 px-4 rounded-2xl bg-[#E5DFD9] hover:bg-[#D8D0C7] text-xs font-black text-[#4C271A] transition-all cursor-pointer active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`py-3 px-4 rounded-2xl text-xs font-black text-white shadow-md transition-all cursor-pointer active:scale-95 ${
                variant === 'danger'
                  ? 'bg-[#E0533C] hover:bg-[#C93B2B]'
                  : 'bg-[#7E4228] hover:bg-[#6D3821]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
