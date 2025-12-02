/**
 * OpenAI 兼容 API - 聊天补全
 * POST /api/v1/chat/completions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey } from '@/lib/auth'
import { getModels } from '@/lib/kv'
import { defaultModels, config } from '@/lib/config'
import { generateImage, getRandomHints } from '@/lib/zimage'

interface Message {
    role: string
    content: string
}

interface ChatCompletionRequest {
    model: string
    messages: Message[]
    stream?: boolean
    temperature?: number
    max_tokens?: number
}

export async function POST(request: NextRequest) {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
        return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
        )
    }

    try {
        const body: ChatCompletionRequest = await request.json()

        // 提取用户消息
        let prompt = ''
        for (let i = body.messages.length - 1; i >= 0; i--) {
            if (body.messages[i].role === 'user') {
                prompt = body.messages[i].content
                break
            }
        }

        if (!prompt) {
            return NextResponse.json(
                { error: 'No user message found' },
                { status: 400 }
            )
        }

        // 获取模型配置
        let models = await getModels()
        if (Object.keys(models).length === 0) {
            models = defaultModels
        }

        const modelName = body.model && models[body.model] ? body.model : Object.keys(models)[0]
        const modelConfig = models[modelName]

        const requestId = `chatcmpl-${Math.random().toString(36).substring(2)}`
        const created = Math.floor(Date.now() / 1000)

        // 流式响应
        if (body.stream !== false) {
            const encoder = new TextEncoder()

            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // 发送创作提示
                        const hints = getRandomHints(8)

                        // 开始生成图片（异步）
                        const imagePromise = generateImage(
                            prompt,
                            modelConfig.height,
                            modelConfig.width,
                            modelConfig.steps
                        )

                        // 逐个发送提示
                        for (const hint of hints) {
                            const chunk = {
                                id: requestId,
                                object: 'chat.completion.chunk',
                                created,
                                model: modelName,
                                choices: [{
                                    index: 0,
                                    delta: { content: hint + '\n' },
                                    finish_reason: null
                                }]
                            }
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                            await new Promise(resolve => setTimeout(resolve, 1500))
                        }

                        // 等待图片生成完成
                        const imageUrl = await imagePromise

                        // 发送结果
                        const content = imageUrl
                            ? `\n✅ 创作完成！\n\n![生成的图片](${imageUrl})`
                            : '\n❌ 抱歉，图片生成失败，请稍后重试。'

                        const resultChunk = {
                            id: requestId,
                            object: 'chat.completion.chunk',
                            created,
                            model: modelName,
                            choices: [{
                                index: 0,
                                delta: { content },
                                finish_reason: null
                            }]
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultChunk)}\n\n`))

                        // 发送结束标记
                        const endChunk = {
                            id: requestId,
                            object: 'chat.completion.chunk',
                            created,
                            model: modelName,
                            choices: [{
                                index: 0,
                                delta: {},
                                finish_reason: 'stop'
                            }]
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`))
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

                        controller.close()
                    } catch (error) {
                        console.error('流式生成错误:', error)
                        controller.error(error)
                    }
                }
            })

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            })
        }

        // 非流式响应
        const imageUrl = await generateImage(
            prompt,
            modelConfig.height,
            modelConfig.width,
            modelConfig.steps
        )

        const content = imageUrl
            ? `![生成的图片](${imageUrl})`
            : '抱歉，图片生成失败，请稍后重试。'

        return NextResponse.json({
            id: requestId,
            object: 'chat.completion',
            created,
            model: modelName,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content
                },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: prompt.length,
                completion_tokens: content.length,
                total_tokens: prompt.length + content.length
            }
        })
    } catch (error) {
        console.error('聊天补全错误:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
