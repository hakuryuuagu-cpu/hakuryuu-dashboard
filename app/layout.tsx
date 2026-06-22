import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'バーチャルオフィス — 2店舗目出店プロジェクト',
  description: '飲食店多店舗展開チームのバーチャルオフィス',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
