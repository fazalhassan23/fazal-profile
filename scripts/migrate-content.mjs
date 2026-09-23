#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dataPath = resolve('data/portfolio-data.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));

function recommendationCategory(recommendation) {
  const source = `${recommendation.headline || ''} ${recommendation.text || ''}`.toLowerCase();
  if (/university|student|research|academic|thesis|course|brac/.test(source)) return 'academic';
  if (/engineer|developer|sqa|software|technical|hardware|database|system/.test(source)) return 'technical';
  return 'management';
}

data.recommendations = (data.recommendations || []).map((recommendation) => ({
  ...recommendation,
  category: ['management', 'technical', 'academic'].includes(recommendation.category)
    ? recommendation.category
    : recommendationCategory(recommendation)
}));
data._savedAt = new Date().toISOString();
writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Migrated ${data.recommendations.length} recommendations.`);
