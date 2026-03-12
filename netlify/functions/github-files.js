// Netlify function to proxy GitHub contents API using secret token
// Place this file under netlify/functions/ to be deployed automatically.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const owner = 'JeronymusAnonymus';
  const repo = 'moedtb';
  // optional path parameter, default to repo root
  const path = (event.queryStringParameters && typeof event.queryStringParameters.path === 'string')
    ? event.queryStringParameters.path
    : '';
  const token = process.env.GITHUB_TOKEN; // set in Netlify site settings

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Token not configured' }) };
  }

  async function fetchDir(subpath) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${subpath}`;
    const res = await fetch(url, {
      headers: { Authorization: `token ${token}`, 'User-Agent': 'netlify-function' }
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const items = await res.json();
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

  try {
    const tree = await fetchDir(path);
    return { statusCode: 200, body: JSON.stringify(tree) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};