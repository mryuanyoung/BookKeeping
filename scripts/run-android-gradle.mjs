import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(rootDir, 'apps', 'android');
const wrapperName = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const wrapperPath = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const env = { ...process.env };

if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const sdkCandidates = process.platform === 'win32'
    ? [
        env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Android', 'Sdk'),
        path.join(homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
      ]
    : [
        path.join(homedir(), 'Android', 'Sdk'),
        path.join(homedir(), 'Library', 'Android', 'sdk'),
      ];
  const sdkPath = sdkCandidates.find((candidate) => candidate && existsSync(candidate));

  if (sdkPath) {
    env.ANDROID_HOME = sdkPath;
    env.ANDROID_SDK_ROOT = sdkPath;
  }
}

if (!existsSync(wrapperPath)) {
  console.error(`Missing Android Gradle wrapper at ${wrapperPath}`);
  process.exit(1);
}

const result = spawnSync(wrapperName, process.argv.slice(2), {
  cwd: androidDir,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
