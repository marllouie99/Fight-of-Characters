import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const apkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const packageName = 'com.fightofcharacters.app';
const activityName = '.MainActivity';

// 1. Locate ADB executable
function findAdb() {
  if (process.env.ADB_PATH && fs.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }

  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(process.env.ANDROID_HOME || '', 'platform-tools', 'adb.exe'),
    path.join(process.env.ANDROID_SDK_ROOT || '', 'platform-tools', 'adb.exe'),
    'C:\\Program Files\\BlueStacks_nxt\\HD-Adb.exe',
    'C:\\Program Files (x86)\\BlueStacks_nxt\\HD-Adb.exe',
    'C:\\Program Files\\BlueStacks\\HD-Adb.exe',
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }

  // Fallback to checking PATH
  try {
    const whichCmd = process.platform === 'win32' ? 'where adb' : 'which adb';
    const found = execSync(whichCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) return found;
  } catch (e) {}

  return null;
}

// 2. Discover active devices or connect to BlueStacks ports
function getConnectedDevices(adb) {
  try {
    const raw = execFileSync(adb, ['devices'], { encoding: 'utf8' });
    const lines = raw.trim().split(/\r?\n/).slice(1);
    const devices = [];
    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(\S+)/);
      if (match) {
        devices.push({ id: match[1], status: match[2] });
      }
    }
    return devices;
  } catch (e) {
    return [];
  }
}

function tryConnectBlueStacks(adb) {
  const ports = ['5555', '5565', '5575', '5554'];
  console.log('🔍 Scanning local BlueStacks ADB ports (5555, 5565, 5575)...');
  for (const port of ports) {
    try {
      execFileSync(adb, ['connect', `127.0.0.1:${port}`], { encoding: 'utf8', timeout: 3000, stdio: 'ignore' });
    } catch (e) {}
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldBuild = args.includes('--build');
  const noLaunch = args.includes('--no-launch');
  let targetDevice = null;
  const devIdx = args.indexOf('--device');
  if (devIdx !== -1 && args[devIdx + 1]) {
    targetDevice = args[devIdx + 1];
  }

  console.log('🤖 [Mobile Deploy & Live Runner] Initializing BlueStacks & Android deployment...\n');

  const adb = findAdb();
  if (!adb) {
    console.error('❌ Could not locate adb.exe or BlueStacks HD-Adb.exe.');
    console.error('   Please install Android SDK platform-tools or enable ADB in BlueStacks Settings.');
    process.exit(1);
  }
  console.log(`   🔧 ADB Bridge: ${adb}`);

  // 1. Discover devices
  let devices = getConnectedDevices(adb);
  let onlineDevices = devices.filter(d => d.status === 'device');

  if (onlineDevices.length === 0) {
    tryConnectBlueStacks(adb);
    devices = getConnectedDevices(adb);
    onlineDevices = devices.filter(d => d.status === 'device');
  }

  if (onlineDevices.length === 0) {
    console.warn('\n⚠️  No online Android device or emulator detected!');
    console.warn('   Ensure BlueStacks or your Android phone has USB / ADB Debugging enabled:');
    console.warn('   - BlueStacks: Settings ⚙️ -> Advanced -> Turn on Android Debug Bridge (ADB)');
    console.warn('   - Physical Phone: Developer Options -> Enable USB Debugging\n');
    process.exit(1);
  }

  const selectedDevice = targetDevice || onlineDevices[0].id;
  console.log(`   📱 Target Device: ${selectedDevice} (${onlineDevices.length} online device(s) found)`);

  // 2. Build APK if requested or if APK does not exist
  if (shouldBuild || !fs.existsSync(apkPath)) {
    console.log('\n📦 [Build Step] Compiling fresh Android APK (npm run mobile:apk)...');
    execSync('npm run mobile:apk', { stdio: 'inherit', cwd: rootDir });
  }

  if (!fs.existsSync(apkPath)) {
    console.error(`❌ APK binary not found at ${apkPath}`);
    process.exit(1);
  }

  const apkStat = fs.statSync(apkPath);
  console.log(`\n📥 [Install Step] Pushing APK (${(apkStat.size / 1024 / 1024).toFixed(1)} MB) to ${selectedDevice}...`);
  const installStart = Date.now();
  try {
    execFileSync(adb, ['-s', selectedDevice, 'install', '-r', apkPath], { stdio: 'inherit' });
    console.log(`   ✅ Installed in ${((Date.now() - installStart) / 1000).toFixed(1)}s!`);
  } catch (err) {
    console.error('❌ Failed to install APK on device:', err.message);
    process.exit(1);
  }

  // 3. Launch MainActivity
  if (!noLaunch) {
    console.log(`\n🚀 [Launch Step] Starting ${packageName}/${activityName}...`);
    try {
      execFileSync(adb, ['-s', selectedDevice, 'shell', 'am', 'start', '-n', `${packageName}/${activityName}`], { stdio: 'inherit' });
      console.log('   🎉 Game launched successfully on device!\n');
    } catch (err) {
      console.warn('⚠️  Could not auto-launch activity:', err.message);
    }
  }
}

main().catch(err => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
