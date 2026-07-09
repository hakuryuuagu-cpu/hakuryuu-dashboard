/**
 * 目標管理 — 型定義 & localStorage ヘルパー
 * 全AIエージェント・人間メンバーの KPI目標・行動目標を管理します
 */

export type GoalType   = 'kpi' | 'action'
export type GoalPeriod = 'monthly' | 'quarterly' | 'annual'
export type GoalStatus = 'active' | 'completed' | 'paused'

export interface Milestone {
  id: string
  text: string
  done: boolean
}

export interface Goal {
  id: string
  type: GoalType
  title: string
  description?: string
  assigneeId: string
  assigneeName: string
  period: GoalPeriod
  dueDate?: string         // YYYY-MM-DD
  status: GoalStatus
  createdAt: string        // ISO string

  // KPI目標のみ
  targetValue?: number
  currentValue?: number
  unit?: string            // 例: '円', '人', '%', '件'

  // 行動目標のみ
  milestones?: Milestone[]
}

const STORAGE_KEY = 'hakuryuu_goals_v1'

export function loadGoals(): Goal[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export function calcProgress(goal: Goal): number {
  if (goal.type === 'kpi') {
    if (!goal.targetValue) return 0
    return Math.min(100, Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100))
  } else {
    const ms = goal.milestones ?? []
    if (ms.length === 0) return 0
    return Math.round((ms.filter(m => m.done).length / ms.length) * 100)
  }
}

export const PERIOD_LABEL: Record<GoalPeriod, string> = {
  monthly:   '月次',
  quarterly: '四半期',
  annual:    '年次',
}

export const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: 'monthly',   label: '月次目標' },
  { value: 'quarterly', label: '四半期目標' },
  { value: 'annual',    label: '年次目標' },
]
