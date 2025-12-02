/**
 * 清空历史 API
 * POST /api/history/clear
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { clearHistory } from '@/lib/kv'

export async function POST(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    await clearHistory()

    return NextResponse.json({ success: true })
}
