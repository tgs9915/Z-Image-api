'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '../dashboard.css'

interface ModelInfo {
    id: string
    object: string
    created: number
    owned_by: string
    name?: string
    description?: string
    max_tokens?: number
}

export default function ModelsPage() {
    const [loading, setLoading] = useState(true)
    const [models, setModels] = useState<ModelInfo[]>([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [operating, setOperating] = useState(false)
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        maxTokens: 4096,
    })
    const router = useRouter()

    useEffect(() => {
        checkAuth()
        loadModels()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) {
            router.push('/')
            return
        }
    }

    const loadModels = async () => {
        const token = localStorage.getItem('console_token')
        if (!token) return

        try {
            const response = await fetch('/api/models', {
                headers: { 'X-Console-Token': token },
            })
            if (response.ok) {
                const data = await response.json()
                setModels(data.data || [])
            }
        } catch (error) {
            console.error('加载模型失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddModel = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/models/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setFormData({ id: '', name: '', description: '', maxTokens: 4096 })
                setShowAddForm(false)
                loadModels()
            } else {
                const data = await response.json()
                alert(data.error || '添加模型失败')
            }
        } catch (error) {
            console.error('添加模型失败:', error)
            alert('添加模型失败')
        } finally {
            setOperating(false)
        }
    }

    const handleDeleteModel = async (id: string) => {
        if (!confirm(`确认删除模型 "${id}" 吗？`)) return

        const token = localStorage.getItem('console_token')
        if (!token) return

        setOperating(true)
        try {
            const response = await fetch('/api/models/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Console-Token': token,
                },
                body: JSON.stringify({ id }),
            })

            if (response.ok) {
                loadModels()
            } else {
                alert('删除模型失败')
            }
        } catch (error) {
            console.error('删除模型失败:', error)
            alert('删除模型失败')
        } finally {
            setOperating(false)
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
                        <h1 className="dashboard-title gradient-text">模型配置</h1>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                {showAddForm ? '取消添加' : '添加模型'}
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
                    {/* 添加模型表单 */}
                    {showAddForm && (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h2 className="stat-title">添加新模型</h2>
                            <form onSubmit={handleAddModel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        模型 ID *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                        required
                                        placeholder="例如: Z-Image-Pro"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        模型名称 *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="例如: Z-Image 专业版"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        描述
                                    </label>
                                    <textarea
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="简要描述该模型的特点"
                                        rows={3}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        最大 Token 数
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.maxTokens}
                                        onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                                        min={1}
                                        style={{ width: '200px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={operating}>
                                        {operating ? '添加中...' : '确认添加'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        取消
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 模型列表 */}
                    <div className="card">
                        <h2 className="stat-title">现有模型 ({models.length})</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {models.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '2rem' }}>
                                    暂无模型配置
                                </p>
                            ) : (
                                models.map(model => (
                                    <div key={model.id} className="proxy-item">
                                        <div className="proxy-info">
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div className="proxy-url">{model.id}</div>
                                                {model.name && (
                                                    <span style={{ color: 'var(--color-text-primary)' }}>{model.name}</span>
                                                )}
                                            </div>
                                            {model.description && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                                    {model.description}
                                                </div>
                                            )}
                                            <div className="proxy-stats">
                                                <span>拥有者: {model.owned_by}</span>
                                                <span>最大 Tokens: {model.max_tokens || 4096}</span>
                                                <span>创建时间: {new Date(model.created * 1000).toLocaleDateString('zh-CN')}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteModel(model.id)}
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
