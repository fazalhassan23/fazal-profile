#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataPath = join(root, 'data', 'portfolio-data.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
const mojibake = /(?:Ã.|Â.|â.|ð.|ï¸|�)/;

function visit(value, path = 'root') {
  if (typeof value === 'string' && mojibake.test(value)) throw new Error(`Mojibake detected at ${path}`);
  if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}[${index}]`));
  if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => visit(child, `${path}.${key}`));
}

function assertUniqueIds(collection, name) {
  const ids = new Set();
  for (const item of collection || []) {
    if (!item?.id) throw new Error(`${name} contains an item without an id`);
    if (ids.has(item.id)) throw new Error(`${name} contains duplicate id: ${item.id}`);
    ids.add(item.id);
  }
}

visit(data);
['metrics', 'expertise', 'awards', 'articles', 'experience', 'projects', 'education', 'extraCurriculars', 'recommendations'].forEach((key) => assertUniqueIds(data[key], key));
if (!data.recommendations?.every((item) => ['management', 'technical', 'academic'].includes(item.category))) {
  throw new Error('Every recommendation needs a supported category');
}
console.log('Portfolio data validation passed.');
