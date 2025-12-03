/**
 * 模型配置 API
 * GET /api/models
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { getModels } from '@/lib/kv'

export async function GET(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    const models = await getModels()

    return NextResponse.json({
        object: 'list',
        data: models,
    })
}
