'use client'

import { useState } from 'react'
import type { AIAgent, Task, TaskStatus } from '@/lib/types'

interface AnalysisRound {
  model: 'GPT' | 'Gemini' | 'Claude'
  role: string
  perspective: string
  content: string
}

interface Props {
  task: Task
  agents: AIAgent[]
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onDelete: (taskId: string) => void
  onClose: () => void
}

const STATUSES: TaskStatus[] = ['未着手', '進行中', '完了', '保留']

const STATUS_STYLE: Record<TaskStatus, string> = {
  '未着手': 'bg-gray-100 text-gray-600 border-gray-200',
  '進行中': 'bg-blue-50 text-blue-700 border-blue-200',
  '完了':   'bg-green-50 text-green-700 border-green-200',
  '保留':   'bg-amber-50 text-amber-700 border-amber-200',
}

const PRIORITY_STYLE: Record<string, string> = {
  '高': 'bg-red-100 text-red-700',
  '中': 'bg-amber-100 text-amber-700',
  '低': 'bg-gray-100 text-gray-600',
}

const TIMEFRAME_LABEL: Record<string, string> = {
  week: '今週', month: '今月', year: '今年',
}

const STATUS_ARROW: Record<TaskStatus, string> = {
  '未着手': '⚪', '進行中': '🔵', '完了': '✅', '保留': '🟡',
}

const MODEL_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  GPT:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Gemini: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  Claude: { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
}

const MODEL_EMOJI: Record<string, string> = {
  GPT: '🟢', Gemini: '🔵', Claude: '🟠',
}

export default function TaskDetailModal({ task, agents, onUpdateStatus, onDelete, onClose }: Props) {
  const agent = agents.find(a => a.id === task.assigneeId)
  const [analysis, setAnalysis]   = useState<AnalysisRound[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed]   = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          content: task.description || `ステータス: ${task.status}、優先度: ${task.priority}`,
          type: 'task',
        }),
      })
      const data = await res.json()
      if (data.rounds) {
        setAnalysis(data.rounds)
        setAnalyzed(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in"
      onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden fade-in max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-3 flex-shrink-0" style={{ backgroundColor: agent?.bgLight ?? '#f8fafc' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm mt-0.5"
            style={{ backgroundColor: agent?.color ?? '#94a3b8' }}>
            {agent?.initials ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-0.5" style={{ color: agent?.color ?? '#64748b' }}>
              {agent?.name ?? '未割当'} — {agent?.role}
            </p>
            <h2 className="text-sm font-bold text-gray-900 leading-snug">{task.title}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/60 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 flex-shrink-0 transition-colors">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">

            {/* Status row */}
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">ステータス</p>
              <div className="flex gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => onUpdateStatus(task.id, s)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      task.status === s
                        ? STATUS_STYLE[s] + ' border-current shadow-sm scale-105'
                        : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">優先度</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[task.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                  {task.priority}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">期間</p>
                <span className="text-xs font-bold text-gray-700">{TIMEFRAME_LABEL[task.timeframe] ?? task.timeframe}</span>
              </div>
              {task.dueDate && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">期限日</p>
                  <span className="text-xs font-semibold text-gray-700">📅 {task.dueDate}</span>
                </div>
              )}
              {task.category && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">カテゴリ</p>
                  <span className="text-xs font-semibold text-gray-700">{task.category}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description ? (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">詳細・メモ</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{task.description}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400">詳細メモなし</div>
            )}

            {/* Completion note */}
            {task.completionNote && (
              <div>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">✅ 完了メモ</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-green-50 border border-green-200 rounded-xl p-3">
                  {task.completionNote}
                </p>
              </div>
            )}

            {/* AI Analysis section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">🤖 AIマルチ分析</p>
                {!analyzed && (
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="text-[10px] font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {analyzing ? (
                      <>
                        <span className="animate-pulse">●</span> 分析中...
                      </>
                    ) : '▶ 全AIで多角分析'}
                  </button>
                )}
                {analyzed && (
                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    🔄 再分析
                  </button>
                )}
              </div>

              {analysis.length === 0 && !analyzing && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    このタスクについて、GPT・Gemini・Claudeが<br />
                    それぞれ異なる視点から分析します
                  </p>
                  <p className="text-[10px] text-gray-300 mt-1">
                    📊 市場分析 / ⚠️ リスク / ✅ アクション提案
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="space-y-2">
                  {['GPT', 'Gemini', 'Claude'].map(m => (
                    <div key={m} className="bg-gray-50 rounded-xl p-3 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <div className="h-2.5 bg-gray-200 rounded w-16" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.length > 0 && (
                <div className="space-y-2.5">
                  {analysis.map((round, i) => {
                    const c = MODEL_COLOR[round.model] ?? MODEL_COLOR.GPT
                    return (
                      <div key={i} className={`rounded-xl p-3 border ${c.bg} ${c.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                          <span className={`text-[10px] font-bold ${c.text}`}>
                            {MODEL_EMOJI[round.model]} {round.model} — {round.role}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full bg-white/60 ${c.text} ml-auto`}>
                            {round.perspective}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {round.content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Change history */}
            {task.history && task.history.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  🕐 変更履歴 <span className="text-gray-400 font-normal normal-case">({task.history.length}件)</span>
                </p>
                <div className="space-y-2">
                  {[...task.history].reverse().map((h) => (
                    <div key={h.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] text-gray-400">{h.date}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-[10px] font-semibold text-gray-500">{STATUS_ARROW[h.fromStatus]} {h.fromStatus}</span>
                          <span className="text-[9px] text-gray-400">→</span>
                          <span className="text-[10px] font-semibold text-gray-700">{STATUS_ARROW[h.toStatus]} {h.toStatus}</span>
                        </div>
                      </div>
                      {h.note && (
                        <p className="text-xs text-gray-600 leading-relaxed mt-1 pl-2 border-l-2 border-green-300">{h.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0 flex-shrink-0">
          <button
            onClick={() => { onDelete(task.id); onClose() }}
            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
            🗑 削除
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
