import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN  = process.env.NOTION_TOKEN ?? ''
const NOTION_DB_ID  = 'cac5bd4fc9ef4790a84731a66c99c295'   // 🏢 物件候補リスト
const SERP_API_KEY  = process.env.SERP_API_KEY ?? ''
const CRON_SECRET   = process.env.CRON_SECRET ?? ''

const notionHeaders = () => ({
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
})

// ── URLが既にNotionに存在するか確認 ──────────────────────────────────────
async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: { property: 'URL', url: { equals: url } },
        page_size: 1,
      }),
    })
    const data = await res.json()
    return (data.results?.length ?? 0) > 0
  } catch { return false }
}

// ── Notionに物件を保存 ────────────────────────────────────────────────────
async function saveToNotion(p: {
  title: string; url: string; area: string
  description: string; source: string
}): Promise<boolean> {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        '物件名':   { title: [{ text: { content: p.title.slice(0, 200) } }] },
        'URL':      { url: p.url || null },
        'エリア':   { rich_text: [{ text: { content: p.area } }] },
        '説明':     { rich_text: [{ text: { content: p.description.slice(0, 2000) } }] },
        '検索ソース': { rich_text: [{ text: { content: p.source.slice(0, 200) } }] },
        'ステータス': { select: { name: '新着' } },
        '発見日':   { date: { start: new Date().toISOString().split('T')[0] } },
      },
    }),
  })
  return res.ok
}

// ── SerpAPI検索 ───────────────────────────────────────────────────────────
async function searchSerpAPI(query: string) {
  if (!SERP_API_KEY) return []
  const url =
    `https://serpapi.com/search.json?engine=google` +
    `&q=${encodeURIComponent(query)}` +
    `&location=Japan&hl=ja&num=10` +
    `&api_key=${SERP_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.organic_results ?? []).map((r: Record<string, string>) => ({
      title:   r.title   ?? '',
      link:    r.link    ?? '',
      snippet: r.snippet ?? '',
    }))
  } catch { return [] }
}

// ── 不動産関連ドメインフィルター ──────────────────────────────────────────
const REAL_ESTATE_DOMAINS = [
  'suumo.jp', 'athome.co.jp', 'homes.co.jp', 'chintai.com',
  'tatemono-navi.com', 'e-buken.jp', 'irent.jp', 'kanri.net',
  'fudousan.com', 'rakumachi.jp', '居抜き.jp', 'inshoku-bu.net',
  'tenpo-souken.com', 'inshokutenpo.com', 'qubit.co.jp',
  'navi.tenpo-estate.com', 'cbre.co.jp', 'jll.co.jp',
  'century21.jp', 'housecom.jp', 'remax-japan.jp',
]

const PROPERTY_KEYWORDS = [
  '物件', 'テナント', '賃貸', '居抜き', 'スケルトン', '坪', '万円',
  '店舗', '空き', 'for rent', '初期費用', '礼金', '敷金',
]

function isPropertyResult(r: { title: string; link: string; snippet: string }): boolean {
  const domain = (() => {
    try { return new URL(r.link).hostname.replace('www.', '') } catch { return '' }
  })()

  // 不動産ドメインならOK
  if (REAL_ESTATE_DOMAINS.some(d => domain.includes(d))) return true

  // タイトル・スニペットに物件キーワードが含まれればOK
  const text = `${r.title} ${r.snippet}`.toLowerCase()
  const matchCount = PROPERTY_KEYWORDS.filter(kw => text.includes(kw)).length
  return matchCount >= 2
}

// ── 検索実行 ──────────────────────────────────────────────────────────────
interface SearchConditions {
  area?:         string
  propertyType?: string
  maxRent?:      string
  keywords?:     string
}

async function runSearch(conditions: SearchConditions) {
  const area  = (conditions.area ?? '名古屋市中区 錦').trim()
  const type  = conditions.propertyType === 'どちらでも' ? '' : (conditions.propertyType ?? '居抜き')
  const extra = conditions.keywords ?? ''

  // 不動産サイト限定クエリ
  const queries = [
    `${area} 飲食店 ${type} テナント 物件 site:suumo.jp OR site:athome.co.jp OR site:homes.co.jp`.replace(/\s+/g, ' ').trim(),
    `${area} 飲食店 ${type} テナント 物件 site:tatemono-navi.com OR site:irent.jp OR site:rakumachi.jp`.replace(/\s+/g, ' ').trim(),
    `名古屋 錦 飲食店 ${type} 店舗 賃貸 ${extra}`.replace(/\s+/g, ' ').trim(),
  ]

  const newItems: string[] = []
  let searchTotal = 0
  let skippedTotal = 0

  for (const query of queries) {
    const results = await searchSerpAPI(query)
    for (const r of results) {
      if (!r.link) continue

      // 物件関連でないページはスキップ
      if (!isPropertyResult(r)) { skippedTotal++; continue }

      searchTotal++
      const exists = await urlExists(r.link)
      if (exists) continue
      const saved = await saveToNotion({
        title: r.title || '物件情報',
        url: r.link,
        area,
        description: r.snippet,
        source: `Google: ${query}`,
      })
      if (saved) newItems.push(r.title)
    }
  }

  return {
    newCount:     newItems.length,
    searchTotal,
    newProperties: newItems,
    skippedTotal,
    message: `${newItems.length}件の新着物件を保存しました（物件候補${searchTotal}件 / 非関連除外${skippedTotal}件）`,
  }
}

// ── GET: Vercel cron から毎朝呼ばれる ────────────────────────────────────
export async function GET(req: NextRequest) {
  // cron認証（CRON_SECRETが設定されている場合のみ検証）
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const result = await runSearch({})
  return NextResponse.json(result)
}

// ── POST: 管理画面から手動検索 ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const conditions: SearchConditions = await req.json().catch(() => ({}))
  const result = await runSearch(conditions)
  return NextResponse.json(result)
}
