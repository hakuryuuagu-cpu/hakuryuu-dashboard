export interface AIAgent {
  id: string
  name: string
  role: string
  color: string
  bgLight: string
  emoji: string
  initials: string
  isAudit?: boolean
  isCustom?: boolean
  description: string
  specialties: string[]
}

export type TaskTimeframe = 'week' | 'month' | 'year'
export type TaskStatus = '未着手' | '進行中' | '完了' | '保留'
export type TaskPriority = '高' | '中' | '低'

export interface TaskHistoryEntry {
  id: string
  date: string
  fromStatus: TaskStatus
  toStatus: TaskStatus
  note?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  timeframe: TaskTimeframe
  dueDate?: string
  category?: string
  createdAt: Date
  history?: TaskHistoryEntry[]
  completionNote?: string
}

export interface Philosophy {
  vision: string
  mission: string
  values: string[]
}

export interface ActivityMessage {
  id: string
  agentId: string
  agentName: string
  agentColor: string
  agentInitials: string
  content: string
  timestamp: Date
  isAudit?: boolean
}

export interface MinutesEntry {
  id: string
  date: string
  time: string
  participants: string[]
  summary: string
  highlights: string[]
  createdAt: Date
}

export interface AIDeliberation {
  model: 'Gemini' | 'GPT' | 'Claude'
  text: string
}

export interface QAInsights {
  questions: string[]
  improvements: string[]
  actions: string[]
  risks: string[]
}

export interface DiscussionRound {
  model: 'GPT' | 'Gemini' | 'Claude'
  label: string
  responses: Array<{ agentId: string; agentName: string; content: string }>
}

export interface QAResponse {
  agentId: string
  agentName: string
  agentColor: string
  agentInitials: string
  content: string
  type: 'opinion' | 'risk'
  isAudit?: boolean
  deliberation?: AIDeliberation[]
}

export interface QAEntry {
  id: string
  topic: string
  responses: QAResponse[]
  discussion?: DiscussionRound[]
  insights?: QAInsights
  createdAt: Date
}

export type ResearchCategory = '食べログ' | 'Google評価' | '競合調査' | '市場調査' | 'SNS・トレンド' | 'AIの回答' | 'その他'

export interface ResearchNote {
  id: string
  category: ResearchCategory
  title: string
  content: string
  source?: string
  rating?: number
  savedAt: string
}
