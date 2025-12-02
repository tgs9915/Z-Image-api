'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './dashboard.css'

interface ProxyStats {
    total: number
    valid: number
    validPriority: number
    validPublic: number
    availableToday: number
    priorityCount: number
    publicCount: number
}

interface HistoryStats {
    total: number
    success: number
    failed: number
    success_rate: number
    avg_duration: number
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [proxyStats, setProxyStats] = useState<ProxyStats | null>(null)
    const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        loadStats()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) {
            router.push('/')
            return
        }

        try {
            const response = await fetch('/api/console/verify', {
                headers: {
                    'X-Console-Token': token,
                },
            })
            const data = await response.json()
            if (!data.valid) {
                localStorage.removeItem('console_token')
                router.push('/')
            }
        } catch (error) {
            console.error('验证失败:', error)
            router.push('/')
        }
    }

    const loadStats = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const [proxyRes, historyRes] = await Promise.all([
                fetch('/api/proxy/stats', {
                    headers: { 'X-Console-Token': token },
                }),
                fetch('/api/history/stats', {
                    headers: { 'X-Console-Token': token },
                }),
            ])

            if (proxyRes.ok) {
                setProxyStats(await proxyRes.json())
            }
            if (historyRes.ok) {
                setHistoryStats(await historyRes.json())
            }
        } catch (error) {
            console.error('加载统计失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('console_token')
        router.push('/')
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
                <p>加载中...</p>
            </div>
        )
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="container">
                    <div className="dashboard-header-content">
                        <h1 className="dashboard-title gradient-text">Z-Image API 控制台</h1>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            退出登录
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    <div className="dashboard-grid">
                        {/* 代理池统计 */}
                        <div className="card stat-card">
                            <h2 className="stat-title">代理池统计</h2>
                            {proxyStats && (
                                <div className="stat-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">总代理数</span>
                                        <span className="stat-value">{proxyStats.total}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">有效代理</span>
                                        <span className="stat-value text-success">{proxyStats.valid}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">优先池</span>
                                        <span className="stat-value">{proxyStats.validPriority}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">今日可用</span>
                                        <span className="stat-value text-primary">{proxyStats.availableToday}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 生成统计 */}
                        <div className="card stat-card">
                            <h2 className="stat-title">生成统计</h2>
                            {historyStats && (
                                <div className="stat-grid">
                                    <div className="stat-item">
                                        <span className="stat-label">总生成数</span>
                                        <span className="stat-value">{historyStats.total}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">成功数</span>
                                        <span className="stat-value text-success">{historyStats.success}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">成功率</span>
                                        <span className="stat-value">{historyStats.success_rate}%</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">平均耗时</span>
                                        <span className="stat-value">{historyStats.avg_duration}s</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 快速访问 */}
                    <div className="card quick-links">
                        <h2 className="stat-title">快速访问</h2>
                        <div className="quick-links-grid">
                            <a href="/dashboard/proxy" className="quick-link-card">
                                <span className="quick-link-icon">🌐</span>
                                <span className="quick-link-title">代理池管理</span>
                                <span className="quick-link-desc">查看和管理代理池</span>
                            </a>
                            <a href="/dashboard/models" className="quick-link-card">
                                <span className="quick-link-icon">🎨</span>
                                <span className="quick-link-title">模型配置</span>
                                <span className="quick-link-desc">管理图片生成模型</span>
                            </a>
                            <a href="/dashboard/history" className="quick-link-card">
                                <span className="quick-link-icon">📊</span>
                                <span className="quick-link-title">生成历史</span>
                                <span className="quick-link-desc">查看生成记录</span>
                            </a>
                            <a href="/dashboard/settings" className="quick-link-card">
                                <span className="quick-link-icon">⚙️</span>
                                <span className="quick-link-title">系统设置</span>
                                <span className="quick-link-desc">配置系统参数</span>
                            </a>
                        </div>
                    </div>

                    {/* API 使用说明 */}
                    <div className="card api-docs">
                        <h2 className="stat-title">API 使用说明</h2>
                        <div className="api-docs-content">
                            <h3>OpenAI 兼容接口</h3>
                            <pre className="code-block">
                                {`# 获取模型列表
GET /api/v1/models

# 生成图片
POST /api/v1/chat/completions
{
  "model": "Z-Image",
  "messages": [
    {"role": "user", "content": "一只可爱的猫咪"}
  ],
  "stream": true
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
