import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Z-Image API - 控制台',
    description: 'Z-Image OpenAI 兼容 API 管理控制台',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    )
}
