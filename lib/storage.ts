/**
 * Blob 存储模块
 * 使用 Vercel Blob 存储图片
 */

import { put } from '@vercel/blob'
import { config } from './config'

/**
 * 上传图片到 Vercel Blob
 */
export async function uploadImage(
    imageBuffer: Buffer,
    filename: string
): Promise<string> {
    try {
        const blob = await put(filename, imageBuffer, {
            access: 'public',
            contentType: 'image/png',
        })

        return blob.url
    } catch (error) {
        console.error('上传图片到 Blob 失败:', error)
        throw new Error('图片上传失败')
    }
}

/**
 * 从 URL 下载并上传图片
 */
export async function downloadAndUploadImage(
    imageUrl: string,
    filename: string,
    proxy?: any
): Promise<string> {
    try {
        // 下载图片
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            // @ts-ignore - Node.js fetch 支持 agent
            agent: proxy,
        })

        if (!response.ok) {
            throw new Error(`下载图片失败: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 上传到 Blob
        return await uploadImage(buffer, filename)
    } catch (error) {
        console.error('下载并上传图片失败:', error)
        throw error
    }
}

/**
 * 生成带时间戳的文件名
 */
export function generateFilename(prefix: string = 'zimage'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const random = Math.random().toString(36).substring(2, 10)
    return `${prefix}_${timestamp}_${random}.png`
}
