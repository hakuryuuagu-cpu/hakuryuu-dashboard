import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantContext } from '@/lib/restaurant-info'

function cleanKey(key: string): string {
  return key.replace(/[^\x20-\x7E]/g, '').trim()
}

interface SuggestedGoal {
  type: 'kpi' | 'action'
  title: string
  description: string
  // KPI
  targetValue?: number
  unit?: string
  // Action
  milestones?: string[]  // テキストのみ（idはフロントで付与）
}

export async function POST(req: NextRequest) {
  const { assigneeName, period } = await req.json() as {
    assigneeName: string
    period: 'monthly' | 'quarterly' | 'annual'
  }

  const geminiKey = cleanKey(process.env.GEMINI_API_KEY || '')
  const gptKey    = cleanKey(process.env.OPENAI_API_KEY || '')

  const periodLabel = period === 'monthly' ? '月次' : period === 'quarterly' ? '四半期' : '年次'

  const prompt = `あなたは飲食店経営コンサルタントです。以下の情報をもとに、${assigneeName}の${periodLabel}目標を3件提案してください。

${getRestaurantContext()}

【条件】
- 担当者: ${assigneeName}
- 期間: ${periodLabel}
- 目標は「KPI目標（数値で測れるもの）」と「行動目標（マイルストーンで追えるもの）」を混ぜて提案
- KPI目標: 具体的な数値ターゲットと単位を含める（例: 月間売上120万円、客単価7,500円、新規顧客10名）
- 行動目標: 3〜4つの具体的なマイルストーンステップに分解
- はくりゅう1号店の実情（客単価7,000円・深夜営業・あぐー豚専門）に即した現実的な目標にすること

JSON配列のみを返してください（説明不要）:
[
  {
    "type": "kpi",
    "title": "目標タイトル（30文字以内）",
    "description": "目標の背景・意図（60文字以内）",
    "targetValue": 数値,
    "unit": "単位（円/人/件/% など）"
  },
  {
    "type": "action",
    "title": "目標タイトル（30文字以内）",
    "description": "目標の背景・意図（60文字以内）",
    "milestones": ["ステップ1（具体的なアクション）", "ステップ2", "ステップ3", "ステップ4"]
  },
  ...
]`

  const tryGemini = async (): Promise<SuggestedGoal[] | null> => {
    if (!geminiKey) return null
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
      if (!res.ok) return null
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return null
      return JSON.parse(match[0])
    } catch { return null }
  }

  const tryGPT = async (): Promise<SuggestedGoal[] | null> => {
    if (!gptKey) return null
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gptKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.8,
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return null
      return JSON.parse(match[0])
    } catch { return null }
  }

  const goals = (await tryGemini()) ?? (await tryGPT())
  if (!goals || goals.length === 0) {
    return NextResponse.json({ error: 'AIへの接続に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ goals })
}
