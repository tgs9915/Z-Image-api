/**
 * 代理检测 API
 * 检测所有代理的可用性
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleToken } from '@/lib/auth'
import { getPriorityProxies, getPublicProxies, savePriorityProxies, savePublicProxies, ProxyInfo } from '@/lib/kv'

/**
 * 检测单个代理
 */
async function checkProxy(proxy: ProxyInfo): Promise<boolean> {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const startTime = Date.now()
        const response = await fetch('https://www.google.com', {
            signal: controller.signal,
            // @ts-ignore
            agent: require('socks-proxy-agent').SocksProxyAgent(proxy.url),
        })
        clearTimeout(timeout)

        const responseTime = Date.now() - startTime
        proxy.lastCheck = Date.now()
        proxy.avgResponseTime = responseTime
        proxy.isValid = response.ok

        return response.ok
    } catch (error) {
        proxy.lastCheck = Date.now()
        proxy.isValid = false
        return false
    }
}

export async function POST(request: NextRequest) {
    try {
        // 验证控制台 Token
        const token = request.headers.get('X-Console-Token')
        if (!verifyConsoleToken(token)) {
            return NextResponse.json({ error: '未授权' }, { status: 401 })
        }

        // 获取所有代理
        const priorityProxies = await getPriorityProxies()
        const publicProxies = await getPublicProxies()

        // 检测所有代理
        const checkPromises = [
            ...priorityProxies.map(p => checkProxy(p)),
            ...publicProxies.map(p => checkProxy(p)),
        ]

        await Promise.all(checkPromises)

        // 保存更新后的代理
        await savePriorityProxies(priorityProxies)
        await savePublicProxies(publicProxies)

        const validPriority = priorityProxies.filter(p => p.isValid).length
        const validPublic = publicProxies.filter(p => p.isValid).length

        return NextResponse.json({
            success: true,
            checked: priorityProxies.length + publicProxies.length,
            valid: validPriority + validPublic,
            validPriority,
            validPublic,
        })
    } catch (error) {
        console.error('代理检测失败:', error)
        return NextResponse.json(
            { error: '代理检测失败' },
            { status: 500 }
        )
    }
}
