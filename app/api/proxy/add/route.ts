/**
 * 添加代理 API
 * POST /api/proxy/add
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { addProxy } from '@/lib/proxy-pool'

interface AddProxyRequest {
    proxy: string
    priority: boolean
}

export async function POST(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    try {
        const body: AddProxyRequest = await request.json()
        const success = await addProxy(body.proxy, body.priority)

        if (success) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({
                success: false,
                error: '无效的代理格式或已存在'
            })
        }
    } catch (error) {
        console.error('添加代理错误:', error)
        return NextResponse.json({
            success: false,
            error: '服务器错误'
        }, { status: 500 })
    }
}
