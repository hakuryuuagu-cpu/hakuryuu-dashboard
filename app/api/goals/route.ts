import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const GOALS_DB_ID  = '4734a8fee47b4dcea56329449f46f1c1'

const headers = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToGoal(page: any) {
  const p = page.properties
  const milestonesRaw = p['マイルストーン']?.rich_text?.[0]?.text?.content ?? '[]'
  let milestones = []
  try { milestones = JSON.parse(milestonesRaw) } catch { milestones = [] }

  return {
    id:            page.id,
    type:          p['タイプ']?.select?.name          ?? 'action',
    title:         p['目標タイトル']?.title?.[0]?.text?.content ?? '',
    description:   p['説明']?.rich_text?.[0]?.text?.content    ?? '',
    assigneeId:    p['担当者ID']?.rich_text?.[0]?.text?.content ?? '',
    assigneeName:  p['担当者名']?.rich_text?.[0]?.text?.content  ?? '',
    period:        p['期間']?.select?.name             ?? 'monthly',
    status:        p['ステータス']?.select?.name        ?? 'active',
    dueDate:       p['期限']?.date?.start              ?? '',
    targetValue:   p['目標値']?.rich_text?.[0]?.text?.content  ? Number(p['目標値'].rich_text[0].text.content) : undefined,
    currentValue:  p['現在値']?.rich_text?.[0]?.text?.content  ? Number(p['現在値'].rich_text[0].text.content) : undefined,
    unit:          p['単位']?.rich_text?.[0]?.text?.content     ?? '',
    milestones,
    createdAt:     page.created_time ?? '',
  }
}

// ── GET: 目標一覧 ─────────────────────────────────────────────────────────
export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${GOALS_DB_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 100,
    }),
  })
  if (!res.ok) return NextResponse.json({ error: 'Notion APIエラー' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ goals: data.results.map(pageToGoal) })
}

// ── POST: 目標作成 ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const g = await req.json()
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      parent: { database_id: GOALS_DB_ID },
      properties: {
        '目標タイトル': { title: [{ text: { content: g.title ?? '' } }] },
        'タイプ':       { select: { name: g.type ?? 'action' } },
        '担当者ID':     { rich_text: [{ text: { content: g.assigneeId ?? '' } }] },
        '担当者名':     { rich_text: [{ text: { content: g.assigneeName ?? '' } }] },
        '期間':         { select: { name: g.period ?? 'monthly' } },
        'ステータス':   { select: { name: g.status ?? 'active' } },
        '説明':         { rich_text: [{ text: { content: (g.description ?? '').slice(0, 2000) } }] },
        '目標値':       { rich_text: [{ text: { content: g.targetValue != null ? String(g.targetValue) : '' } }] },
        '現在値':       { rich_text: [{ text: { content: g.currentValue != null ? String(g.currentValue) : '' } }] },
        '単位':         { rich_text: [{ text: { content: g.unit ?? '' } }] },
        'マイルストーン': { rich_text: [{ text: { content: JSON.stringify(g.milestones ?? []).slice(0, 2000) } }] },
        ...(g.dueDate ? { '期限': { date: { start: g.dueDate } } } : {}),
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err }, { status: 500 })
  }
  const page = await res.json()
  return NextResponse.json({ goal: pageToGoal(page) })
}

// ── PATCH: 目標更新 ───────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { id, ...g } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {}
  if (g.title         != null) props['目標タイトル'] = { title: [{ text: { content: g.title } }] }
  if (g.type          != null) props['タイプ']       = { select: { name: g.type } }
  if (g.status        != null) props['ステータス']   = { select: { name: g.status } }
  if (g.period        != null) props['期間']         = { select: { name: g.period } }
  if (g.assigneeId    != null) props['担当者ID']     = { rich_text: [{ text: { content: g.assigneeId } }] }
  if (g.assigneeName  != null) props['担当者名']     = { rich_text: [{ text: { content: g.assigneeName } }] }
  if (g.description   != null) props['説明']         = { rich_text: [{ text: { content: g.description.slice(0, 2000) } }] }
  if (g.targetValue   != null) props['目標値']       = { rich_text: [{ text: { content: String(g.targetValue) } }] }
  if (g.currentValue  != null) props['現在値']       = { rich_text: [{ text: { content: String(g.currentValue) } }] }
  if (g.unit          != null) props['単位']         = { rich_text: [{ text: { content: g.unit } }] }
  if (g.milestones    != null) props['マイルストーン'] = { rich_text: [{ text: { content: JSON.stringify(g.milestones).slice(0, 2000) } }] }
  if (g.dueDate       != null) props['期限']         = g.dueDate ? { date: { start: g.dueDate } } : { date: null }

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ properties: props }),
  })
  if (!res.ok) return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  const page = await res.json()
  return NextResponse.json({ goal: pageToGoal(page) })
}

// ── DELETE: 目標削除 ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ archived: true }),
  })
  if (!res.ok) return NextResponse.json({ error: '削除失敗' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
