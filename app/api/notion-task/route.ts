import { NextResponse } from 'next/server'

const NOTION_VERSION = '2022-06-28'
const DATABASE_ID    = '5a6db9b1b0464ed59eba14234191b150'

const TIMEFRAME_MAP: Record<string, string> = {
  week: '今週', month: '今月', year: '今年',
}

export async function POST(req: Request) {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'NOTION_TOKEN が設定されていません' }, { status: 500 })
  }

  const body = await req.json()
  const { title, description, assigneeName, status, priority, timeframe, dueDate, category } = body

  const properties: Record<string, unknown> = {
    'タスク名':  { title: [{ text: { content: title ?? '' } }] },
    'ステータス': { select: { name: status ?? '未着手' } },
    '優先度':    { select: { name: priority ?? '中' } },
    '期間':      { select: { name: TIMEFRAME_MAP[timeframe] ?? '今週' } },
  }
  if (assigneeName) properties['担当AI']   = { rich_text: [{ text: { content: assigneeName } }] }
  if (category)     properties['カテゴリ']  = { rich_text: [{ text: { content: category } }] }
  if (description)  properties['詳細・メモ'] = { rich_text: [{ text: { content: description } }] }
  if (dueDate)      properties['期限日']    = { date: { start: dueDate } }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization':  `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: DATABASE_ID },
      properties,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[Notion] create page error:', data)
    return NextResponse.json({ error: data }, { status: res.status })
  }

  return NextResponse.json({ id: data.id, url: data.url })
}
