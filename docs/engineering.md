# 工程约定

## 技术与运行环境

- Node.js 24 LTS、npm 11（`.nvmrc` / `package.json#engines`）。
- React 19 + TypeScript strict + Vite 8（Rolldown），Tailwind CSS 4 + shadcn/ui。
- 提交 `package-lock.json`，开发和 CI 使用 `npm ci` 还原锁定依赖。
- 浏览器应用、Vite 配置、测试分别使用 `tsconfig.app.json`、`tsconfig.node.json`、`tsconfig.test.json`。

## 本地命令

| 命令                  | 用途                                         |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | 本地开发，固定端口 5173                      |
| `npm run check`       | 格式、ESLint、类型、业务测试，一项失败即退出 |
| `npm run format`      | 自动格式化源码、样式及配置                   |
| `npm run lint:fix`    | 自动修复支持修复的规则                       |
| `npm run test:watch`  | 监听并重跑业务测试                           |
| `npm run build`       | 类型检查和生产构建，输出 dist                |
| `npm run verify:dist` | 核对构建入口、CSS 资源和 public 素材路径     |
| `npm run preview`     | 本地预览生产产物，固定端口 4173              |

开发服务器默认只监听本机。需要局域网手机调试时，使用 `npm run dev -- --host 0.0.0.0`。生产环境只需托管 dist，不需要运行 Node 服务。

## 代码职责

- `about.html`、`src/about.css`：无需 JavaScript 的功能与使用指南。
- `build/seo.ts`：构建时生成页面元信息、正式地址与 sitemap。
- `src/App.tsx`：应用编排、设置、编辑和截图入口。
- `src/Phone.tsx`、`StatusBar.tsx`：微信视图与设备仿真。
- `src/model.ts`、`chat-time.ts`：消息状态联动、日期显示及时间计算。
- `src/group-store.ts`、`useProject.ts`：本地草稿迁移、分组持久化和撤销历史。
- `src/components/ui/`：可编辑的 shadcn/ui 基础组件及上游许可。
- `src/ChoiceSelect.tsx`、`DateTimePicker.tsx`、`DeviceFields.tsx`：业务表单组合。
- `src/lib/assets.ts`：运行时 public 素材路径入口。
- `src/styles.css`：微信仿真与既有工作区样式；`src/ui.css`：通用组件主题。
- `src/*.test.ts`：状态联动、本地迁移和时间规则的 Node 单元测试。
- `public/wechat/`、`public/fonts/`：静态素材及来源、许可说明。

ESLint 检查 TS、Hooks 调用和依赖、React Refresh 导出边界。shadcn 上游组件允许导出组合用工具函数。Prettier 与 EditorConfig 负责格式，ESLint 不重复做排版检查。格式化已应用到现有源码和原先压缩成行的 CSS，方便后续维护。

## 资源和构建

`VITE_BASE_PATH` 默认 `/`，可设为 `/fake-wechat/`。Vite 处理 HTML 和 CSS 的资源引用；TSX 通过 `assetPath()` 引用 public 文件，首页链接也跟随部署前缀。不要在 TSX 新增 `/wechat/...` 这样的根路径。

日历与截图渲染器独立懒加载；构建不依赖 CDN。不要通过提高体积警告阈值掩盖包体变化。

本项目使用浏览器本地存储，不存在运行时后端或服务端密钥。`.env` 只用于本地配置，不提交；`VITE_` 变量会公开进入前端产物，不能存放密钥。

## 自动检查

`.github/workflows/ci.yml` 在 push / PR 时执行全部检查，并分别验证根目录、项目子目录构建。`.github/workflows/pages.yml` 在 main push 或手动触发时重新检查、构建并发布。Action 使用固定提交 SHA，Node 版本来自 `.nvmrc`。本地通过不代表远端部署成功，应以 Actions 和 Pages 的实际访问结果为准。
