'use client'

import { useState, useEffect, useRef } from 'react'
import type { ResearchNote } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────
interface DailyRecord {
  id: string
  date: string
  tabelogScore: number | null
  googleScore:  number | null
  review: string
  report: string
  createdAt: Date
}

interface SNSTrend {
  tag: string
  count: string
  platform: string
  emoji: string
  note: string
}

interface SNSReport {
  id: string
  date: string
  time: string
  trends: SNSTrend[]
  comment: string
}

// ── Props ──────────────────────────────────────────────────
interface Props {
  onSaveToResearch?: (note: Partial<ResearchNote>) => void
}

// ── SNS trend data pool ────────────────────────────────────
const SNS_TREND_POOL: SNSTrend[] = [
  { tag: '#映えスイーツ',       count: '2.3万', platform: 'Instagram', emoji: '🍰', note: '新作デザートのビジュアル強化に活用可能' },
  { tag: '#ひとり飯',           count: '1.8万', platform: 'TikTok',    emoji: '🍜', note: '一人客向けメニュー・席配置の見直し検討' },
  { tag: '#糖質オフランチ',     count: '1.2万', platform: 'X',         emoji: '🥗', note: '健康志向メニューの追加提案' },
  { tag: '#地元グルメ',         count: '3.4万', platform: 'Instagram', emoji: '📍', note: '地域密着PRに積極活用' },
  { tag: '#ランチ活',           count: '5.6万', platform: 'X',         emoji: '☀️', note: 'ランチタイム集客に直結するハッシュタグ' },
  { tag: '#テイクアウトグルメ', count: '2.1万', platform: 'TikTok',    emoji: '🥡', note: 'テイクアウト需要の高まりを示す' },
  { tag: '#週末ランチ',         count: '4.7万', platform: 'Instagram', emoji: '🍽️', note: '休日の集客施策に活用' },
  { tag: '#おうちごはん風',     count: '1.5万', platform: 'Instagram', emoji: '🏠', note: '「家庭的な味」の訴求で差別化' },
  { tag: '#コスパ最高',         count: '6.2万', platform: 'X',         emoji: '💴', note: 'コストパフォーマンスを前面に打ち出す戦略' },
  { tag: '#新メニュー',         count: '8.1万', platform: 'Instagram', emoji: '✨', note: 'メニュー改訂のタイミングに合わせた投稿効果大' },
  { tag: '#定食文化',           count: '1.1万', platform: 'TikTok',    emoji: '🍱', note: '定食系コンテンツが若年層に再注目' },
  { tag: '#飲食店応援',         count: '2.8万', platform: 'X',         emoji: '🤝', note: 'ファンコミュニティ形成に活用' },
  { tag: '#スタッフ紹介',       count: '0.9万', platform: 'TikTok',    emoji: '👨‍🍳', note: 'スタッフの人柄で差別化できるコンテンツ' },
  { tag: '#フードロス削減',     count: '1.4万', platform: 'Instagram', emoji: '♻️', note: 'サステナビリティへの取り組みとしてアピール可能' },
  { tag: '#朝ごはん',           count: '3.9万', platform: 'Instagram', emoji: '🌅', note: 'モーニング展開の市場ニーズ確認' },
]

const SNS_COMMENTS = [
  '糖質オフ・健康志向トレンドが継続中。2号店メニューに低カロリー選択肢の追加を推奨します。',
  '「映え」コンテンツの需要が高まっています。商品のビジュアル改善とInstagram投稿を強化しましょう。',
  'TikTok発の「ひとり飯」ブームが拡大中。一人客に特化した席配置や限定メニューを検討する価値があります。',
  'ローカルハッシュタグ（#地元グルメ）の活用で地域密着型のPRが効果的です。近隣住民へのアプローチを強化しましょう。',
  'コスパ訴求のトレンドが続いています。「ボリューム×価格」を軸にしたメニュー展開を提案します。',
  'スタッフ紹介コンテンツがTikTokで伸びています。人物にフォーカスした投稿を試してみましょう。',
]

