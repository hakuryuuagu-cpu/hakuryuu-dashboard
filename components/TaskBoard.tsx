'use client'

import { useState } from 'react'
import type { AIAgent, Task, TaskTimeframe, TaskStatus } from '@/lib/types'
import TaskDetailModal from './TaskDetailModal'

interface Props {
  agents: AIAgent[]
  tasks: Task[]
  onAddTask: (timeframe: TaskTimeframe) => void
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onDeleteTask: (taskId: string) => void
}

const TIMEFRAMES: { key: TaskTimeframe; label: string; emoji: string; hdr: string; bg: string; border: string; btn: string; progress: string }[] = [
  { key: 'week',  label: '今週',  emoji: '📅', hdr: 'bg-indigo-600', bg: 'bg-indigo-50/60', border: 'border-indigo-200', btn: 'bg-indigo-600 hover:bg-indigo-700', progress: 'bg-indigo-500' },
  { key: 'month', label: '今月',  emoji: '📆', hdr: 'bg-sky-600',    bg: 'bg-sky-50/60',    border: 'border-sky-200',    btn: 'bg-sky-600 hover:bg-sky-700',    progress: 'bg-sky-500'    },
  { key: 'year',  label: '今年',  emoji: '🗓️', hdr: 'bg-violet-600', bg: 'bg-violet-50/60', border: 'border-violet-200', btn: 'bg-violet-600 hover:bg-violet-700', progress: 'bg-violet-500' },
]

const STATUSES: TaskStatus[] = ['未着手', '進行中', '完了', '保留']

const STATUS_STYLE: Record<TaskStatus, string> = {
  '未着手': 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  '進行中': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  '完了':   'bg-green-100 text-green-700 hover:bg-green-200',
  '保留':   'bg-amber-100 text-amber-700 hover:bg-amber-200',
}

const PRIORITY_DOT: Record<string, string> = {
  '高': 'bg-red-500',
  '中': 'bg-amber-400',
  '低': 'bg-gray-300',
}

export default function TaskBoard({ agents, tasks, onAddTask, onUpdateStatus, onDeleteTask }: Props) {
  const [hoveredId, setHoveredId]     = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const getAgent = (id: string) => agents.find(a => a.id === id)

  const nextStatus = (cur: TaskStatus): TaskStatus =>
    STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length]

  return (
    <>
      <div className="flex-1 flex gap-3 p-4 overflow-hidden min-w-0">
        {TIMEFRAMES.map(tf => {
          const col  = tasks.filter(t => t.timeframe === tf.key)
          const done = col.filter(t => t.status === '完了').length
          const pct  = col.length > 0 ? Math.round((done / col.length) * 100) : 0

          return (
            <div key={tf.key}
              className={`flex-1 flex flex-col rounded-2xl border ${tf.border} overflow-hidden shadow-sm min-w-0`}>

              {/* Column header */}
              <div className={`${tf.hdr} px-4 py-3 flex items-center gap-2 flex-shrink-0`}>
                <span className="text-xl">{tf.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight">{tf.label}</h3>
                  <p className="text-white/70 text-[10px]">
                    {col.length}件 · 完了{done}件 · {pct}%
                  </p>
                </div>
                <button onClick={() => onAddTask(tf.key)}
                  className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 flex items-center justify-center text-white font-bold transition-colors flex-shrink-0"
                  title="タスク追加">
                  ＋
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/60 flex-shrink-0">
                <div className={`h-full ${tf.progress} transition-all duration-500`}
                  style={{ width: `${pct}%` }} />
              </div>

              {/* Task list */}
              <div className={`flex-1 overflow-y-auto p-2.5 space-y-2 ${tf.bg}`}>
                {col.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-3xl mb-2 opacity-40">{tf.emoji}</div>
                    <p className="text-xs text-gray-400">タスクがありません</p>
                    <button onClick={() => onAddTask(tf.key)}
                      className="mt-2.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                      ＋ 追加する
                    </button>
                  </div>
                ) : (
                  col.map(task => {
                    const agent = getAgent(task.assigneeId)
                    const isDone = task.status === '完了'
                    const isHov  = hoveredId === task.id

                    return (
                      <div key={task.id}
                        className={`bg-white rounded-xl border border-gray-100 p-3 transition-all cursor-pointer ${
                          isDone
                            ? 'opacity-60 hover:opacity-100 hover:shadow-md hover:-translate-y-0.5 ring-1 ring-green-200'
                            : 'hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        onClick={() => setSelectedTask(task)}
                        onMouseEnter={() => setHoveredId(task.id)}
                        onMouseLeave={() => setHoveredId(null)}>

                        {/* Title row */}
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`}
                            title={`優先度: ${task.priority}`} />
                          <p className={`flex-1 text-xs font-semibold text-gray-900 leading-snug ${isDone ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          {/* Delete button — stop propagation so it doesn't open modal */}
                          {isHov && (
                            <button
                              onClick={e => { e.stopPropagation(); onDeleteTask(task.id) }}
                              className="w-5 h-5 flex-shrink-0 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-[9px] font-bold transition-colors"
                              title="削除">✕</button>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2 pl-4">
                            {task.description}
                          </p>
                        )}

                        {/* Assignee + Status */}
                        <div className="flex items-center gap-2 mt-2 pl-4">
                          {agent ? (
                            <div className="flex items-center gap-1 min-w-0">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                                style={{ backgroundColor: agent.color }}>
                                {agent.initials}
                              </div>
                              <span className="text-[10px] text-gray-600 truncate">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">未割当</span>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); onUpdateStatus(task.id, nextStatus(task.status)) }}
                            className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${STATUS_STYLE[task.status]}`}
                            title="クリックでステータス変更">
                            {task.status}
                          </button>
                        </div>

                        {/* Category + Due */}
                        {(task.category || task.dueDate) && (
                          <div className="flex items-center gap-2 mt-1.5 pl-4">
                            {task.category && (
                              <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{task.category}</span>
                            )}
                            {task.dueDate && (
                              <span className={`text-[9px] ml-auto ${new Date(task.dueDate) < new Date() && !isDone ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                📅 {task.dueDate}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Completed hint */}
                        {isDone && isHov && (
                          <p className="text-[9px] text-green-600 mt-1.5 pl-4 font-medium">
                            タップして詳細を確認 →
                          </p>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add button */}
              <div className={`flex-shrink-0 p-2.5 border-t ${tf.border} bg-white/80`}>
                <button onClick={() => onAddTask(tf.key)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold text-white transition-colors shadow-sm ${tf.btn}`}>
                  ＋ タスクを追加
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          agents={agents}
          onUpdateStatus={(id, status) => {
            onUpdateStatus(id, status)
            setSelectedTask(prev => prev ? { ...prev, status } : null)
          }}
          onDelete={id => { onDeleteTask(id); setSelectedTask(null) }}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  )
}
