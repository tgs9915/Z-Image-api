'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../dashboard.css'

interface ProxyInfo {
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

export default function ProxyManagementPage() {
    const [loading, setLoading] = useState(true)
    const [proxies, setProxies] = useState<ProxyInfo[]>([])
    const [newProxy, setNewProxy] = useState('')
    const [isPriority, setIsPriority] = useState(false)
    const [operating, setOperating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        loadProxies()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) {
            router.push('/')
            return
        }
    }

    const loadProxies = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const response = await fetch('/api/proxy/list', {
                headers: { 'X-Console-Token': token },
            })
            if (response.ok) {
                const data = await response.json()
                setProxies(data.proxies || [])
            }
        } catch (error) {
            console.error('加载代理列表失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProxy = async () => {
        if (!newProxy.trim()) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/proxy/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify({
                    proxy: newProxy,
                    priority: isPriority,
                }),
            })

            if (response.ok) {
                setNewProxy('')
                loadProxies()
            } else {
                alert('添加代理失败')
            }
        } catch (error) {
            console.error('添加代理失败:', error)
            alert('添加代理失败')
        } finally {
            setOperating(false)
        }
    }

    const handleRemoveProxy = async (ipKey: string) => {
        if (!confirm('确认删除这个代理吗?')) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/proxy/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify({ ipKey }),
            })

            if (response.ok) {
                loadProxies()
            } else {
                alert('删除代理失败')
            }
        } catch (error) {
            console.error('删除代理失败:', error)
            alert('删除代理失败')
        } finally {
            setOperating(false)
        }
    }

    const handleCheckProxies = async () => {
        if (!confirm('这将检测所有代理的可用性，可能需要一些时间。确认继续吗?')) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/proxy/check', {
                method: 'POST',
                headers: { 'X-Console-Token': token },
            })

            if (response.ok) {
                const data = await response.json()
                alert(`检测完成！\n总计: ${data.checked}\n有效: ${data.valid}\n优先池: ${data.validPriority}\n公共池: ${data.validPublic}`)
                loadProxies()
            } else {
                alert('检测代理失败')
            }
        } catch (error) {
            console.error('检测代理失败:', error)
            alert('检测代理失败')
        } finally {
            setOperating(false)
        }
    }

    const handleUpdateProxies = async () => {
        if (!confirm('这将从配置的代理源拉取最新的代理地址。可能需要一些时间。确认继续吗?')) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/proxy/update', {
                method: 'POST',
                headers: { 'X-Console-Token': token },
            })

            if (response.ok) {
                const data = await response.json()
                alert(`拉取完成！\n新增代理: ${data.new_count} 个`)
                loadProxies()
            } else {
                alert('拉取代理失败')
            }
        } catch (error) {
            console.error('拉取代理失败:', error)
            alert('拉取代理失败')
        } finally {
            setOperating(false)
        }
    }

    const handleClearProxies = async (pool?: string) => {
        const poolName = pool === 'priority' ? '优先池' : pool === 'public' ? '公共池' : '所有代理池'
        if (!confirm(`确认清空${poolName}吗？此操作不可恢复！`)) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/proxy/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify({ pool }),
            })

            if (response.ok) {
                loadProxies()
            } else {
                alert('清空代理池失败')
            }
        } catch (error) {
            console.error('清空代理池失败:', error)
            alert('清空代理池失败')
        } finally {
            setOperating(false)
        }
    }

    const formatDate = (timestamp: number) => {
        if (!timestamp) return '从未'
        return new Date(timestamp).toLocaleString('zh-CN')
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <span className="spinner" style={{ width: '2rem', height: '2rem' }}></span>
                <p>加载中...</p>
            </div>
        )
    }

    const priorityProxies = proxies.filter(p => p.pool === 'priority')
    const publicProxies = proxies.filter(p => p.pool === 'public')

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="container">
                    <div className="dashboard-header-content">
                        <h1 className="dashboard-title gradient-text">代理池管理</h1>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpdateProxies}
                                disabled={operating}
                                title="从配置的代理源URL拉取代理地址"
                            >
                                {operating ? '拉取中...' : '🔄 从代理源拉取'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCheckProxies}
                                disabled={operating}
                            >
                                {operating ? '检测中...' : '检测所有代理'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
                                返回控制台
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    {/* 添加代理 */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h2 className="stat-title">手动添加代理地址</h2>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            💡 这里添加的是单个代理地址（IP:PORT），不是代理源URL。如需从代理源拉取，请点击上方"从代理源拉取"按钮。
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="格式: socks5://ip:port 或 ip:port"
                                value={newProxy}
                                onChange={(e) => setNewProxy(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={isPriority}
                                    onChange={(e) => setIsPriority(e.target.checked)}
                                />
                                <span>添加到优先池</span>
                            </label>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddProxy}
                                disabled={operating || !newProxy.trim()}
                            >
                                添加
                            </button>
                        </div>
                    </div>

                    {/* 优先池 */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="stat-title">优先池 ({priorityProxies.length})</h2>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleClearProxies('priority')}
                                disabled={operating || priorityProxies.length === 0}
                            >
                                清空优先池
                            </button>
                        </div>
                        <div className="proxy-list">
                            {priorityProxies.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '2rem' }}>
                                    暂无优先代理
                                </p>
                            ) : (
                                priorityProxies.map(proxy => (
                                    <div key={proxy.ipKey} className="proxy-item">
                                        <div className="proxy-info">
                                            <div className="proxy-url">{proxy.url}</div>
                                            <div className="proxy-stats">
                                                <span className={proxy.isValid ? 'text-success' : 'text-danger'}>
                                                    {proxy.isValid ? '✓ 有效' : '✗ 无效'}
                                                </span>
                                                <span>成功: {proxy.successCount}</span>
                                                <span>失败: {proxy.failCount}</span>
                                                <span>响应: {proxy.avgResponseTime.toFixed(0)}ms</span>
                                                <span>今日使用: {proxy.usesToday}</span>
                                                <span>最后检测: {formatDate(proxy.lastCheck)}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveProxy(proxy.ipKey)}
                                            disabled={operating}
                                        >
                                            删除
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 公共池 */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="stat-title">公共池 ({publicProxies.length})</h2>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleClearProxies('public')}
                                disabled={operating || publicProxies.length === 0}
                            >
                                清空公共池
                            </button>
                        </div>
                        <div className="proxy-list">
                            {publicProxies.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '2rem' }}>
                                    暂无公共代理
                                </p>
                            ) : (
                                publicProxies.map(proxy => (
                                    <div key={proxy.ipKey} className="proxy-item">
                                        <div className="proxy-info">
                                            <div className="proxy-url">{proxy.url}</div>
                                            <div className="proxy-stats">
                                                <span className={proxy.isValid ? 'text-success' : 'text-danger'}>
                                                    {proxy.isValid ? '✓ 有效' : '✗ 无效'}
                                                </span>
                                                <span>成功: {proxy.successCount}</span>
                                                <span>失败: {proxy.failCount}</span>
                                                <span>响应: {proxy.avgResponseTime.toFixed(0)}ms</span>
                                                <span>今日使用: {proxy.usesToday}</span>
                                                <span>最后检测: {formatDate(proxy.lastCheck)}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveProxy(proxy.ipKey)}
                                            disabled={operating}
                                        >
                                            删除
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
