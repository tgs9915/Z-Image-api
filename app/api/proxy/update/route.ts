/**
 * 更新代理池 API
 * POST /api/proxy/update
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { fetchProxiesFromSources, addProxy } from '@/lib/proxy-pool'

export async function POST(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    try {
        // 从源拉取代理
        const proxies = await fetchProxiesFromSources()

        // 添加到公共池
        let newCount = 0
        for (const proxy of proxies) {
            const added = await addProxy(proxy, false)
            if (added) newCount++
        }

        return NextResponse.json({
            success: true,
            new_count: newCount
        })
    } catch (error) {
        console.error('更新代理池错误:', error)
        return NextResponse.json({
            success: false,
            error: '服务器错误'
        }, { status: 500 })
    }
}
