import { spawnSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tauriDir = path.join(rootDir, 'src-tauri');
const manifestPath = path.join(tauriDir, 'Cargo.toml');
const exePath = path.join(
  tauriDir,
  'target',
  'release',
  process.platform === 'win32' ? 'circle-mini-battle-rust.exe' : 'circle-mini-battle-rust'
);

const buildOnly = process.argv.includes('--build-only') || process.argv.includes('--build');
const forceRebuild = process.argv.includes('--rebuild') || buildOnly;

// Ensure Cargo & MSYS2 UCRT64 MinGW toolchain are in PATH even if terminal was not restarted
const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
const msysBin = 'C:\\msys64\\ucrt64\\bin';
const mingwBin = 'C:\\MinGW\\bin';
const pathSep = process.platform === 'win32' ? ';' : ':';

const extraPaths = [cargoBin, msysBin, mingwBin].filter((p) => fs.existsSync(p));
const env = {
  ...process.env,
  PATH: [...extraPaths, process.env.PATH || ''].join(pathSep)
};

function needsCompilation() {
  if (forceRebuild || !fs.existsSync(exePath)) return true;
  try {
    const exeMtime = fs.statSync(exePath).mtimeMs;
    const mainRsMtime = fs.statSync(path.join(tauriDir, 'src', 'main.rs')).mtimeMs;
    const cargoTomlMtime = fs.statSync(manifestPath).mtimeMs;
    return mainRsMtime > exeMtime || cargoTomlMtime > exeMtime;
  } catch {
    return true;
  }
}

function ensureWebView2LoaderDll() {
  const targetDir = path.dirname(exePath);
  const destDll = path.join(targetDir, 'WebView2Loader.dll');
  if (fs.existsSync(destDll)) return;

  const buildDir = path.join(targetDir, 'build');
  if (!fs.existsSync(buildDir)) return;

  try {
    const entries = fs.readdirSync(buildDir);
    for (const entry of entries) {
      if (entry.startsWith('webview2-com-sys-')) {
        const candidate = path.join(buildDir, entry, 'out', 'x64', 'WebView2Loader.dll');
        if (fs.existsSync(candidate)) {
          fs.copyFileSync(candidate, destDll);
          console.log('✅ [Rust Desktop Shell] Placed WebView2Loader.dll next to executable.');
          return;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [Rust Desktop Shell] Could not auto-copy WebView2Loader.dll:', err.message);
  }
}

if (needsCompilation()) {
  console.log('🦀 [Rust Desktop Shell] Compiling native release binary (Cargo + WebView2/Wry)...');
  const buildRes = spawnSync(
    'cargo',
    ['build', '--manifest-path', manifestPath, '--release'],
    {
      cwd: rootDir,
      env,
      stdio: 'inherit'
    }
  );
  if (buildRes.status !== 0) {
    console.error('❌ [Rust Desktop Shell] Cargo build failed.');
    process.exit(buildRes.status || 1);
  }
  if (fs.existsSync(exePath)) {
    const sizeMb = (fs.statSync(exePath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ [Rust Desktop Shell] Release binary ready: ${exePath} (${sizeMb} MB)`);
  }
}

ensureWebView2LoaderDll();

if (buildOnly) {
  process.exit(0);
}

console.log('🚀 [Rust Desktop Shell] Launching Circle Mini-Battle (Rust + WebView2)...');
const child = spawn(exePath, [], {
  cwd: rootDir,
  env,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
