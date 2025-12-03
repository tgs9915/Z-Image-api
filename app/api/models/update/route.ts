/**
 * 更新模型 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleToken } from '@/lib/auth'
import { getModels, saveModels } from '@/lib/kv'

export async function POST(request: NextRequest) {
    try {
        // 验证控制台 Token
        const token = request.headers.get('X-Console-Token')
        if (!verifyConsoleToken(token)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        const body = await request.json()
        const { id, name, description, maxTokens } = body

        if (!id) {
            return NextResponse.json(
                { error: '缺少模型 ID' },
                { status: 400 }
            )
        }

        const models = await getModels()
        const index = models.findIndex(m => m.id === id)

        if (index === -1) {
            return NextResponse.json(
                { error: '模型不存在' },
                { status: 404 }
            )
        }

        // 更新模型信息
        if (name) models[index].name = name
        if (description !== undefined) models[index].description = description
        if (maxTokens) models[index].max_tokens = maxTokens

        await saveModels(models)

        return NextResponse.json({
            success: true,
            model: models[index],
        })
    } catch (error) {
        console.error('更新模型失败:', error)
        return NextResponse.json(
            { error: '更新模型失败' },
            { status: 500 }
        )
    }
}
