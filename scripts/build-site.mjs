#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const dist = resolve('dist');
const data = JSON.parse(readFileSync(resolve('data/portfolio-data.json'), 'utf8'));

// The administration screen is a local development tool. Never ship its password hash
// or editor files as part of the public Pages artifact.
delete data.adminAuth;
delete data._hasLocalChanges;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const file of ['index.html', 'about.html', 'projects.html', '404.html', 'robots.txt', 'sitemap.xml', 'CNAME']) {
  cpSync(resolve(root, file), resolve(dist, file));
}
for (const directory of ['assets', 'css']) cpSync(resolve(root, directory), resolve(dist, directory), { recursive: true });
mkdirSync(resolve(dist, 'js'), { recursive: true });
for (const file of ['utils.js', 'store.js', 'render.js', 'main.js']) cpSync(resolve(root, 'js', file), resolve(dist, 'js', file));
mkdirSync(resolve(dist, 'data'), { recursive: true });
writeFileSync(resolve(dist, 'data', 'portfolio-data.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
writeFileSync(resolve(dist, 'data', 'default-data.js'), `window.__PORTFOLIO_BUILD__ = true;\nwindow.DEFAULT_PORTFOLIO_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
console.log('Built public-only site artifact in dist/.');
