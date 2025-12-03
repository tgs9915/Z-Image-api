/**
 * OpenAI 兼容 API - 模型列表
 * GET /api/v1/models
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { getModels } from '@/lib/kv'

export async function GET(request: NextRequest) {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
        )
    }

    // 获取模型配置 (已经是 OpenAI 格式的数组)
    const models = await getModels()

    return NextResponse.json({
        object: 'list',
        data: models,
    })
}
