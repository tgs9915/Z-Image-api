/**
 * 移除代理 API
 * POST /api/proxy/remove
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { removeProxy } from '@/lib/proxy-pool'

interface RemoveProxyRequest {
    ip_key: string
}

export async function POST(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    try {
        const body: RemoveProxyRequest = await request.json()
        const success = await removeProxy(body.ip_key)

        return NextResponse.json({ success })
    } catch (error) {
        console.error('移除代理错误:', error)
        return NextResponse.json({
            success: false,
            error: '服务器错误'
        }, { status: 500 })
    }
}
