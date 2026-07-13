'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  type Goal, type Milestone, type GoalPeriod, type GoalStatus,
  calcProgress, PERIOD_LABEL, PERIOD_OPTIONS,
} from '@/lib/goals'
import type { MemberProfile } from '@/lib/member-profiles'

// ─── 固定メンバー（VirtualOfficeと合わせてください） ──────────────────────
const DEFAULT_MEMBERS = [
  { id: 'owner',   name: 'オーナー（自分）', color: '#7c3aed', emoji: '👑' },
  { id: 'staff1',  name: 'スタッフ1',       color: '#2563eb', emoji: '👤' },
  { id: 'staff2',  name: 'スタッフ2',       color: '#059669', emoji: '👤' },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── 進捗バー ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#6366f1' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── KPI カード ──────────────────────────────────────────────────────────
function KpiCard({
  goal, onUpdateValue, onToggleStatus, onDelete,
}: {
  goal: Goal
  onUpdateValue: (id: string, val: number) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(goal.currentValue ?? 0))
  const pct = calcProgress(goal)

  const pctColor =
    pct >= 100 ? '#10b981' :
    pct >= 60  ? '#6366f1' :
    pct >= 30  ? '#f59e0b' : '#ef4444'

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      goal.status === 'completed' ? 'border-green-200 bg-green-50/40 opacity-70' : 'border-indigo-100 bg-white'
    }`}>
      {/* header */}
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">📈</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-snug">{goal.title}</p>
          {goal.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{goal.description}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onToggleStatus(goal.id)}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
              goal.status === 'completed'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-100 hover:text-green-700'
            }`}>
            {goal.status === 'completed' ? '✅ 達成' : '○ 進行中'}
          </button>
          <button onClick={() => onDelete(goal.id)} className="text-gray-300 hover:text-red-400 text-xs transition-colors">✕</button>
        </div>
      </div>

      {/* progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-xs text-gray-500">進捗</span>
          <span className="text-lg font-black" style={{ color: pctColor }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} color={pctColor} />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>現在: <span className="font-bold text-gray-700">{(goal.currentValue ?? 0).toLocaleString()}{goal.unit}</span></span>
          <span>目標: <span className="font-bold text-gray-700">{(goal.targetValue ?? 0).toLocaleString()}{goal.unit}</span></span>
        </div>
      </div>

      {/* update value */}
      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border border-indigo-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder={`現在値を入力（${goal.unit}）`}
          />
          <button
            onClick={() => { onUpdateValue(goal.id, Number(input)); setEditing(false) }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
            更新
          </button>
          <button onClick={() => setEditing(false)} className="px-2 py-1.5 text-gray-400 text-xs hover:text-gray-600">✕</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="w-full py-1.5 text-[11px] font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
          ✏️ 進捗を更新
        </button>
      )}

      {goal.dueDate && (
        <p className="text-[10px] text-gray-400">期限: {goal.dueDate}</p>
      )}
    </div>
  )
}

