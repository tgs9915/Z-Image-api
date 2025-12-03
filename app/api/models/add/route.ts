/**
 * 添加模型 API
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

        if (!id || !name) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            )
        }

        const models = await getModels()

        // 检查模型是否已存在
        if (models.some(m => m.id === id)) {
            return NextResponse.json(
                { error: '模型 ID 已存在' },
                { status: 400 }
            )
        }

        const newModel = {
            id,
            object: 'model',
            created: Math.floor(Date.now() / 1000),
            owned_by: 'z-image',
            name,
            description: description || '',
            max_tokens: maxTokens || 4096,
        }

        models.push(newModel)
        await saveModels(models)

        return NextResponse.json({
            success: true,
            model: newModel,
        })
    } catch (error) {
        console.error('添加模型失败:', error)
        return NextResponse.json(
            { error: '添加模型失败' },
            { status: 500 }
        )
    }
}
