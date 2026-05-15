# Amazon Pillow Tracker

> ZP-TP01 U 型枕（BLK / DBL 双 ASIN）亚马逊广告与销售数据可视化仪表盘。

Excel 仍然是 source of truth，本系统通过单向 ETL 把数据镜像到 SQLite，再由 Next.js 渲染交互式仪表盘。不修改原始 Excel 文件。

---

## 当前页面

| 路径 | 功能 |
|---|---|
| `/` | 总览：4 张 Rolling 7D KPI 卡 + 阶段进度 + 4 象限定位 + 累计漏斗 + 单件经济模型 + 7 天明细 |
| `/?asin=DBL` | 切换到 DBL ASIN（URL 状态） |
| `/compare` | BLK vs DBL 对比：4 张 Δ 卡 + 3 个走势图 + 8 行累计差距表 |
| `/keywords` | 关键词台账：聚合表 + 5 个筛选 chip + 11 列可排序，标红超红线 / 标橙烧钱无转化 / 标黄低 CVR |

侧边栏常驻显示：BLK + DBL 实时状态卡（Rolling 7D ACoS/TACoS、今日单/花费、库存）、当前阶段进度、累计 ROAS。

---

## 技术栈

- **Next.js 16** App Router + **React 19** + **Tailwind CSS v4** + **shadcn/ui 4** (@base-ui/react)
- **Prisma 7** (driver adapter pattern) + **SQLite** (better-sqlite3)
- **Recharts 3** 图表（折线 / 散点 / sparkline，主题感知配色）
- **xlsx** (SheetJS) ETL，**Zod** schema 校验，**date-fns** 日期算术
- **TypeScript** 严格模式 + **Vitest** 单元测试 + **lucide-react** 图标

---

## 数据流

```
Excel (source of truth, 只读)
  └── xlsx 解析  ──→  Zod 校验  ──→  Prisma upsert  ──→  SQLite (data/tracker.db)
                                                              ↓
                              Next.js Server Components 直接读 Prisma
                                                              ↓
                                              浏览器：仪表盘 + 关键词 + 对比
```

ETL 涵盖 5 个表：
- `Param`（参数中心：售价、汇率、Day0、目标 CVR、TACoS 红线）
- `Asin`（BLK / DBL 基础信息）
- `DailyRecord`（每日核心指标 36 天 × 2 ASIN）
- `UnitEconomics`（单件经济模型：成本、佣金、FBA fee 等）
- `Keyword`（关键词台账：1352 行日级数据，4-tuple unique 主键）

---

## 快速开始

**系统需求**：Node.js 20+、pnpm 9+、Windows / macOS / Linux

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env：把 EXCEL_SOURCE_PATH 指向你的 Excel 文件实际路径

# 3. 初始化数据库
pnpm prisma migrate dev
pnpm prisma db seed

# 4. 从 Excel 同步数据
pnpm sync

# 5. 启动仪表盘
pnpm dev
# 浏览器访问 http://localhost:3000
```

---

## 日常工作流

```bash
# 在 Excel 里更新数据后
pnpm sync          # 单向同步 Excel → SQLite（增量 upsert）

# 校验同步是否准确
pnpm verify        # 输出 BLK / DBL 最新 Rolling 7D，与 Excel "00 总览" 表 B26-C32 对照
```

> **重要约束**：`pnpm sync` 是单向的。Excel 是唯一权威数据源。仪表盘里看到的所有数字最终都源于 Excel。如果数字不对，先检查 Excel 原始单元格。

---

## 项目结构

```
amazon-pillow-tracker/
├── prisma/
│   ├── schema.prisma         # 5 个数据模型
│   ├── migrations/           # 数据库迁移历史
│   └── seed.ts               # ASIN + Phase 初始化数据
├── data/
│   └── tracker.db            # SQLite (gitignored)
├── scripts/
│   ├── sync-from-excel.ts    # 主 ETL 入口
│   ├── verify.ts             # DB ↔ Excel 对账
│   └── inspect-keywords.ts   # 一次性 Excel 结构诊断脚本
├── src/
│   ├── app/
│   │   ├── page.tsx          # 总览
│   │   ├── compare/page.tsx  # BLK vs DBL
│   │   ├── keywords/page.tsx # 关键词台账
│   │   └── layout.tsx        # 全局布局 + sidebar
│   ├── components/
│   │   ├── sidebar.tsx       # 常驻信息面板
│   │   ├── hero-kpi.tsx      # Rolling 7D KPI 卡
│   │   ├── rolling-chart.tsx # 4 指标走势折线
│   │   ├── quadrant-scatter.tsx
│   │   ├── conversion-funnel.tsx
│   │   ├── economics-waterfall.tsx
│   │   └── ...
│   └── lib/
│       ├── prisma.ts         # Prisma client 单例（driver adapter）
│       ├── calculations.ts   # 业务公式（纯函数 + TDD 覆盖）
│       ├── insights.ts       # 阈值规则引擎
│       └── etl/              # Excel 解析 + Zod schema
└── tests/                    # Vitest 单元测试
```

---

## 设计原则

1. **Excel 不动**：所有读取操作走 `XLSX.readFile`，无 `XLSX.writeFile`
2. **数据单向流动**：Excel → SQLite，仪表盘只读 SQLite
3. **业务公式纯函数化**：`getPhase` / `rolling7d` / `quadrant` 等都是输入→输出的纯函数，方便 TDD
4. **服务端组件优先**：所有页面默认 Server Component，仅图表强制 `'use client'`
5. **主题感知配色**：图表用 `useTheme()` 切换深浅色板，不用 `hsl(var(--*))`（Tailwind v4 是 oklch 格式，hsl 包装会破）

---

## 已知限制 / 下一步

- 部分日期处理依赖系统时区（北京 UTC+8）；跨时区运行 ETL 需要调整 `dateToLocalMidnightUtc`
- 关键词热力图、Placement 投放位漏斗、CVR/CPC 散点未实现（roadmap 中）
- 还没有 CSV 导入入口（v3 计划）
- 没有用户认证 / 多租户 — 这是本地工具，单用户使用

---

## 测试与校验

```bash
pnpm test          # Vitest 跑全部单元测试（calculations + ETL parser）
pnpm tsc --noEmit  # 严格类型检查
pnpm verify        # 业务对账（DB 最新 7D KPI vs Excel 00 总览）
```

---

## License

私有项目，未公开 License。如需基于此构建衍生作品，请联系作者。
