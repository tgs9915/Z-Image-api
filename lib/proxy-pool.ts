/**
 * 代理池管理模块
 * 管理 SOCKS5 代理，支持优先池和公共池
 */

import { SocksProxyAgent } from 'socks-proxy-agent'
import {
    ProxyInfo,
    getPriorityProxies,
    savePriorityProxies,
    getPublicProxies,
    savePublicProxies,
} from './kv'
import { config } from './config'

/**
 * 解析代理 URL
 */
function parseProxyUrl(proxyUrl: string): { ip: string; port: number } | null {
    try {
        // 支持格式: socks5://ip:port 或 ip:port
        const match = proxyUrl.match(/(?:socks5:\/\/)?(.+):(\d+)/)
        if (match) {
            return { ip: match[1], port: parseInt(match[2]) }
        }
    } catch (error) {
        console.error('解析代理 URL 失败:', proxyUrl, error)
    }
    return null
}

/**
 * 生成代理 IP 键
 */
function generateIpKey(proxyUrl: string): string {
    const parsed = parseProxyUrl(proxyUrl)
    return parsed ? `${parsed.ip}:${parsed.port}` : proxyUrl
}

/**
 * 格式化代理 URL
 */
function formatProxyUrl(proxyUrl: string): string {
    if (proxyUrl.startsWith('socks5://')) {
        return proxyUrl
    }
    return `socks5://${proxyUrl}`
}

/**
 * 创建代理信息对象
 */
function createProxyInfo(proxyUrl: string, pool: 'priority' | 'public'): ProxyInfo {
    const formattedUrl = formatProxyUrl(proxyUrl)
    return {
        url: formattedUrl,
        ipKey: generateIpKey(proxyUrl),
        isValid: false,
        lastCheck: 0,
        successCount: 0,
        failCount: 0,
        avgResponseTime: 0,
        usesToday: 0,
        lastUsedDate: new Date().toISOString().split('T')[0],
        pool,
    }
}

/**
 * 从代理源拉取代理地址列表
 * 
 * 代理源 (Proxy Source): URL，指向包含代理地址列表的文本文件
 * 代理地址 (Proxy Address): 具体的代理服务器，格式为 IP:PORT
 * 
 * @returns 代理地址数组，例如 ['1.2.3.4:1080', '5.6.7.8:1080']
 */
export async function fetchProxiesFromSources(): Promise<string[]> {
    const proxies: Set<string> = new Set()

    for (const source of config.proxyPool.sources) {
        try {
            console.log(`正在拉取代理源: ${source}`)
            const response = await fetch(source, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            })

            if (!response.ok) {
                console.warn(`拉取代理源失败 [${response.status}]: ${source}`)
                continue
            }

            const text = await response.text()
            const lines = text.split('\n')

            for (const line of lines) {
                const trimmed = line.trim()
                // 匹配 IP:PORT 格式
                if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(trimmed)) {
                    proxies.add(trimmed)
                }
            }
        } catch (error) {
            console.error(`拉取代理源异常: ${source}`, error)
        }
    }

    const result = Array.from(proxies)
    console.log(`总共拉取到 ${result.length} 个代理`)
    return result
}

/**
 * 获取可用代理（支持自动初始化）
 */
export async function getProxy(): Promise<ProxyInfo | null> {
    // 优先从优先池获取
    const priorityProxies = await getPriorityProxies()
    const validPriority = priorityProxies.filter(p => p.isValid)

    if (validPriority.length > 0) {
        // 随机选择一个
        const proxy = validPriority[Math.floor(Math.random() * validPriority.length)]

        // 检查每日使用次数
        const today = new Date().toISOString().split('T')[0]
        if (proxy.lastUsedDate !== today) {
            proxy.usesToday = 0
            proxy.lastUsedDate = today
        }

        if (proxy.usesToday < config.proxyPool.maxDailyUses) {
            return proxy
        }
    }

    // 从公共池获取
    const publicProxies = await getPublicProxies()
    const validPublic = publicProxies.filter(p => p.isValid)

    if (validPublic.length > 0) {
        const proxy = validPublic[Math.floor(Math.random() * validPublic.length)]

        const today = new Date().toISOString().split('T')[0]
        if (proxy.lastUsedDate !== today) {
            proxy.usesToday = 0
            proxy.lastUsedDate = today
        }

        if (proxy.usesToday < config.proxyPool.maxDailyUses) {
            return proxy
        }
    }

    // 如果代理池完全为空，尝试自动初始化（首次使用或池被清空）
    if (priorityProxies.length === 0 && publicProxies.length === 0) {
        console.log('代理池为空，正在自动拉取代理...')
        try {
            const proxies = await fetchProxiesFromSources()
            console.log(`自动拉取到 ${proxies.length} 个代理`)

            // 添加到公共池
            let addedCount = 0
            for (const proxyUrl of proxies.slice(0, 100)) { // 只添加前100个，避免太慢
                const added = await addProxy(proxyUrl, false)
                if (added) addedCount++
            }

            console.log(`自动初始化：成功添加 ${addedCount} 个代理到公共池`)

            // 递归调用一次来返回代理
            if (addedCount > 0) {
                return await getProxy()
            }
        } catch (error) {
            console.error('自动初始化代理池失败:', error)
        }
    }

    return null
}

/**
 * 标记代理成功
 */
export async function markProxySuccess(proxyInfo: ProxyInfo, responseTime: number): Promise<void> {
    proxyInfo.successCount++
    proxyInfo.usesToday++
    proxyInfo.lastUsedDate = new Date().toISOString().split('T')[0]

    // 更新平均响应时间
    if (proxyInfo.avgResponseTime === 0) {
        proxyInfo.avgResponseTime = responseTime
    } else {
        proxyInfo.avgResponseTime = (proxyInfo.avgResponseTime + responseTime) / 2
    }

    // 如果是公共池代理且响应时间优秀，提升到优先池
    if (
        proxyInfo.pool === 'public' &&
        responseTime < config.proxyPool.promoteThreshold &&
        proxyInfo.successCount >= 2
    ) {
        await promoteToPriority(proxyInfo)
    } else {
        // 保存更新
        await saveProxyInfo(proxyInfo)
    }
}

