/**
 * OpenAI 兼容 API - 模型列表
 * GET /api/v1/models
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { getModels } from '@/lib/kv'
import { defaultModels } from '@/lib/config'

export async function GET(request: NextRequest) {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
        )
    }

    // 获取模型配置
    let models = await getModels()

    // 如果没有模型，使用默认配置
    if (Object.keys(models).length === 0) {
        models = defaultModels
    }

    // 转换为 OpenAI 格式
    const modelsData = Object.values(models).map(model => ({
        id: model.name,
        object: 'model',
        created: 1700000000,
        owned_by: 'tongyi-mai',
        description: model.description,
    }))

    return NextResponse.json({
        object: 'list',
        data: modelsData,
    })
}
