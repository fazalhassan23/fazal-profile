#!/usr/bin/env node
/**
 * Repairs common UTF-8-as-Latin-1 corruption in a JSON file.
 * Run only on a reviewed backup: node scripts/repair-mojibake.mjs data/portfolio-data.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/repair-mojibake.mjs <json-file>');

const mojibake = /(?:Ã.|Â.|â.|ð.|ï¸|�)/g;
const score = (value) => (String(value).match(mojibake) || []).length;
const windows1252 = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86], ['‡', 0x87],
  ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a], ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91],
  ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97], ['˜', 0x98],
  ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c], ['ž', 0x9e], ['Ÿ', 0x9f]
]);

function decodeWindows1252AsUtf8(value) {
  const bytes = Uint8Array.from([...value], (character) => {
    const code = character.codePointAt(0);
    return code <= 0xff ? code : (windows1252.get(character) ?? 0x3f);
  });
  return Buffer.from(bytes).toString('utf8');
}

function repair(value) {
  if (typeof value === 'string') {
    const candidate = decodeWindows1252AsUtf8(value);
    return score(candidate) < score(value) ? candidate : value;
  }
  if (Array.isArray(value)) return value.map(repair);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, repair(child)]));
  }
  return value;
}

const original = JSON.parse(readFileSync(file, 'utf8'));
const repaired = repair(original);
writeFileSync(file, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
