/**
 * 清空代理池 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleToken } from '@/lib/auth'
import { clearAllProxies, clearPriorityProxies, clearPublicProxies } from '@/lib/proxy-pool'

export async function POST(request: NextRequest) {
    try {
        // 验证控制台 Token
        const token = request.headers.get('X-Console-Token')
        if (!verifyConsoleToken(token)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        const body = await request.json()
        const { pool } = body

        if (pool === 'priority') {
            await clearPriorityProxies()
        } else if (pool === 'public') {
            await clearPublicProxies()
        } else {
            await clearAllProxies()
        }

        return NextResponse.json({
            success: true,
            message: pool ? `已清空${pool === 'priority' ? '优先' : '公共'}池` : '已清空所有代理池',
        })
    } catch (error) {
        console.error('清空代理池失败:', error)
        return NextResponse.json(
            { error: '清空代理池失败' },
            { status: 500 }
        )
    }
}
