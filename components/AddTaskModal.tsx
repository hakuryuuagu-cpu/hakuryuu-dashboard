'use client'

import { useState } from 'react'
import type { AIAgent, HumanMember, Task, TaskTimeframe, TaskStatus, TaskPriority } from '@/lib/types'

interface Props {
  agents: AIAgent[]
  humanMembers?: HumanMember[]
  defaultTimeframe: TaskTimeframe
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const TIMEFRAME_OPTIONS: { value: TaskTimeframe; label: string }[] = [
  { value: 'week',  label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'year',  label: '今年' },
]

const STATUS_OPTIONS: TaskStatus[] = ['未着手', '進行中', '完了', '保留']

const CATEGORY_PRESETS = [
  '物件調査', '財務', 'メニュー開発', 'マーケティング',
  '採用・研修', '市場調査', 'リスク管理', '経営計画', '物件', 'その他',
]

export default function AddTaskModal({ agents, humanMembers = [], defaultTimeframe, onAdd, onClose }: Props) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState(agents[0]?.id ?? '')
  const [status, setStatus]         = useState<TaskStatus>('未着手')
  const [priority, setPriority]     = useState<TaskPriority>('中')
  const [timeframe, setTimeframe]   = useState<TaskTimeframe>(defaultTimeframe)
  const [dueDate, setDueDate]       = useState('')
  const [category, setCategory]     = useState('')
  const [customCat, setCustomCat]   = useState(false)

  const canSubmit = title.trim().length > 0 && !!assigneeId

  const handleSubmit = () => {
    if (!canSubmit) return
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      status,
      priority,
      timeframe,
      dueDate: dueDate || undefined,
      category: category || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[92vh] flex flex-col overflow-hidden fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">タスクを追加</h2>
            <p className="text-indigo-200 text-xs mt-0.5">担当者・期限・詳細を設定してください</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">タスク名 *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="例：物件候補3件を調査してリスト化する"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">詳細・メモ（任意）</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="タスクの内容、背景、完了条件など..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">担当者 *</label>
            <div className="grid grid-cols-2 gap-1.5">
              {agents.map(a => (
                <button key={a.id} onClick={() => setAssigneeId(a.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${assigneeId === a.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: a.color }}>
                    {a.initials}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${assigneeId === a.id ? 'text-indigo-700' : 'text-gray-800'}`}>{a.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{a.role}</p>
                  </div>
                </button>
              ))}
              {humanMembers.length > 0 && (
                <>
                  <div className="col-span-2 pt-1 pb-0.5">
                    <p className="text-[9px] font-bold text-gray-400">👤 登録メンバー</p>
                  </div>
                  {humanMembers.map(m => (
                    <button key={m.id} onClick={() => setAssigneeId(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${assigneeId === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: m.color + '33' }}>
                        {m.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${assigneeId === m.id ? 'text-indigo-700' : 'text-gray-800'}`}>{m.name}</p>
                        <p className="text-[9px] text-gray-400 truncate">{m.role}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">期間 *</label>
            <div className="flex gap-2">
              {TIMEFRAME_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTimeframe(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${timeframe === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">優先度</label>
              <div className="flex gap-1">
                {(['高', '中', '低'] as TaskPriority[]).map(p => {
                  const active = priority === p
                  const cls = p === '高' ? 'bg-red-500 text-white' : p === '中' ? 'bg-amber-400 text-white' : 'bg-gray-300 text-gray-700'
                  return (
                    <button key={p} onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${active ? cls : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">ステータス</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">期限日（任意）</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">カテゴリ（任意）</label>
            {!customCat ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_PRESETS.map(c => (
                    <button key={c} onClick={() => setCategory(category === c ? '' : c)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCustomCat(true)} className="text-xs text-indigo-500 hover:text-indigo-700 mt-1.5">
                  ✏️ カスタム入力
                </button>
              </>
            ) : (
              <>
                <input value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="カテゴリ名を入力..." autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={() => setCustomCat(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">
                  ← プリセットに戻る
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            キャンセル
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${canSubmit ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            タスクを登録
          </button>
        </div>
      </div>
    </div>
  )
}