function generateReport(date: string, tabelog: number | null, google: number | null, review: string): string {
  const lines: string[] = []
  lines.push(`【マーケAI 評価分析レポート】${date}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('')
  lines.push('■ 本日の評価スコア')
  const entries: { label: string; val: number }[] = []
  if (tabelog !== null) { lines.push(`  食べログ: ${tabelog.toFixed(2)} ／ 5.0`); entries.push({ label: '食べログ', val: tabelog }) }
  if (google  !== null) { lines.push(`  Google:  ${google.toFixed(1)}  ／ 5.0`);  entries.push({ label: 'Google',   val: google  }) }
  if (entries.length === 0) lines.push('  スコアの入力なし')
  lines.push('')
  if (review.trim()) { lines.push('■ 口コミ・記録'); lines.push(`  「${review.trim()}」`); lines.push('') }
  lines.push('■ マーケAI 分析コメント')
  const vals = entries.map(e => e.val)
  const mean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  if (mean !== null) {
    if (mean >= 4.5)      lines.push('  ◎ 非常に高い評価を維持。SNSで積極的に発信しブランド価値向上に活用しましょう。')
    else if (mean >= 4.0) lines.push('  ○ 良好なスコアです。口コミへの返信を継続しさらなるスコアアップを目指しましょう。')
    else if (mean >= 3.5) lines.push('  △ 平均的なスコアです。口コミから改善ポイントを抽出し優先的に対応してください。')
    else                  lines.push('  ✕ スコアが低い水準です。早急な改善施策の実行を推奨します。')
    if (entries.length === 2) {
      const diff = Math.abs(entries[0].val - entries[1].val)
      if (diff >= 0.3) {
        const high = entries[0].val > entries[1].val ? entries[0] : entries[1]
        const low  = entries[0].val < entries[1].val ? entries[0] : entries[1]
        lines.push(`  → ${high.label}（${high.val.toFixed(2)}）と${low.label}（${low.val.toFixed(1)}）に${diff.toFixed(2)}の差があります。${low.label}の改善に注力しましょう。`)
      }
    }
  }
  lines.push('')
  lines.push('■ 推奨アクション')
  lines.push('  1. 各プラットフォームの口コミへ24時間以内に返信')
  lines.push('  2. 高評価ポイントをSNSコンテンツに活用')
  lines.push('  3. 来週のミーティングで改善事項を議題化')
  if (tabelog !== null && tabelog < 4.0) lines.push('  ・食べログの写真・説明文の更新を検討')
  if (google  !== null && google  < 4.0) lines.push('  ・Googleビジネスプロフィールの情報を最新化')
  return lines.join('\n')
}

function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
function todayStr() { return new Date().toLocaleDateString('ja-JP') }

// ── Component ──────────────────────────────────────────────
export default function DailyRecordTab({ onSaveToResearch }: Props) {
  const [tabelogInput, setTabelogInput] = useState('')
  const [googleInput,  setGoogleInput]  = useState('')
  const [reviewInput,  setReviewInput]  = useState('')
  const [isAnalyzing,  setIsAnalyzing]  = useState(false)
  const [isFetching,    setIsFetching]    = useState(false)
  const [fetchError,    setFetchError]    = useState<string | null>(null)
  const [reviewCount,   setReviewCount]   = useState<number | null>(null)
  const [lastFetchDate, setLastFetchDate] = useState<string | null>(null)
  const [records,    setRecords]    = useState<DailyRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [snsReport,    setSnsReport]    = useState<SNSReport | null>(null)
  const [isSnsLoading, setIsSnsLoading] = useState(false)
  // saved flash state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const snsTimerRef = useRef<NodeJS.Timeout | null>(null)

  const flashSaved = (id: string) => {
    setSavedIds(prev => new Set([...prev, id]))
    setTimeout(() => setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n }), 2000)
  }

  const fetchTabelog = async (silent = false) => {
    if (!silent) setIsFetching(true)
    setFetchError(null)
    try {
      const res  = await fetch('/api/ratings')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラー')
      if (data.tabelog !== null) {
        setTabelogInput(String(data.tabelog))
        setReviewCount(data.reviewCount)
        setLastFetchDate(todayStr())
        try { localStorage.setItem('tabelogLastFetch', todayStr()) } catch {}
      }
    } catch (e: unknown) {
      if (!silent) setFetchError(e instanceof Error ? e.message : 'エラー')
    } finally {
      if (!silent) setIsFetching(false)
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tabelogLastFetch')
      if (saved !== todayStr()) fetchTabelog(true)
      else setLastFetchDate(saved)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateSNSReport = () => {
    setIsSnsLoading(true)
    setTimeout(() => {
      setSnsReport({
        id: uid(), date: new Date().toLocaleDateString('ja-JP'),
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        trends: pickN(SNS_TREND_POOL, 5),
        comment: SNS_COMMENTS[Math.floor(Math.random() * SNS_COMMENTS.length)],
      })
      setIsSnsLoading(false)
    }, 1200)
  }

  useEffect(() => {
    generateSNSReport()
    snsTimerRef.current = setInterval(generateSNSReport, 5 * 60 * 1000)
    return () => { if (snsTimerRef.current) clearInterval(snsTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    const tabelog = tabelogInput ? parseFloat(tabelogInput) : null
    const google  = googleInput  ? parseFloat(googleInput)  : null
    if (tabelog === null && google === null && !reviewInput.trim()) return
    setIsAnalyzing(true)
    const date = todayStr()
    let report: string
    try {
      const systemPrompt =
        'あなたは「マーケAI」というAIエージェントです。飲食店「あぐー豚しゃぶ 居酒屋 はくりゅう 錦」の' +
        'マーケティング担当AIとして、評価スコアと口コミを分析し具体的なマーケティング施策を提案してください。\n' +
        'レポート形式: 【マーケAI 評価分析レポート】[日付] ■本日の評価スコア ■口コミ・記録 ■マーケAI分析コメント ■推奨アクション'
      const userMessage = [
        `日付: ${date}`,
        tabelog !== null ? `食べログ評価: ${tabelog.toFixed(2)} / 5.0` : null,
        google  !== null ? `Google評価: ${google.toFixed(1)} / 5.0`    : null,
        reviewInput.trim() ? `口コミ・メモ: ${reviewInput.trim()}`      : null,
      ].filter(Boolean).join('\n')
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userMessage }),
      })
      const data = await res.json()
      report = res.ok ? (data.content ?? generateReport(date, tabelog, google, reviewInput))
                      : generateReport(date, tabelog, google, reviewInput)
    } catch {
      report = generateReport(date, tabelog, google, reviewInput)
    }
    const record: DailyRecord = {
      id: uid(), date, tabelogScore: tabelog, googleScore: google,
      review: reviewInput.trim(), report, createdAt: new Date(),
    }
    setRecords(prev => [record, ...prev])
    setExpandedId(record.id)
    setTabelogInput(''); setGoogleInput(''); setReviewInput('')
    setIsAnalyzing(false)
  }

  // 日次レコードを調査メモに保存
  const saveRecordToResearch = (rec: DailyRecord) => {
    if (!onSaveToResearch) return
    // スコアが両方ある場合はどちらのカテゴリにするか — Google優先で分けて保存
    const scoreParts: string[] = []
    if (rec.tabelogScore !== null) scoreParts.push(`食べログ: ${rec.tabelogScore.toFixed(2)}`)
    if (rec.googleScore  !== null) scoreParts.push(`Google: ${rec.googleScore.toFixed(1)}`)
    const category = rec.googleScore !== null ? 'Google評価' : '食べログ'
    onSaveToResearch({
      category,
      title: `${rec.date} — ${scoreParts.join(' / ')}`,
      content: rec.report,
      rating: rec.tabelogScore ?? rec.googleScore ?? undefined,
      source: rec.googleScore !== null ? 'https://share.google/DsYvtUQJPPvYt8Byz' : undefined,
    })
    flashSaved(rec.id)
  }

  // SNSレポートを調査メモに保存
  const saveSNSToResearch = () => {
    if (!onSaveToResearch || !snsReport) return
    const content = [
      `【SNSトレンド調査】${snsReport.date} ${snsReport.time}`,
      '',
      ...snsReport.trends.map(t => `${t.emoji} ${t.tag}（${t.platform}・${t.count}件）\n  → ${t.note}`),
      '',
      `💡 商品開発AIコメント:\n${snsReport.comment}`,
    ].join('\n')
    onSaveToResearch({
      category: 'SNS・トレンド',
      title: `SNSトレンド ${snsReport.date}`,
      content,
    })
    flashSaved('sns')
  }

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Section 1: Daily Entry ── */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-base">📊</span>
          <span className="text-xs font-bold text-gray-700">本日の評価を記録</span>
          <span className="text-[9px] text-gray-400 ml-auto">{todayStr()}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* 食べログ */}
          <div>
            <label className="text-[9px] font-bold text-orange-600 block mb-1">🍽 食べログ</label>
            <div className="flex gap-1">
              <input type="number" min="1" max="5" step="0.01" value={tabelogInput}
                onChange={e => setTabelogInput(e.target.value)} placeholder="例: 3.38"
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300" />
              <button onClick={() => fetchTabelog(false)} disabled={isFetching} title="食べログから自動取得"
                className={`px-2 rounded-lg text-[9px] font-bold border transition-colors flex-shrink-0 ${
                  isFetching ? 'bg-orange-50 text-orange-300 border-orange-100 cursor-wait'
                             : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'}`}>
                {isFetching ? '…' : '取得'}
              </button>
            </div>
            {reviewCount !== null && !fetchError && (
              <p className="text-[8px] text-orange-500 mt-0.5">✓ {reviewCount}件の口コミから取得{lastFetchDate && <span className="text-gray-400">（{lastFetchDate}）</span>}</p>
            )}
            {fetchError && <p className="text-[8px] text-red-500 mt-0.5">⚠ {fetchError}</p>}
          </div>

          {/* Google */}
          <div>
            <label className="text-[9px] font-bold text-blue-600 block mb-1">
              🌐 Google <span className="text-[7px] text-gray-400 font-normal">（手入力）</span>
            </label>
            <input type="number" min="1" max="5" step="0.1" value={googleInput}
              onChange={e => setGoogleInput(e.target.value)} placeholder="例: 4.1"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <p className="text-[7px] text-gray-400 mt-0.5">
              <a href="https://share.google/DsYvtUQJPPvYt8Byz" target="_blank" rel="noopener noreferrer"
                className="underline hover:text-blue-500">Googleページを開く →</a>
            </p>
          </div>
        </div>

        <div className="mb-2">
          <label className="text-[9px] font-bold text-gray-600 block mb-1">💬 口コミ・気になる点のメモ</label>
          <textarea value={reviewInput} onChange={e => setReviewInput(e.target.value)}
            placeholder="印象的な口コミや改善ポイントを入力…" rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>

        <button onClick={handleSubmit}
          disabled={isAnalyzing || (!tabelogInput && !googleInput && !reviewInput.trim())}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
            isAnalyzing ? 'bg-pink-200 text-pink-600 cursor-wait'
            : (!tabelogInput && !googleInput && !reviewInput.trim()) ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm'}`}>
          {isAnalyzing ? 'マーケAIが分析中…' : '記録してマーケAIに分析させる →'}
        </button>
      </div>

      {/* ── Section 2: Past records ── */}
      {records.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-500">📋 マーケAI分析レポート ({records.length}件)</p>
          </div>
          {records.map(rec => (
            <div key={rec.id} className="border-t border-gray-100 fade-in">
              <button onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-700">{rec.date}</span>
                    {rec.tabelogScore !== null && (
                      <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">食{rec.tabelogScore.toFixed(2)}</span>
                    )}
                    {rec.googleScore !== null && (
                      <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">G{rec.googleScore.toFixed(1)}</span>
                    )}
                  </div>
                  {rec.review && <p className="text-[9px] text-gray-400 truncate mt-0.5">「{rec.review}」</p>}
                </div>
                <span className="text-[9px] text-gray-400 flex-shrink-0">{expandedId === rec.id ? '▲' : '▼'}</span>
              </button>

              {expandedId === rec.id && (
                <div className="px-3 pb-3 fade-in">
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center text-white text-[8px] font-bold">マ</div>
                      <span className="text-[9px] font-bold text-pink-700">マーケAI</span>
                      <span className="text-[8px] bg-pink-100 text-pink-600 px-1.5 rounded-full font-bold ml-auto">分析完了</span>
                    </div>
                    <pre className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{rec.report}</pre>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => navigator.clipboard.writeText(rec.report)}
                        className="text-[9px] text-pink-600 hover:text-pink-800 font-medium border border-pink-200 px-2 py-0.5 rounded-lg transition-colors">
                        📋 コピー
                      </button>
                      {onSaveToResearch && (
                        <button onClick={() => saveRecordToResearch(rec)}
                          className={`text-[9px] font-bold border px-2 py-0.5 rounded-lg transition-all ${
                            savedIds.has(rec.id)
                              ? 'bg-green-500 text-white border-green-500'
                              : 'text-indigo-600 hover:text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                          }`}>
                          {savedIds.has(rec.id) ? '✓ 保存済み' : '📌 調査メモに保存'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Section 3: SNS Trends ── */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base">📱</span>
          <span className="text-xs font-bold text-gray-700">SNSトレンド調査</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-[7px] font-bold text-green-700">商</div>
            <span className="text-[9px] text-green-700 font-medium">商品開発AI</span>
          </div>
        </div>

        {isSnsLoading ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-[10px] text-green-600">SNSをスキャン中…</span>
          </div>
        ) : snsReport ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-2 fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-green-600 font-medium">{snsReport.date} {snsReport.time} 更新</span>
              <div className="flex items-center gap-1.5">
                {onSaveToResearch && (
                  <button onClick={saveSNSToResearch}
                    className={`text-[9px] font-bold border px-2 py-0.5 rounded-lg transition-all ${
                      savedIds.has('sns')
                        ? 'bg-green-600 text-white border-green-600'
                        : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                    }`}>
                    {savedIds.has('sns') ? '✓ 保存済み' : '📌 保存'}
                  </button>
                )}
                <button onClick={generateSNSReport}
                  className="text-[9px] text-green-600 hover:text-green-800 font-medium border border-green-200 px-2 py-0.5 rounded-lg transition-colors">
                  🔄 更新
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {snsReport.trends.map((t, i) => (
                <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-2 border border-green-100">
                  <span className="text-sm flex-shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-green-700">{t.tag}</span>
                      <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 rounded-full">{t.platform}</span>
                      <span className="text-[8px] text-gray-400 ml-auto">{t.count}件</span>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed">{t.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-green-100 rounded-lg p-2">
              <p className="text-[9px] font-bold text-green-700 mb-0.5">💡 商品開発AIコメント</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">{snsReport.comment}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
