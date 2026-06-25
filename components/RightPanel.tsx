'use client'

import { useState, useEffect, useRef } from 'react'
import type { AIAgent, ActivityMessage, MinutesEntry, QAEntry, DiscussionRound, QAInsights, ResearchNote } from '@/lib/types'
import DailyRecordTab from './DailyRecordTab'
import ResearchNoteTab from './ResearchNoteTab'
import AutoCollectTab from './AutoCollectTab'

type TabKey = 'activity' | 'minutes' | 'qa' | 'daily' | 'research' | 'autocollect'
type QAViewMode = 'final' | 'discussion'

interface Props {
  agents: AIAgent[]
  messages: ActivityMessage[]
  minutes: MinutesEntry[]
  qaEntries: QAEntry[]
  onQASubmit: (topic: string) => void
}

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'activity',    label: 'ライブ',   emoji: '🔴' },
  { key: 'minutes',     label: '議事録',   emoji: '📋' },
  { key: 'qa',          label: '質問',     emoji: '💬' },
  { key: 'daily',       label: '日次',     emoji: '📊' },
  { key: 'research',    label: '調査メモ', emoji: '📌' },
  { key: 'autocollect', label: '自動収集', emoji: '🤖' },
]

const QUICK_QUESTIONS = [
  '2号店の出店タイミングはいつが最適？',
  '初期投資の規模感を教えて',
  '競合との差別化はどう進める？',
  '採用計画の優先順位は？',
]

const MODEL_COLORS: Record<string, string> = { Gemini: '#4285f4', GPT: '#10b981', Claude: '#f97316' }
const MODEL_EMOJI:  Record<string, string> = { Gemini: '🔵',     GPT: '🟢',     Claude: '🟠'     }
const MODEL_LABEL:  Record<string, string> = { GPT: '初期分析', Gemini: '補足視点', Claude: '統合回答' }

