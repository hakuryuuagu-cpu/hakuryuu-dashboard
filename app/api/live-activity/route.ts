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

interface ActivityMessage {
  agentId: string
  agentName: string
  content: string
}

export async function POST(req: NextRequest) {
  const { agents, tasks } = await req.json() as {
    agents: AgentInfo[]
    tasks: Array<{ title: string; status: string; category?: string }>
  }

  const geminiKey = cleanKey(process.env.GEMINI_API_KEY || '')
  const gptKey    = cleanKey(process.env.OPENAI_API_KEY || '')

  const taskList = tasks.length > 0
    ? tasks.slice(0, 8).map(t => `・${t.title}（${t.status}）`).join('\n')
    : '（タスクなし）'

  const agentList = agents
    .map(a => `- ${a.name}（${a.role}）: ${a.specialties.join('、')}${a.isAudit ? '。リスク・監査担当。' : ''}`)
    .join('\n')

  const prompt = `あなたは「あぐー豚しゃぶ 居酒屋 はくりゅう」2号店出店プロジェクトの専門AIチームです。

現在進行中のタスク:
${taskList}

チームメンバー:
${agentList}

今この瞬間、各エージェントが自律的に業務を進めています。
${agents.length}名のうち${Math.min(4, agents.length)}名が今やっていること・気づいたこと・調査中のことを、
それぞれの専門視点から自然な業務報告として短くコメントしてください（各50文字以内）。

現在のタスク内容を具体的に参照したリアルなコメントにすること。
监査AIは必ずリスクや注意点を含めること。

以下のJSON配列のみを返してください（説明文なし）:
[
  {"agentId": "エージェントID", "agentName": "エージェント名", "content": "コメント"},
  ...
]`

  // Gemini first (free tier)
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 800 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        const match = raw.match(/\[[\s\S]*?\]/)
        if (match) {
          const parsed: ActivityMessage[] = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({ messages: parsed })
          }
        }
      }
    } catch (e) {
      console.error('Gemini live-activity error:', e)
    }
  }

  // Fallback: GPT
  if (gptKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gptKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.9,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content ?? ''
        let parsed: ActivityMessage[] = []
        try {
          const obj = JSON.parse(raw)
          parsed = Array.isArray(obj) ? obj : (obj.messages ?? obj.data ?? Object.values(obj)[0] ?? [])
        } catch {
          const match = raw.match(/\[[\s\S]*?\]/)
          if (match) parsed = JSON.parse(match[0])
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ messages: parsed })
        }
      }
    } catch (e) {
      console.error('GPT live-activity error:', e)
    }
  }

  return NextResponse.json({ messages: [] }, { status: 500 })
}
