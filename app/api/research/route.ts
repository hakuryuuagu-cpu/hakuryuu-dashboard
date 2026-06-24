import { NextRequest, NextResponse } from 'next/server'

function cleanKey(key: string): string {
  return key.replace(/[^\x20-\x7E]/g, '').trim()
}

export async function POST(req: NextRequest) {
  const { keyword, name } = await req.json()
  const apiKey = cleanKey(process.env.OPENAI_API_KEY || '')

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not set' }, { status: 500 })
  }

  const prompt = `以下のテーマについて、飲食店経営に役立つ最新情報を調査・まとめてください。

テーマ: ${name}
キーワード: ${keyword}

以下の形式でまとめてください：

【現状・トレンド】
- （3〜5点で箇条書き）

【注目ポイント】
- （2〜3点で箇条書き）

【はくりゅう2号店への示唆】
- （1〜2点、具体的なアクション提案）

※簡潔かつ実用的な情報をお願いします。`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは飲食店経営のリサーチアシスタントです。「あぐー豚しゃぶ 居酒屋 はくりゅう」の沖縄での2号店出店プロジェクトを支援しています。市場動向、競合情報、トレンドなどを実用的にまとめてください。'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message || 'API error' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'データを取得できませんでした'

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Research API error:', error)
    return NextResponse.json({ error: 'Research failed' }, { status: 500 })
  }
}
