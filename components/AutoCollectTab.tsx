'use client'

import { useState, useEffect } from 'react'
import type { ResearchNote, ResearchCategory } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface CollectItem {
  id: string
  name: string
  keyword: string
  category: ResearchCategory
  enabled: boolean
  lastCollectedAt?: string
}

const DEFAULT_ITEMS: CollectItem[] = [
  { id: '1', name: '競合店情報', keyword: '沖縄 居酒屋 しゃぶしゃぶ 競合店 新店情報 2025', category: '競合調査', enabled: true },
  { id: '2', name: 'SNSトレンド', keyword: '居酒屋 グルメ SNSトレンド インスタ映え 2025', category: 'SNS・トレンド', enabled: true },
  { id: '3', name: 'キーワード口コミ', keyword: 'あぐー豚 はくりゅう 沖縄 居酒屋 口コミ 評判', category: 'SNS・トレンド', enabled: true },
  { id: '4', name: '物件情報', keyword: '沖縄 那覇 飲食店 居抜き物件 テナント 2025', category: '市場調査', enabled: true },
  { id: '5', name: '人気料理トレンド', keyword: '2025 人気料理 フードトレンド 商品開発 居酒屋メニュー', category: 'SNS・トレンド', enabled: true },
  { id: '6', name: '野菜・食材価格', keyword: '沖縄 野菜 市場価格 食材コスト 仕入れ', category: '市場調査', enabled: true },
]

const STORAGE_KEY = 'hakuryuu_collect_items'

const CATEGORIES: ResearchCategory[] = ['競合調査', '市場調査', 'SNS・トレンド', 'AIの回答', 'その他']

export default function AutoCollectTab() {
  const [items, setItems] = useState<CollectItem[]>(DEFAULT_ITEMS)
  const [collecting, setCollecting] = useState<string | null>(null)
  const [isAllCollecting, setIsAllCollecting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', keyword: '', category: '市場調査' as ResearchCategory })
  const [lastCollected, setLastCollected] = useState<string | null>(null)
  const [doneIds, setDoneIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const saveNote = async (item: CollectItem, content: string) => {
    try {
      await supabase.from('research_notes').insert({
        id: `collect_${item.id}_${Date.now()}`,
        category: item.category,
        title: `【自動収集】${item.name} - ${new Date().toLocaleDateString('ja-JP')}`,
        content,
        saved_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error('Failed to save note:', e)
    }
  }

  const collectOne = async (item: CollectItem): Promise<void> => {
    setCollecting(item.id)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: item.keyword, name: item.name }),
      })
      const data = await res.json()
      if (data.content) {
        await saveNote(item, data.content)
        const now = new Date().toISOString()
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, lastCollectedAt: now } : i))
        setDoneIds(prev => [...prev, item.id])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCollecting(null)
    }
  }

  const collectAll = async () => {
    setIsAllCollecting(true)
    setDoneIds([])
    const enabled = items.filter(i => i.enabled)
    for (const item of enabled) {
      await collectOne(item)
    }
    setLastCollected(new Date().toLocaleString('ja-JP'))
    setIsAllCollecting(false)
  }

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i))
  }

  const deleteItem = (id: string) => {
    if (confirm('この項目を削除しますか？')) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  const addItem = () => {
    if (!newItem.name.trim() || !newItem.keyword.trim()) return
    const item: CollectItem = {
      id: Date.now().toString(),
      name: newItem.name.trim(),
      keyword: newItem.keyword.trim(),
      category: newItem.category,
      enabled: true,
    }
    setItems(prev => [...prev, item])
    setNewItem({ name: '', keyword: '', category: '市場調査' })
    setShowAddForm(false)
  }

  const enabledCount = items.filter(i => i.enabled).length

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="bg-indigo-50 rounded-2xl p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-indigo-700">🤖 AI自動収集</p>
            <p className="text-[10px] text-indigo-400 mt-0.5">
              {enabledCount}件が有効 · 結果は📌調査メモに保存
            </p>
            {lastCollected && (
              <p className="text-[10px] text-green-600 mt-0.5">✓ 最終収集: {lastCollected}</p>
            )}
          </div>
          <button
            onClick={collectAll}
            disabled={isAllCollecting || enabledCount === 0}
            className="px-3 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            {isAllCollecting ? '収集中...' : '▶ 今日の情報を収集'}
          </button>
        </div>

        {/* Progress bar during collection */}
        {isAllCollecting && (
          <div className="mt-2">
            <div className="h-1 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(doneIds.length / enabledCount) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-indigo-400 mt-1">{doneIds.length}/{enabledCount} 完了</p>
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={`rounded-xl p-3 border transition-all ${
              item.enabled ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
            } ${doneIds.includes(item.id) ? 'border-green-200 bg-green-50' : ''}`}
          >
            <div className="flex items-start gap-2">
              {/* Toggle */}
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 relative ${
                  item.enabled ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  item.enabled ? 'left-4' : 'left-0.5'
                }`} />
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-gray-800">{item.name}</p>
                  <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {doneIds.includes(item.id) && (
                    <span className="text-[9px] text-green-500 font-bold">✓ 完了</span>
                  )}
                  {collecting === item.id && (
                    <span className="text-[9px] text-indigo-400 animate-pulse">収集中...</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.keyword}</p>
                {item.lastCollectedAt && (
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    前回: {new Date(item.lastCollectedAt).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {item.enabled && !isAllCollecting && (
                  <button
                    onClick={() => collectOne(item)}
                    disabled={collecting === item.id}
                    className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                  >
                    {collecting === item.id ? '...' : '▶'}
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-[10px] text-gray-300 hover:text-red-400 px-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2">
          <p className="text-xs font-bold text-blue-700">＋ 新しい収集項目を追加</p>
          <div>
            <label className="text-[10px] text-gray-500 font-medium">項目名</label>
            <input
              type="text"
              placeholder="例: ランチトレンド"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="w-full text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white mt-0.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-medium">検索キーワード</label>
            <input
              type="text"
              placeholder="例: 沖縄 ランチ 人気 2025"
              value={newItem.keyword}
              onChange={e => setNewItem(p => ({ ...p, keyword: e.target.value }))}
              className="w-full text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white mt-0.5"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-medium">保存カテゴリ</label>
            <select
              value={newItem.category}
              onChange={e => setNewItem(p => ({ ...p, category: e.target.value as ResearchCategory }))}
              className="w-full text-xs border border-blue-200 rounded-lg px-2 py-1.5 bg-white mt-0.5"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={addItem}
              disabled={!newItem.name.trim() || !newItem.keyword.trim()}
              className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              追加する
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          ＋ 項目を追加
        </button>
      )}
    </div>
  )
}
