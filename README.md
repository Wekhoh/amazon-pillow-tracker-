# U型枕推广追踪系统

ZP-TP01 BLK/DBL ASIN 推广数据可视化仪表盘。从 Excel 同步数据，提供本地 Web 仪表盘。

## 系统需求

- Node.js 20+
- pnpm 9+
- Excel 源文件：`U型枕推广计划和记录表.xlsx`（位于 OneDrive 桌面/ZP-TP01旅行枕项目汇总/）

## 首次安装

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env：确认 EXCEL_SOURCE_PATH 指向 Excel 文件

# 3. 初始化数据库
pnpm prisma migrate dev
pnpm prisma db seed
```

## 每日使用

```bash
# 1. 同步 Excel 数据到 SQLite（每次更新 Excel 后运行）
pnpm sync

# 2. 启动仪表盘
pnpm dev
# 浏览器访问 http://localhost:3000
```

## 数据校验

```bash
pnpm verify
```

输出 BLK 和 DBL 最新行的 Rolling 7D ACoS/TACoS/CVR/ROAS，与 Excel `00 总览` 表 B26-C32 对比（容差 0.1%）。

## 页面

| 路径 | 功能 |
|---|---|
| `/` | 总览（KPI 卡片 + 阶段进度 + Rolling 7D 折线） |
| `/?asin=DBL` | 切换到 DBL ASIN |
| `/compare` | BLK vs DBL 三指标对比 |

## 测试

```bash
pnpm test
```

19 个单元测试覆盖 `getPhase` / `rolling7d` / `quadrant` / `parseParams` / `parseDailyRecords`。

## 重要约束

- **Excel 文件只读**：本系统不会修改 Excel 表。所有数据写入 `data/tracker.db`（gitignored）。
- **同步是单向的**：Excel → SQLite。Excel 是 source of truth。

## 技术栈

- Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- shadcn/ui 4 (@base-ui/react)
- Prisma 7 (driver adapter pattern) + SQLite (better-sqlite3)
- Recharts (图表)
- TypeScript / Zod / date-fns / xlsx (SheetJS)
- Vitest (单元测试)

## 后续 Phase

- Phase 2：深度可视化（关键词热力图、Placement 漏斗、四象限散点）
- Phase 3：CSV 拖拽导入 + 公网分享 URL
- Phase 4（可选）：表单录入界面
- Phase 5（可选）：Tauri 桌面应用打包
