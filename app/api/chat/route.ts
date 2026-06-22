import { NextResponse } from 'next/server'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'

interface AgentInfo { id: string; name: string; role: string; specialties: string[]; isAudit?: boolean }
interface BatchResponse { agentId: string; content: string }
interface DiscussionRound { model: 'GPT' | 'Gemini' | 'Claude'; label: string; responses: Array<{ agentId: string; agentName: string; content: string }> }
interface Insights { questions: string[]; improvements: string[]; actions: string[]; risks: string[] }

function cleanKey(key: string): string {
  return key.replace(/[^\x20-\x7E]/g, '').trim()
}

function extractJSON(text: string): BatchResponse[] {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed.responses) ? parsed.responses : []
  } catch { return [] }
}

function buildPrompt(agents: AgentInfo[], topic: string, round: 'initial' | 'supplement' | 'synthesize', context: string): string {
  const agentList = agents.map((a, i) =>
    `${i + 1}. id="${a.id}" name="${a.name}" 役割="${a.role}" 専門="${a.specialties.join('、')}"` +
    (a.isAudit ? ' ※監査AI（リスク・問題点を必ず指摘）' : '')
  ).join('\n')

  const base =
    `あなたは以下の${agents.length}人のAIエージェントです。\n` +
    `飲食店「あぐー豚しゃぶ 居酒屋 はくりゅう 錦」（名古屋市中区錦、個室居酒屋）の2号店出店プロジェクトチームです。\n\n` +
    `[エージェント]\n${agentList}\n\n[質問]\n${topic}\n\n`

  const instructions: Record<typeof round, string> = {
    initial: '各エージェントとして、専門分野の観点から初期分析を行ってください。',
    supplement: `${context}\n\n上記の初期分析を踏まえ、各エージェントとして追加視点・補足・懸念点など異なる角度の意見を加えてください。`,
    synthesize: `${context}\n\n上記のAIたちの見解を統合し、各エージェントとして最も包括的で実践的な最終回答を2〜4文で作成してください。`,
  }

  return base + instructions[round] + '\n\n必ず以下のJSON形式のみで返してください（説明不要）:\n{"responses":[{"agentId":"id値","content":"回答"},...]}'
}

function formatContext(label: string, responses: BatchResponse[], agents: AgentInfo[]): string {
  return `[${label}の見解]\n` + responses.map(r => {
    const a = agents.find(ag => ag.id === r.agentId)
    return `• ${a?.name ?? r.agentId}: ${r.content}`
  }).join('\n')
}

