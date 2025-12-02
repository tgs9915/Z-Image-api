/**
 * 代理池列表 API
 * GET /api/proxy/list
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'
import { getPriorityProxies, getPublicProxies } from '@/lib/kv'

export async function GET(request: NextRequest) {
    if (!verifyConsoleAuth(request)) {
        return NextResponse.json(
            { error: '未登录或 session 已过期' },
            { status: 401 }
        )
    }

    const { searchParams } = new URL(request.url)
    const pool = searchParams.get('pool') // 'priority' | 'public' | null
    const validOnly = searchParams.get('valid_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let proxies = []

    if (pool === 'priority') {
        proxies = await getPriorityProxies()
    } else if (pool === 'public') {
        proxies = await getPublicProxies()
    } else {
        const priority = await getPriorityProxies()
        const public_ = await getPublicProxies()
        proxies = [...priority, ...public_]
    }

    if (validOnly) {
        proxies = proxies.filter(p => p.isValid)
    }

    const total = proxies.length
    const slice = proxies.slice(offset, offset + limit)

    return NextResponse.json({
        proxies: slice,
        total
    })
}
