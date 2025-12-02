/**
 * KV 存储模块
 * 使用 Vercel KV (Redis) 存储持久化数据
 */

import { kv } from '@vercel/kv'

// KV 键前缀
const KEYS = {
    PROXIES_PRIORITY: 'kv:proxies:priority',
    PROXIES_PUBLIC: 'kv:proxies:public',
    MODELS: 'kv:models',
    SETTINGS: 'kv:settings',
    HISTORY: 'kv:history',
}

// ==================== 代理池存储 ====================

export interface ProxyInfo {
    url: string
    ipKey: string
    isValid: boolean
    lastCheck: number
    successCount: number
    failCount: number
    avgResponseTime: number
    usesToday: number
    lastUsedDate: string
    pool: 'priority' | 'public'
}

/**
 * 获取所有优先代理
 */
export async function getPriorityProxies(): Promise<ProxyInfo[]> {
    try {
        const data = await kv.get<ProxyInfo[]>(KEYS.PROXIES_PRIORITY)
        return data || []
    } catch (error) {
        console.error('获取优先代理失败:', error)
        return []
    }
}

/**
 * 保存优先代理
 */
export async function savePriorityProxies(proxies: ProxyInfo[]): Promise<void> {
    try {
        await kv.set(KEYS.PROXIES_PRIORITY, proxies)
    } catch (error) {
        console.error('保存优先代理失败:', error)
    }
}

/**
 * 获取所有公共代理
 */
export async function getPublicProxies(): Promise<ProxyInfo[]> {
    try {
        const data = await kv.get<ProxyInfo[]>(KEYS.PROXIES_PUBLIC)
        return data || []
    } catch (error) {
        console.error('获取公共代理失败:', error)
        return []
    }
}

/**
 * 保存公共代理
 */
export async function savePublicProxies(proxies: ProxyInfo[]): Promise<void> {
    try {
        await kv.set(KEYS.PROXIES_PUBLIC, proxies)
    } catch (error) {
        console.error('保存公共代理失败:', error)
    }
}

// ==================== 模型配置存储 ====================

export interface ModelConfig {
    name: string
    height: number
    width: number
    steps: number
    description: string
    isDefault: boolean
}

/**
 * 获取所有模型配置
 */
export async function getModels(): Promise<Record<string, ModelConfig>> {
    try {
        const data = await kv.get<Record<string, ModelConfig>>(KEYS.MODELS)
        return data || {}
    } catch (error) {
        console.error('获取模型配置失败:', error)
        return {}
    }
}

/**
 * 保存模型配置
 */
export async function saveModels(models: Record<string, ModelConfig>): Promise<void> {
    try {
        await kv.set(KEYS.MODELS, models)
    } catch (error) {
        console.error('保存模型配置失败:', error)
    }
}

// ==================== 系统设置存储 ====================

export interface Settings {
    baseUrl: string
    maxDailyUses: number
    updateInterval: number
    verifyBeforeUse: boolean
    verifyMaxAttempts: number
}

/**
 * 获取系统设置
 */
export async function getSettings(): Promise<Settings | null> {
    try {
        const data = await kv.get<Settings>(KEYS.SETTINGS)
        return data
    } catch (error) {
        console.error('获取系统设置失败:', error)
        return null
    }
}

/**
 * 保存系统设置
 */
export async function saveSettings(settings: Settings): Promise<void> {
    try {
        await kv.set(KEYS.SETTINGS, settings)
    } catch (error) {
        console.error('保存系统设置失败:', error)
    }
}

// ==================== 生成历史存储 ====================

export interface HistoryRecord {
    id: string
    prompt: string
    imageUrl: string | null
    success: boolean
    duration: number
    proxyUsed: string | null
    createdAt: string
}

/**
 * 获取生成历史
 */
export async function getHistory(limit: number = 500): Promise<HistoryRecord[]> {
    try {
        const data = await kv.get<HistoryRecord[]>(KEYS.HISTORY)
        return (data || []).slice(0, limit)
    } catch (error) {
        console.error('获取生成历史失败:', error)
        return []
    }
}

/**
 * 添加生成记录
 */
export async function addHistoryRecord(record: HistoryRecord): Promise<void> {
    try {
        const history = await getHistory()
        history.unshift(record)
        // 保持最大记录数
        const maxSize = 500
        if (history.length > maxSize) {
            history.splice(maxSize)
        }
        await kv.set(KEYS.HISTORY, history)
    } catch (error) {
        console.error('添加生成记录失败:', error)
    }
}

/**
 * 清空生成历史
 */
export async function clearHistory(): Promise<void> {
    try {
        await kv.set(KEYS.HISTORY, [])
    } catch (error) {
        console.error('清空生成历史失败:', error)
    }
}
