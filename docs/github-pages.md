# 发布到 GitHub Pages

项目是纯前端静态应用，可以部署到 GitHub Pages。GitHub Free 使用公开仓库即可；私有仓库的 Pages 可用性取决于账号套餐。参考 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) 和 [Vite 静态部署指南](https://vite.dev/guide/static-deploy)。

## 首次发布

1. 在 GitHub 新建仓库，例如 `fake-wechat`，将本项目源码和 package-lock.json 推送到 `main`。不要上传 node_modules、dist、output、.env。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 打开 **Actions → Deploy GitHub Pages → Run workflow**，选择 main 并运行。首次 push 可能发生在开启 Pages 之前，失败时完成第 2 步再手动运行即可。
4. 等待 build 和 deploy 成功，在 Pages 或 deployment 记录中打开站点。普通项目的地址类似 `https://用户名.github.io/fake-wechat/`。

之后推送 main 会自动检查并发布新版本，不需要手动上传 dist，也不需要额外购买服务器。若主分支不叫 main，要同步修改 pages.yml 的分支触发和 deploy 条件。

工作流从 configure-pages 读取真实 `base_path`，无需在代码里写死用户名或仓库名；项目站点、`用户名.github.io` 根站点及自定义域名可使用同一套配置。自定义域名仍需自行在 Pages 设置和 DNS 中配置。

## 本地模拟子目录

macOS / Linux：

```sh
VITE_BASE_PATH=/fake-wechat/ npm run build
VITE_BASE_PATH=/fake-wechat/ npm run verify:dist
VITE_BASE_PATH=/fake-wechat/ npm run preview
```

打开 `http://localhost:4173/fake-wechat/`。预览时必须与构建时使用相同前缀。Windows 可将 `VITE_BASE_PATH=/fake-wechat/` 写入不提交的 `.env.local`，然后运行同样的 npm 命令。

## 数据和功能

网页代码和内置示例会公开；用户自己编排的消息、头像和上传图片保存在访问者浏览器的 localStorage，工作流不会将草稿上传 GitHub。换设备、换浏览器不会自动同步；清理站点数据会删除草稿。localhost 与线上域名属于不同来源，本地草稿不会自动搬到线上。

Pages 提供 HTTPS，适合剪贴板和截图功能；复制图片还取决于浏览器支持和权限，可使用保存 PNG。网页不连接微信、不执行真实转账。

## 排查

- workflow 报 Pages 未启用：先完成 Settings → Pages 的 Source 配置。
- 页面空白或素材 404：检查发布日志的 base_path，使用带仓库名的完整 URL；不要只上传源码作为静态产物。
- 代码检查失败：本地先执行 `npm ci`、`npm run check`、`npm run build`。
- 不确定远端是否成功：以 Actions 的部署记录和站点实际访问为准；本项目配置完成不代表已经发布。

## SEO 与分享

Pages 工作流同时将真实 base_url 传给 VITE_SITE_URL，自动生成两页 canonical、分享图片地址与 sitemap。上线后按 [SEO 说明](seo.md) 验证站点并提交 sitemap；配置完成不代表已被收录。
