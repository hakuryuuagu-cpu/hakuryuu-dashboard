import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_DB_ID = 'cac5bd4fc9ef4790a84731a66c99c295'

const notionHeaders = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
})

// ── GET: 物件一覧をNotionから取得 ─────────────────────────────────────────
export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 100,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Notion APIエラー' }, { status: 500 })
  }

  const data = await res.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = (data.results ?? []).map((page: any) => {
    const p = page.properties
    return {
      id:           page.id,
      title:        p['物件名']?.title?.[0]?.text?.content  ?? '(名称未設定)',
      url:          p['URL']?.url                            ?? '',
      area:         p['エリア']?.rich_text?.[0]?.text?.content   ?? '',
      rent:         p['家賃']?.rich_text?.[0]?.text?.content     ?? '',
      size:         p['面積']?.rich_text?.[0]?.text?.content     ?? '',
      seats:        p['席数目安']?.rich_text?.[0]?.text?.content  ?? '',
      propertyType: p['物件タイプ']?.select?.name              ?? '',
      status:       p['ステータス']?.select?.name              ?? '新着',
      description:  p['説明']?.rich_text?.[0]?.text?.content     ?? '',
      source:       p['検索ソース']?.rich_text?.[0]?.text?.content ?? '',
      foundAt:      p['発見日']?.date?.start ?? page.created_time?.split('T')[0] ?? '',
      createdTime:  page.created_time ?? '',
    }
  })

  return NextResponse.json({ properties })
}

// ── PATCH: ステータス・詳細情報を更新 ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { pageId, status, rent, size, seats, propertyType } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: Record<string, any> = {}
  if (status)       props['ステータス']  = { select: { name: status } }
  if (rent)         props['家賃']        = { rich_text: [{ text: { content: rent } }] }
  if (size)         props['面積']        = { rich_text: [{ text: { content: size } }] }
  if (seats)        props['席数目安']    = { rich_text: [{ text: { content: seats } }] }
  if (propertyType) props['物件タイプ']  = { select: { name: propertyType } }

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({ properties: props }),
  })

  if (!res.ok) return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
