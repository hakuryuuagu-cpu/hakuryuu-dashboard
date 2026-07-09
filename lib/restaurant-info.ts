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
    // 【鍋】
    { category: '鍋',    name: 'あぐー豚しゃぶしゃぶ 2人前',      price: 4545, costRate: 0.1364 },
    { category: '鍋',    name: '蛤×あぐー豚しゃぶしゃぶ 2人前',   price: 8000, costRate: 0.3312 },
    // 【一品】
    { category: '一品',  name: 'あぐー冷しゃぶサラダ',            price: 1700, costRate: 0.3412 },
    { category: '一品',  name: 'あぐー豚の回鍋肉',                price:  863, costRate: 0.4068 },
    { category: '一品',  name: '天使エビとアボカドサラダ',         price: 1700, costRate: 0.3943 },
    { category: '一品',  name: 'アスパラベーコン',                 price:  900, costRate: 0.5049 },
    // 【おつまみ】
    { category: 'おつまみ', name: 'クリームチーズ醤油漬け',       price:  654, costRate: 0.1262 },
    { category: 'おつまみ', name: 'パリパリピーマン',             price:  427, costRate: 0.1874 },
    { category: 'おつまみ', name: 'トマトスライス',               price:  545, costRate: 0.2064 },
    { category: 'おつまみ', name: 'チャンジャクリームチーズ',     price:  772, costRate: 0.2580 },
    { category: 'おつまみ', name: 'チャンジャ',                   price:  545, costRate: 0.2696 },
    { category: 'おつまみ', name: 'トマトのカプレーゼ',           price:  754, costRate: 0.3930 },
    // 【揚げ物】
    { category: '揚げ物', name: '塩フライドポテト',               price:  545, costRate: 0.3547 },
    { category: '揚げ物', name: 'アンチョビフライドポテト',       price:  545, costRate: 0.3897 },
    // 【ご飯】
    { category: 'ご飯',  name: '沖縄そば',                        price:  872, costRate: 0.1753 },
    { category: 'ご飯',  name: 'うーどんチャンプルー',            price:  836, costRate: 0.4943 },
    // 【デザート】
    { category: 'デザート', name: 'ソフトクリーム プレミアムバニラ', price: 500, costRate: 0.2460 },
  ],
  drinkMenu: [
    { name: '生ビール',   price: 600 },
    { name: 'オリオン生', price: 600 },
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

  // カテゴリ別にまとめる
  const categories = [...new Set(m.signatureMenus.map(i => (i as { category?: string; name: string; price: number; costRate: number }).category ?? 'その他'))]
  const menuByCategory = categories.map(cat => {
    const items = m.signatureMenus
      .filter(i => ((i as { category?: string }).category ?? 'その他') === cat)
      .map(i => `    ・${i.name} ¥${i.price.toLocaleString()}（原価率${Math.round(i.costRate * 100)}%）`)
      .join('\n')
    return `  【${cat}】\n${items}`
  }).join('\n')

  return `
【店舗基本情報】
店名: ${m.name}（${m.branch}）
所在地: ${m.address}　TEL: ${m.tel}
席数: ${m.seats}席　開業: ${m.openedYear}年
営業時間: ${m.hours}　定休: ${m.closedDays}
客単価: 約¥${m.avgSpendPerPerson.toLocaleString()}
コンセプト: ${m.concept}

【現在のメニューと原価率】
${menuByCategory}

【強み】
${m.strengths.map(s => `  ・${s}`).join('\n')}

【ターゲット顧客】
${m.targetCustomers.map(t => `  ・${t}`).join('\n')}

【2号店プロジェクト概要】
出店エリア: ${m.project2.targetArea}　目標: ${m.project2.targetOpenDate}
コンセプト: ${m.project2.concept}
`.trim()
}
