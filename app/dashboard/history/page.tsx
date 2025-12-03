'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../dashboard.css'

interface HistoryRecord {
    id: string
    prompt: string
    imageUrl: string | null
    success: boolean
    duration: number
    proxyUsed: string | null
    createdAt: string
}

export default function HistoryPage() {
    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState<HistoryRecord[]>([])
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        loadHistory()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) {
            router.push('/')
            return
        }
    }

    const loadHistory = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const response = await fetch('/api/history', {
                headers: { 'X-Console-Token': token },
            })
            if (response.ok) {
                const data = await response.json()
                setHistory(data.history || [])
            }
        } catch (error) {
            console.error('加载历史失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClearHistory = async () => {
        if (!confirm('确认清空所有历史记录吗？此操作不可恢复！')) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const response = await fetch('/api/history/clear', {
                method: 'POST',
                headers: { 'X-Console-Token': token },
            })

            if (response.ok) {
                setHistory([])
            } else {
                alert('清空历史失败')
            }
        } catch (error) {
            console.error('清空历史失败:', error)
            alert('清空历史失败')
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN')
    }

    const filteredHistory = history.filter(item => {
        if (filter === 'success') return item.success
        if (filter === 'failed') return !item.success
        return true
    })

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
                        <h1 className="dashboard-title gradient-text">生成历史</h1>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-danger"
                                onClick={handleClearHistory}
                                disabled={history.length === 0}
                            >
                                清空历史
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
                    {/* 过滤器 */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>筛选:</span>
                            <button
                                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter('all')}
                            >
                                全部 ({history.length})
                            </button>
                            <button
                                className={`btn ${filter === 'success' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter('success')}
                            >
                                成功 ({history.filter(h => h.success).length})
                            </button>
                            <button
                                className={`btn ${filter === 'failed' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter('failed')}
                            >
                                失败 ({history.filter(h => !h.success).length})
                            </button>
                        </div>
                    </div>

                    {/* 历史记录列表 */}
                    <div className="card">
                        <h2 className="stat-title">记录列表</h2>
                        <div className="history-list">
                            {filteredHistory.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '2rem' }}>
                                    暂无记录
                                </p>
                            ) : (
                                filteredHistory.map(record => (
                                    <div key={record.id} className="history-item">
                                        <div className="history-header">
                                            <div className="history-prompt">
                                                <strong>提示词:</strong> {record.prompt}
                                            </div>
                                            <div className="history-meta">
                                                <span className={record.success ? 'text-success' : 'text-danger'}>
                                                    {record.success ? '✓ 成功' : '✗ 失败'}
                                                </span>
                                                <span>{record.duration.toFixed(2)}s</span>
                                                <span>{formatDate(record.createdAt)}</span>
                                            </div>
                                        </div>
                                        {record.success && record.imageUrl && (
                                            <img
                                                src={record.imageUrl}
                                                alt={record.prompt}
                                                className="history-image"
                                                loading="lazy"
                                            />
                                        )}
                                        {record.proxyUsed && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                                代理: {record.proxyUsed}
                                            </div>
                                        )}
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
