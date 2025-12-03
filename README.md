# Z-Image API - Next.js Serverless 版本

基于源码AI重构：https://linux.do/t/topic/1243252
基于 Next.js 14 的 Z-Image OpenAI 兼容 API，支持 Vercel Serverless 部署。

## 功能特性

- ✅ **OpenAI 兼容 API**: 完全兼容 OpenAI 聊天补全接口
- ✅ **Z-Image 集成**: 调用 Z-Image Turbo API 生成图片
- ✅ **代理池管理**: 自动管理和健康检查 SOCKS5 代理
- ✅ **管理控制台**: 现代化 Web 界面管理系统
- ✅ **Serverless**: 完全无服务器架构，自动扩展
- ✅ **持久化存储**: Vercel KV + Blob 存储
- ✅ **流式响应**: 支持 SSE 流式输出
- ✅ **中文界面**: 完整中文交互

## 技术栈

- **框架**: Next.js 14 (App Router)
- **部署**: Vercel Serverless Functions
- **存储**: Vercel KV (Redis) + Vercel Blob
- **认证**: JWT Tokens
- **样式**: Vanilla CSS (现代深色主题)
- **语言**: TypeScript 全栈

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

必填配置：
```env
# JWT 密钥（生产环境请使用强密码）
JWT_SECRET=your-super-secret-jwt-key

# 控制台登录
CONSOLE_USERNAME=admin
CONSOLE_PASSWORD=your-password

# API 密钥（可选）
API_KEYS=sk-key1,sk-key2

# 公开 URL（部署后填写）
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### 3. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000 即可看到登录页面。

### 4. 部署到 Vercel

#### 方式一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

#### 方式二：通过 Git

1. 将代码推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com) 导入项目
3. Vercel 会自动检测 Next.js 项目并部署

#### 配置 Vercel 存储

部署后需要配置 Vercel 存储服务：

1. **Vercel KV (Redis)**
   - 在项目设置中点击 "Storage" → "Create Database" → "KV"
   - Vercel 会自动添加环境变量：`KV_URL`, `KV_REST_API_URL` 等

2. **Vercel Blob**
   - 在项目设置中点击 "Storage" → "Create Store" → "Blob"
   - Vercel 会自动添加环境变量：`BLOB_READ_WRITE_TOKEN`

3. **配置其他环境变量**
   - 在项目设置 → Environment Variables 中添加：
     - `JWT_SECRET`
     - `CONSOLE_USERNAME`
     - `CONSOLE_PASSWORD`
     - `API_KEYS`
     - `NEXT_PUBLIC_BASE_URL`

4. **重新部署**
   - 配置完成后，重新部署项目使环境变量生效

## API 使用

### OpenAI 兼容接口

#### 1. 获取模型列表

```bash
curl https://your-app.vercel.app/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### 2. 生成图片（流式）

```bash
curl https://your-app.vercel.app/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "Z-Image",
    "messages": [
      {"role": "user", "content": "一只可爱的猫咪在花园里玩耍"}
    ],
    "stream": true
  }'
```

#### 3. 非流式响应

```bash
curl https://your-app.vercel.app/api/v1/chat/completions \
  -H "Content-Type": "application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "Z-Image-Square",
    "messages": [
      {"role": "user", "content": "赛博朋克风格的未来城市"}
    ],
    "stream": false
  }'
```

## 管理控制台

访问 `https://your-app.vercel.app/` 登录控制台：

- **代理池管理**: 查看、添加、删除代理
- **模型配置**: 管理图片生成模型参数
- **生成历史**: 查看所有生成记录和统计
- **系统设置**: 配置系统参数

## 默认模型

| 模型名称 | 尺寸 | 比例 | 描述 |
|---------|------|------|------|
| Z-Image | 896×1600 | 9:16 | 默认竖屏模式 |
| Z-Image-Square | 1024×1024 | 1:1 | 正方形 |
| Z-Image-Wide | 1600×896 | 16:9 | 横屏模式 |

## 项目结构

```
z-image/
├── app/                        # Next.js App Router
│   ├── api/                    # API 路由（Serverless Functions）
│   │   ├── v1/                 # OpenAI 兼容 API
│   │   ├── console/            # 控制台 API
│   │   ├── proxy/              # 代理池 API
│   │   ├── models/             # 模型配置 API
│   │   └── history/            # 历史记录 API
│   ├── dashboard/              # 控制台页面
│   ├── page.tsx                # 登录页面
│   └── layout.tsx              # 根布局
├── lib/                        # 工具库
│   ├── auth.ts                 # JWT 认证
│   ├── config.ts               # 配置管理
│   ├── kv.ts                   # Vercel KV 存储
│   ├── storage.ts              # Vercel Blob 存储
│   ├── proxy-pool.ts           # 代理池管理
│   └── zimage.ts               # Z-Image API 调用
├── legacy_source/              # 原 Python 项目（已废弃）
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

## 注意事项

1. **Serverless 限制**
   - Hobby 计划: 函数执行时间限制 10 秒
   - Pro 计划: 函数执行时间限制 60 秒
   - 图片生成可能需要较长时间，建议使用流式响应

2. **存储配额**
   - Vercel KV 和 Blob 有免费配额限制
   - 超出配额需要升级计划

3. **代理池** ✨ 自动初始化
   - 内置 7 个免费 SOCKS5 代理源（与原 Python 源码一致）
   - **首次使用时自动拉取代理**，无需手动操作
   - 支持通过 `PROXY_SOURCES` 环境变量自定义代理源
   - 可手动添加自己的优先级代理
   - 支持自动健康检查和优先级管理
   - 详细说明：`代理源配置说明.md` 和 `代理池自动初始化说明.md`

4. **图片存储**
   - 图片自动上传到 Vercel Blob
   - 返回永久 CDN URL

## 开发说明

### 添加新的 API 路由

在 `app/api/` 下创建新的 `route.ts` 文件：

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' })
}
```

### 使用 KV 存储

```typescript
import { kv } from '@vercel/kv'

// 保存数据
await kv.set('key', value)

// 读取数据
const data = await kv.get('key')
```

### 使用 Blob 存储

```typescript
import { put } from '@vercel/blob'

const blob = await put('filename.png', buffer, {
  access: 'public',
})

console.log(blob.url) // CDN URL
```

## License

MIT

## 致谢

- [Z-Image Turbo](https://huggingface.co/spaces/mrfakename/Z-Image-Turbo) - 图片生成模型
- [Vercel](https://vercel.com) - Serverless 部署平台
- [Next.js](https://nextjs.org) - React 框架
