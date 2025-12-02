/**
 * 生成历史 API
 * GET /api/history
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { getHistory } from '@/lib/kv'

export async function GET(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const records = await getHistory(limit)

    return NextResponse.json({
        records,
        total: records.length
    })
}
