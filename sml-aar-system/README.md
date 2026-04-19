# SML & AAR 智能管理系统

> 单一数据源 · 异常管理 · AI 风险预警

针对汽车整车外观定义明细表（SML）的日常维护、节点追踪和外观认可报告（AAR）出具的 Web 系统 Demo。

---

## 📋 技术栈

- **前端**：Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide Icons
- **后端**：Next.js API Routes
- **数据库**：SQLite + Prisma ORM
- **Excel 处理**：ExcelJS

---

## 🚀 本地部署步骤（VSCode）

### 前置要求

- **Node.js** ≥ 18.17（推荐 20 LTS）
  - 下载：https://nodejs.org/
  - 检查版本：`node -v`
- **VSCode**

### 快速启动（推荐）

#### macOS / Linux

```bash
cd sml-aar-system
chmod +x start.sh
./start.sh
```

#### Windows

双击 `start.bat` 即可。

脚本会自动完成：依赖安装 → 数据库初始化 → 启动服务。

### 手动步骤

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库 + 灌入测试数据
npm run db:init

# 3. 启动开发服务器
npm run dev
```

启动后访问 🌐 **http://localhost:3000**

> 如果 npm 源慢，可切换国内镜像：
> ```bash
> npm config set registry https://registry.npmmirror.com
> ```

---

## ✨ 功能演示要点

打开首页后你会看到：

1. **顶部指标卡片**：总零件数 / AAR 已签发比例 / 高风险预警数
2. **AI 风险看板**（黄色高亮区）：
   - 「真皮座椅面套」— 命中关键词【模具/咬花/排期】+ 超期未到样
   - 「翼子板」— 实际送样较计划延期 7 天
3. **SML 数据台**：可按状态 / DRE / 供应商筛选
4. **生成 AAR**：点击「前保险杠总成」那行的 **生成AAR** 按钮，会下载格式化好的 Excel 报告

---

## 📂 项目结构

```
sml-aar-system/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── parts/route.ts        # 零件列表 API (联表 + 风险评估)
│   │   └── aar/export/route.ts   # AAR Excel 导出 API
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # Dashboard 主页
├── lib/
│   ├── prisma.ts                 # Prisma 客户端单例
│   └── risk.ts                   # AI 风险规则引擎 ⭐
├── prisma/
│   ├── schema.prisma             # 数据模型定义 ⭐
│   └── seed.ts                   # Mock 数据种子
├── .env                          # 数据库连接配置
├── .vscode/                      # VSCode 推荐配置
├── start.sh / start.bat          # 一键启动脚本
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产环境构建 |
| `npm run start` | 启动生产服务器 |
| `npm run db:init` | 首次初始化数据库 + 灌入种子数据 |
| `npm run db:reset` | **重置**数据库 (慎用) |
| `npm run db:studio` | 打开 Prisma Studio 可视化查看数据库 |

---

## 🔧 常见问题

### Q1: 启动后页面加载数据失败？
检查是否执行过 `npm run db:init`。若仍有问题，运行 `npm run db:reset` 重置。

### Q2: 想查看/修改数据库数据？
```bash
npm run db:studio
```
浏览器会打开 Prisma Studio（默认 http://localhost:5555），可直接编辑数据。

### Q3: 修改了 schema.prisma 后如何生效？
```bash
npx prisma migrate dev --name your_migration_name
```

### Q4: 端口 3000 被占用？
```bash
npm run dev -- -p 3001
```

### Q5: npm install 报错或很慢？
切换国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 🧠 核心逻辑说明

### 数据流转（三表串联）

```
SML (静态主数据)
  └── SampleTracking (每一轮送样 T0/T1/T2...)
        └── AarResult (本轮评审结果 ΔE / Gloss / 主观)
```

- **SML** 一次创建，低频变更
- **SampleTracking** 每轮送样新增一条，保留历史
- **AarResult** 每轮评审留痕，是生成 AAR 的数据源

### AI 风险评估规则（`lib/risk.ts`）

当前 v1 基于规则，命中以下任一条件即判为 **HIGH** 风险：

1. `actualDate` 晚于 `plannedDate` → 已延期 N 天
2. 计划日已过但 `actualDate` 仍为 null → 预期延期 N 天
3. `status = 打回` 且 `remark` 含关键词：修模 / 模具 / 材料 / 排期 / 重新 / 咬花 / 补模 / 换料

> v2 规划：接入 LLM 对 remark 做语义分类，给出风险评分 + 修复建议

### AAR Excel 生成流程

1. 前端点击「生成AAR」按钮 → 请求 `/api/aar/export?trackingId=xxx`
2. 后端三表联查（`SampleTracking` → `Sml` + `AarResult`）
3. 用 ExcelJS 按「零件信息 / 送样信息 / 评审结果」分节组装
4. 返回 xlsx 二进制流，浏览器自动下载

---

## 📝 后续演进方向

- [ ] 规则引擎 → LLM 语义分类（接 Claude API 或自建 MiniMax）
- [ ] AAR 模板对齐实际业务格式（公司 logo / D65 光源 / 测量位置图）
- [ ] Feishu Bitable 双向同步 + Webhook 推送
- [ ] 多轮次时间线视图（T0→T1→T2 演进可视化）
- [ ] 录入评审表单页面（当前仅显示按钮）

Happy Coding! 🎉
