#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetPath = path.join(rootDir, 'node_modules', 'node-releases', 'data', 'processed', 'envs.json');

if (fs.existsSync(targetPath)) {
  console.log('node-releases/envs.json already exists');
  process.exit(0);
}

const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Minimal envs.json - browserslist needs this file to exist
const minimalEnvs = [{"name":"nodejs","version":"18.0.0","date":"2022-04-18","lts":false,"security":false,"v8":"10.1.124.8"}];
fs.writeFileSync(targetPath, JSON.stringify(minimalEnvs));
console.log('Created node-releases/data/processed/envs.json');
process.exit(0);
