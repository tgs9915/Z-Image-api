# Z-Image Vercel 部署指南

本指南将帮助你将 Z-Image API 项目部署到 Vercel。

## 前置准备

1. [GitHub](https://github.com) 账号
2. [Vercel](https://vercel.com) 账号（可用 GitHub 登录）
3. 本项目代码已推送到 GitHub 仓库

## 部署步骤

### 步骤 1: 准备 GitHub 仓库

1. 在 GitHub 创建新仓库（或使用现有仓库）
2. 将项目代码推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit: Z-Image Next.js Serverless"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 步骤 2: 导入项目到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New Project"**
3. 选择 **"Import Git Repository"**
4. 授权 Vercel 访问你的 GitHub 账号
5. 选择 `z-image` 仓库
6. 点击 **"Import"**

### 步骤 3: 配置项目

Vercel 会自动检测到 Next.js 项目，使用以下默认配置：

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: .next
- **Install Command**: `npm install`

保持默认设置，点击 **"Deploy"**。

### 步骤 4: 等待初次部署完成

Vercel 会自动构建和部署项目。这可能需要几分钟时间。部署完成后，你会看到项目 URL，例如：

```
https://your-project-name.vercel.app
```

**注意**: 此时项目还无法正常使用，因为缺少必要的环境变量和存储服务。

### 步骤 5: 配置 Vercel KV (Redis 存储)

1. 在 Vercel Dashboard，进入你的项目
2. 点击顶部导航栏的 **"Storage"** 标签
3. 点击 **"Create Database"**
4. 选择 **"KV"** (Redis)
5. 填写数据库名称（例如：`z-image-kv`）
6. 选择区域（建议选择离你最近的）
7. 点击 **"Create"**

Vercel 会自动添加以下环境变量到你的项目：
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 步骤 6: 配置 Vercel Blob (文件存储)

1. 在 **"Storage"** 标签页
2. 点击 **"Create Store"**
3. 选择 **"Blob"**
4. 填写存储名称（例如：`z-image-blob`）
5. 点击 **"Create"**

Vercel 会自动添加环境变量：
- `BLOB_READ_WRITE_TOKEN`

### 步骤 7: 配置其他环境变量

1. 点击顶部导航栏的 **"Settings"** 标签
2. 在左侧菜单选择 **"Environment Variables"**
3. 添加以下环境变量：

#### 必填变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `your-super-secret-key-change-this` | JWT 密钥，**请使用强随机密码** |
| `CONSOLE_USERNAME` | `admin` | 控制台登录用户名 |
| `CONSOLE_PASSWORD` | `your-password` | 控制台登录密码 |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` | 你的项目 URL |

#### 可选变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `API_KEYS` | 空 | API 密钥（逗号分隔），留空则不验证 |
| `ZIMAGE_API_URL` | `https://mrfakename-z-image-turbo.hf.space` | Z-Image API 地址 |
| `PROXY_POOL_ENABLED` | `true` | 是否启用代理池 |
| `PROXY_POOL_MAX_DAILY` | `5` | 代理每日最大使用次数 |

**添加环境变量的步骤**：
1. 点击 **"Add New"** → **"Environment Variable"**
2. 输入 **Name** 和 **Value**
3. 勾选所有环境（Production, Preview, Development）
4. 点击 **"Save"**
5. 重复以上步骤添加所有变量

### 步骤 8: 重新部署

环境变量添加完成后需要重新部署：

1. 点击顶部导航栏的 **"Deployments"** 标签
2. 找到最新的部署记录
3. 点击右侧的 **"⋯"** 菜单
4. 选择 **"Redeploy"**
5. 确认重新部署

### 步骤 9: 验证部署

部署完成后：

1. 访问你的项目 URL：`https://your-project.vercel.app`
2. 你应该看到登录页面
3. 使用配置的用户名和密码登录
4. 进入控制台，验证各项功能

### 步骤 10: 测试 API

使用 `curl` 或 Postman 测试 OpenAI 兼容 API：

```bash
# 获取模型列表
curl https://your-project.vercel.app/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# 生成图片
curl https://your-project.vercel.app/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "Z-Image",
    "messages": [{"role": "user", "content": "一只可爱的猫咪"}],
    "stream": true
  }'
```

## 常见问题

### Q: 部署失败怎么办？

A: 检查以下几点：
1. 确保 `package.json` 中的依赖项正确
2. 查看 Vercel 部署日志中的错误信息
3. 确认 Node.js 版本兼容性
4. 检查项目结构是否完整

### Q: 登录后提示未授权？

A: 确保已正确配置：
1. `JWT_SECRET` 环境变量
2. `CONSOLE_USERNAME` 和 `CONSOLE_PASSWORD`
3. 变量添加后需要重新部署

### Q: 图片上传失败？

A: 检查：
1. Vercel Blob 存储是否已创建
2. `BLOB_READ_WRITE_TOKEN` 环境变量是否存在
3. 是否已重新部署

### Q: 代理池不工作？

A: 检查：
1. 确认 Vercel KV 数据库已创建
2. KV 相关环境变量是否正确
3. 在控制台手动添加代理测试

### Q: API 无法访问？

A: 检查：
1. URL 是否正确（`/api/v1/...`）
2. API Key 是否配置和传递正确
3. 查看 Vercel 函数日志

## 优化建议

### 1. 自定义域名

1. 在 Vercel Dashboard → Settings → Domains
2. 添加你的自定义域名
3. 按照提示配置 DNS

### 2. 函数超时时间

如果使用 Vercel Pro 计划：
1. Settings → Functions
2. 调整 Max Duration 至 60 秒（适合图片生成）

### 3. 区域配置

在 `vercel.json` 中指定函数运行区域：

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60,
      "regions": ["hkg1", "sin1"]
    }
  }
}
```

### 4. 监控和日志

1. 使用 Vercel Analytics 监控访问
2. 使用 Vercel Logs 查看函数执行日志
3. 考虑集成 Sentry 等错误追踪服务

## 更新部署

### 方式一：自动部署（推荐）

每次推送到 GitHub 主分支，Vercel 会自动部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

### 方式二：手动部署

使用 Vercel CLI：

```bash
npm i -g vercel
vercel --prod
```

## 成本估算

### Vercel Hobby 计划（免费）

- ✅ 无限部署
- ✅ 100 GB 带宽/月
- ✅ Serverless Functions（10 秒超时）
- ✅ 100 GB 小时边缘函数
- ⚠️ KV: 30,000 命令/月
- ⚠️ Blob: 500 MB 存储 + 1 GB 带宽/月

### Vercel Pro 计划（$20/月）

- ✅ 1 TB 带宽/月
- ✅ Serverless Functions（60 秒超时）
- ✅ 1,000 GB 小时边缘函数
- ✅ KV: 500,000 命令/月
- ✅ Blob: 100 GB 存储 + 1 TB 带宽/月

**建议**: 
- 个人使用或测试：Hobby 计划足够
- 生产环境或高流量：建议 Pro 计划

## 安全建议

1. **使用强密码**: `JWT_SECRET` 和 `CONSOLE_PASSWORD` 必须使用强随机密码
2. **限制 API Key**: 不要公开暴露 API Key
3. **启用 CORS**: 在生产环境配置 CORS 限制
4. **监控访问**: 定期检查访问日志，发现异常及时处理
5. **定期更新**: 保持依赖项更新，修复安全漏洞

## 支持

如有问题，请：
1. 查看 Vercel 文档: https://vercel.com/docs
2. 查看项目 README
3. 提交 Issue

祝你部署顺利！🚀
