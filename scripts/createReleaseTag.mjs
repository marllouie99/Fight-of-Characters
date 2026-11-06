import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// Determine release tag
let tag = process.argv[2];
if (!tag) {
  tag = `v${pkg.version}`;
}
if (!tag.startsWith('v')) {
  tag = `v${tag}`;
}

console.log(`\n🚀 [Release Tagging Automation] Preparing release for tag: ${tag}`);

// 1. Verify working directory is clean
try {
  const status = execSync('git status -s', { encoding: 'utf8' }).trim();
  if (status.length > 0) {
    console.error('❌ Cannot create release tag: You have uncommitted changes in your git working tree:');
    console.error(status);
    console.error('\nPlease commit or stash your changes before tagging a release.');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Failed to check git status:', err.message);
  process.exit(1);
}

// 2. Check if tag already exists locally or remotely
const existingTags = execSync('git tag -l', { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(t => t.trim())
  .filter(Boolean);

if (existingTags.includes(tag)) {
  console.log(`⚠️ Tag '${tag}' already exists locally. Pushing existing tag to remotes...`);
} else {
  console.log(`🏷️ Creating annotated git tag: ${tag}...`);
  execSync(`git tag -a ${tag} -m "Release ${tag}: Fight of Characters automated distribution bundle"`, {
    stdio: 'inherit'
  });
}

// 3. Push tag to all configured remotes
const remotes = execSync('git remote', { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(r => r.trim())
  .filter(Boolean);

console.log(`📤 Pushing ${tag} to remotes (${remotes.join(', ')})...`);
for (const remote of remotes) {
  try {
    execSync(`git push ${remote} ${tag}`, { stdio: 'inherit' });
    console.log(`   ✅ Pushed ${tag} to ${remote}`);
  } catch (err) {
    console.warn(`   ⚠️ Warning: Failed to push tag to ${remote}:`, err.message);
  }
}

console.log('\n🎉 [RELEASE TRIGGERED SUCCESSFULLY]');
console.log(`   GitHub Actions is now compiling the game bundle, running tests,`);
console.log(`   and publishing the release ZIP to your GitHub repository!`);
console.log(`   • CI Actions Run: https://github.com/marllouie99/Fight-of-Characters/actions`);
console.log(`   • Releases Page: https://github.com/marllouie99/Fight-of-Characters/releases\n`);
