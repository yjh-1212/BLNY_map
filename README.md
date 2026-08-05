# 北粮南运数字化协同平台

项目已重构为前后端分离架构：后端使用 Express 5 提供 JSON API，并使用 SQLite 本地文件保存业务数据；前端使用 Vue 3、Vue Router 和 Vite。为确保外观和功能与参考项目完全一致，原版业务页面作为前端兼容资源保存在 `frontend/public/`，Vue 负责统一路由和跨模块导航，不修改页面内部 DOM、CSS、图表或交互脚本。

## 技术架构

```text
浏览器 :5173
  ├─ Vue 3 SPA（模块路由与跨页面导航）
  ├─ 原版页面兼容资源（完整保留视觉和交互）
  └─ /api/* ──Vite Proxy──> Express :8080 ──> SQLite 文件
```

```text
.
├─ backend/                 Express API
│  ├─ data/                 SQLite 数据文件目录
│  ├─ scripts/              数据库初始化脚本
│  ├─ src/
│  │  ├─ data/modules.js    模块目录
│  │  ├─ db/                SQLite 连接、表结构与管理白名单
│  │  ├─ routes/            本地数据库管理 API
│  │  ├─ app.js             中间件与 API 路由
│  │  ├─ config.js          环境配置
│  │  └─ server.js          进程入口
│  └─ test/                 Node 原生 API 测试
├─ frontend/                Vue 3 SPA
│  ├─ src/
│  │  ├─ router/            前端路由
│  │  └─ views/             原版页面全屏承载组件
│  ├─ public/               与参考项目逐字节一致的页面资源
│  │  └─ database-admin.html 本地数据库管理页面
│  └─ vite.config.js        开发代理及构建配置
├─ scripts/dev.mjs          前后端并行开发入口
└─ docker-compose.yml       双容器部署
```

## 环境要求

- Node.js 24.15 或更高版本（使用内置 `node:sqlite`）
- npm 10 或更高版本

当前机器已经具备 Node.js 24 与 npm 11，本次没有下载新的系统软件。Express、Vue、Vite 等项目依赖分别保存在 `backend/node_modules` 和 `frontend/node_modules`。

## 本地开发

首次安装依赖：

```bash
npm run install:all
```

同时启动前后端：

```bash
npm run dev
```

首次使用或需要确认数据库结构时，可以执行：

```bash
npm run db:init
```

数据库默认创建在 `backend/data/beiliang-nanyun.db`。数据库初始化是幂等的，重复执行不会重复插入演示数据。

启动后访问：

- Vue 前端：http://localhost:5173
- Express API：http://localhost:8080
- 健康检查：http://localhost:8080/api/health
- 模块清单：http://localhost:8080/api/v1/modules
- 本地数据库管理：http://localhost:5173/admin/database

也可以分别启动：

```bash
npm run dev:backend
npm run dev:frontend
```

## 测试与构建

```bash
npm test
```

该命令会运行 Express API 测试，并执行 Vue 生产构建。前端产物输出到 `frontend/dist/`。

## 环境变量

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Express 监听地址 |
| `PORT` | `8080` | Express 监听端口 |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | 允许跨域的前端来源，多个值用逗号分隔 |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Vite 开发代理目标 |
| `DATABASE_PATH` | `backend/data/beiliang-nanyun.db` | SQLite 数据文件位置 |
| `ENABLE_DATABASE_ADMIN` | 开发环境为 `true` | 是否启用本地数据库管理 API |

PowerShell 示例：

```powershell
$env:PORT = "8088"
$env:VITE_API_PROXY_TARGET = "http://localhost:8088"
npm run dev
```

## Docker 部署

```bash
docker compose up --build
```

访问 http://localhost:8081。前端容器通过 Nginx 将 `/api/` 反向代理到后端容器。

Docker 使用具名卷 `backend-data` 持久化 SQLite 文件，并默认关闭数据库管理 API。数据库管理页面设计为本机开发工具，不应直接开放到公网。

## 本地数据库

初始化后包含四张表：

- `platform_modules`：平台模块目录，只读
- `organizations`：参与机构，可新增、编辑、搜索和删除
- `grain_batches`：粮食批次，可新增、编辑、搜索和删除
- `transport_orders`：运输订单，可新增、编辑、搜索和删除

管理页面通过受限 API 操作数据库，不接受任意 SQL，也不允许访问白名单之外的表。备份前建议先停止后端，然后复制 `beiliang-nanyun.db` 文件；运行期间启用 WAL 时，还会临时出现同名的 `-wal` 和 `-shm` 文件。

### 角色化业务数据与完整流程

系统提供六类演示角色：平台管理员、贸易商业务负责人、公路货运调度员、铁路调度员、港口协同员和船商调度员。顶部切换角色后，可信数据空间与多式联运会同步加载该角色可见的菜单、企业数据范围和操作权限。

数据库除兼容表外，还包含四组正式领域表：

- `sys_*`：组织、用户、角色、权限及操作日志。
- `tds_*`：空间成员、连接器、数据来源、数据资源、数据产品、申请授权、使用记录及 EPCIS 转换。
- `mm_*`：运输需求、运力、方案、订单、分段任务、运输事件、异常及可信数据引用。
- `platform_modules`、`organizations`、`grain_batches`、`transport_orders`：保留的兼容与基础数据表。

角色化 CRUD API 位于 `/api/v1/business/:resource`，流程 API 位于 `/api/v1/workflow/*`。前端会自动携带当前角色，并由后端按企业、订单参与关系和分段任务进行二次权限校验。完整演示顺序如下：

1. 贸易商在“运输需求”提交需求并申请联运协同数据。
2. 依次切换车队、铁路、港口和船商角色，在“授权审批”完成审批。
3. 切回贸易商，在“联运方案”生成并确认方案，系统自动创建订单和四段任务。
4. 依次切换四类承运角色，在“我的任务”确认任务，在“任务执行”上报完成事件。
5. 系统生成转换记录、EPCIS 事件、运输事件和操作日志，并在四段完成后自动结束运输订单。

## 等表现迁移说明

- 页面基准：`D:\项目资料\Code\bf\beiliang-nanyun-node\public`
- 六个静态资源复制后均经过 SHA-256 校验，与参考文件逐字节一致
- Vue 路由为每个业务模块提供稳定地址，并保留原页面的 `postMessage` 跨模块导航
- 业务页面使用同源全屏框架隔离，避免 Vue 全局样式改变原版视觉