// ─── 行動目標カード ───────────────────────────────────────────────────────
function ActionCard({
  goal, onToggleMilestone, onToggleStatus, onDelete,
}: {
  goal: Goal
  onToggleMilestone: (goalId: string, msId: string) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}) {
  const pct = calcProgress(goal)
  const milestones = goal.milestones ?? []
  const done = milestones.filter(m => m.done).length

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      goal.status === 'completed' ? 'border-green-200 bg-green-50/40 opacity-70' : 'border-sky-100 bg-white'
    }`}>
      {/* header */}
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none">🎯</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-snug">{goal.title}</p>
          {goal.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{goal.description}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onToggleStatus(goal.id)}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
              goal.status === 'completed'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-100 hover:text-green-700'
            }`}>
            {goal.status === 'completed' ? '✅ 達成' : '○ 進行中'}
          </button>
          <button onClick={() => onDelete(goal.id)} className="text-gray-300 hover:text-red-400 text-xs transition-colors">✕</button>
        </div>
      </div>

      {/* progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-xs text-gray-500">マイルストーン達成</span>
          <span className="text-base font-black text-sky-600">{done}/{milestones.length}</span>
        </div>
        <ProgressBar pct={pct} color="#0ea5e9" />
      </div>

      {/* milestones */}
      <div className="space-y-1.5">
        {milestones.map((ms, i) => (
          <button
            key={ms.id}
            onClick={() => onToggleMilestone(goal.id, ms.id)}
            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
              ms.done
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-100 hover:bg-sky-50 hover:border-sky-200'
            }`}>
            <span className={`text-base leading-none flex-shrink-0 ${ms.done ? 'opacity-100' : 'opacity-30'}`}>
              {ms.done ? '✅' : '⬜'}
            </span>
            <span className={`text-xs leading-snug ${ms.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              <span className="text-[10px] text-gray-400 mr-1">STEP {i + 1}</span>
              {ms.text}
            </span>
          </button>
        ))}
      </div>

      {goal.dueDate && (
        <p className="text-[10px] text-gray-400">期限: {goal.dueDate}</p>
      )}
    </div>
  )
}

// ─── 担当者バッジ ─────────────────────────────────────────────────────────
function AssigneeBadge({ name, color, emoji }: { name: string; color: string; emoji: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
        style={{ backgroundColor: color + '22', border: `1.5px solid ${color}` }}>
        {emoji}
      </span>
      <span className="text-sm font-bold" style={{ color }}>{name}</span>
    </div>
  )
}

// ─── 目標追加フォーム ─────────────────────────────────────────────────────
type AddFormState = {
  type: 'kpi' | 'action'
  title: string
  description: string
  assigneeId: string
  period: GoalPeriod
  dueDate: string
  // KPI
  targetValue: string
  unit: string
  // Action
  milestoneInputs: string[]
}

