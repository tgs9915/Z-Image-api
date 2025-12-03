/**
 * 删除模型 API
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
        const { id } = body

        if (!id) {
            return NextResponse.json(
                { error: '缺少模型 ID' },
                { status: 400 }
            )
        }

        const models = await getModels()
        const filtered = models.filter(m => m.id !== id)

        if (filtered.length === models.length) {
            return NextResponse.json(
                { error: '模型不存在' },
                { status: 404 }
            )
        }

        await saveModels(filtered)

        return NextResponse.json({
            success: true,
            message: '模型已删除',
        })
    } catch (error) {
        console.error('删除模型失败:', error)
        return NextResponse.json(
            { error: '删除模型失败' },
            { status: 500 }
        )
    }
}