/**
 * 标记代理失败
 */
export async function markProxyFailed(proxyInfo: ProxyInfo): Promise<void> {
    proxyInfo.failCount++

    // 如果是优先池代理且连续失败，从优先池移除
    if (
        proxyInfo.pool === 'priority' &&
        proxyInfo.failCount >= config.proxyPool.demoteFailCount
    ) {
        await demoteFromPriority(proxyInfo)
    } else {
        // 如果失败次数过多，标记为无效
        if (proxyInfo.failCount >= 5) {
            proxyInfo.isValid = false
        }
        await saveProxyInfo(proxyInfo)
    }
}

/**
 * 提升到优先池
 */
async function promoteToPriority(proxyInfo: ProxyInfo): Promise<void> {
    // 从公共池移除
    const publicProxies = await getPublicProxies()
    const filtered = publicProxies.filter(p => p.ipKey !== proxyInfo.ipKey)
    await savePublicProxies(filtered)

    // 添加到优先池
    proxyInfo.pool = 'priority'
    proxyInfo.failCount = 0
    const priorityProxies = await getPriorityProxies()
    priorityProxies.push(proxyInfo)
    await savePriorityProxies(priorityProxies)

    console.log(`代理提升到优先池: ${proxyInfo.ipKey}`)
}

/**
 * 从优先池降级
 */
async function demoteFromPriority(proxyInfo: ProxyInfo): Promise<void> {
    // 从优先池移除
    const priorityProxies = await getPriorityProxies()
    const filtered = priorityProxies.filter(p => p.ipKey !== proxyInfo.ipKey)
    await savePriorityProxies(filtered)

    console.log(`代理从优先池移除: ${proxyInfo.ipKey}`)
}

/**
 * 保存代理信息
 */
async function saveProxyInfo(proxyInfo: ProxyInfo): Promise<void> {
    if (proxyInfo.pool === 'priority') {
        const proxies = await getPriorityProxies()
        const index = proxies.findIndex(p => p.ipKey === proxyInfo.ipKey)
        if (index >= 0) {
            proxies[index] = proxyInfo
            await savePriorityProxies(proxies)
        }
    } else {
        const proxies = await getPublicProxies()
        const index = proxies.findIndex(p => p.ipKey === proxyInfo.ipKey)
        if (index >= 0) {
            proxies[index] = proxyInfo
            await savePublicProxies(proxies)
        }
    }
}

/**
 * 添加代理
 */
export async function addProxy(proxyUrl: string, priority: boolean = false): Promise<boolean> {
    const parsed = parseProxyUrl(proxyUrl)
    if (!parsed) {
        return false
    }

    const proxyInfo = createProxyInfo(proxyUrl, priority ? 'priority' : 'public')

    if (priority) {
        const proxies = await getPriorityProxies()
        // 检查是否已存在
        if (proxies.some(p => p.ipKey === proxyInfo.ipKey)) {
            return false
        }
        proxies.push(proxyInfo)
        await savePriorityProxies(proxies)
    } else {
        const proxies = await getPublicProxies()
        if (proxies.some(p => p.ipKey === proxyInfo.ipKey)) {
            return false
        }
        proxies.push(proxyInfo)
        await savePublicProxies(proxies)
    }

    return true
}

/**
 * 移除代理
 */
export async function removeProxy(ipKey: string): Promise<boolean> {
    // 从优先池移除
    const priorityProxies = await getPriorityProxies()
    const filteredPriority = priorityProxies.filter(p => p.ipKey !== ipKey)
    if (filteredPriority.length !== priorityProxies.length) {
        await savePriorityProxies(filteredPriority)
        return true
    }

    // 从公共池移除
    const publicProxies = await getPublicProxies()
    const filteredPublic = publicProxies.filter(p => p.ipKey !== ipKey)
    if (filteredPublic.length !== publicProxies.length) {
        await savePublicProxies(filteredPublic)
        return true
    }

    return false
}

/**
 * 创建 SOCKS5 代理 Agent
 */
export function createProxyAgent(proxyInfo: ProxyInfo): any {
    return new SocksProxyAgent(proxyInfo.url)
}

/**
 * 获取代理池统计
 */
export async function getProxyStats() {
    const priorityProxies = await getPriorityProxies()
    const publicProxies = await getPublicProxies()

    const total = priorityProxies.length + publicProxies.length
    const validPriority = priorityProxies.filter(p => p.isValid).length
    const validPublic = publicProxies.filter(p => p.isValid).length
    const valid = validPriority + validPublic

    const today = new Date().toISOString().split('T')[0]
    const availableToday = [...priorityProxies, ...publicProxies].filter(
        p => p.isValid && (p.lastUsedDate !== today || p.usesToday < config.proxyPool.maxDailyUses)
    ).length

    return {
        total,
        valid,
        validPriority,
        validPublic,
        availableToday,
        priorityCount: priorityProxies.length,
        publicCount: publicProxies.length,
    }
}

/**
 * 清空所有代理池
 */
export async function clearAllProxies(): Promise<void> {
    await savePriorityProxies([])
    await savePublicProxies([])
}

/**
 * 清空优先池
 */
export async function clearPriorityProxies(): Promise<void> {
    await savePriorityProxies([])
}

/**
 * 清空公共池
 */
export async function clearPublicProxies(): Promise<void> {
    await savePublicProxies([])
}
