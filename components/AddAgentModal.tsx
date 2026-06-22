'use client'

import { useState } from 'react'

interface Props {
  onAdd: (name: string, role: string, emoji: string, color: string) => void
  onClose: () => void
}

const EMOJI_OPTIONS = ['🧑‍💼', '👨‍🍳', '👩‍💻', '📦', '🎨', '🧑‍🔧', '📣', '🤝', '📐', '🧑‍🎓', '🛒', '🏋️']
const COLOR_OPTIONS = [
  '#06b6d4', '#ec4899', '#f97316', '#84cc16',
  '#14b8a6', '#a855f7', '#64748b', '#0ea5e9',
]

const PRESET_ROLES = ['販促担当', '採用担当', '店舗運営', 'IT担当', '法務担当', 'デザイン担当', '調理開発', '仕入担当']

export default function AddAgentModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [emoji, setEmoji] = useState('🧑‍💼')
  const [color, setColor] = useState('#06b6d4')
  const [customRole, setCustomRole] = useState(false)

  const canSubmit = name.trim().length > 0 && role.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">＋</div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">AIエージェントを追加</h2>
              <p className="text-indigo-200 text-xs">新しい部門・担当を追加できます</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-sm transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: color }}
            >
              {name.slice(0, 1) || '?'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{emoji}</span>
                <span className="font-bold text-gray-900 text-sm">{name || '名前未入力'}</span>
              </div>
              <p className="text-xs text-gray-500">{role || '役割未入力'}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">エージェント名 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：採用担当AI、デザインAI..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">役割・部門 *</label>
            {!customRole ? (
              <>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {PRESET_ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left ${role === r ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCustomRole(true)} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                  ✏️ カスタムで入力
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="例：販促担当、採用担当..."
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
                <button onClick={() => setCustomRole(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors">
                  ← プリセットに戻る
                </button>
              </>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">アイコン絵文字</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">テーマカラー</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
              キャンセル
            </button>
            <button
              onClick={() => canSubmit && onAdd(name.trim(), role.trim(), emoji, color)}
              disabled={!canSubmit}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSubmit ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              追加する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
