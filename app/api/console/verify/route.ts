/**
 * 控制台验证 API
 * GET /api/console/verify
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyConsoleAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const valid = verifyConsoleAuth(request)

    return NextResponse.json({ valid })
}
