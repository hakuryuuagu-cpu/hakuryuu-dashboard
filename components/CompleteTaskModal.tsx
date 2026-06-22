'use client'

import { useState } from 'react'

interface Props {
  taskTitle: string
  onComplete: (note: string) => void
  onCancel: () => void
}

export default function CompleteTaskModal({ taskTitle, onComplete, onCancel }: Props) {
  const [note, setNote] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in"
      onClick={onCancel}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden fade-in"
        onClick={e => e.stopPropagation()}>

        <div className="bg-green-500 px-5 py-4">
          <h2 className="text-white font-bold text-base">✅ タスク完了</h2>
          <p className="text-green-100 text-xs mt-0.5 leading-snug line-clamp-2">{taskTitle}</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              完了メモ <span className="text-gray-400 font-normal">（任意）</span>
            </label>
            <p className="text-[10px] text-gray-400 mb-2">何をしたか・何が変わったかを記録しておくと後で振り返れます</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例：オーナーと物件契約を締結。手付金50万円を振込済み。次のステップは内装業者の選定。"
              rows={4}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
              キャンセル
            </button>
            <button
              onClick={() => onComplete(note.trim())}
              className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors shadow-sm">
              完了にする ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
