# 北粮南运综合数据驾驶舱（Node 部署版）

该版本已将原 HTML 页面整理为可直接部署的 Node.js 网站，页面内容、
地图动画和运输方式筛选保持不变。服务端仅使用 Node.js 内置模块，
不需要安装第三方依赖。

## 直接启动

要求 Node.js 20 或更高版本。

```bash
npm start
```

启动后访问：

- 网站：`http://localhost:8080`
- 健康检查：`http://localhost:8080/api/health`

如需修改端口：

```bash
HOST=0.0.0.0 PORT=8080 npm start
```

## Docker 部署

```bash
docker build -t beiliang-nanyun-map .
docker run -d --name beiliang-nanyun-map -p 8080:8080 beiliang-nanyun-map
```

## 生产服务器建议

可使用 Docker、PM2 或 systemd 保持 Node 进程常驻，再通过 Nginx
将域名反向代理至 Node 服务端口。

## 目录结构

```text
.
├── public/
│   ├── dashboard.html
│   └── favicon.svg
├── server.mjs
├── package.json
├── Dockerfile
└── .env.example
```

页面中的 ECharts 与中国地图脚本沿用原 HTML 的 CDN 引用，因此用户
浏览器需要能够访问 `cdn.jsdelivr.net`。
