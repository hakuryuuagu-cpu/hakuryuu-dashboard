'use client'

import type { AIAgent, Task } from '@/lib/types'

interface Props {
  agents: AIAgent[]
  tasks: Task[]
}

export default function TeamPanel({ agents, tasks }: Props) {
  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50">
        <h2 className="text-xs font-bold text-gray-700">👥 チームメンバー</h2>
        <p className="text-[10px] text-gray-400 mt-0.5">{agents.length}名が参加中</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agents.map(agent => {
          const agentTasks = tasks.filter(t => t.assigneeId === agent.id)
          const inProgress = agentTasks.filter(t => t.status === '進行中').length
          const done = agentTasks.filter(t => t.status === '完了').length
          const pending = agentTasks.filter(t => t.status === '未着手').length
          const held = agentTasks.filter(t => t.status === '保留').length
          const activeTasks = agentTasks.filter(t => t.status !== '完了')

          return (
            <div key={agent.id} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

              {/* Header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ backgroundColor: agent.bgLight }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: agent.color }}>
                  {agent.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-sm leading-none">{agent.emoji}</span>
                    <span className="text-xs font-bold text-gray-900 truncate">{agent.name}</span>
                    {agent.isAudit && (
                      <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">監査</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{agent.role}</p>
                </div>
              </div>

              {/* Description */}
              <div className="px-3 py-2 bg-white border-t border-gray-100">
                <p className="text-[10px] text-gray-600 leading-relaxed">{agent.description}</p>
              </div>

              {/* Specialties */}
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {agent.specialties.map(s => (
                  <span key={s}
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: agent.color + 'cc' }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* Task Stats */}
              <div className="mx-3 mb-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  担当タスク {agentTasks.length}件
                </p>

                {agentTasks.length === 0 ? (
                  <p className="text-[10px] text-gray-400">タスクなし</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 text-[10px] mb-2">
                      {inProgress > 0 && (
                        <span className="flex items-center gap-0.5 text-blue-600 font-semibold">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          進行中 {inProgress}
                        </span>
                      )}
                      {pending > 0 && (
                        <span className="flex items-center gap-0.5 text-gray-500">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          未着手 {pending}
                        </span>
                      )}
                      {done > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          完了 {done}
                        </span>
                      )}
                      {held > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          保留 {held}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${agentTasks.length > 0 ? (done / agentTasks.length) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Active tasks preview */}
                    {activeTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-start gap-1.5 mt-1">
                        <span className="text-[9px] mt-0.5">
                          {t.status === '進行中' ? '🔵' : t.status === '保留' ? '🟡' : '⚪'}
                        </span>
                        <p className="text-[10px] text-gray-700 leading-tight truncate">{t.title}</p>
                      </div>
                    ))}
                    {activeTasks.length > 2 && (
                      <p className="text-[9px] text-gray-400 mt-1">他 {activeTasks.length - 2}件...</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
