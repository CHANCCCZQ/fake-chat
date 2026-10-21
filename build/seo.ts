import type { HtmlTagDescriptor, Plugin } from 'vite';

export const seoPages = {
  '': {
    title: '微信聊天记录生成器 - 双视角聊天模拟与截图 | 对话工坊',
    description:
      '对话工坊是一款网页版微信聊天记录模拟工具，支持双手机视角、文字、表情、图片、红包和转账、任意位置插入消息、聊天分组与 PNG 截图，草稿保存在本机浏览器。',
  },
  'about.html': {
    title: '微信聊天模拟工具使用指南 - 图片、红包、转账与截图 | 对话工坊',
    description:
      '了解对话工坊的双视角聊天编排、消息插入、红包转账状态联动、安卓与 iOS 状态栏、聊天分组和截图用法，以及本地草稿保存方式。',
  },
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!,
  );

export function siteAddress(siteUrl: string | undefined, base: string) {
  if (!siteUrl?.trim()) return undefined;
  const url = new URL(siteUrl.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'VITE_SITE_URL must be a public HTTP(S) site URL without credentials, query or hash.',
    );
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  if (url.pathname !== base) throw new Error('VITE_SITE_URL pathname must match VITE_BASE_PATH.');
  return url.href;
}

export function seoPlugin(siteUrl: string | undefined, base: string): Plugin {
  const site = siteAddress(siteUrl, base);
  return {
    name: 'dialog-studio-seo',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const path = context.path.endsWith('about.html') ? 'about.html' : '';
        const page = seoPages[path];
        const url = site && new URL(path, site).href;
        const image = site && new URL('social-card.png', site).href;
        const tags: HtmlTagDescriptor[] = [
          { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
          { tag: 'meta', attrs: { property: 'og:site_name', content: '对话工坊' } },
          { tag: 'meta', attrs: { property: 'og:locale', content: 'zh_CN' } },
          { tag: 'meta', attrs: { property: 'og:title', content: page.title } },
          { tag: 'meta', attrs: { property: 'og:description', content: page.description } },
          { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
          { tag: 'meta', attrs: { name: 'twitter:title', content: page.title } },
          { tag: 'meta', attrs: { name: 'twitter:description', content: page.description } },
        ];
        if (url && image) {
          tags.push(
            { tag: 'link', attrs: { rel: 'canonical', href: url } },
            {
              tag: 'link',
              attrs: {
                rel: 'sitemap',
                type: 'application/xml',
                href: new URL('sitemap.xml', site).href,
              },
            },
            { tag: 'meta', attrs: { property: 'og:url', content: url } },
            { tag: 'meta', attrs: { property: 'og:image', content: image } },
            { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' } },
            { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
            { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
            {
              tag: 'meta',
              attrs: {
                property: 'og:image:alt',
                content: '对话工坊，双手机视角的微信聊天模拟与截图工具',
              },
            },
            { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
          );
        }
        const application = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: '对话工坊',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web',
          inLanguage: 'zh-CN',
          description: seoPages[''].description,
          ...(site ? { url: site, image } : {}),
        };
        return {
          html: html
            .replace(/<title>.*?<\/title>/s, `<title>${escape(page.title)}</title>`)
            .replace(
              /(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/,
              `$1${escape(page.description)}$2`,
            ),
          tags: [
            ...tags,
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              children: JSON.stringify(application).replace(/</g, '\\u003c'),
            },
          ],
        };
      },
    },
    generateBundle() {
      if (!site) return;
      const entries = Object.keys(seoPages)
        .map((path) => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`)
        .join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
      });
      // Crawlers only recognize robots.txt at the origin root, never /repo/robots.txt.
      if (base === '/')
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', site).href}\n`,
        });
    },
  };
}
