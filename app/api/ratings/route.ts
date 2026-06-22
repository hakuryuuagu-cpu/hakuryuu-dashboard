import { NextResponse } from 'next/server'

const TABELOG_URL = 'https://tabelog.com/aichi/A2301/A230103/23063617/'

export async function GET() {
  try {
    const res = await fetch(TABELOG_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja-JP,ja;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 }, // cache 1 hour
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `食べログへのアクセスに失敗 (HTTP ${res.status})` },
        { status: 502 }
      )
    }

    const html = await res.text()

    // og:description に "★★★☆☆3.38 ■..." の形式で含まれる
    const ratingMatch = html.match(/★[★☆]*\s*(\d+\.\d+)/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null

    // "口コミ 138 人" の形式
    const reviewMatch = html.match(/口コミ\D*?(\d+)\s*人/)
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null

    if (rating === null) {
      return NextResponse.json(
        { error: 'ページから評価点数を取得できませんでした' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tabelog: rating,
      reviewCount,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { error: `通信エラー: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    )
  }
}
