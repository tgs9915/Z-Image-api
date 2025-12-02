/**
 * 代理池统计 API
 * GET /api/proxy/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { getProxyStats } from '@/lib/proxy-pool'

export async function GET(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    const stats = await getProxyStats()
    return NextResponse.json(stats)
}
