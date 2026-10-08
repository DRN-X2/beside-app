import React, { useState } from 'react'
import { X, Users, Swords, CheckCircle2, XCircle, Sparkles, RotateCcw } from 'lucide-react'

interface OllieQuizModalProps {
  isOpen: boolean
  onClose: () => void
  partnerName?: string
}

interface Question {
  prompt: string
  options: { key: string; text: string }[]
  correct: string
  explanation: string
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    prompt: 'Which data structure follows the Last-In, First-Out (LIFO) order of elements?',
    options: [
      { key: 'A', text: 'Queue (FIFO sequence)' },
      { key: 'B', text: 'Stack (Push / Pop operations)' },
      { key: 'C', text: 'Binary Search Tree' },
      { key: 'D', text: 'Doubly Linked List' },
    ],
    correct: 'B',
    explanation: 'A Stack follows LIFO principle where the most recently added element is removed first.',
  },
  {
    prompt: 'What is the average time complexity of searching an element in a balanced Binary Search Tree?',
    options: [
      { key: 'A', text: 'O(1)' },
      { key: 'B', text: 'O(n)' },
      { key: 'C', text: 'O(log n)' },
      { key: 'D', text: 'O(n log n)' },
    ],
    correct: 'C',
    explanation: 'Each comparison cuts the search space in half, resulting in logarithmic O(log n) time.',
  },
]

export const OllieQuizModal: React.FC<OllieQuizModalProps> = ({
  isOpen,
  onClose,
  partnerName = 'Partner',
}) => {
  const [quizMode, setQuizMode] = useState<'team' | 'battle'>('team')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  if (!isOpen) return null

  const currentQ = SAMPLE_QUESTIONS[questionIndex] || SAMPLE_QUESTIONS[0]

  const handleSelectOption = (key: string) => {
    if (hasAnswered) return
    setSelectedOption(key)
    setHasAnswered(true)
  }

  const handleNextOrReset = () => {
    setHasAnswered(false)
    setSelectedOption(null)
    setQuestionIndex((prev) => (prev + 1) % SAMPLE_QUESTIONS.length)
  }

  const isCorrect = selectedOption === currentQ.correct

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm bg-[#FAF2E6] border border-[#7E4228]/25 rounded-[32px] p-5 shadow-[8px_8px_24px_rgba(126,66,40,0.18),-4px_-4px_16px_rgba(255,255,255,0.95)] text-[#2D1B11] animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#7E4228]/15 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7E4228] p-1 flex items-center justify-center shadow-[2px_2px_6px_rgba(126,66,40,0.25)] border border-white/20 shrink-0">
              <img
                src="/beside-logo.png"
                alt="Ollie Mascot"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-base text-[#2D1B11] leading-tight">
                  Ollie's Quiz Sample
                </h3>
              </div>
              <p className="text-[10px] text-[#7E4228] font-bold">
                Quick study challenge with {partnerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] flex items-center justify-center cursor-pointer shadow-xs transition-all active:scale-95"
            title="Close quiz"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Mode Selector: Team Mode vs Battle Duel */}
        <div className="flex bg-[#FFF9F2] p-1 rounded-2xl border border-[#7E4228]/20 shadow-xs mb-3.5">
          <button
            onClick={() => {
              setQuizMode('team')
              setHasAnswered(false)
              setSelectedOption(null)
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              quizMode === 'team'
                ? 'bg-[#7E4228] text-white shadow-sm'
                : 'text-[#7E4228] hover:bg-[#F3E7D5]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Mode</span>
          </button>
          <button
            onClick={() => {
              setQuizMode('battle')
              setHasAnswered(false)
              setSelectedOption(null)
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              quizMode === 'battle'
                ? 'bg-[#7E4228] text-white shadow-sm'
                : 'text-[#7E4228] hover:bg-[#F3E7D5]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Battle Duel</span>
          </button>
        </div>

        {/* Question Card */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          <div className="p-3.5 rounded-2xl bg-[#FFF9F2] border border-[#7E4228]/20 shadow-sm">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#7E4228] block mb-1">
              {quizMode === 'battle' ? 'Battle Mode · Fast Finger' : 'Cooperative Challenge'} · Q{questionIndex + 1}
            </span>
            <h4 className="font-display font-black text-sm text-[#2D1B11] leading-snug">
              {currentQ.prompt}
            </h4>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.key
              const isOptCorrect = opt.key === currentQ.correct

              let btnStyle = 'bg-[#FFF9F2] border-[#7E4228]/20 text-[#2D1B11] hover:bg-[#F3E7D5]'
              if (hasAnswered) {
                if (isSelected && isOptCorrect) {
                  btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black shadow-xs'
                } else if (isSelected && !isOptCorrect) {
                  btnStyle = 'bg-rose-100 border-rose-400 text-rose-950 font-black shadow-xs'
                } else if (isOptCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                }
              }

              return (
                <button
                  key={opt.key}
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer shadow-xs active:scale-98 ${btnStyle} ${
                    hasAnswered ? 'cursor-default' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-xl bg-[#FAF2E6] border border-[#7E4228]/25 font-black text-xs text-[#7E4228] flex items-center justify-center shrink-0">
                      {opt.key}
                    </span>
                    <span className="text-xs font-semibold truncate">{opt.text}</span>
                  </div>

                  {hasAnswered && isOptCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                  )}
                  {hasAnswered && isSelected && !isOptCorrect && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-1" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Feedback Result */}
          {hasAnswered && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold animate-fade-in ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7E4228]" />
                <span className="font-black">
                  {isCorrect ? 'Correct! +100 Study XP earned' : 'Nice try!'}
                </span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed text-[#4C271A]">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#7E4228]/15 mt-2 flex items-center gap-2">
          {hasAnswered ? (
            <button
              onClick={handleNextOrReset}
              className="flex-1 py-2.5 rounded-2xl bg-[#7E4228] hover:bg-[#924D30] text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Another Question</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-[#FFF9F2] hover:bg-[#F3E7D5] border border-[#7E4228]/20 text-[#7E4228] text-xs font-bold transition-all cursor-pointer text-center"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
