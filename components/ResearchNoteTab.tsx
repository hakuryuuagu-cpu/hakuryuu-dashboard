'use client'

import { useState, useEffect } from 'react'
import type { ResearchNote, ResearchCategory } from '@/lib/types'

const STORAGE_KEY = 'hakuryuu_research_notes'

const CATEGORIES: ResearchCategory[] = [
  '食べログ', 'Google評価', '競合調査', '市場調査', 'SNS・トレンド', 'AIの回答', 'その他'
]

const CATEGORY_STYLE: Record<ResearchCategory, { bg: string; text: string; emoji: string }> = {
  '食べログ':     { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🍴' },
  'Google評価':   { bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '⭐' },
  '競合調査':     { bg: 'bg-purple-100', text: 'text-purple-700', emoji: '🔍' },
  '市場調査':     { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '📊' },
  'SNS・トレンド':{ bg: 'bg-pink-100',   text: 'text-pink-700',   emoji: '📱' },
  'AIの回答':     { bg: 'bg-indigo-100', text: 'text-indigo-700', emoji: '🤖' },
  'その他':       { bg: 'bg-gray-100',   text: 'text-gray-600',   emoji: '📝' },
}

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }

interface AddNoteFormProps {
  onSave: (note: ResearchNote) => void
  onCancel: () => void
  prefill?: Partial<ResearchNote>
}

function AddNoteForm({ onSave, onCancel, prefill }: AddNoteFormProps) {
  const [category, setCategory] = useState<ResearchCategory>(prefill?.category ?? '食べログ')
  const [title, setTitle]       = useState(prefill?.title ?? '')
  const [content, setContent]   = useState(prefill?.content ?? '')
  const [source, setSource]     = useState(prefill?.source ?? '')
  const [rating, setRating]     = useState<string>(prefill?.rating?.toString() ?? '')

  const showRating = category === '食べログ' || category === 'Google評価'

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    onSave({
      id: uid(),
      category,
      title: title.trim(),
      content: content.trim(),
      source: source.trim() || undefined,
      rating: rating ? parseFloat(rating) : undefined,
      savedAt: new Date().toLocaleString('ja-JP', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    })
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2.5 shadow-sm">
      <p className="text-[10px] font-bold text-indigo-700">＋ 新しい調査メモ</p>

      {/* Category */}
      <div>
        <label className="text-[9px] font-bold text-gray-500 block mb-1">カテゴリ</label>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map(c => {
            const s = CATEGORY_STYLE[c]
            return (
              <button key={c} onClick={() => setCategory(c)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${
                  category === c
                    ? `${s.bg} ${s.text} border-current`
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                }`}>
                {s.emoji} {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[9px] font-bold text-gray-500 block mb-1">タイトル *</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="例：競合A 食べログ評価"
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      </div>

      {/* Rating (for tabelog/google) */}
      {showRating && (
        <div>
          <label className="text-[9px] font-bold text-gray-500 block mb-1">
            評価スコア <span className="font-normal text-gray-400">（任意）</span>
          </label>
          <input value={rating} onChange={e => setRating(e.target.value)}
            type="number" step="0.01" min="0" max="5"
            placeholder="例：3.85"
            className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
      )}

      {/* Content */}
      <div>
        <label className="text-[9px] font-bold text-gray-500 block mb-1">内容 *</label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="調査内容・評価の詳細・気になった点など"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none" />
      </div>

      {/* Source */}
      <div>
        <label className="text-[9px] font-bold text-gray-500 block mb-1">
          情報源URL <span className="font-normal text-gray-400">（任意）</span>
        </label>
        <input value={source} onChange={e => setSource(e.target.value)}
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[10px] text-gray-500 hover:bg-gray-50 font-medium">
          キャンセル
        </button>
        <button onClick={handleSave} disabled={!title.trim() || !content.trim()}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
            title.trim() && content.trim()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          保存する
        </button>
      </div>
    </div>
  )
}

interface Props {
  externalNote?: Partial<ResearchNote> | null
  onExternalNoteHandled?: () => void
}

export default function ResearchNoteTab({ externalNote, onExternalNoteHandled }: Props) {
  const [notes, setNotes]           = useState<ResearchNote[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [filterCat, setFilterCat]   = useState<ResearchCategory | 'すべて'>('すべて')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [prefill, setPrefill]       = useState<Partial<ResearchNote> | undefined>()

  // localStorageから読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setNotes(JSON.parse(stored))
    } catch {}
  }, [])

  // 外部から渡されたメモ（QA保存など）を自動フォーム表示
  useEffect(() => {
    if (externalNote) {
      setPrefill(externalNote)
      setShowForm(true)
      onExternalNoteHandled?.()
    }
  }, [externalNote])

  const saveToStorage = (updated: ResearchNote[]) => {
    setNotes(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleSave = (note: ResearchNote) => {
    saveToStorage([note, ...notes])
    setShowForm(false)
    setPrefill(undefined)
  }

  const handleDelete = (id: string) => {
    saveToStorage(notes.filter(n => n.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const filtered = filterCat === 'すべて' ? notes : notes.filter(n => n.category === filterCat)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header + add button */}
      <div className="flex-shrink-0 px-3 pt-2.5 pb-2 border-b border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-700">📌 調査メモ</p>
            <p className="text-[9px] text-gray-400">{notes.length}件保存済み</p>
          </div>
          <button onClick={() => { setPrefill(undefined); setShowForm(v => !v) }}
            className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
              showForm ? 'bg-gray-200 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}>
            {showForm ? '✕ 閉じる' : '＋ 追加'}
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {(['すべて', ...CATEGORIES] as const).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-all ${
                filterCat === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {c === 'すべて' ? 'すべて' : `${CATEGORY_STYLE[c].emoji}${c}`}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {showForm && (
          <AddNoteForm
            prefill={prefill}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setPrefill(undefined) }}
          />
        )}

        {filtered.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2 opacity-40">📌</div>
            <p className="text-xs leading-relaxed mb-1">まだメモがありません</p>
            <p className="text-[10px] text-gray-400">
              食べログ・Google評価・競合情報など<br />「＋ 追加」から記録できます
            </p>
          </div>
        )}

        {filtered.map(note => {
          const s = CATEGORY_STYLE[note.category]
          const isOpen = expandedId === note.id
          return (
            <div key={note.id} className="rounded-xl border border-gray-200 overflow-hidden fade-in">
              {/* Note header */}
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : note.id)}>
                <div className="flex items-start gap-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${s.bg} ${s.text}`}>
                    {s.emoji} {note.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 leading-snug truncate">{note.title}</p>
                    {note.rating !== undefined && (
                      <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                        {'★'.repeat(Math.round(note.rating))}{'☆'.repeat(5 - Math.round(note.rating))} {note.rating.toFixed(2)}
                      </p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-0.5">{note.savedAt}</p>
                  </div>
                  <span className="text-gray-400 text-[9px] flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 space-y-2 fade-in">
                  <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  {note.source && (
                    <a href={note.source} target="_blank" rel="noopener noreferrer"
                      className="text-[9px] text-indigo-500 hover:text-indigo-700 underline block truncate">
                      🔗 {note.source}
                    </a>
                  )}
                  <button onClick={() => handleDelete(note.id)}
                    className="text-[9px] text-red-400 hover:text-red-600 transition-colors">
                    🗑 削除する
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
