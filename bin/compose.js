#!/usr/bin/env node
// videolab composer — Phase B.
// Run from the target app repo (which contains demo.yml):
//   npx <path-to-videolab> compose collection-kombat

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

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

  const videoConfigPath = path.join(VIDEOLAB_ROOT, 'apps', appName, 'videos', `${flowName}.json`);
  if (!existsSync(videoConfigPath)) throw new Error(`video config not found: ${videoConfigPath}`);
  const videoConfig = JSON.parse(await readFile(videoConfigPath, 'utf8'));

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

  const configFile = `apps/${appName}/videos/${flowName}.json`;
  const runtimeConfig = {
    compositionId: `${appName}-${flowName}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    videoAsset: `${appName}/${flowName}.mp4`,
    config: videoConfig,
  };
  await writeFile(path.join(VIDEOLAB_ROOT, 'studio', 'src', 'generated', 'current.json'), JSON.stringify(runtimeConfig, null, 2));
  const outputDir = path.join(VIDEOLAB_ROOT, 'apps', appName, 'out');
  await mkdir(outputDir, { recursive: true });
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const output = path.join(outputDir, `${appName}-${flowName}.mp4`);
  const composition = runtimeConfig.compositionId;
  log(`rendering ${composition} to ${output}`);
  log(`using per-video config ${configFile}`);
  const result = spawnSync(npx, [
    'remotion', 'render', 'studio/src/index.ts', composition, output, '--overwrite',
  ], { cwd: VIDEOLAB_ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Remotion exited with status ${result.status}`);
  log('finished:', output);
}

main().catch((error) => {
  console.error('[videolab] error:', error.message);
  process.exit(1);
});
