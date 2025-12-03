'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../dashboard.css'

interface Settings {
    baseUrl?: string
    maxDailyUses?: number
    updateInterval?: number
    verifyBeforeUse?: boolean
    verifyMaxAttempts?: number
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<Settings>({
        baseUrl: '',
        maxDailyUses: 100,
        updateInterval: 3600,
        verifyBeforeUse: false,
        verifyMaxAttempts: 3,
    })
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        loadSettings()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) {
            router.push('/')
            return
        }
    }

    const loadSettings = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const response = await fetch('/api/settings', {
                headers: { 'X-Console-Token': token },
            })
            if (response.ok) {
                const data = await response.json()
                if (data) {
                    setSettings(data)
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem('console_token')
        if (!token) return

        setSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify(settings),
            })

            if (response.ok) {
                alert('设置已保存')
            } else {
                alert('保存设置失败')
            }
        } catch (error) {
            console.error('保存设置失败:', error)
            alert('保存设置失败')
        } finally {
            setSaving(false)
        }
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
                        <h1 className="dashboard-title gradient-text">系统设置</h1>
                        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
                            返回控制台
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    <div className="card">
                        <h2 className="stat-title">通用设置</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                    基础 URL
                                </label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={settings.baseUrl || ''}
                                    onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                                    placeholder="https://your-api.vercel.app"
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    API 的基础 URL，用于生成图片链接
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                    代理每日最大使用次数
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.maxDailyUses || 100}
                                    onChange={(e) => setSettings({ ...settings, maxDailyUses: parseInt(e.target.value) })}
                                    min={1}
                                    style={{ width: '200px' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    单个代理每天最多可使用的次数
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                    代理池更新间隔（秒）
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.updateInterval || 3600}
                                    onChange={(e) => setSettings({ ...settings, updateInterval: parseInt(e.target.value) })}
                                    min={60}
                                    style={{ width: '200px' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    自动更新代理池的时间间隔（建议 3600 秒以上）
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.verifyBeforeUse || false}
                                        onChange={(e) => setSettings({ ...settings, verifyBeforeUse: e.target.checked })}
                                    />
                                    <span>使用前验证代理</span>
                                </label>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                                    在使用代理前先检测其可用性（会增加响应时间）
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                    验证最大尝试次数
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.verifyMaxAttempts || 3}
                                    onChange={(e) => setSettings({ ...settings, verifyMaxAttempts: parseInt(e.target.value) })}
                                    min={1}
                                    max={10}
                                    style={{ width: '200px' }}
                                />
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                    代理验证失败后的最大重试次数
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? '保存中...' : '保存设置'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* 环境变量说明 */}
                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h2 className="stat-title">环境变量配置</h2>
                        <div className="api-docs-content">
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                以下环境变量需要在 Vercel 控制台中配置：
                            </p>
                            <pre className="code-block">
                                {`# 认证相关
JWT_SECRET=your-random-secret-key
CONSOLE_USERNAME=admin
CONSOLE_PASSWORD=your-password

# API 密钥（多个用逗号分隔）
API_KEYS=sk-key1,sk-key2,sk-key3

# 部署 URL
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Vercel KV（自动注入）
KV_REST_API_URL=***
KV_REST_API_TOKEN=***

# Vercel Blob（自动注入）
BLOB_READ_WRITE_TOKEN=***`}
                            </pre>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
