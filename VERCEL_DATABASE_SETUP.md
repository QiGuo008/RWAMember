# Vercel PostgreSQL 数据库设置指南

## 1. 在 Vercel 创建 PostgreSQL 数据库

### 1.1 登录 Vercel 控制台
1. 访问 [vercel.com](https://vercel.com)
2. 登录你的账户

### 1.2 创建数据库
1. 在项目仪表板中，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres"
4. 输入数据库名称（例如：`rwa-member-db`）
5. 选择区域（建议选择离用户最近的区域）
6. 点击 "Create"

## 2. 配置环境变量

### 2.1 获取数据库连接信息
创建数据库后，Vercel 会提供连接信息：
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 2.2 设置环境变量
在 Vercel 项目设置中：
1. 进入项目设置 > Environment Variables
2. 添加以下变量：

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-here
```

## 3. 部署前准备

### 3.1 生成 Prisma Client
```bash
# 生成 Prisma client
pnpm prisma generate
```

### 3.2 推送数据库架构
```bash
# 推送 schema 到数据库
pnpm prisma db push
```

### 3.3 查看数据库（可选）
```bash
# 打开 Prisma Studio 查看数据
pnpm prisma studio
```

## 4. 部署到 Vercel

### 4.1 部署命令
```bash
# 提交代码到 git
git add .
git commit -m "Add PostgreSQL database support"
git push

# 或使用 Vercel CLI
vercel --prod
```

### 4.2 检查部署状态
1. 在 Vercel 仪表板中检查部署状态
2. 查看部署日志确保 Prisma 正确生成
3. 测试 API 端点确保数据库连接正常

## 5. 数据库迁移（如果需要）

如果你需要修改数据库结构：

```bash
# 创建迁移文件
pnpm prisma migrate dev --name describe-your-changes

# 部署到生产环境
pnpm prisma migrate deploy
```

## 6. 本地开发设置

### 6.1 复制环境变量
```bash
# 从 .env.example 创建 .env
cp .env.example .env
```

### 6.2 填入 Vercel 数据库 URL
```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 6.3 本地测试
```bash
# 生成 Prisma client
pnpm prisma generate

# 启动开发服务器
pnpm dev
```

## 7. 常见问题解决

### 问题：Prisma 生成失败
**解决方案：**
```bash
# 清除 Prisma 缓存并重新生成
pnpm prisma generate --force-reset
```

### 问题：数据库连接失败
**检查：**
1. 环境变量是否正确设置
2. 数据库 URL 是否包含 `?sslmode=require`
3. 网络是否可以访问数据库

### 问题：部署时数据库架构未同步
**解决方案：**
在 Vercel 部署设置中添加构建命令：
```bash
pnpm prisma generate && pnpm prisma db push && pnpm build
```

## 8. 生产环境最佳实践

1. **使用连接池：** Vercel PostgreSQL 自动提供连接池
2. **环境分离：** 为开发、测试、生产环境使用不同的数据库
3. **备份策略：** Vercel 提供自动备份，但建议定期手动备份重要数据
4. **监控：** 在 Vercel 仪表板中监控数据库使用情况和性能

## 9. 成本优化

- Vercel PostgreSQL 基于使用量计费
- 监控数据库大小和查询频率
- 考虑使用索引优化查询性能
- 定期清理不必要的数据