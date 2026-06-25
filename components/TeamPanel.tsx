'use client'

import { useState } from 'react'
import type { AIAgent, Task, HumanMember } from '@/lib/types'

const MEMBER_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']
const MEMBER_EMOJIS = ['👤','👩','👨','🧑','👩‍💼','👨‍💼','🧑‍🍳','👩‍🍳']
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,6)}` }

interface Props {
  agents: AIAgent[]
  tasks: Task[]
  humanMembers: HumanMember[]
  onAddHuman: (member: HumanMember) => void
  onDeleteHuman: (id: string) => void
}

export default function TeamPanel({ agents, tasks, humanMembers, onAddHuman, onDeleteHuman }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [role, setRole]         = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [emojiIdx, setEmojiIdx] = useState(0)

  const handleAdd = () => {
    if (!name.trim()) return
    onAddHuman({
      id: uid(),
      name: name.trim(),
      role: role.trim() || '担当者',
      color: MEMBER_COLORS[colorIdx],
      emoji: MEMBER_EMOJIS[emojiIdx],
    })
    setName(''); setRole(''); setShowForm(false)
  }

  return (
    <div className="w-44 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 bg-gray-50">
        <h2 className="text-[11px] font-bold text-gray-700">👥 チーム</h2>
        <p className="text-[9px] text-gray-400">AI {agents.length}名 · 人物 {humanMembers.length}名</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* AI agents */}
        {agents.map(agent => {
          const agentTasks = tasks.filter(t => t.assigneeId === agent.id)
          const inProgress = agentTasks.filter(t => t.status === '進行中').length
          const done = agentTasks.filter(t => t.status === '完了').length
          const activeTasks = agentTasks.filter(t => t.status !== '完了')
          const pct = agentTasks.length > 0 ? Math.round((done / agentTasks.length) * 100) : 0

          return (
            <div key={agent.id} className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-2.5 py-2" style={{ backgroundColor: agent.bgLight }}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: agent.color }}>
                  {agent.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-gray-900 truncate">{agent.name}</span>
                    {agent.isAudit && (
                      <span className="text-[7px] bg-red-100 text-red-600 px-1 py-0.5 rounded-full font-bold flex-shrink-0">監査</span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500 truncate">{agent.role}</p>
                </div>
              </div>
              <div className="px-2.5 py-2 bg-white">
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="text-gray-400">タスク {agentTasks.length}件</span>
                  <span className="text-green-600 font-bold">{pct}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 text-[9px]">
                  {inProgress > 0 && <span className="text-blue-600 font-semibold">🔵{inProgress}</span>}
                  {done > 0 && <span className="text-green-600 font-semibold">✅{done}</span>}
                </div>
                {activeTasks.slice(0, 1).map(t => (
                  <p key={t.id} className="text-[9px] text-gray-500 mt-1 truncate leading-tight">
                    {t.status === '進行中' ? '▶' : '○'} {t.title}
                  </p>
                ))}
                {activeTasks.length > 1 && (
                  <p className="text-[8px] text-gray-400">他{activeTasks.length - 1}件</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Divider + human members section */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-bold text-gray-500">👤 登録メンバー</p>
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-[8px] text-indigo-500 hover:text-indigo-700 font-bold transition-colors"
            >
              {showForm ? '✕' : '＋'}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="bg-indigo-50 rounded-xl p-2.5 mb-2 space-y-2 border border-indigo-100">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="名前"
                className="w-full border border-indigo-200 rounded-lg px-2 py-1 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="役割（例：店長）"
                className="w-full border border-indigo-200 rounded-lg px-2 py-1 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              {/* Color picker */}
              <div>
                <p className="text-[8px] text-gray-500 mb-1">カラー</p>
                <div className="flex flex-wrap gap-1">
                  {MEMBER_COLORS.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => setColorIdx(i)}
                      className={`w-4 h-4 rounded-full transition-all ${colorIdx === i ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              {/* Emoji picker */}
              <div>
                <p className="text-[8px] text-gray-500 mb-1">アイコン</p>
                <div className="flex flex-wrap gap-1">
                  {MEMBER_EMOJIS.map((e, i) => (
                    <button
                      key={e}
                      onClick={() => setEmojiIdx(i)}
                      className={`text-sm w-6 h-6 rounded-lg flex items-center justify-center transition-all ${emojiIdx === i ? 'bg-indigo-200 ring-1 ring-indigo-400' : 'bg-white'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="w-full py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                追加する
              </button>
            </div>
          )}

          {/* Human member list */}
          {humanMembers.length === 0 && !showForm && (
            <p className="text-[9px] text-gray-400 text-center py-2">
              ＋ からメンバーを登録
            </p>
          )}
          {humanMembers.map(m => (
            <div key={m.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-gray-100 bg-white mb-1.5 group shadow-sm">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm"
                style={{ backgroundColor: m.color + '22' }}
              >
                {m.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900 truncate">{m.name}</p>
                <p className="text-[9px] text-gray-500 truncate">{m.role}</p>
              </div>
              <button
                onClick={() => onDeleteHuman(m.id)}
                className="opacity-0 group-hover:opacity-100 text-[9px] text-red-400 hover:text-red-600 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
