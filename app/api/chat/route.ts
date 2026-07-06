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

  // ── 円卓討論モード（QA質問）──────────────────────────────────
  if (body.agents && body.topic) {
    const agents: AgentInfo[] = body.agents
    const topic: string = body.topic

    // 発言順：非監査AI → 監査AI
    const ordered = [
      ...agents.filter(a => !a.isAudit),
      ...agents.filter(a => a.isAudit),
    ]

    const agentList = ordered.map((a, i) =>
      `${i + 1}. id="${a.id}" 名前="${a.name}" 役割="${a.role}" 専門="${a.specialties.join('、')}"` +
      (a.isAudit ? '（監査担当・最後に全員の意見を踏まえてリスク総括）' : '')
    ).join('\n')

    const discussionPrompt = `あなたは「あぐー豚しゃぶ 居酒屋 はくりゅう 錦」（名古屋市中区錦・個室居酒屋）の2号店出店プロジェクト専門AIチームです。

以下の議題について、メンバー全員が順番に発言する円卓討論を生成してください。

【議題】
${topic}

【参加者（この順番で発言）】
${agentList}

【討論ルール】
- 1番目：自分の専門視点から初期見解を述べる
- 2番目以降：「〇〇さんの〜という点を踏まえ、私の立場からは〜」の形で、前の発言者を名指しして引用してから自分の意見を加える
- 全員が必ず具体的・実際的な情報を含める（例：「名古屋市中区の居酒屋坪単価は約〇万円」「競合店の客単価は平均〇円」「周辺の昼間人口は〇万人」などの数字・データ）
- 監査AI：全員の発言を踏まえてリスクと対策を具体的に総括する
- 各発言は200文字以内、討論らしい自然な口語で

JSON配列のみを返してください（説明・前置き不要）:
[
  {"agentId": "id値", "agentName": "名前", "content": "発言内容（前の人を踏まえた具体的な討論）"},
  ...
]`

    // GPT優先 → Geminiフォールバック
    let discussion: Array<{ agentId: string; agentName: string; content: string }> = []

    if (openaiKey) {
      try {
        const res = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cleanKey(openaiKey)}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: discussionPrompt }],
            max_tokens: 2000,
            temperature: 0.85,
          }),
        })
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        const match = text.match(/\[[\s\S]*?\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            discussion = parsed
            console.log('[Chat] GPT discussion OK:', discussion.length, 'turns')
          }
        }
      } catch (e) {
        console.error('[Chat] GPT failed:', e instanceof Error ? e.message : e)
      }
    }

    if (discussion.length === 0) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${cleanKey(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: discussionPrompt }] }],
            generationConfig: { temperature: 0.85, maxOutputTokens: 2000 },
          }),
        })
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const match = text.match(/\[[\s\S]*?\]/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            discussion = parsed
            console.log('[Chat] Gemini discussion OK:', discussion.length, 'turns')
          }
        }
      } catch (e) {
        console.error('[Chat] Gemini failed:', e instanceof Error ? e.message : e)
      }
    }

    if (discussion.length === 0) {
      return NextResponse.json({ error: 'AIへの接続に失敗しました。APIキーを確認してください。' }, { status: 500 })
    }

    // frontendが期待する形式に変換
    const responses = discussion.map(r => ({
      agentId: r.agentId,
      agentName: r.agentName,
      content: r.content,
    }))

    const discussionRounds: DiscussionRound[] = [{
      model: 'GPT',
      label: '円卓討論',
      responses: discussion.map(r => ({ agentId: r.agentId, agentName: r.agentName, content: r.content })),
    }]

    return NextResponse.json({ responses, discussion: discussionRounds, insights: { questions: [], improvements: [], actions: [], risks: [] } })
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
