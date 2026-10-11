#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const remoteVideo = '/sdcard/camera-kit-qr-e2e.mp4';

async function main() {
  const { values } = parseArgs({
    options: {
      serial: { type: 'string' },
      apk: { type: 'string', default: join(root, 'example/android/app/build/outputs/apk/release/app-release.apk') },
      artifacts: { type: 'string', default: join(root, 'e2e/artifacts') },
    },
  });
  if (!values.serial?.startsWith('emulator-')) {
    throw new Error('Pass --serial emulator-5554 for an emulator with an imagefile rear camera.');
  }
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
  const adb = join(sdk, 'platform-tools/adb');
  if (!existsSync(adb) || !existsSync(values.apk)) {
    throw new Error('Set ANDROID_HOME to your Android SDK and build the release APK first.');
  }
  const maestro = (process.env.PATH || '')
    .split(delimiter)
    .map((directory) => join(directory, 'maestro'))
    .find(existsSync);
  if (!maestro) throw new Error('Install Maestro and add its bin directory to PATH.');
  const artifacts = resolve(values.artifacts);
  mkdirSync(artifacts, { recursive: true });
  const device = (args, options = {}) =>
    execFileSync(adb, ['-s', values.serial, ...args], {
      stdio: 'inherit',
      timeout: 60_000,
      ...options,
    });
  const screenshot = (name) => {
    const output = openSync(join(artifacts, name), 'w');
    try {
      device(['exec-out', 'screencap', '-p'], { stdio: ['ignore', output, 'inherit'] });
    } finally {
      closeSync(output);
    }
  };
  const background = (args, output) => {
    const child = spawn(adb, ['-s', values.serial, ...args], { stdio: ['ignore', output, output] });
    const done = new Promise((resolveDone) => {
      child.once('error', (error) => {
        child.spawnError = error;
        resolveDone();
      });
      child.once('close', resolveDone);
    });
    return { child, done };
  };
  const wait = async (processInfo, timeout) => {
    let timer;
    try {
      await Promise.race([
        processInfo.done,
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            processInfo.child.kill('SIGKILL');
            reject(new Error('Timed out stopping an adb capture process.'));
          }, timeout);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  let video;
  let recordingPid;
  let logcat;
  const recordingLog = openSync(join(artifacts, 'screenrecord.log'), 'w');
  const logcatOutput = openSync(join(artifacts, 'logcat.txt'), 'w');
  try {
    device(['install', '-r', resolve(values.apk)]);
    device(['logcat', '-c']);
    logcat = background(['logcat', '-v', 'threadtime'], logcatOutput);
    device(['shell', 'rm', '-f', remoteVideo]);
    video = background(
      ['shell', 'screenrecord', '--size', '720x1280', '--bit-rate', '4000000', '--time-limit', '180', remoteVideo],
      recordingLog,
    );
    await delay(1000);
    if (video.child.spawnError || video.child.exitCode !== null || video.child.signalCode !== null) {
      throw new Error('screenrecord did not start; see screenrecord.log.');
    }
    recordingPid = device(['shell', 'pidof', 'screenrecord'], { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (!/^\d+$/.test(recordingPid)) {
      recordingPid = undefined;
      throw new Error('Expected exactly one screenrecord process on the test emulator.');
    }
    console.log('Running the camera QR test...');
    execFileSync(
      maestro,
      [
        '--device',
        values.serial,
        'test',
        '--format',
        'JUNIT',
        '--output',
        join(artifacts, 'report.xml'),
        '--debug-output',
        join(artifacts, 'maestro'),
        '--test-output-dir',
        join(artifacts, 'maestro'),
        join(here, 'scan-qr.yaml'),
      ],
      { stdio: 'inherit', timeout: 90_000, cwd: root },
    );
    screenshot('scanned-qr.png');
  } finally {
    // SIGINT finalizes the remote MP4. Save diagnostics on test failures too.
    try {
      if (recordingPid) device(['shell', 'kill', '-2', recordingPid], { timeout: 10_000 });
      if (video) {
        await wait(video, 15_000);
        device(['pull', remoteVideo, join(artifacts, 'camera-qr-e2e.mp4')]);
      }
      screenshot('final.png');
    } finally {
      if (logcat) {
        logcat.child.kill();
        await wait(logcat, 10_000);
      }
      closeSync(recordingLog);
      closeSync(logcatOutput);
    }
  }
  console.log(`Camera QR test passed. Artifacts: ${artifacts}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
