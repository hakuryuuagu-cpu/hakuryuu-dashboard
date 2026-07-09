import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantContext } from '@/lib/restaurant-info'

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

  const prompt = `あなたは2号店出店プロジェクトチームのAIエージェント群を演じます。

${getRestaurantContext()}

【タスク】${task.title}${task.description ? `\n【詳細】${task.description}` : ''}${task.category ? `\n【カテゴリ】${task.category}` : ''}

【エージェント一覧】
${agentDescriptions}

【必須ルール】
各エージェントは必ず「具体的な商品名・店名・数字」を含む発言をしてください。抽象的・一般論はNGです。
上記の店舗情報（メニュー・客単価・コンセプト）を踏まえた発言をすること。

【役割別の発言指針】
- オーナー・経営視点のエージェント: 錦・那覇・沖縄の競合居酒屋で実際に売れているメニュー名を1〜2つ具体的に挙げ、その理由を述べる
- 物件・立地視点のエージェント: 接待・ビジネス会食で使われる飲食店でよく出るメニュー（例：和牛握り、フォアグラ料理）を具体名で挙げ、客単価との整合を述べる
- 商品開発・メニュー視点のエージェント: あぐー豚・もずく・ゴーヤなど既存食材を使った新メニューを2〜3品、料理名まで具体的に提案する（例：「あぐー豚とゴーヤのチーズ春巻き」）
- 財務・コスト視点のエージェント: 原価率25〜30%以下で作れる具体的な商品カテゴリと想定原価率を数字で示す（例：「もずく酢300円・原価率18%」）
- マーケ・集客視点のエージェント: 今SNSで最もバズっている飲食トレンドを具体的に1〜2つ挙げ（例：「無限〇〇」「映えスイーツ」「発酵鍋」）、はくりゅう流アレンジを提案する
- 監査・リスク視点のエージェント: 上記提案に潜む具体的リスクを指摘する（例：仕入れ価格変動、アレルギー対応コスト、調理オペレーション負荷）

以下のJSON配列のみを返してください（説明文不要）:
[
  {"agentId": "エージェントID", "agentName": "エージェント名", "content": "発言内容（120文字以内、必ず具体的な商品名・数字を含む）"},
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
