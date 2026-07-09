/**
 * はくりゅう 店舗基本情報
 * ここを更新するだけで全AIエージェントのプロンプトに反映されます
 */

export const RESTAURANT_INFO = {
  // ─── 基本情報 ───────────────────────────────────────────
  name:        'あぐー豚しゃぶ 居酒屋 はくりゅう 錦',
  branch:      '1号店',
  address:     '名古屋市中区錦3-8-19 HP錦ビル3F',
  tel:         '052-954-8020',
  seats:       42,
  hours:       '月〜土 17:00〜翌3:30 / 日 17:00〜23:00',
  closedDays:  '年中無休',
  openedYear:  2015,

  // ─── コンセプト・強み ────────────────────────────────────
  concept: '名古屋・錦に位置するあぐー豚しゃぶしゃぶ専門居酒屋。沖縄ブランド豚「あぐー」の旨味を活かした鍋料理と沖縄食材のサイドメニューを提供。客単価7,000円の高単価業態。',
  strengths: [
    'あぐー豚の希少性・ブランド力（沖縄産黒豚）',
    '名古屋・錦という繁華街立地（水商売・接待需要が厚い）',
    '客単価7,000円の高単価でリピーター獲得',
    '翌3:30まで営業・夜の繁華街需要に対応',
  ],

  // ─── メニュー・価格 ──────────────────────────────────────
  avgSpendPerPerson: 7000, // 客単価（円）
  signatureMenus: [
    { name: 'あぐー豚しゃぶしゃぶ（1人前）', price: 1800, costRate: 0 }, // 原価率は原価計算表から要転記
    { name: 'あぐー豚しゃぶ食べ放題',        price: 3500, costRate: 0 },
    // ↓ 原価計算表から転記してください
    // { name: 'メニュー名', price: 価格, costRate: 原価率（例: 0.30） },
  ],
  drinkMenu: [
    { name: '生ビール',   price: 600 },
    { name: 'オリオン生', price: 600 },
    // 追加してください
  ],

  // ─── ターゲット顧客 ──────────────────────────────────────
  targetCustomers: [
    '接待・ビジネス利用（法人需要）',
    '地元サラリーマン・OL',
    '水商売・夜職の方（深夜営業対応）',
    '観光客・インバウンド',
  ],
  competitorStores: [
    // 近隣の競合店を記入してください
    // { name: '○○居酒屋', note: '客単価5,000円帯・個室あり' },
  ],

  // ─── 2号店プロジェクト ───────────────────────────────────
  project2: {
    targetArea:     '未定',
    targetOpenDate: '未定',
    targetSeats:    0,
    budget:         '未定',
    concept:        '1号店の強み（あぐー豚・高単価・深夜営業）を活かした2号店展開',
  },
} as const

/**
 * AIプロンプト注入用のサマリー文字列を生成
 */
export function getRestaurantContext(): string {
  const m = RESTAURANT_INFO
  const menuList = m.signatureMenus
    .map(item => `  ・${item.name} ¥${item.price.toLocaleString()}${item.costRate > 0 ? `（原価率${Math.round(item.costRate * 100)}%）` : ''}`)
    .join('\n')

  return `
【店舗基本情報】
店名: ${m.name}（${m.branch}）
所在地: ${m.address}
席数: ${m.seats > 0 ? `${m.seats}席` : '未設定'}
営業時間: ${m.hours}　定休: ${m.closedDays}
客単価: 約¥${m.avgSpendPerPerson.toLocaleString()}
コンセプト: ${m.concept}

【看板メニュー】
${menuList || '  （未設定）'}

【強み】
${m.strengths.map(s => `  ・${s}`).join('\n')}

【ターゲット顧客】
${m.targetCustomers.map(t => `  ・${t}`).join('\n')}

【2号店プロジェクト概要】
出店エリア: ${m.project2.targetArea}
目標: ${m.project2.targetOpenDate}オープン / ${m.project2.targetSeats > 0 ? `${m.project2.targetSeats}席` : '席数未定'} / 予算${m.project2.budget}
コンセプト: ${m.project2.concept}
`.trim()
}
