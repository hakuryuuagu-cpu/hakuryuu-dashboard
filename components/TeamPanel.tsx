'use client'

import type { AIAgent, Task } from '@/lib/types'

interface Props {
  agents: AIAgent[]
  tasks: Task[]
}

export default function TeamPanel({ agents, tasks }: Props) {
  return (
    <div className="w-44 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 bg-gray-50">
        <h2 className="text-[11px] font-bold text-gray-700">👥 チーム</h2>
        <p className="text-[9px] text-gray-400">{agents.length}名</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {agents.map(agent => {
          const agentTasks = tasks.filter(t => t.assigneeId === agent.id)
          const inProgress = agentTasks.filter(t => t.status === '進行中').length
          const done = agentTasks.filter(t => t.status === '完了').length
          const activeTasks = agentTasks.filter(t => t.status !== '完了')
          const pct = agentTasks.length > 0 ? Math.round((done / agentTasks.length) * 100) : 0

          return (
            <div key={agent.id} className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Header */}
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

              {/* Stats compact */}
              <div className="px-2.5 py-2 bg-white">
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="text-gray-400">タスク {agentTasks.length}件</span>
                  <span className="text-green-600 font-bold">{pct}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }} />
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
      </div>
    </div>
  )
}
