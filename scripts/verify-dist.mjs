import assert from 'node:assert/strict';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

const root = resolve('dist');
const rawBase = process.env.VITE_BASE_PATH || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const checked = new Set();
async function checkUrl(url, owner = 'index.html') {
  if (/^(data:|https?:|#)/.test(url)) return;
  const path = url.split(/[?#]/)[0];
  assert.ok(path.startsWith(base), `${owner}: URL ${url} must use base ${base}`);
  const file = resolve(
    root,
    decodeURIComponent(path.slice(base.length)),
    ...(path.endsWith('/') ? ['index.html'] : []),
  );
  assert.ok(!relative(root, file).startsWith('..'), `Asset escapes dist: ${url}`);
  assert.ok((await stat(file)).isFile(), `${owner}: missing asset ${url}`);
  checked.add(file);
}
for (const page of ['index.html', 'about.html']) {
  const content = await readFile(resolve(root, page), 'utf8');
  for (const match of content.matchAll(/(?:src|href)="([^"]+)"/g)) await checkUrl(match[1], page);
  assert.equal([...content.matchAll(/<title>/g)].length, 1, `${page}: one title required`);
  assert.equal(
    [...content.matchAll(/name="description"/g)].length,
    1,
    `${page}: one description required`,
  );
  assert.ok(content.includes('<h1>'), `${page}: static heading missing`);
  if (page === 'about.html')
    assert.ok(!/<script[^>]+src=/.test(content), 'Guide must be readable without JavaScript');
  const schema = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(schema, `${page}: structured data missing`);
  assert.equal(JSON.parse(schema[1])['@type'], 'WebApplication');
  const canonical = content.match(/rel="canonical" href="([^"]+)"/);
  const siteUrl = process.env.VITE_SITE_URL;
  if (siteUrl) {
    const site = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
    const url = new URL(page === 'index.html' ? '' : page, site).href;
    assert.equal(canonical?.[1], url);
    assert.ok(
      content.includes(`property="og:image" content="${new URL('social-card.png', site).href}"`),
    );
  } else {
    assert.ok(!canonical, `${page}: unknown site URL must not invent a canonical`);
  }
}
await checkUrl(`${base}social-card.png`);
const social = await readFile(resolve(root, 'social-card.png'));
assert.equal(social.subarray(1, 4).toString(), 'PNG');
assert.equal(social.readUInt32BE(16), 1200);
assert.equal(social.readUInt32BE(20), 630);
if (process.env.VITE_SITE_URL) {
  const site = process.env.VITE_SITE_URL.replace(/\/?$/, '/');
  const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, 2);
  assert.ok(sitemap.includes(`<loc>${site}</loc>`));
  assert.ok(sitemap.includes(`<loc>${new URL('about.html', site).href}</loc>`));
  if (base === '/') {
    const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
    assert.ok(robots.includes(`Sitemap: ${new URL('sitemap.xml', site).href}`));
  } else {
    await assert.rejects(access(resolve(root, 'robots.txt')), { code: 'ENOENT' });
  }
} else {
  await assert.rejects(access(resolve(root, 'sitemap.xml')), { code: 'ENOENT' });
}
const assetDir = resolve(root, 'assets');
for (const name of await readdir(assetDir)) {
  const file = resolve(assetDir, name);
  const text = await readFile(file, 'utf8');
  if (extname(file) === '.css') {
    for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      await checkUrl(match[1], name);
    }
  }
  if (extname(file) === '.js') {
    assert.ok(!/["']\/(?:wechat|fonts)\//.test(text), `${name}: unprefixed runtime asset`);
  }
}
for (const folder of ['wechat', 'fonts']) {
  for (const name of await readdir(resolve('public', folder))) {
    await checkUrl(`${base}${folder}/${name}`, 'public assets');
  }
}
console.log(`Static build verified: ${checked.size} assets, base ${base}`);
