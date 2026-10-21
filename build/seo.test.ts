import test from 'node:test';
import assert from 'node:assert/strict';
import { siteAddress } from './seo';

test('SEO leaves unknown publication URLs unset and normalizes configured base URLs', () => {
  assert.equal(siteAddress(undefined, '/'), undefined);
  assert.equal(siteAddress(' ', '/'), undefined);
  assert.equal(siteAddress('https://example.com', '/'), 'https://example.com/');
  assert.equal(
    siteAddress('https://example.github.io/tool', '/tool/'),
    'https://example.github.io/tool/',
  );
});

test('SEO rejects credentials, non-web protocols, fragments and query strings', () => {
  for (const url of [
    'ftp://example.com/',
    'https://user:pass@example.com/',
    'https://example.com/?id=1',
    'https://example.com/#editor',
  ]) {
    assert.throws(() => siteAddress(url, '/'));
  }
});

test('SEO rejects canonical URLs outside the configured project base path', () => {
  assert.throws(() => siteAddress('https://example.github.io/', '/tool/'));
  assert.throws(() => siteAddress('https://example.github.io/another/', '/tool/'));
});
