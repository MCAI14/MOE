/*
  Build-time script to fetch a repository directory listing from GitHub and output it as JSON.

  This is intended to run during Netlify build (or locally) so the site can serve a static JSON
  file without requiring a runtime serverless function.

  Usage (Netlify):
    - Set GITHUB_TOKEN in Netlify environment variables
    - Netlify build runs: node scripts/generate-github-file-list.js

  Output:
    - database/github-file-list.json
*/

import fs from 'fs';
import path from 'path';

const owner = process.env.GITHUB_OWNER || 'JeronymusAnonymus';
const repo = process.env.GITHUB_REPO || 'moedtb';
const token = process.env.GITHUB_TOKEN;
const outPath = path.resolve(process.cwd(), 'database', 'github-file-list.json');

if (!token) {
  console.error('GITHUB_TOKEN is not set. Set it as an environment variable (e.g., in Netlify).');
  process.exit(1);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

async function fetchDir(subpath = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${subpath}`;
  const items = await fetchJson(url, {
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'netlify-build',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const out = [];
  for (const entry of items) {
    if (entry.type === 'dir') {
      const children = await fetchDir(entry.path);
      out.push({ name: entry.name, children });
    } else if (entry.type === 'file') {
      out.push({ name: entry.name, url: entry.download_url });
    }
  }
  return out;
}

(async () => {
  try {
    const tree = await fetchDir('');
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, JSON.stringify(tree, null, 2), 'utf8');
    console.log('✅ Generated', outPath);
  } catch (err) {
    console.error('Failed to generate file list:', err);
    process.exit(1);
  }
})();
