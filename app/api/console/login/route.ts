/**
 * 控制台登录 API
 * POST /api/console/login
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, generateToken } from '@/lib/auth'
import { config } from '@/lib/config'

interface LoginRequest {
    username: string
    password: string
}

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json()

        if (verifyCredentials(body.username, body.password)) {
            const token = generateToken(body.username)

            return NextResponse.json({
                success: true,
                token,
                expires_hours: config.auth.sessionExpireHours
            })
        }

        return NextResponse.json({
            success: false,
            error: '用户名或密码错误'
        }, { status: 401 })
    } catch (error) {
        console.error('登录错误:', error)
        return NextResponse.json({
            success: false,
            error: '服务器错误'
        }, { status: 500 })
    }
}
