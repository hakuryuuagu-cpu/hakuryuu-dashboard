/**
 * はくりゅう 店舗基本情報
 * ここを更新するだけで全AIエージェントのプロンプトに反映されます
 */

export const RESTAURANT_INFO = {
  // ─── 基本情報 ───────────────────────────────────────────
  name:        'あぐー豚しゃぶ 居酒屋 はくりゅう 錦',
  branch:      '1号店',
  address:     '那覇市○○ ○-○-○',          // ← 要記入
  tel:         '098-XXX-XXXX',              // ← 要記入
  seats:       0,                           // ← 席数を数字で（例: 30）
  hours:       '17:00〜24:00（L.O. 23:30）', // ← 要確認
  closedDays:  '不定休',                    // ← 要確認
  openedYear:  2020,                        // ← 開業年

  // ─── コンセプト・強み ────────────────────────────────────
  concept: 'あぐー豚しゃぶしゃぶ専門の居酒屋。沖縄ブランド豚「あぐー」の旨味を活かした出汁と、沖縄食材を使ったサイドメニューが特徴。',
  strengths: [
    'あぐー豚の希少性・ブランド力',
    '沖縄産食材にこだわったメニュー',
    // 他の強みを追加してください
  ],

  // ─── メニュー・価格 ──────────────────────────────────────
  avgSpendPerPerson: 3500, // 客単価（円）
  signatureMenus: [
    { name: 'あぐー豚しゃぶしゃぶ（1人前）', price: 1800, costRate: 0 }, // costRate: 原価率（例: 0.32 = 32%）
    { name: 'あぐー豚しゃぶ食べ放題',        price: 3500, costRate: 0 },
    // 他のメニューを追加してください
    // { name: 'もずく天ぷら', price: 500, costRate: 0.20 },
    // { name: 'ゴーヤチャンプルー', price: 680, costRate: 0 },
  ],
  drinkMenu: [
    { name: '生ビール',  price: 550 },
    { name: 'オリオン生', price: 500 },
    // 追加してください
  ],

  // ─── ターゲット顧客 ──────────────────────────────────────
  targetCustomers: [
    '観光客（県外・海外）',
    '地元常連客',
    // 追加してください（例: 'ビジネス接待利用', '家族連れ'）
  ],
  competitorStores: [
    // 近隣の競合店を記入してください
    // { name: '○○居酒屋', note: '客単価4,000円帯・個室あり' },
  ],

  // ─── 2号店プロジェクト ───────────────────────────────────
  project2: {
    targetArea:     '那覇市内',
    targetOpenDate: '2025年内',
    targetSeats:    0,                        // ← 目標席数
    budget:         '未定',                   // ← 出店予算（例: '3,000万円'）
    concept:        '1号店の強みを活かしながら、接待・記念日需要も取り込む上位業態',
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
