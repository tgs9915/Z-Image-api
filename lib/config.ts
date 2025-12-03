/**
 * 配置管理模块
 * 加载和管理系统配置
 */

// 默认 SOCKS5 代理源URL（与 Python 源码一致）
// 这些是指向代理地址列表的URL，不是代理地址本身
const DEFAULT_PROXY_SOURCES = [
    'https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/socks5/data.txt',
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt',
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
    'https://sockslist.us/Raw',
    'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-socks5.txt',
    'https://vakhov.github.io/fresh-proxy-list/socks5.txt',
]

// 服务器配置
export const config = {
    // Z-Image API
    zimage: {
        apiUrl: process.env.ZIMAGE_API_URL || 'https://mrfakename-z-image-turbo.hf.space',
        defaultHeight: 1024,
        defaultWidth: 1024,
        defaultSteps: 9,
        randomSeed: true,
    },

    // 认证
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
        consoleUsername: process.env.CONSOLE_USERNAME || 'admin',
        consolePassword: process.env.CONSOLE_PASSWORD || 'zimage@2024',
        sessionExpireHours: 24,
    },

    // API 密钥
    apiKeys: process.env.API_KEYS?.split(',').filter(Boolean) || [],

    // 基础 URL
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

    // 代理池
    proxyPool: {
        enabled: process.env.PROXY_POOL_ENABLED === 'true',
        maxDailyUses: parseInt(process.env.PROXY_POOL_MAX_DAILY || '5'),
        updateInterval: parseInt(process.env.PROXY_POOL_UPDATE_INTERVAL || '300'),
        healthCheckInterval: parseInt(process.env.PROXY_HEALTH_CHECK_INTERVAL || '120'),
        promoteThreshold: parseFloat(process.env.PROXY_PROMOTE_THRESHOLD || '5.0'),
        demoteFailCount: parseInt(process.env.PROXY_DEMOTE_FAIL_COUNT || '3'),
        verifyBeforeUse: process.env.PROXY_VERIFY_BEFORE_USE === 'true', // Default false
        verifyMaxAttempts: parseInt(process.env.PROXY_VERIFY_MAX_ATTEMPTS || '5'),
        // 代理源URL列表 - 每个URL指向一个包含代理地址(IP:PORT)的文本文件
        // 支持从环境变量 PROXY_SOURCES 配置（逗号或换行符分隔），或使用默认的7个代理源URL
        sources: process.env.PROXY_SOURCES
            ? process.env.PROXY_SOURCES.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
            : DEFAULT_PROXY_SOURCES,
    },

    // 存储
    storage: {
        urlPrefix: '/images',
    },

    // 历史记录
    history: {
        maxSize: 500,
    },
}

// 默认模型配置
export const defaultModels = {
    'Z-Image': {
        name: 'Z-Image',
        height: 1600,
        width: 896,
        steps: 9,
        description: '默认竖屏模式 9:16',
        isDefault: true,
    },
    'Z-Image-Square': {
        name: 'Z-Image-Square',
        height: 1024,
        width: 1024,
        steps: 9,
        description: '正方形 1:1',
        isDefault: true,
    },
    'Z-Image-Wide': {
        name: 'Z-Image-Wide',
        height: 896,
        width: 1600,
        steps: 9,
        description: '横屏模式 16:9',
        isDefault: true,
    },
}

// 创作提示词
export const creativeHints = [
    '🎨 正在调配色彩...',
    '✨ 灵感涌现中...',
    '🖌️ 勾勒轮廓...',
    '🌈 渲染光影...',
    '🎭 塑造细节...',
    '💫 注入灵魂...',
    '🌸 点缀氛围...',
    '🔮 融合元素...',
    '🎪 构建场景...',
    '🌙 调整明暗...',
    '🎯 精修细节...',
    '🎬 最终渲染...',
    '🖼️ 即将完成...',
]
