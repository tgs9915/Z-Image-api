/**
 * Z-Image API 调用模块
 * 调用 Z-Image Turbo API 生成图片
 */

import { config, creativeHints } from './config'
import { getProxy, markProxySuccess, markProxyFailed, createProxyAgent } from './proxy-pool'
import { downloadAndUploadImage, generateFilename } from './storage'
import { addHistoryRecord, HistoryRecord } from './kv'
import { ProxyInfo } from './kv'

/**
 * 生成随机 User-Agent
 */
function getRandomUserAgent(): string {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ]
    return userAgents[Math.floor(Math.random() * userAgents.length)]
}

/**
 * 生成伪造 IP 地址
 */
function generateFakeIp(): string {
    return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
}

/**
 * 获取请求头
 */
function getHeaders(): Record<string, string> {
    const fakeIp = generateFakeIp()
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': getRandomUserAgent(),
        'X-Forwarded-For': fakeIp,
        'X-Real-IP': fakeIp,
        'X-Client-IP': fakeIp,
    }
}

/**
 * 生成图片的核心逻辑
 */
async function doGenerate(
    prompt: string,
    height: number,
    width: number,
    steps: number,
    proxyInfo: ProxyInfo | null
): Promise<string | null> {
    const startTime = Date.now()

    try {
        const callUrl = `${config.zimage.apiUrl}/gradio_api/call/generate_image`

        // 生成随机种子
        const seed = Math.floor(Math.random() * 999999999)
        const randomizeSeed = true

        const payload = {
            data: [prompt, height, width, steps, seed, randomizeSeed]
        }

        console.log(`生成参数: height=${height}, width=${width}, steps=${steps}, seed=${seed}`)

        // 配置代理
        const fetchOptions: any = {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
            // @ts-ignore - Node.js fetch 支持 signal
            signal: AbortSignal.timeout(60000),
        }

        if (proxyInfo) {
            fetchOptions.agent = createProxyAgent(proxyInfo)
        }

        // 提交生成请求
        console.log('正在提交生成请求...')
        const response = await fetch(callUrl, fetchOptions)

        if (!response.ok) {
            console.error(`生成请求失败: ${response.status}`)
            return null
        }

        const result = await response.json()
        const eventId = result.event_id

        if (!eventId) {
            console.error('未获取到 event_id')
            return null
        }

        // 获取结果
        const resultUrl = `${config.zimage.apiUrl}/gradio_api/call/generate_image/${eventId}`
        const sseHeaders = { ...getHeaders(), Accept: 'text/event-stream' }

        const sseOptions: any = {
            headers: sseHeaders,
            // @ts-ignore
            signal: AbortSignal.timeout(180000),
        }

        if (proxyInfo) {
            sseOptions.agent = createProxyAgent(proxyInfo)
        }

        const sseResponse = await fetch(resultUrl, sseOptions)

        if (!sseResponse.ok) {
            console.error(`获取结果失败: ${sseResponse.status}`)
            return null
        }

        // 解析 SSE 流
        let imageUrl: string | null = null
        const text = await sseResponse.text()
        const lines = text.split('\n')

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim()
                if (dataStr === 'null' || dataStr === '') continue

                try {
                    const data = JSON.parse(dataStr)
                    console.log('SSE 数据:', JSON.stringify(data).substring(0, 500))

                    if (Array.isArray(data) && data.length >= 1) {
                        const firstItem = data[0]
                        if (typeof firstItem === 'string') {
                            imageUrl = firstItem
                        } else if (typeof firstItem === 'object' && firstItem !== null) {
                            imageUrl = firstItem.url || firstItem.path
                        }

                        if (imageUrl) {
                            console.log('解析到图片 URL:', imageUrl.substring(0, 150))
                            break
                        }
                    }
                } catch (error) {
                    // 忽略 JSON 解析错误
                }
            }
        }

        if (!imageUrl) {
            console.error('未获取到图片 URL')
            return null
        }

        // 下载并上传图片到 Blob 存储
        console.log('正在下载并上传图片...')
        const filename = generateFilename()
        const proxyAgent = proxyInfo ? createProxyAgent(proxyInfo) : undefined
        const blobUrl = await downloadAndUploadImage(imageUrl, filename, proxyAgent)

        console.log('图片已保存到 Blob:', blobUrl)

        // 标记代理成功
        if (proxyInfo) {
            const elapsed = (Date.now() - startTime) / 1000
            await markProxySuccess(proxyInfo, elapsed)
        }

        return blobUrl
    } catch (error) {
        console.error('生成图片出错:', error)

        // 标记代理失败
        if (proxyInfo) {
            await markProxyFailed(proxyInfo)
        }

        return null
    }
}

/**
 * 生成图片（带重试）
 */
export async function generateImage(
    prompt: string,
    height: number = config.zimage.defaultHeight,
    width: number = config.zimage.defaultWidth,
    steps: number = config.zimage.defaultSteps,
    maxRetries: number = 3
): Promise<string | null> {
    const totalStartTime = Date.now()
    let lastProxyUsed = '直连'

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        console.log(`生成图片 (尝试 ${attempt + 1}/${maxRetries}), 提示词: ${prompt.substring(0, 50)}...`)

        // 获取代理
        let proxyInfo: ProxyInfo | null = null
        if (config.proxyPool.enabled) {
            proxyInfo = await getProxy()
            if (proxyInfo) {
                lastProxyUsed = proxyInfo.ipKey
                console.log(`使用代理: ${proxyInfo.ipKey}`)
            } else {
                console.log('未获取到可用代理，使用直连')
            }
        }

        // 执行生成
        const result = await doGenerate(prompt, height, width, steps, proxyInfo)

        if (result) {
            // 记录成功
            const duration = (Date.now() - totalStartTime) / 1000
            const record: HistoryRecord = {
                id: Math.random().toString(36).substring(2, 10),
                prompt,
                imageUrl: result,
                success: true,
                duration: Math.round(duration * 100) / 100,
                proxyUsed: lastProxyUsed,
                createdAt: new Date().toISOString(),
            }
            await addHistoryRecord(record)

            return result
        }

        // 重试前等待
        if (attempt < maxRetries - 1) {
            const waitTime = 3 + attempt * 2
            console.log(`生成失败，${waitTime}秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
        }
    }

    // 记录失败
    const duration = (Date.now() - totalStartTime) / 1000
    const record: HistoryRecord = {
        id: Math.random().toString(36).substring(2, 10),
        prompt,
        imageUrl: null,
        success: false,
        duration: Math.round(duration * 100) / 100,
        proxyUsed: lastProxyUsed,
        createdAt: new Date().toISOString(),
    }
    await addHistoryRecord(record)

    console.error(`生成失败，已重试 ${maxRetries} 次`)
    return null
}

/**
 * 获取随机创作提示
 */
export function getRandomHints(count: number = 8): string[] {
    const shuffled = [...creativeHints].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
}
