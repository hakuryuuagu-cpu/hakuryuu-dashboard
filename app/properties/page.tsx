'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── 型定義 ───────────────────────────────────────────────────────────────
interface Property {
  id: string
  title: string
  url: string
  area: string
  rent: string
  size: string
  seats: string
  propertyType: string
  status: '新着' | '確認済' | '問い合わせ済' | '却下'
  description: string
  source: string
  foundAt: string
  createdTime: string
}

interface SearchConditions {
  area: string
  propertyType: string
  maxRent: string
  minSize: string
  maxSize: string
  keywords: string
}

const DEFAULT_CONDITIONS: SearchConditions = {
  area: '名古屋市中区 錦',
  propertyType: '居抜き',
  maxRent: '20',
  minSize: '',
  maxSize: '',
  keywords: '',
}

const COND_KEY = 'hakuryuu_property_conditions_v1'

const STATUS_STYLE: Record<string, string> = {
  '新着':       'bg-red-100 text-red-700 border-red-200',
  '確認済':     'bg-amber-100 text-amber-700 border-amber-200',
  '問い合わせ済': 'bg-blue-100 text-blue-700 border-blue-200',
  '却下':       'bg-gray-100 text-gray-400 border-gray-200',
}

const STATUS_OPTIONS = ['新着', '確認済', '問い合わせ済', '却下'] as const

// 24時間以内か判定
function isNew(foundAt: string, createdTime: string): boolean {
  const d = new Date(createdTime || foundAt)
  return Date.now() - d.getTime() < 24 * 60 * 60 * 1000
}

