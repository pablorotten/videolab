#!/usr/bin/env node
// videolab composer — Phase B.
// Run from the target app repo (which contains demo.yml):
//   npx <path-to-videolab> compose collection-kombat

import { existsSync } from 'node:fs';
import { mkdir, readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const VIDEOLAB_ROOT = process.env.VIDEOLAB_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const log = (...messages) => console.log('[videolab]', ...messages);

function parseSimpleYaml(text) {
  const match = text.match(/^name:\s*(.+)$/m);
  return match?.[1].trim();
}

async function main() {
  const [command, flowName] = process.argv.slice(2);
  if (command !== 'compose' || !flowName) {
    console.error('Usage (from the app repo that contains demo.yml):\n  videolab compose <flow>\n');
    process.exit(1);
  }

  const demoPath = path.join(process.cwd(), 'demo.yml');
  if (!existsSync(demoPath)) throw new Error(`no demo.yml found in ${process.cwd()}`);
  const appName = parseSimpleYaml(await readFile(demoPath, 'utf8'));
  if (!appName) throw new Error('demo.yml is missing name');

  const rawVideo = path.join(VIDEOLAB_ROOT, 'apps', appName, 'raw', `${flowName}.webm`);
  if (!existsSync(rawVideo)) throw new Error(`raw footage not found: ${rawVideo}`);

  // Remotion seeks H.264 more reliably than long Chromium WebM recordings.
  const publicDir = path.join(VIDEOLAB_ROOT, 'public', appName);
  const normalizedVideo = path.join(publicDir, `${flowName}.mp4`);
  await mkdir(publicDir, { recursive: true });
  log('normalizing raw footage with ffmpeg');
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', rawVideo,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-r', '30', '-an', normalizedVideo,
  ], { stdio: 'inherit' });

  // The first composition uses the movie-kombat asset name. Keep the command
  // explicit until per-app composition configs are introduced.
  const expectedAsset = path.join(publicDir, 'collection-kombat.mp4');
  if (normalizedVideo !== expectedAsset) await copyFile(normalizedVideo, expectedAsset);
  const output = path.join(VIDEOLAB_ROOT, 'apps', appName, 'out', `${appName}-${flowName}.mp4`);
  await mkdir(path.dirname(output), { recursive: true });

  log(`rendering ${output}`);
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, [
    'remotion', 'render', 'studio/src/index.ts', 'MovieKombatDemo', output, '--overwrite',
  ], { cwd: VIDEOLAB_ROOT, stdio: 'inherit' });
  log('finished:', output);
}

main().catch((error) => {
  console.error('[videolab] error:', error.message);
  process.exit(1);
});
