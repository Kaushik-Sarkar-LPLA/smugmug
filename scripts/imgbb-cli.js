#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=');
  }
}

function usage() {
  console.log(`Usage:
  node scripts/imgbb-cli.js upload <file> [--name name] [--expiration seconds]
  node scripts/imgbb-cli.js info

Environment:
  IMGBB_API_KEY must be set in .env or the shell.`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

async function upload(filePath, options) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error('IMGBB_API_KEY is missing');

  const absolutePath = path.resolve(filePath);
  const buffer = fs.readFileSync(absolutePath);
  const form = new FormData();
  form.set('key', apiKey);
  form.set('image', buffer.toString('base64'));
  if (options.name) form.set('name', options.name);
  if (options.expiration) form.set('expiration', options.expiration);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: form,
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || `ImgBB upload failed with HTTP ${response.status}`);
  }

  console.log(JSON.stringify({
    id: body.data.id,
    title: body.data.title,
    url: body.data.url,
    display_url: body.data.display_url,
    delete_url: body.data.delete_url,
    size: body.data.size,
    width: body.data.width,
    height: body.data.height,
    mime: body.data.image?.mime,
  }, null, 2));
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || command === 'help' || command === '--help') {
    usage();
    return;
  }

  if (command === 'info') {
    console.log(JSON.stringify({
      hasApiKey: Boolean(process.env.IMGBB_API_KEY),
      apiKeySuffix: process.env.IMGBB_API_KEY ? process.env.IMGBB_API_KEY.slice(-4) : null,
    }, null, 2));
    return;
  }

  if (command === 'upload') {
    const filePath = args._[1];
    if (!filePath) {
      usage();
      process.exitCode = 2;
      return;
    }
    await upload(filePath, args);
    return;
  }

  usage();
  process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
