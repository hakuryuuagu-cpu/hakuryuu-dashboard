'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  INITIAL_AI_AGENTS, INITIAL_TASK_DATA, INITIAL_PHILOSOPHY,
  AGENT_ACTIVITIES, QA_TEMPLATES,
} from '@/lib/constants'
import type {
  AIAgent, AIDeliberation, Task, TaskStatus, TaskTimeframe, TaskHistoryEntry,
  Philosophy, ActivityMessage, MinutesEntry, QAEntry, QAResponse,
  DiscussionRound, QAInsights,
} from '@/lib/types'
import PhilosophyBanner from './PhilosophyBanner'
import TeamPanel from './TeamPanel'
import TaskBoard from './TaskBoard'
import AddTaskModal from './AddTaskModal'
import AddAgentModal from './AddAgentModal'
import RightPanel from './RightPanel'
import CompleteTaskModal from './CompleteTaskModal'

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export default function VirtualOffice() {
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AI_AGENTS)
  const [tasks, setTasks] = useState<Task[]>(() =>
    INITIAL_TASK_DATA.map(t => ({ ...t, createdAt: new Date() }))
  )
  const [philosophy, setPhilosophy] = useState<Philosophy>(INITIAL_PHILOSOPHY)
  const [activityMessages, setActivityMessages] = useState<ActivityMessage[]>([])
  const [minutes, setMinutes] = useState<MinutesEntry[]>([])
  const [qaEntries, setQaEntries] = useState<QAEntry[]>([])
  const [showAddTask, setShowAddTask]   = useState(false)
  const [defaultTF, setDefaultTF]       = useState<TaskTimeframe>('week')
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [showEditPhil, setShowEditPhil] = useState(false)
  const [pendingComplete, setPendingComplete] = useState<{ taskId: string; taskTitle: string } | null>(null)

  const agentsRef   = useRef(agents)
  agentsRef.current = agents
  const msgIdxRef   = useRef(0)
  const minBufRef   = useRef<ActivityMessage[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentAgents = agentsRef.current
      if (currentAgents.length === 0) return
      const agent = currentAgents[msgIdxRef.current % currentAgents.length]
      msgIdxRef.current++
      const lines = AGENT_ACTIVITIES[agent.id] ?? []
      if (lines.length === 0) return
      const msg: ActivityMessage = {
        id: uid(), agentId: agent.id, agentName: agent.name,
        agentColor: agent.color, agentInitials: agent.initials,
        content: pickRandom(lines), timestamp: new Date(), isAudit: agent.isAudit,
      }
      setActivityMessages(prev => [...prev.slice(-80), msg])
      minBufRef.current = [...minBufRef.current, msg]
      if (msgIdxRef.current % 6 === 0 && minBufRef.current.length >= 3) {
        const buf = minBufRef.current.slice(-6)
        const participants = [...new Set(buf.map(m => m.agentName))]
        const highlights   = buf.filter(m => m.isAudit).map(m => m.content)
        const entry: MinutesEntry = {
          id: uid(),
          date: new Date().toLocaleDateString('ja-JP'),
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          participants,
          summary: `${participants.join('・')}が業務報告を実施。各部門の進捗と課題を共有。`,
          highlights: highlights.slice(0, 2),
          createdAt: new Date(),
        }
        setMinutes(prev => [entry, ...prev.slice(0, 19)])
        minBufRef.current = []
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleOpenAddTask = useCallback((tf: TaskTimeframe) => {
    setDefaultTF(tf); setShowAddTask(true)
  }, [])

  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...task, id: uid(), createdAt: new Date() }])
    setShowAddTask(false)
  }, [])

  const handleUpdateStatus = useCallback((taskId: string, status: TaskStatus) => {
    if (status === '完了') {
      setTasks(prev => {
        const task = prev.find(t => t.id === taskId)
        if (task) setPendingComplete({ taskId, taskTitle: task.title })
        return prev
      })
      return
    }
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const h: TaskHistoryEntry = {
        id: uid(),
        date: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        fromStatus: t.status,
        toStatus: status,
      }
      return { ...t, status, history: [...(t.history ?? []), h] }
    }))
  }, [])

  const handleCompleteTask = useCallback((note: string) => {
    if (!pendingComplete) return
    const { taskId } = pendingComplete
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const h: TaskHistoryEntry = {
        id: uid(),
        date: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        fromStatus: t.status,
        toStatus: '完了',
        note: note || undefined,
      }
      return { ...t, status: '完了', completionNote: note || t.completionNote, history: [...(t.history ?? []), h] }
    }))
    setPendingComplete(null)
  }, [pendingComplete])

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const handleAddAgent = useCallback((name: string, role: string, emoji: string, color: string) => {
    const newAgent: AIAgent = {
      id: `custom_${uid()}`, name, role, color, bgLight: color + '22', emoji,
      initials: name.slice(0, 1), isCustom: true,
      description: `${role}担当として業務を遂行します。`, specialties: [role],
    }
    setAgents(prev => [...prev, newAgent])
    setShowAddAgent(false)
  }, [])

  const handleQASubmit = useCallback((topic: string) => {
    const entry: QAEntry = { id: uid(), topic, responses: [], createdAt: new Date() }
    setQaEntries(prev => [entry, ...prev])
    const currentAgents = agentsRef.current

    ;(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agents: currentAgents.map(a => ({
              id: a.id, name: a.name, role: a.role, specialties: a.specialties, isAudit: !!a.isAudit,
            })),
            topic,
          }),
        })
        const data = await res.json()

        if (res.ok && Array.isArray(data.responses)) {
          setQaEntries(prev => prev.map(e => e.id === entry.id ? {
            ...e,
            discussion: (data.discussion ?? []) as DiscussionRound[],
            insights: data.insights as QAInsights | undefined,
          } : e))

          data.responses.forEach((r: { agentId: string; content: string; deliberation?: { model: string; text: string }[] }, i: number) => {
            const agent = currentAgents.find(a => a.id === r.agentId)
            if (!agent) return
            setTimeout(() => {
              const response: QAResponse = {
                agentId: agent.id, agentName: agent.name,
                agentColor: agent.color, agentInitials: agent.initials,
                content: r.content, type: agent.isAudit ? 'risk' : 'opinion',
                isAudit: agent.isAudit,
                deliberation: r.deliberation as AIDeliberation[] | undefined,
              }
              setQaEntries(prev =>
                prev.map(e => e.id === entry.id ? { ...e, responses: [...e.responses, response] } : e)
              )
            }, i * 500)
          })
        } else {
          throw new Error(data.error ?? 'エラー')
        }
      } catch {
        currentAgents.forEach((agent, i) => {
          setTimeout(() => {
            const templates = QA_TEMPLATES[agent.id] ?? QA_TEMPLATES._default ?? []
            const content = pickRandom(templates).replace(/\{topic\}/g, topic)
            const response: QAResponse = {
              agentId: agent.id, agentName: agent.name,
              agentColor: agent.color, agentInitials: agent.initials,
              content, type: agent.isAudit ? 'risk' : 'opinion', isAudit: agent.isAudit,
            }
            setQaEntries(prev =>
              prev.map(e => e.id === entry.id ? { ...e, responses: [...e.responses, response] } : e)
            )
          }, i * 400)
        })
      }
    })()
  }, [])

  const total  = tasks.length
  const inProg = tasks.filter(t => t.status === '進行中').length
  const done   = tasks.filter(t => t.status === '完了').length

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">AIチーム ダッシュボード</h1>
            <p className="text-[10px] text-gray-400">2号店出店プロジェクト</p>
          </div>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex -space-x-1.5">
            {agents.map(a => (
              <div key={a.id} title={`${a.name}（${a.role}）`}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: a.color }}>
                {a.initials}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-1">{agents.length}名</span>
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="text-gray-400">全{total}件</span>
          <span className="text-blue-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />進行中{inProg}
          </span>
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />完了{done}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowEditPhil(true)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            ✏️ 理念を編集
          </button>
          <button onClick={() => handleOpenAddTask('week')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
            ＋ タスク追加
          </button>
          <button onClick={() => setShowAddAgent(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm">
            ＋ 担当追加
          </button>
        </div>
      </header>

      <PhilosophyBanner philosophy={philosophy} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <TeamPanel agents={agents} tasks={tasks} />
        <TaskBoard
          agents={agents} tasks={tasks}
          onAddTask={handleOpenAddTask}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
        />
        <RightPanel
          agents={agents} messages={activityMessages}
          minutes={minutes} qaEntries={qaEntries}
          onQASubmit={handleQASubmit}
        />
      </div>

      {showAddTask && (
        <AddTaskModal agents={agents} defaultTimeframe={defaultTF} onAdd={handleAddTask} onClose={() => setShowAddTask(false)} />
      )}
      {showAddAgent && (
        <AddAgentModal onAdd={handleAddAgent} onClose={() => setShowAddAgent(false)} />
      )}
      {showEditPhil && (
        <PhilosophyEditModal
          philosophy={philosophy}
          onSave={p => { setPhilosophy(p); setShowEditPhil(false) }}
          onClose={() => setShowEditPhil(false)}
        />
      )}
      {pendingComplete && (
        <CompleteTaskModal
          taskTitle={pendingComplete.taskTitle}
          onComplete={handleCompleteTask}
          onCancel={() => setPendingComplete(null)}
        />
      )}
    </div>
  )
}

function PhilosophyEditModal({ philosophy, onSave, onClose }: {
  philosophy: Philosophy
  onSave: (p: Philosophy) => void
  onClose: () => void
}) {
  const [vision, setVision]   = useState(philosophy.vision)
  const [mission, setMission] = useState(philosophy.mission)
  const [valText, setValText] = useState(philosophy.values.join('、'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden fade-in">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">企業理念の編集</h2>
            <p className="text-amber-100 text-xs mt-0.5">ビジョン・ミッション・バリューを設定</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">✨ ビジョン</label>
            <input value={vision} onChange={e => setVision(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">🎯 ミッション</label>
            <textarea value={mission} onChange={e => setMission(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">💎 バリュー（読点「、」で区切る）</label>
            <input value={valText} onChange={e => setValText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium">キャンセル</button>
            <button onClick={() => onSave({ vision: vision.trim(), mission: mission.trim(), values: valText.split('、').map(v => v.trim()).filter(Boolean) })}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold">保存する</button>
          </div>
        </div>
      </div>
    </div>
  )
}
