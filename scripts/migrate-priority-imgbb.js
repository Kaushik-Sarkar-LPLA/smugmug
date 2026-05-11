#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const manifestPath = path.join(projectRoot, 'data/export/priority-media-manifest.json');
const outputPath = path.join(projectRoot, 'data/export/priority-imgbb-upload-manifest.json');
const downloadDir = path.join(projectRoot, 'data/export/priority-downloads');

function loadEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=');
  }
}

function oauthHeader(method, rawUrl, params = {}) {
  const oauth = {
    oauth_consumer_key: process.env.SMUGMUG_API_KEY,
    oauth_token: process.env.SMUGMUG_ACCESS_TOKEN,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };
  const encode = (value) => encodeURIComponent(String(value)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const allParams = { ...params, ...oauth };
  const paramString = Object.keys(allParams).sort().map((key) => `${encode(key)}=${encode(allParams[key])}`).join('&');
  const base = [method.toUpperCase(), encode(rawUrl), encode(paramString)].join('&');
  const signingKey = `${encode(process.env.SMUGMUG_API_SECRET)}&${encode(process.env.SMUGMUG_ACCESS_TOKEN_SECRET)}`;
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).map(([key, value]) => `${encode(key)}="${encode(value)}"`).join(', ');
}

async function smugmugGet(apiPath, params = {}) {
  const url = new URL(`https://api.smugmug.com${apiPath}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: oauthHeader('GET', `https://api.smugmug.com${apiPath}`, params),
    },
  });
  if (!response.ok) throw new Error(`SmugMug ${apiPath} failed: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

async function getDownloadUrl(item) {
  const uri = item.download_uri || item.largest_image_uri;
  if (!uri) throw new Error(`No download URI for ${item.image_key}`);
  const data = await smugmugGet(uri);
  const response = data.Response || data;
  const payload = response.ImageDownload || response.LargestImage || response.ImageSize || response;
  const url = payload.Url || payload.url;
  if (!url) throw new Error(`No downloadable URL in ${uri} for ${item.image_key}`);
  return url;
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status} ${url}`);
  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

async function uploadToImgBB(filePath, name) {
  const form = new FormData();
  form.set('key', process.env.IMGBB_API_KEY);
  form.set('name', name);
  form.set('image', fs.readFileSync(filePath).toString('base64'));
  const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message || `ImgBB upload failed: HTTP ${response.status}`);
  return body.data;
}

function extensionFor(item, fallbackUrl) {
  const file = item.file_name || fallbackUrl || '';
  const ext = path.extname(file.split('?')[0]).toLowerCase();
  return ext && ext.length <= 6 ? ext : '.jpg';
}

async function main() {
  loadEnv();
  for (const key of ['SMUGMUG_API_KEY', 'SMUGMUG_API_SECRET', 'SMUGMUG_ACCESS_TOKEN', 'SMUGMUG_ACCESS_TOKEN_SECRET', 'IMGBB_API_KEY']) {
    if (!process.env[key]) throw new Error(`${key} is missing`);
  }
  fs.mkdirSync(downloadDir, { recursive: true });
  const priority = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).filter((item) => !item.is_video);
  const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : [];
  const byImageKey = new Map(existing.map((item) => [item.image_key, item]));
  const results = [...existing];

  for (let index = 0; index < priority.length; index += 1) {
    const item = priority[index];
    if (byImageKey.has(item.image_key)) {
      console.log(`skip ${index + 1}/${priority.length} ${item.priority_role} ${item.image_key}`);
      continue;
    }
    const downloadUrl = await getDownloadUrl(item);
    const ext = extensionFor(item, downloadUrl);
    const filePath = path.join(downloadDir, `${item.priority_role}-${String(item.sort_order).padStart(4, '0')}-${item.image_key}${ext}`);
    await downloadFile(downloadUrl, filePath);
    const uploaded = await uploadToImgBB(filePath, item.imgbb_name);
    const record = {
      priority_role: item.priority_role,
      album_name: item.album_name,
      album_uri: item.album_uri,
      album_web_uri: item.album_web_uri,
      sort_order: item.sort_order,
      image_key: item.image_key,
      file_name: item.file_name,
      source_web_uri: item.web_uri,
      source_download_url: downloadUrl,
      local_path: filePath,
      imgbb_name: item.imgbb_name,
      imgbb_id: uploaded.id,
      imgbb_title: uploaded.title,
      imgbb_url: uploaded.url,
      imgbb_display_url: uploaded.display_url,
      imgbb_delete_url: uploaded.delete_url,
      size: uploaded.size,
      width: uploaded.width,
      height: uploaded.height,
      mime: uploaded.image?.mime,
      uploaded_at: new Date().toISOString(),
    };
    results.push(record);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`uploaded ${index + 1}/${priority.length} ${item.priority_role} ${item.image_key} -> ${uploaded.display_url}`);
  }
  console.log(`done: ${results.length}/${priority.length} priority photos uploaded`);
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
