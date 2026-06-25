import { NextRequest, NextResponse } from 'next/server'

function cleanKey(key: string): string {
  return key.replace(/[^\x20-\x7E]/g, '').trim()
}

interface AgentInfo {
  id: string
  name: string
  role: string
  specialties: string[]
  isAudit?: boolean
}

interface DiscussMessage {
  agentId: string
  agentName: string
  content: string
}

export async function POST(req: NextRequest) {
  const { task, agents } = await req.json() as {
    task: { title: string; description?: string; category?: string }
    agents: AgentInfo[]
  }

  const gptKey = cleanKey(process.env.OPENAI_API_KEY || '')
  const geminiKey = cleanKey(process.env.GEMINI_API_KEY || '')

  const agentDescriptions = agents
    .map(a => `- ${a.name}（${a.role}）: 専門は${a.specialties.join('、')}${a.isAudit ? '。リスク・監査の視点で厳しくチェック。' : ''}`)
    .join('\n')

  const prompt = `あなたは「あぐー豚しゃぶ 居酒屋 はくりゅう」2号店出店プロジェクトチームのAIエージェント群を演じます。

以下のタスクについて、各エージェントがそれぞれの専門的視点から分析・コメントしてください。

【タスク】${task.title}${task.description ? `\n【詳細】${task.description}` : ''}${task.category ? `\n【カテゴリ】${task.category}` : ''}

【エージェント一覧】
${agentDescriptions}

各エージェントが具体的・実用的な観点でコメントします。
物件系タスクなら: 類似物件の状況、広さの適正、初期投資、交通量・人口集積度なども考慮。
財務系タスクなら: 数字・コスト・ROI視点。
マーケ系タスクなら: 集客・SNS・顧客層視点。
監査AIは必ずリスクや懸念点を指摘する。

以下のJSON配列のみを返してください（説明文は不要）:
[
  {"agentId": "エージェントID", "agentName": "エージェント名", "content": "コメント（100文字以内）"},
  ...
]`

  const messages: DiscussMessage[] = []

  // Try GPT first
  if (gptKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gptKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.8,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content ?? ''
        // Parse: might be wrapped in object or direct array
        let parsed: DiscussMessage[] = []
        try {
          const obj = JSON.parse(raw)
          parsed = Array.isArray(obj) ? obj : (obj.messages ?? obj.data ?? Object.values(obj)[0] ?? [])
        } catch {
          // Try extracting array from text
          const match = raw.match(/\[[\s\S]*\]/)
          if (match) parsed = JSON.parse(match[0])
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ messages: parsed })
        }
      }
    } catch (e) {
      console.error('GPT task-discuss error:', e)
    }
  }

  // Fallback: Gemini
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        let parsed: DiscussMessage[] = []
        try {
          const match = raw.match(/\[[\s\S]*\]/)
          if (match) parsed = JSON.parse(match[0])
        } catch {}
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ messages: parsed })
        }
      }
    } catch (e) {
      console.error('Gemini task-discuss error:', e)
    }
  }

  return NextResponse.json({ messages: [] }, { status: 500 })
}
