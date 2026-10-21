# 基础 SEO 与分享

## 已实现

- 工具入口和 `about.html` 使用独立的标题、描述、中文语言和语义标题。
- 使用指南直接输出静态 HTML，包含功能、操作步骤和 FAQ，不依赖 JavaScript。工具的使用说明弹窗提供指南链接；指南可返回编辑器。
- 入口 HTML 在编辑器加载前提供简短介绍与指南链接，JavaScript 正常加载后替换为编辑器。没有把 SEO 文案隐藏在编辑界面里。
- 构建时生成 Open Graph、Twitter Card 和 WebApplication JSON-LD。未添加虚构评分或评论，也不承诺搜索结果的特殊展示。
- 分享图使用随项目发布的 `public/social-card.png`（1200×630）；macOS 下可用 `swift scripts/generate-social-card.swift` 重新生成，不是 CI 必需依赖。
- `build/seo.ts` 管理两页的描述、公开地址与 sitemap；测试和产物校验覆盖地址、元信息、结构化数据、PNG 尺寸和内链。

## 正式网址

`VITE_SITE_URL` 是含项目路径的完整公开网址，例如 `https://your-name.github.io/fake-wechat/`，路径须与 `VITE_BASE_PATH=/fake-wechat/` 对应。不能包含用户名密码、查询参数或 hash。

GitHub Pages 工作流自动从 configure-pages 注入这两个值，不用在源码写用户名。自定义域名仍先在 Pages 和 DNS 中设置。

没有配置正式网址时，不生成 canonical、og:url、绝对分享图 URL 或 sitemap；避免把 localhost 或示例域名当成线上地址。基础标题、描述和静态指南仍然存在。普通本地构建不会携带 CI 校验使用的 example 域名。

## sitemap 与 robots

正式网址配置好后，生成的 sitemap 只包含工具入口和使用指南，不包含浏览器草稿、分组或聊天内容。

域名根目录站点同时生成 robots.txt，允许抓取并声明 sitemap。仓库子目录站点不生成无效的 `/仓库名/robots.txt`，因为 robots 必须位于域名根目录；已有根站点的 robots 规则仍可能影响子目录。

## 上线后还需完成

1. 用最终网址检查两页均返回 200，图片、字体、分享图正常加载。
2. 在 Google Search Console 或目标搜索引擎的站长平台验证站点所有权。选择 URL 前缀方式时，地址包含仓库子目录。
3. 提交该前缀下的 sitemap.xml，并检查抓取、渲染和索引状态。
4. 若使用 HTML 验证文件，将平台提供的真实文件放入 public 后发布；不要提交凭空编写的验证码。

这些需要实际站点和账号，当前没有代为提交。收录和排名由搜索引擎决定。Open Graph 信息也不保证每个社交平台、尤其微信内，都展示同一种链接卡片。

参考：[Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)、[sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)、[Open Graph](https://ogp.me/)。