function InsightsPanel({ insights }: { insights: QAInsights }) {
  const sections = [
    { key: 'questions',    label: '❓ 疑問・不明点',  items: insights.questions,    color: 'bg-amber-50 border-amber-200 text-amber-800' },
    { key: 'improvements', label: '💡 改善点',        items: insights.improvements, color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { key: 'actions',      label: '✅ 行動指標',      items: insights.actions,      color: 'bg-green-50 border-green-200 text-green-800' },
    { key: 'risks',        label: '⚠️ リスク・懸念',  items: insights.risks,        color: 'bg-red-50 border-red-200 text-red-800' },
  ]
  const hasAny = sections.some(s => s.items.length > 0)
  if (!hasAny) return null

  return (
    <div className="border-t border-indigo-100 bg-indigo-50 p-2.5 space-y-2">
      <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">📊 ディスカッションから抽出</p>
      {sections.map(s => s.items.length > 0 && (
        <div key={s.key} className={`rounded-lg border p-2 ${s.color}`}>
          <p className="text-[9px] font-bold mb-1">{s.label}</p>
          {s.items.map((item, i) => (
            <p key={i} className="text-[10px] leading-relaxed pl-2 border-l-2 border-current opacity-80 mb-0.5">{item}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function DiscussionView({ discussion, agents }: { discussion: DiscussionRound[]; agents: AIAgent[] }) {
  return (
    <div className="space-y-2 p-2">
      {discussion.map((round, ri) => (
        <div key={ri} className="rounded-lg overflow-hidden border border-gray-100">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ backgroundColor: MODEL_COLORS[round.model] + '22' }}>
            <span className="text-sm leading-none">{MODEL_EMOJI[round.model]}</span>
            <span className="text-[10px] font-bold" style={{ color: MODEL_COLORS[round.model] }}>{round.model}</span>
            <span className="text-[9px] text-gray-500 ml-0.5">— {MODEL_LABEL[round.model]}</span>
            <span className="ml-auto text-[8px] text-gray-400">{round.responses.length}名</span>
          </div>
          <div className="bg-white space-y-1 p-1.5">
            {round.responses.map(r => {
              const agent = agents.find(a => a.id === r.agentId)
              return (
                <div key={r.agentId} className="flex gap-1.5 items-start rounded-lg p-1.5 bg-gray-50 border border-gray-100">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: agent?.color ?? '#94a3b8' }}>
                    {agent?.initials ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold block mb-0.5" style={{ color: agent?.color ?? '#64748b' }}>
                      {r.agentName}
                    </span>
                    <p className="text-[10px] text-gray-700 leading-relaxed">{r.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RightPanel({ agents, messages, minutes, qaEntries, onQASubmit }: Props) {
  const [tab, setTab]           = useState<TabKey>('activity')
  const [question, setQuestion] = useState('')
  const [qaViewMode, setQaViewMode] = useState<Record<string, QAViewMode>>({})
  const [expandedDelib, setExpandedDelib] = useState<Set<string>>(new Set())
  // 調査メモタブへ渡す外部保存データ
  const [pendingResearch, setPendingResearch] = useState<Partial<ResearchNote> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const toggleDelib = (key: string) =>
    setExpandedDelib(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const getViewMode = (entryId: string): QAViewMode => qaViewMode[entryId] ?? 'final'
  const setViewMode = (entryId: string, mode: QAViewMode) =>
    setQaViewMode(prev => ({ ...prev, [entryId]: mode }))

  useEffect(() => {
    if (tab === 'activity') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  const submit = () => {
    if (!question.trim()) return
    onQASubmit(question.trim())
    setQuestion('')
    setTab('qa')
  }

  // QA回答を調査メモとして保存
  const saveQAToResearch = (topic: string, content: string) => {
    setPendingResearch({
      category: 'AIの回答',
      title: topic.length > 30 ? topic.slice(0, 30) + '…' : topic,
      content,
    })
    setTab('research')
  }

  return (
    <div className="flex-1 min-w-[280px] bg-white border-l border-gray-200 flex flex-col overflow-hidden">

      {/* Tab bar — 5 tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0 bg-gray-50">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-[7px] font-bold transition-all ${
              tab === t.key
                ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}>
            <span className="text-sm leading-none">{t.emoji}</span>
            <span className="leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── ACTIVITY ────────────────────────────── */}
      {tab === 'activity' && (
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
              <div className="text-4xl mb-3 opacity-40">🔴</div>
              <p className="text-xs leading-relaxed">AIエージェントが活動を開始すると<br />ここにリアルタイムで表示されます</p>
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {messages.map(msg => (
                <div key={msg.id}
                  className={`flex gap-2 items-start rounded-xl p-2 fade-in ${msg.isAudit ? 'bg-red-50 border border-red-100' : 'hover:bg-gray-50'}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm"
                    style={{ backgroundColor: msg.agentColor }}>
                    {msg.agentInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-bold" style={{ color: msg.agentColor }}>{msg.agentName}</span>
                      {msg.isAudit && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">監査</span>}
                      <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">
                        {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      )}

      {/* ── MINUTES ─────────────────────────────── */}
      {tab === 'minutes' && (
        <div className="flex-1 overflow-y-auto">
          {minutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
              <div className="text-4xl mb-3 opacity-40">📋</div>
              <p className="text-xs leading-relaxed">AIが活動を続けると自動で<br />議事録・報告書が生成されます</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {minutes.map(entry => (
                <div key={entry.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400 font-medium">{entry.date} {entry.time}</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{entry.participants.length}名</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {entry.participants.map(p => {
                      const a = agents.find(ag => ag.name === p)
                      return <span key={p} className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: a?.color ?? '#94a3b8' }}>{p}</span>
                    })}
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{entry.summary}</p>
                  {entry.highlights.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <p className="text-[9px] font-bold text-red-600">🔍 監査指摘事項</p>
                      {entry.highlights.map((h, i) => (
                        <p key={i} className="text-[10px] text-red-700 bg-red-50 rounded-lg px-2 py-1 leading-relaxed">{h}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QA ──────────────────────────────────── */}
      {tab === 'qa' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {qaEntries.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-2 opacity-40">💬</div>
                <p className="text-xs leading-relaxed mb-3">下のフォームから質問すると<br />全AIが専門的観点で回答します</p>
                <p className="text-[10px] text-gray-400 font-medium mb-1.5">よくある質問：</p>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => setQuestion(q)}
                    className="block w-full text-left text-[10px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors mb-1">
                    ▶ {q}
                  </button>
                ))}
              </div>
            )}

            {qaEntries.map(entry => {
              const viewMode = getViewMode(entry.id)
              const hasDiscussion = entry.discussion && entry.discussion.length > 0
              const hasInsights   = entry.insights && (
                entry.insights.questions.length + entry.insights.improvements.length +
                entry.insights.actions.length + entry.insights.risks.length > 0
              )

              return (
                <div key={entry.id} className="rounded-xl border border-gray-200 overflow-hidden fade-in">
                  {/* Question header */}
                  <div className="bg-indigo-600 px-3 py-2">
                    <p className="text-white text-xs font-bold leading-snug">Q. {entry.topic}</p>
                    <p className="text-indigo-300 text-[9px] mt-0.5">
                      {entry.createdAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* View mode tabs */}
                  {hasDiscussion && (
                    <div className="flex border-b border-gray-200 bg-gray-50">
                      <button onClick={() => setViewMode(entry.id, 'final')}
                        className={`flex-1 py-1.5 text-[9px] font-bold transition-colors ${
                          viewMode === 'final' ? 'text-indigo-700 bg-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-600'
                        }`}>
                        💬 最終回答
                      </button>
                      <button onClick={() => setViewMode(entry.id, 'discussion')}
                        className={`flex-1 py-1.5 text-[9px] font-bold transition-colors ${
                          viewMode === 'discussion' ? 'text-indigo-700 bg-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-600'
                        }`}>
                        🔄 議論過程
                      </button>
                    </div>
                  )}

                  {/* Final answers */}
                  {viewMode === 'final' && (
                    <div className="bg-gray-50 p-2 space-y-1.5">
                      {entry.responses.length === 0 && (
                        <div className="flex items-center gap-2 py-2 px-1">
                          <div className="flex gap-1">
                            {[0,1,2].map(i => (
                              <div key={i} className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">AIが議論中…</span>
                        </div>
                      )}
                      {entry.responses.map(r => (
                        <div key={r.agentId}
                          className={`rounded-lg p-2 fade-in ${r.isAudit ? 'bg-red-50 border border-red-100' : 'bg-white border border-gray-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                              style={{ backgroundColor: r.agentColor }}>
                              {r.agentInitials}
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: r.agentColor }}>{r.agentName}</span>
                            {r.isAudit && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 rounded-full ml-auto font-bold">監査</span>}
                          </div>
                          <p className="text-[10px] text-gray-700 leading-relaxed">{r.content}</p>
                          {/* 📌 調査メモに保存ボタン */}
                          <button
                            onClick={() => saveQAToResearch(entry.topic, `【${r.agentName}の回答】\n${r.content}`)}
                            className="mt-1.5 text-[8px] text-gray-400 hover:text-indigo-500 flex items-center gap-0.5 transition-colors">
                            📌 調査メモに保存
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Discussion view */}
                  {viewMode === 'discussion' && hasDiscussion && (
                    <DiscussionView discussion={entry.discussion!} agents={agents} />
                  )}

                  {/* Insights */}
                  {hasInsights && <InsightsPanel insights={entry.insights!} />}
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-3 space-y-2">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="チームへの質問・相談を入力…（Enterで送信）"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            />
            <button onClick={submit} disabled={!question.trim()}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                question.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              全AIに質問する →
            </button>
          </div>
        </div>
      )}

      {/* ── DAILY RECORD ────────────────────────── */}
      {tab === 'daily' && <DailyRecordTab onSaveToResearch={(note) => { setPendingResearch(note); setTab('research') }} />}

      {/* ── RESEARCH NOTES ──────────────────────── */}
      {tab === 'research' && (
        <ResearchNoteTab
          externalNote={pendingResearch}
          onExternalNoteHandled={() => setPendingResearch(null)}
        />
      )}

      {/* ── AUTO COLLECT ────────────────────────── */}
      {tab === 'autocollect' && (
        <div className="flex-1 overflow-y-auto">
          <AutoCollectTab />
        </div>
      )}
    </div>
  )
}
