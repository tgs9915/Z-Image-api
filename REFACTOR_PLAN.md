# Z-Image 项目 Next.js Serverless 重构计划

## 项目分析

### 当前架构
- **后端**: FastAPI (Python)
- **功能**:
  - OpenAI 兼容 API (`/v1/models`, `/v1/chat/completions`)
  - Z-Image 图片生成集成
  - 代理池管理系统
  - 管理控制台
  - 图片存储和访问
  - Session 管理
  - 生成历史记录

### 挑战
1. **文件存储**: Vercel 是无状态的，本地文件存储需要改为云存储
2. **代理池**: 内存中的代理池需要持久化存储
3. **定时任务**: 代理池更新和健康检查需要使用 Vercel Cron Jobs
4. **Session 管理**: 内存 session 需要改为基于 JWT 或数据库

## 重构方案

### 技术栈
- **框架**: Next.js 14 (App Router)
- **部署**: Vercel Serverless
- **样式**: Vanilla CSS (现代化设计)
- **图片存储**: Vercel Blob Storage
- **数据存储**: Vercel KV (Redis) 用于代理池、session、配置
- **认证**: JWT tokens

### 新架构

#### 1. 前端 (Next.js App Router)
```
app/
├── page.tsx                    # 首页/控制台登录
├── dashboard/                  # 管理控制台
│   ├── page.tsx               # 控制台主页
│   ├── proxy/page.tsx         # 代理池管理
│   ├── models/page.tsx        # 模型配置
│   ├── history/page.tsx       # 生成历史
│   └── settings/page.tsx      # 系统设置
└── layout.tsx                 # 根布局
```

#### 2. API 路由 (Next.js API Routes - Serverless Functions)
```
app/api/
├── v1/
│   ├── models/route.ts        # OpenAI 兼容: 模型列表
│   └── chat/completions/route.ts  # OpenAI 兼容: 图片生成
├── console/
│   ├── login/route.ts         # 控制台登录
│   ├── logout/route.ts        # 登出
│   └── verify/route.ts        # 验证 session
├── proxy/
│   ├── stats/route.ts         # 代理统计
│   ├── list/route.ts          # 代理列表
│   ├── update/route.ts        # 更新代理池
│   ├── check/route.ts         # 检测代理
│   ├── add/route.ts           # 添加代理
│   └── remove/route.ts        # 移除代理
├── models/
│   ├── route.ts               # 获取模型列表
│   ├── add/route.ts           # 添加模型
│   ├── update/route.ts        # 更新模型
│   └── delete/route.ts        # 删除模型
├── settings/
│   ├── route.ts               # 获取设置
│   └── update/route.ts        # 更新设置
└── history/
    ├── route.ts               # 获取历史
    ├── clear/route.ts         # 清空历史
    └── stats/route.ts         # 历史统计
```

#### 3. 工具库
```
lib/
├── zimage.ts                  # Z-Image API 调用
├── proxy-pool.ts              # 代理池管理 (Vercel KV)
├── storage.ts                 # Vercel Blob 存储
├── auth.ts                    # JWT 认证
├── config.ts                  # 配置管理
└── utils.ts                   # 工具函数
```

### 数据存储方案

#### Vercel KV (Redis)
```typescript
// 键结构
kv:proxies:priority:*        // 优先代理池
kv:proxies:public:*          // 公共代理池
kv:models:*                  // 模型配置
kv:settings                  // 系统设置
kv:history:*                 // 生成历史 (最近500条)
kv:sessions:*                // Session 数据 (可选，或用JWT)
```

#### Vercel Blob
```
/images/                      // 生成的图片
```

### 环境变量 (.env.local)
```bash
# Vercel 存储
BLOB_READ_WRITE_TOKEN=
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Z-Image API
ZIMAGE_API_URL=https://mrfakename-z-image-turbo.hf.space

# 认证
JWT_SECRET=
CONSOLE_USERNAME=admin
CONSOLE_PASSWORD=

# API 密钥
API_KEYS=sk-key1,sk-key2

# 配置
NEXT_PUBLIC_BASE_URL=
```

### 迁移步骤

1. ✅ **初始化 Next.js 项目**
2. ✅ **创建基础配置和工具库**
3. ✅ **实现 Z-Image 生成逻辑**
4. ✅ **实现代理池管理 (KV 存储)**
5. ✅ **实现 OpenAI 兼容 API**
6. ✅ **实现控制台前端**
7. ✅ **实现认证系统**
8. ✅ **配置 Vercel 部署**
9. ✅ **测试和优化**

## 优势

1. **完全 Serverless**: 自动扩展，按需付费
2. **全球 CDN**: Vercel Edge Network 加速
3. **持久化存储**: Vercel KV + Blob 替代本地文件
4. **现代化 UI**: React + Next.js 14 App Router
5. **类型安全**: TypeScript 全栈类型支持
6. **零配置部署**: Git push 即可部署

## 注意事项

1. Vercel Serverless Functions 有 10 秒执行时间限制（Hobby），50 秒（Pro）
2. 图片生成可能需要流式响应保持连接
3. Vercel KV 和 Blob 有配额限制
4. 代理池更新可使用 Vercel Cron Jobs
