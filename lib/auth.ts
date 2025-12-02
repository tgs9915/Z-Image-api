/**
 * 认证模块
 * 处理登录、JWT 生成和验证
 */

import jwt from 'jsonwebtoken'
import { config } from './config'
import { NextRequest } from 'next/server'

export interface JWTPayload {
    username: string
    iat: number
    exp: number
}

/**
 * 验证控制台登录凭据
 */
export function verifyCredentials(username: string, password: string): boolean {
    return (
        username === config.auth.consoleUsername &&
        password === config.auth.consolePassword
    )
}

/**
 * 生成 JWT token
 */
export function generateToken(username: string): string {
    const payload = {
        username,
        iat: Math.floor(Date.now() / 1000),
    }

    return jwt.sign(payload, config.auth.jwtSecret, {
        expiresIn: `${config.auth.sessionExpireHours}h`,
    })
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload
        return decoded
    } catch (error) {
        return null
    }
}

/**
 * 从请求头中获取并验证 token
 */
export function getTokenFromRequest(request: NextRequest): string | null {
    // 从 X-Console-Token 或 Authorization 头获取 token
    const consoleToken = request.headers.get('X-Console-Token')
    const authHeader = request.headers.get('Authorization')

    if (consoleToken) {
        return consoleToken
    }

    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    return null
}

/**
 * 验证控制台访问权限
 */
export function verifyConsoleAuth(request: NextRequest): boolean {
    const token = getTokenFromRequest(request)
    if (!token) return false

    const payload = verifyToken(token)
    return payload !== null
}

/**
 * 验证 API 密钥
 */
export function verifyApiKey(request: NextRequest): boolean {
    // 如果没有配置 API 密钥，则不验证
    if (config.apiKeys.length === 0) {
        return true
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return false

    let token: string
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
    } else {
        token = authHeader
    }

    return config.apiKeys.includes(token)
}
