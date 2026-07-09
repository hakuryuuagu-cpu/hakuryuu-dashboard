/**
 * 社員プロフィール — 型定義 & localStorage ヘルパー
 * AIが目標提案時にこの情報を参照します
 */

export interface MemberProfile {
  memberId: string
  jobTitle: string      // 役職（例: ホールリーダー、キッチン担当）
  joinedDate: string    // 入社年月 YYYY-MM
  strengths: string     // 強み・得意なこと
  challenges: string    // 課題・成長ポイント
  notes: string         // 自由メモ（AIに伝えたいこと何でも）
  updatedAt: string     // 最終更新 ISO string
}

const STORAGE_KEY = 'hakuryuu_member_profiles_v1'

export function loadProfiles(): MemberProfile[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch { return [] }
}

export function saveProfiles(profiles: MemberProfile[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function getProfile(memberId: string): MemberProfile | undefined {
  return loadProfiles().find(p => p.memberId === memberId)
}

export function upsertProfile(profile: MemberProfile): void {
  const all = loadProfiles()
  const idx = all.findIndex(p => p.memberId === profile.memberId)
  if (idx >= 0) all[idx] = profile
  else all.push(profile)
  saveProfiles(all)
}

/** AIプロンプト用のプロフィール文字列を生成 */
export function profileToText(profile: MemberProfile, memberName: string): string {
  const lines: string[] = [`【${memberName}のプロフィール】`]
  if (profile.jobTitle)   lines.push(`役職: ${profile.jobTitle}`)
  if (profile.joinedDate) lines.push(`入社: ${profile.joinedDate}`)
  if (profile.strengths)  lines.push(`強み・得意: ${profile.strengths}`)
  if (profile.challenges) lines.push(`課題・成長ポイント: ${profile.challenges}`)
  if (profile.notes)      lines.push(`備考: ${profile.notes}`)
  return lines.join('\n')
}
