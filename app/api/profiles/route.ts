import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN  = process.env.NOTION_TOKEN ?? ''
const PROFILES_DB_ID = '25f1dc4c5f2a4abb88e3b35ef7c29503'

const headers = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToProfile(page: any) {
  const p = page.properties
  return {
    pageId:     page.id,
    memberId:   p['メンバーID']?.title?.[0]?.text?.content ?? '',
    jobTitle:   p['役職']?.rich_text?.[0]?.text?.content   ?? '',
    joinedDate: p['入社年月']?.rich_text?.[0]?.text?.content ?? '',
    strengths:  p['強み']?.rich_text?.[0]?.text?.content   ?? '',
    challenges: p['課題']?.rich_text?.[0]?.text?.content   ?? '',
    notes:      p['備考']?.rich_text?.[0]?.text?.content   ?? '',
    updatedAt:  p['更新日']?.last_edited_time              ?? '',
  }
}

// ── GET: プロフィール一覧 ─────────────────────────────────────────────────
export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${PROFILES_DB_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ page_size: 100 }),
  })
  if (!res.ok) return NextResponse.json({ error: 'Notion APIエラー' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ profiles: data.results.map(pageToProfile) })
}

// ── POST: プロフィール作成/更新（upsert） ────────────────────────────────
export async function POST(req: NextRequest) {
  const { memberId, jobTitle, joinedDate, strengths, challenges, notes } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  // 既存ページを検索
  const qRes = await fetch(`https://api.notion.com/v1/databases/${PROFILES_DB_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      filter: { property: 'メンバーID', title: { equals: memberId } },
      page_size: 1,
    }),
  })
  const qData = await qRes.json()
  const existing = qData.results?.[0]

  const props = {
    'メンバーID': { title: [{ text: { content: memberId } }] },
    '役職':       { rich_text: [{ text: { content: jobTitle   ?? '' } }] },
    '入社年月':   { rich_text: [{ text: { content: joinedDate ?? '' } }] },
    '強み':       { rich_text: [{ text: { content: (strengths  ?? '').slice(0, 2000) } }] },
    '課題':       { rich_text: [{ text: { content: (challenges ?? '').slice(0, 2000) } }] },
    '備考':       { rich_text: [{ text: { content: (notes      ?? '').slice(0, 2000) } }] },
  }

  let page
  if (existing) {
    const res = await fetch(`https://api.notion.com/v1/pages/${existing.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ properties: props }),
    })
    page = await res.json()
  } else {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ parent: { database_id: PROFILES_DB_ID }, properties: props }),
    })
    page = await res.json()
  }

  return NextResponse.json({ profile: pageToProfile(page) })
}
