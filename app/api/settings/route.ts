/**
 * 系统设置 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleToken } from '@/lib/auth'
import { getSettings, saveSettings } from '@/lib/kv'

/**
 * 获取设置
 */
export async function GET(request: NextRequest) {
    try {
        // 验证控制台 Token
        const token = request.headers.get('X-Console-Token')
        if (!verifyConsoleToken(token)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        const settings = await getSettings()
        return NextResponse.json(settings)
    } catch (error) {
        console.error('获取设置失败:', error)
        return NextResponse.json(
            { error: '获取设置失败' },
            { status: 500 }
        )
    }
}

/**
 * 更新设置
 */
export async function POST(request: NextRequest) {
    try {
        // 验证控制台 Token
        const token = request.headers.get('X-Console-Token')
        if (!verifyConsoleToken(token)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        const body = await request.json()
        const currentSettings = await getSettings()

        // 合并设置
        const newSettings = {
            ...currentSettings,
            ...body,
        }

        await saveSettings(newSettings)

        return NextResponse.json({
            success: true,
            settings: newSettings,
        })
    } catch (error) {
        console.error('更新设置失败:', error)
        return NextResponse.json(
            { error: '更新设置失败' },
            { status: 500 }
        )
    }
}
