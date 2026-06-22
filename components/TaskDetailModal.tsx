'use client'

import type { AIAgent, Task, TaskStatus } from '@/lib/types'

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

export default function TaskDetailModal({ task, agents, onUpdateStatus, onDelete, onClose }: Props) {
  const agent = agents.find(a => a.id === task.assigneeId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in"
      onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden fade-in max-h-[90vh] flex flex-col"
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

            {/* Change history */}
            {task.history && task.history.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  🕐 変更履歴 <span className="text-gray-400 font-normal normal-case">({task.history.length}件)</span>
                </p>
                <div className="space-y-2">
                  {[...task.history].reverse().map((h, i) => (
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