function AddGoalForm({
  members, onAdd, onClose,
}: {
  members: typeof DEFAULT_MEMBERS
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt' | 'status'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<AddFormState>({
    type: 'kpi',
    title: '',
    description: '',
    assigneeId: members[0]?.id ?? '',
    period: 'monthly',
    dueDate: '',
    targetValue: '',
    unit: '円',
    milestoneInputs: ['', '', ''],
  })

  const set = (k: Partial<AddFormState>) => setForm(p => ({ ...p, ...k }))

  const canSubmit = form.title.trim() &&
    (form.type === 'kpi'
      ? Number(form.targetValue) > 0
      : form.milestoneInputs.some(m => m.trim()))

  const handleSubmit = () => {
    if (!canSubmit) return
    const assignee = members.find(m => m.id === form.assigneeId)!
    if (form.type === 'kpi') {
      onAdd({
        type: 'kpi',
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigneeId: form.assigneeId,
        assigneeName: assignee.name,
        period: form.period,
        dueDate: form.dueDate || undefined,
        targetValue: Number(form.targetValue),
        currentValue: 0,
        unit: form.unit.trim() || undefined,
      })
    } else {
      const milestones: Milestone[] = form.milestoneInputs
        .filter(m => m.trim())
        .map(text => ({ id: uid(), text: text.trim(), done: false }))
      onAdd({
        type: 'action',
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigneeId: form.assigneeId,
        assigneeName: assignee.name,
        period: form.period,
        dueDate: form.dueDate || undefined,
        milestones,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">🎯 新しい目標を設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* 目標タイプ */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">目標タイプ</label>
            <div className="grid grid-cols-2 gap-2">
              {([['kpi', '📈 KPI目標', '数値で測る'], ['action', '🎯 行動目標', 'マイルストーン']] as const).map(([v, label, sub]) => (
                <button key={v} onClick={() => set({ type: v })}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    form.type === v
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <p className="text-sm font-bold text-gray-800">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">目標タイトル</label>
            <input value={form.title} onChange={e => set({ title: e.target.value })}
              placeholder="例: 月間売上120万円達成"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* 説明 */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">説明（任意）</label>
            <textarea value={form.description} onChange={e => set({ description: e.target.value })}
              placeholder="目標の背景・意図"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          {/* 担当者 */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">担当者</label>
            <select value={form.assigneeId} onChange={e => set({ assigneeId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
            </select>
          </div>

          {/* 期間 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">期間</label>
              <select value={form.period} onChange={e => set({ period: e.target.value as GoalPeriod })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">期限（任意）</label>
              <input type="date" value={form.dueDate} onChange={e => set({ dueDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>

          {/* KPI 追加フィールド */}
          {form.type === 'kpi' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 block mb-1">目標値</label>
                <input type="number" value={form.targetValue} onChange={e => set({ targetValue: e.target.value })}
                  placeholder="例: 1200000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">単位</label>
                <input value={form.unit} onChange={e => set({ unit: e.target.value })}
                  placeholder="円"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
          )}

          {/* 行動目標 マイルストーン */}
          {form.type === 'action' && (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">マイルストーン（達成ステップ）</label>
              <div className="space-y-2">
                {form.milestoneInputs.map((ms, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">STEP {i + 1}</span>
                    <input value={ms}
                      onChange={e => {
                        const next = [...form.milestoneInputs]
                        next[i] = e.target.value
                        set({ milestoneInputs: next })
                      }}
                      placeholder={`ステップ${i + 1}の内容`}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                ))}
              </div>
              {form.milestoneInputs.length < 6 && (
                <button onClick={() => set({ milestoneInputs: [...form.milestoneInputs, ''] })}
                  className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-bold">
                  ＋ ステップを追加
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={handleSubmit} disabled={!canSubmit}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
              canSubmit ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            目標を登録
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AI提案バナー ─────────────────────────────────────────────────────────
function AISuggestPanel({
  members, profiles, onAccept,
}: {
  members: typeof DEFAULT_MEMBERS
  profiles: MemberProfile[]
  onAccept: (goals: Omit<Goal, 'id' | 'createdAt' | 'status'>[]) => void
}) {
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [suggestions, setSuggestions] = useState<Omit<Goal, 'id' | 'createdAt' | 'status'>[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? '')
  const [period, setPeriod]     = useState<GoalPeriod>('monthly')
  const [error, setError]       = useState('')

  const suggest = async () => {
    setLoading(true)
    setError('')
    setSuggestions([])
    setSelected(new Set())
    const assignee = members.find(m => m.id === assigneeId)!
    // プロフィールをpropsから取得してAPIに送る
    const profile = profiles.find(p => p.memberId === assigneeId)
    try {
      const res = await fetch('/api/suggest-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeName: assignee.name,
          period,
          profile: profile ? {
            jobTitle:   profile.jobTitle,
            joinedDate: profile.joinedDate,
            strengths:  profile.strengths,
            challenges: profile.challenges,
            notes:      profile.notes,
          } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? 'エラーが発生しました'); return }
      // APIの提案をGoal形式に変換
      const goals: Omit<Goal, 'id' | 'createdAt' | 'status'>[] = data.goals.map((g: {
        type: 'kpi' | 'action'
        title: string
        description?: string
        targetValue?: number
        unit?: string
        milestones?: string[]
      }) => ({
        type: g.type,
        title: g.title,
        description: g.description,
        assigneeId,
        assigneeName: assignee.name,
        period,
        ...(g.type === 'kpi'
          ? { targetValue: g.targetValue, currentValue: 0, unit: g.unit }
          : { milestones: (g.milestones ?? []).map((text: string) => ({ id: uid(), text, done: false })) }
        ),
      }))
      setSuggestions(goals)
      setSelected(new Set(goals.map((_, i) => i)))
    } catch (e) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleSel = (i: number) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm">
        ✨ AIが目標を提案
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-violet-800">✨ AI目標提案</p>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
            className="w-full border border-violet-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
            {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
          </select>
          {(() => {
            const p = profiles.find(prof => prof.memberId === assigneeId)
            const filled = p && (p.strengths || p.challenges || p.notes)
            return filled
              ? <p className="text-[10px] text-violet-600 mt-1 pl-1">✅ プロフィール登録済み — 個別最適な提案が可能</p>
              : <p className="text-[10px] text-gray-400 mt-1 pl-1">💡 プロフィールを入力するとより個別な提案になります</p>
          })()}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value as GoalPeriod)}
          className="flex-1 min-w-[120px] border border-violet-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
          {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={suggest} disabled={loading}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
          {loading ? '生成中…' : '提案する'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {suggestions.length > 0 && (
        <>
          <p className="text-xs text-violet-700 font-medium">採用する目標にチェックを入れてください：</p>
          <div className="space-y-2">
            {suggestions.map((g, i) => (
              <button key={i} onClick={() => toggleSel(i)}
                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                  selected.has(i) ? 'border-violet-400 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{selected.has(i) ? '✅' : '⬜'}</span>
                  <span className="text-sm">{g.type === 'kpi' ? '📈' : '🎯'}</span>
                  <p className="text-sm font-bold text-gray-800 flex-1">{g.title}</p>
                </div>
                {g.description && <p className="text-[11px] text-gray-500 mt-1 pl-9">{g.description}</p>}
                {g.type === 'kpi' && (
                  <p className="text-[10px] text-indigo-600 mt-1 pl-9 font-bold">
                    目標: {(g.targetValue ?? 0).toLocaleString()}{g.unit}
                  </p>
                )}
                {g.type === 'action' && (g.milestones ?? []).length > 0 && (
                  <div className="mt-1 pl-9 space-y-0.5">
                    {(g.milestones ?? []).map((ms: Milestone, mi: number) => (
                      <p key={ms.id} className="text-[10px] text-gray-500">STEP {mi + 1}: {ms.text}</p>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => { onAccept(suggestions.filter((_, i) => selected.has(i))); setOpen(false); setSuggestions([]) }}
            disabled={selected.size === 0}
            className="w-full py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
            選択した{selected.size}件の目標を登録
          </button>
        </>
      )}
    </div>
  )
}

const J = (b: object) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

// ─── メインページ ─────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [goals, setGoals]             = useState<Goal[]>([])
  const [profiles, setProfiles]       = useState<MemberProfile[]>([])
  const [showAdd, setShowAdd]         = useState(false)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPeriod, setFilterPeriod]     = useState<GoalPeriod | 'all'>('all')
  const [filterStatus, setFilterStatus]     = useState<GoalStatus | 'all'>('active')

  // Notion から読込み（全端末で共有）
  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => setGoals(d.goals ?? []))
      .catch(() => {})
      .finally(() => setLoadingGoals(false))
    fetch('/api/profiles')
      .then(r => r.json())
      .then(d => setProfiles(d.profiles ?? []))
      .catch(() => {})
  }, [])

  // メンバー一覧（固定）
  const members = DEFAULT_MEMBERS

  const addGoals = useCallback(async (defs: Omit<Goal, 'id' | 'createdAt' | 'status'>[]) => {
    for (const d of defs) {
      const tempId = `temp_${uid()}`
      const newGoal: Goal = { ...d, id: tempId, createdAt: new Date().toISOString(), status: 'active' }
      setGoals(prev => [...prev, newGoal])
      const res = await fetch('/api/goals', J(newGoal))
      const data = await res.json()
      if (data.goal) setGoals(prev => prev.map(g => g.id === tempId ? data.goal : g))
    }
  }, [])

  const updateKpiValue = async (id: string, val: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentValue: val } : g))
    await fetch('/api/goals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, currentValue: val }) })
  }

  const toggleMilestone = async (goalId: string, msId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g
      const milestones = g.milestones?.map(m => m.id === msId ? { ...m, done: !m.done } : m)
      return { ...g, milestones }
    }))
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const milestones = goal.milestones?.map(m => m.id === msId ? { ...m, done: !m.done } : m)
    await fetch('/api/goals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: goalId, milestones }) })
  }

  const toggleStatus = async (id: string) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const status = goal.status === 'completed' ? 'active' : 'completed'
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status } : g))
    await fetch('/api/goals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
  }

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    await fetch('/api/goals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  // フィルタ
  const filtered = goals.filter(g =>
    (filterAssignee === 'all' || g.assigneeId === filterAssignee) &&
    (filterPeriod   === 'all' || g.period === filterPeriod) &&
    (filterStatus   === 'all' || g.status === filterStatus)
  )

  // 担当者ごとにグループ化
  const grouped = members
    .map(m => ({
      member: m,
      goals: filtered.filter(g => g.assigneeId === m.id),
    }))
    .filter(g => g.goals.length > 0)

  const totalActive    = goals.filter(g => g.status === 'active').length
  const totalCompleted = goals.filter(g => g.status === 'completed').length
  const avgProgress    = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + calcProgress(g), 0) / goals.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* ── ヘッダー ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1 transition-colors">
          ← ダッシュボードへ
        </Link>
        <div className="w-px h-5 bg-gray-200" />
        <h1 className="text-lg font-black text-gray-800">🎯 目標管理</h1>
        <p className="text-xs text-gray-400">はくりゅう 2号店出店プロジェクト</p>
        <div className="ml-auto flex items-center gap-3">
          <AISuggestPanel members={members} profiles={profiles} onAccept={addGoals} />
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
            ＋ 目標を追加
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── サマリー ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '進行中の目標', value: totalActive,    color: '#6366f1', icon: '🎯' },
            { label: '達成済み',    value: totalCompleted,  color: '#10b981', icon: '✅' },
            { label: '平均進捗率',  value: `${avgProgress}%`, color: '#f59e0b', icon: '📊' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── フィルター ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-wrap gap-3 shadow-sm">
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">全担当者</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
          </select>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value as GoalPeriod | 'all')}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">全期間</option>
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {([['all', '全て'], ['active', '進行中'], ['completed', '達成済み']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  filterStatus === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}>
                {l}
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length}件表示中</span>
          )}
        </div>

        {/* ── 読込中 ── */}
        {loadingGoals && (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-4xl">🎯</div>
          </div>
        )}

        {/* ── 目標なし ── */}
        {!loadingGoals && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">🎯</div>
            <p className="text-gray-500 font-bold mb-2">まだ目標が設定されていません</p>
            <p className="text-sm text-gray-400 mb-6">「AIが目標を提案」ボタンで店舗情報をもとにした目標案を自動生成できます</p>
            <button onClick={() => setShowAdd(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              最初の目標を追加する
            </button>
          </div>
        )}

        {/* ── 担当者別グループ ── */}
        {grouped.map(({ member, goals: memberGoals }) => (
          <section key={member.id} className="space-y-3">
            <AssigneeBadge name={member.name} color={member.color} emoji={member.emoji} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberGoals.map(goal =>
                goal.type === 'kpi' ? (
                  <KpiCard
                    key={goal.id} goal={goal}
                    onUpdateValue={updateKpiValue}
                    onToggleStatus={toggleStatus}
                    onDelete={deleteGoal}
                  />
                ) : (
                  <ActionCard
                    key={goal.id} goal={goal}
                    onToggleMilestone={toggleMilestone}
                    onToggleStatus={toggleStatus}
                    onDelete={deleteGoal}
                  />
                )
              )}
            </div>
          </section>
        ))}

        {/* フィルタ中でヒットなし */}
        {goals.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2 opacity-30">🔍</p>
            <p>条件に合う目標が見つかりません</p>
          </div>
        )}
      </main>

      {/* 追加モーダル */}
      {showAdd && (
        <AddGoalForm
          members={members}
          onAdd={defs => { addGoals([defs]); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
