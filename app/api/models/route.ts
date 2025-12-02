/**
 * 模型配置 API
 * GET /api/models
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { getModels } from '@/lib/kv'
import { defaultModels } from '@/lib/config'

export async function GET(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    let models = await getModels()

    // 如果没有模型，初始化默认模型
    if (Object.keys(models).length === 0) {
        models = defaultModels
    }

    return NextResponse.json({
        models,
        total: Object.keys(models).length
    })
}
