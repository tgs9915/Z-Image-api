/**
 * 历史统计 API
 * GET /api/history/stats
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

    const records = await getHistory(500)
    const total = records.length
    const success = records.filter(r => r.success).length
    const failed = total - success
    const avgDuration = total > 0
        ? records.reduce((sum, r) => sum + r.duration, 0) / total
        : 0

    return NextResponse.json({
        total,
        success,
        failed,
        success_rate: total > 0 ? Math.round(success / total * 1000) / 10 : 0,
        avg_duration: Math.round(avgDuration * 100) / 100
    })
}