async function callGemini(apiKey: string, prompt: string): Promise<BatchResponse[]> {
  const res = await fetch(`${GEMINI_URL}?key=${cleanKey(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1500 } }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? `Gemini ${res.status}`)
  return extractJSON(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '')
}

async function callGPT(apiKey: string, prompt: string): Promise<BatchResponse[]> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey(apiKey)}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.8 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? `GPT ${res.status}`)
  return extractJSON(data.choices?.[0]?.message?.content ?? '')
}

async function callClaude(apiKey: string, prompt: string): Promise<BatchResponse[]> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': cleanKey(apiKey), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? `Claude ${res.status}`)
  return extractJSON(data.content?.[0]?.text ?? '')
}

async function extractInsights(apiKey: string, topic: string, context: string): Promise<Insights> {
  const prompt = `あなたはビジネスアナリストです。以下のAIチームのディスカッションを分析し、重要ポイントを抽出してください。

【議題】${topic}

【ディスカッション内容】
${context}

以下のJSON形式のみで返してください（説明・前置き不要）:
{
  "questions": ["ディスカッション中に出た疑問・不明点を1文で（最大3つ）"],
  "improvements": ["具体的な改善提案を1文で（最大3つ）"],
  "actions": ["今すぐ取れる具体的な行動指標を1文で（最大3つ）"],
  "risks": ["注意すべきリスク・懸念を1文で（最大2つ）"]
}`

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey(apiKey)}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.4 }),
  })
  const data = await res.json()
  if (!res.ok) return { questions: [], improvements: [], actions: [], risks: [] }
  const text = data.choices?.[0]?.message?.content ?? ''
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { questions: [], improvements: [], actions: [], risks: [] }
    const p = JSON.parse(match[0])
    return {
      questions:    Array.isArray(p.questions)    ? p.questions    : [],
      improvements: Array.isArray(p.improvements) ? p.improvements : [],
      actions:      Array.isArray(p.actions)      ? p.actions      : [],
      risks:        Array.isArray(p.risks)        ? p.risks        : [],
    }
  } catch { return { questions: [], improvements: [], actions: [], risks: [] } }
}

export async function POST(req: Request) {
  const geminiKey    = process.env.GEMINI_API_KEY
  const openaiKey    = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!geminiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY が .env.local に設定されていません' }, { status: 500 })
  }

  const body = await req.json()

  // ── バッチモード（QA質問）──────────────────────────────────
  if (body.agents && body.topic) {
    const agents: AgentInfo[] = body.agents
    const topic: string = body.topic

    // Round 1: GPT 初期分析
    let gptRes: BatchResponse[] = []
    if (openaiKey) {
      try {
        gptRes = await callGPT(openaiKey, buildPrompt(agents, topic, 'initial', ''))
        console.log('[Chat] GPT OK:', gptRes.length, 'responses')
      } catch (e) {
        console.error('[Chat] GPT failed:', e instanceof Error ? e.message : e)
      }
    }

    // Round 2: Gemini 補完視点
    let geminiRes: BatchResponse[] = []
    const gptCtxForGemini = gptRes.length > 0 ? formatContext('GPT', gptRes, agents) : ''
    try {
      geminiRes = await callGemini(
        geminiKey,
        buildPrompt(agents, topic, gptRes.length > 0 ? 'supplement' : 'initial', gptCtxForGemini)
      )
      console.log('[Chat] Gemini OK:', geminiRes.length, 'responses')
    } catch (e) {
      console.error('[Chat] Gemini failed (non-fatal):', e instanceof Error ? e.message : e)
    }

    // Round 3: Claude 統合
    let claudeRes: BatchResponse[] = []
    if (anthropicKey) {
      const gptCtx = gptRes.length > 0 ? formatContext('GPT', gptRes, agents) : ''
      const gemCtx = geminiRes.length > 0 ? '\n\n' + formatContext('Gemini', geminiRes, agents) : ''
      const available = gptCtx + gemCtx
      try {
        claudeRes = await callClaude(anthropicKey, buildPrompt(agents, topic, available.length > 0 ? 'synthesize' : 'initial', available))
        console.log('[Chat] Claude OK:', claudeRes.length, 'responses')
      } catch (e) {
        console.error('[Chat] Claude failed:', e instanceof Error ? e.message : e)
      }
    }

    const finalSource = claudeRes.length > 0 ? claudeRes : gptRes.length > 0 ? gptRes : geminiRes

    if (finalSource.length === 0) {
      return NextResponse.json({ error: '全モデルへの接続に失敗しました。APIキーを確認してください。' }, { status: 500 })
    }

    // 最終回答 + 議論過程
    const responses = finalSource.map(r => {
      const deliberation: { model: string; text: string }[] = []
      const p = gptRes.find(x => x.agentId === r.agentId)
      const g = geminiRes.find(x => x.agentId === r.agentId)
      const c = claudeRes.find(x => x.agentId === r.agentId)
      if (p) deliberation.push({ model: 'GPT',    text: p.content })
      if (g) deliberation.push({ model: 'Gemini', text: g.content })
      if (c) deliberation.push({ model: 'Claude', text: c.content })
      return { ...r, deliberation }
    })

    // ディスカッションラウンド構築
    const discussion: DiscussionRound[] = []
    if (gptRes.length > 0) discussion.push({
      model: 'GPT', label: 'GPT — 初期分析',
      responses: gptRes.map(r => ({ agentId: r.agentId, agentName: agents.find(a => a.id === r.agentId)?.name ?? r.agentId, content: r.content }))
    })
    if (geminiRes.length > 0) discussion.push({
      model: 'Gemini', label: 'Gemini — 補足視点',
      responses: geminiRes.map(r => ({ agentId: r.agentId, agentName: agents.find(a => a.id === r.agentId)?.name ?? r.agentId, content: r.content }))
    })
    if (claudeRes.length > 0) discussion.push({
      model: 'Claude', label: 'Claude — 統合回答',
      responses: claudeRes.map(r => ({ agentId: r.agentId, agentName: agents.find(a => a.id === r.agentId)?.name ?? r.agentId, content: r.content }))
    })

    // インサイト抽出
    let insights: Insights = { questions: [], improvements: [], actions: [], risks: [] }
    if (openaiKey && discussion.length > 0) {
      const allContext = discussion.map(d => formatContext(d.label, d.responses.map(r => ({ agentId: r.agentId, content: r.content })), agents)).join('\n\n')
      try {
        insights = await extractInsights(openaiKey, topic, allContext)
        console.log('[Chat] Insights OK')
      } catch (e) {
        console.error('[Chat] Insights failed:', e instanceof Error ? e.message : e)
      }
    }

    return NextResponse.json({ responses, discussion, insights })
  }

  // ── シングルモード（マーケAIレポート等）─────────────────────
  const { systemPrompt, userMessage } = body
  if (!systemPrompt || !userMessage) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  try {
    const prompt = `${systemPrompt}\n\n---\n${userMessage}`

    if (anthropicKey) {
      const res = await fetch(CLAUDE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': cleanKey(anthropicKey), 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok) return NextResponse.json({ content: data.content?.[0]?.text ?? '' })
    }

    if (openaiKey) {
      const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey(openaiKey)}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 512 }),
      })
      const data = await res.json()
      if (res.ok) return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? '' })
    }

    const res = await fetch(`${GEMINI_URL}?key=${cleanKey(geminiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 512 } }),
    })
    const data = await res.json()
    return NextResponse.json({ content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
