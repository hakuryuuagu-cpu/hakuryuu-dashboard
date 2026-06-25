import { NextRequest, NextResponse } from 'next/server'

function cleanKey(key: string): string {
  return key.replace(/[^\x20-\x7E]/g, '').trim()
}

interface AnalysisRound {
  model: 'GPT' | 'Gemini' | 'Claude'
  role: string
  perspective: string
  content: string
}

async function callGPT(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error('GPT error')
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) throw new Error('Gemini error')
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error('Claude error')
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

export async function POST(req: NextRequest) {
  const { title, content, type } = await req.json()

  const gptKey     = cleanKey(process.env.OPENAI_API_KEY || '')
  const geminiKey  = cleanKey(process.env.GEMINI_API_KEY || '')
  const claudeKey  = cleanKey(process.env.ANTHROPIC_API_KEY || '')

  const contextLabel = type === 'task'
    ? 'タスク・業務項目'
    : type === 'research'
    ? '調査・リサーチ情報'
    : '収集情報'

  const baseContext = `あなたは「あぐー豚しゃぶ 居酒屋 はくりゅう」の2号店出店プロジェクトチームの一員です。
以下の${contextLabel}について、あなたの専門的な視点から分析してください。

【${contextLabel}】
タイトル: ${title}
内容: ${content}

回答は200文字以内で簡潔に、実用的な観点でお願いします。`

  const rounds: AnalysisRound[] = []

  // GPT: 市場・データ分析視点
  if (gptKey) {
    try {
      const gptSystem = 'あなたはデータ分析・市場調査の専門家AIです。数字・根拠・市場動向を重視した実用的な分析を行います。'
      const gptPrompt = baseContext + '\n\n【あなたの視点】市場データ・数値・競合比較の観点から分析してください。'
      const gptResult = await callGPT(gptKey, gptSystem, gptPrompt)
      rounds.push({ model: 'GPT', role: 'データ・市場分析', perspective: '数値・根拠・競合比較', content: gptResult })
    } catch (e) {
      console.error('GPT analysis failed:', e)
    }
  }

  // Gemini: リスク・顧客視点
  if (geminiKey) {
    try {
      const prevContext = rounds.length > 0 ? `\n\nGPTの分析: ${rounds[0].content}` : ''
      const geminiPrompt = `あなたはリスク管理・顧客体験の専門家AIです。${baseContext}${prevContext}\n\n【あなたの視点】リスク・課題・顧客目線から分析してください。GPTの分析を踏まえて補足や異なる意見も述べてください。`
      const geminiResult = await callGemini(geminiKey, geminiPrompt)
      rounds.push({ model: 'Gemini', role: 'リスク・顧客視点', perspective: 'リスク・顧客体験・改善点', content: geminiResult })
    } catch (e) {
      console.error('Gemini analysis failed:', e)
    }
  }

  // Claude: 統合・アクション提案
  if (claudeKey) {
    try {
      const prevContext = rounds.map(r => `${r.model}(${r.role}): ${r.content}`).join('\n\n')
      const claudeSystem = 'あなたは戦略立案・アクション設計の専門家AIです。他のAIの分析を踏まえて具体的なアクションを提案します。'
      const claudePrompt = `${baseContext}\n\n他のAIの分析:\n${prevContext}\n\n【あなたの視点】上記の分析を統合し、具体的な次のアクション・改善提案を示してください。`
      const claudeResult = await callClaude(claudeKey, claudeSystem, claudePrompt)
      rounds.push({ model: 'Claude', role: '統合・アクション提案', perspective: '戦略・具体的アクション', content: claudeResult })
    } catch (e) {
      console.error('Claude analysis failed:', e)
    }
  }

  if (rounds.length === 0) {
    return NextResponse.json({ error: 'No AI available' }, { status: 500 })
  }

  return NextResponse.json({ rounds })
}
