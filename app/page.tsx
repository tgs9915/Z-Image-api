'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import './login.css'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/console/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            const data = await response.json()

            if (data.success) {
                // 保存 token
                localStorage.setItem('console_token', data.token)
                // 跳转到控制台
                router.push('/dashboard')
            } else {
                setError(data.error || '登录失败')
            }
        } catch (error) {
            console.error('登录错误:', error)
            setError('网络错误，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-bg">
                <div className="login-bg-gradient"></div>
            </div>

            <div className="login-card glass">
                <div className="login-header">
                    <h1 className="login-title gradient-text">Z-Image API</h1>
                    <p className="login-subtitle">管理控制台</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="label" htmlFor="username">
                            用户名
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label" htmlFor="password">
                            密码
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                登录中...
                            </>
                        ) : (
                            '登录'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="login-footer-text">
                        🚀 Z-Image OpenAI 兼容 API - Serverless 版本
                    </p>
                </div>
            </div>
        </div>
    )
}