// ─── 物件カード ───────────────────────────────────────────────────────────
function PropertyCard({
  property,
  onStatusChange,
  onDetailSave,
}: {
  property: Property
  onStatusChange: (id: string, status: string) => void
  onDetailSave: (id: string, data: { rent: string; size: string; seats: string; propertyType: string }) => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [rent, setRent]     = useState(property.rent)
  const [size, setSize]     = useState(property.size)
  const [seats, setSeats]   = useState(property.seats)
  const [pType, setPType]   = useState(property.propertyType)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onDetailSave(property.id, { rent, size, seats, propertyType: pType })
    setSaving(false)
    setShowDetail(false)
  }

  const hidden = property.status === '却下'

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm transition-opacity ${hidden ? 'opacity-40' : ''} ${
      isNew(property.foundAt, property.createdTime) && property.status === '新着'
        ? 'border-red-200 bg-red-50/30'
        : 'border-gray-100 bg-white'
    }`}>
      {/* ヘッダー */}
      <div className="p-4 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isNew(property.foundAt, property.createdTime) && property.status === '新着' && (
                <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  NEW
                </span>
              )}
              {property.propertyType && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  property.propertyType === '居抜き' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {property.propertyType}
                </span>
              )}
            </div>
            {property.url ? (
              <a href={property.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-bold text-indigo-700 hover:underline leading-snug line-clamp-2">
                {property.title}
              </a>
            ) : (
              <p className="text-sm font-bold text-gray-800 leading-snug">{property.title}</p>
            )}
          </div>
          {/* ステータスセレクト */}
          <select
            value={property.status}
            onChange={e => onStatusChange(property.id, e.target.value)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none flex-shrink-0 ${STATUS_STYLE[property.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 詳細メタ情報 */}
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
          {property.area     && <span>📍 {property.area}</span>}
          {property.rent     && <span>💴 {property.rent}</span>}
          {property.size     && <span>📐 {property.size}</span>}
          {property.seats    && <span>🪑 {property.seats}席</span>}
          {property.foundAt  && <span className="ml-auto">🔍 {property.foundAt}</span>}
        </div>

        {property.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{property.description}</p>
        )}
      </div>

      {/* 詳細入力トグル */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setShowDetail(v => !v)}
          className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
          {showDetail ? '▲ 閉じる' : '✏️ 詳細情報を入力'}
        </button>
      </div>

      {showDetail && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-gray-500 block mb-0.5">家賃</label>
              <input value={rent} onChange={e => setRent(e.target.value)}
                placeholder="例: 18万円" className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-500 block mb-0.5">面積</label>
              <input value={size} onChange={e => setSize(e.target.value)}
                placeholder="例: 35坪" className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-500 block mb-0.5">席数目安</label>
              <input value={seats} onChange={e => setSeats(e.target.value)}
                placeholder="例: 40" className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-500 block mb-0.5">物件タイプ</label>
              <select value={pType} onChange={e => setPType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300">
                <option value="">未選択</option>
                <option value="居抜き">居抜き</option>
                <option value="スケルトン">スケルトン</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? '保存中…' : '💾 Notionに保存'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 検索条件フォーム ─────────────────────────────────────────────────────
function ConditionsPanel({
  conditions,
  onChange,
  onSearch,
  searching,
  lastResult,
}: {
  conditions: SearchConditions
  onChange: (c: SearchConditions) => void
  onSearch: () => void
  searching: boolean
  lastResult: string
}) {
  const set = (k: Partial<SearchConditions>) => onChange({ ...conditions, ...k })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-sm">🔍 検索条件</h2>
        <p className="text-[10px] text-gray-400">毎朝9:00に自動検索されます</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-bold text-gray-600 block mb-1">エリア</label>
          <input value={conditions.area} onChange={e => set({ area: e.target.value })}
            placeholder="例: 名古屋市中区 錦"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">物件タイプ</label>
          <select value={conditions.propertyType} onChange={e => set({ propertyType: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="居抜き">居抜き限定</option>
            <option value="スケルトン">スケルトン</option>
            <option value="どちらでも">どちらでも</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">家賃上限（万円）</label>
          <input type="number" value={conditions.maxRent} onChange={e => set({ maxRent: e.target.value })}
            placeholder="例: 20"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">面積（坪・最小）</label>
          <input type="number" value={conditions.minSize} onChange={e => set({ minSize: e.target.value })}
            placeholder="例: 25"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">面積（坪・最大）</label>
          <input type="number" value={conditions.maxSize} onChange={e => set({ maxSize: e.target.value })}
            placeholder="例: 60"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-bold text-gray-600 block mb-1">追加キーワード（任意）</label>
          <input value={conditions.keywords} onChange={e => set({ keywords: e.target.value })}
            placeholder="例: 個室 深夜営業可 駐車場"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
      </div>

      {lastResult && (
        <p className="text-xs text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2">{lastResult}</p>
      )}

      <button onClick={onSearch} disabled={searching}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
          searching
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}>
        {searching ? '🔍 検索中…（SerpAPIで物件を調査）' : '🔍 今すぐ検索する'}
      </button>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [conditions, setConditions] = useState<SearchConditions>(DEFAULT_CONDITIONS)

  // localStorage から検索条件を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COND_KEY)
      if (saved) setConditions(JSON.parse(saved))
    } catch {}
  }, [])

  const saveConditions = (c: SearchConditions) => {
    setConditions(c)
    try { localStorage.setItem(COND_KEY, JSON.stringify(c)) } catch {}
  }

  // Notionから物件一覧を取得
  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/properties')
      const data = await res.json()
      setProperties(data.properties ?? [])
    } catch {
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  // 今すぐ検索
  const handleSearch = async () => {
    setSearching(true)
    setLastResult('')
    try {
      const res = await fetch('/api/property-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conditions),
      })
      const data = await res.json()
      setLastResult(data.message ?? '')
      if ((data.newCount ?? 0) > 0) await fetchProperties()
    } catch {
      setLastResult('検索中にエラーが発生しました')
    } finally {
      setSearching(false)
    }
  }

  // ステータス更新
  const handleStatusChange = async (pageId: string, status: string) => {
    setProperties(prev => prev.map(p => p.id === pageId ? { ...p, status: status as Property['status'] } : p))
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, status }),
    })
  }

  // 詳細情報保存
  const handleDetailSave = async (pageId: string, data: { rent: string; size: string; seats: string; propertyType: string }) => {
    setProperties(prev => prev.map(p => p.id === pageId ? { ...p, ...data } : p))
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, ...data }),
    })
  }

  // フィルタ
  const filtered = filterStatus === 'all'
    ? properties.filter(p => p.status !== '却下')
    : properties.filter(p => p.status === filterStatus)

  const newCount = properties.filter(p =>
    p.status === '新着' && isNew(p.foundAt, p.createdTime)
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1">
          ← ダッシュボードへ
        </Link>
        <div className="w-px h-5 bg-gray-200" />
        <h1 className="text-lg font-black text-gray-800">🏢 物件候補</h1>
        <p className="text-xs text-gray-400">名古屋市中区 錦エリア 2号店候補</p>
        {newCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
            NEW {newCount}件
          </span>
        )}
        <button onClick={fetchProperties} className="ml-auto text-xs text-gray-400 hover:text-indigo-500 transition-colors">
          ↻ 更新
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* 左: 検索条件 */}
          <div className="space-y-4">
            <ConditionsPanel
              conditions={conditions}
              onChange={saveConditions}
              onSearch={handleSearch}
              searching={searching}
              lastResult={lastResult}
            />

            {/* サマリー */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600">ステータス別</p>
              {(['新着', '確認済', '問い合わせ済', '却下'] as const).map(s => {
                const count = properties.filter(p => p.status === s).length
                return (
                  <div key={s} className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s]}`}>{s}</span>
                    <span className="text-sm font-black text-gray-700">{count}件</span>
                  </div>
                )
              })}
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">合計</span>
                <span className="text-sm font-black text-gray-700">{properties.length}件</span>
              </div>
            </div>

            {/* Notionリンク */}
            <a
              href="https://app.notion.com/p/cac5bd4fc9ef4790a84731a66c99c295"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-300 transition-colors">
              <span className="text-xl">📓</span>
              <div>
                <p className="text-xs font-bold text-gray-700">Notionで管理する</p>
                <p className="text-[10px] text-gray-400">物件候補リスト データベース</p>
              </div>
            </a>
          </div>

          {/* 右: 物件リスト */}
          <div className="space-y-4">
            {/* フィルタータブ */}
            <div className="flex gap-2 flex-wrap">
              {[['all', '却下以外'], ['新着', '新着'], ['確認済', '確認済'], ['問い合わせ済', '問い合わせ済'], ['却下', '却下']] .map(([v, l]) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                    filterStatus === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
                  {l}
                  {v !== 'all' && (
                    <span className="ml-1 text-[10px]">({properties.filter(p => p.status === v).length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* ローディング */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* 物件なし */}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-3 opacity-30">🏢</div>
                <p className="text-gray-500 font-bold mb-2">
                  {properties.length === 0 ? 'まだ物件が収集されていません' : '該当する物件がありません'}
                </p>
                <p className="text-sm text-gray-400 mb-6">「今すぐ検索する」で物件を探せます。<br />SerpAPIキーが必要です（無料枠あり）。</p>
              </div>
            )}

            {/* 物件カード */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onStatusChange={handleStatusChange}
                  onDetailSave={handleDetailSave}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
