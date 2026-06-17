#!/usr/bin/env node

import { inflateRawSync } from 'node:zlib';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_AAB_PATH = 'android/app/build/outputs/bundle/release/app-release.aab';
const MANIFEST_PATHS = {
  '.aab': ['base/manifest/AndroidManifest.xml'],
  '.apk': ['AndroidManifest.xml'],
};

const RESTRICTED_SMS_PERMISSIONS = [
  'android.permission.READ_SMS',
  'android.permission.RECEIVE_MMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.RECEIVE_WAP_PUSH',
  'android.permission.SEND_SMS',
  'android.permission.WRITE_SMS',
];

function parseArgs(argv) {
  const options = {
    artifactPath: process.env.MONEYKAI_ANDROID_RELEASE_ARTIFACT || DEFAULT_AAB_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--aab' || arg === '--apk' || arg === '--artifact') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a file path.`);
      }
      options.artifactPath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--aab=')) {
      options.artifactPath = arg.slice('--aab='.length);
      continue;
    }

    if (arg.startsWith('--apk=')) {
      options.artifactPath = arg.slice('--apk='.length);
      continue;
    }

    if (arg.startsWith('--artifact=')) {
      options.artifactPath = arg.slice('--artifact='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`MoneyKai Android release permission verifier

Usage:
  npm run android:verify:release-permissions
  npm run android:verify:release-permissions -- --aab android/app/build/outputs/bundle/release/app-release.aab
  MONEYKAI_ANDROID_RELEASE_ARTIFACT=path/to/app-release.aab npm run android:verify:release-permissions

Checks the compiled AndroidManifest.xml inside a release AAB/APK and fails if restricted SMS permissions are present.
`);
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error('Invalid ZIP: end of central directory record was not found.');
}

function listZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error(`Invalid ZIP: central directory entry ${index} is malformed.`);
    }

    const compressionMethod = buffer.readUInt16LE(centralDirectoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralDirectoryOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(centralDirectoryOffset + 24);
    const nameLength = buffer.readUInt16LE(centralDirectoryOffset + 28);
    const extraLength = buffer.readUInt16LE(centralDirectoryOffset + 30);
    const commentLength = buffer.readUInt16LE(centralDirectoryOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralDirectoryOffset + 42);
    const nameStart = centralDirectoryOffset + 46;
    const name = buffer.toString('utf8', nameStart, nameStart + nameLength);

    entries.set(name, {
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      name,
    });

    centralDirectoryOffset = nameStart + nameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntry(buffer, entry) {
  const { localHeaderOffset } = entry;

  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error(`Invalid ZIP: local header for ${entry.name} is malformed.`);
  }

  const nameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + nameLength + extraLength;
  const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedData;
  }

  if (entry.compressionMethod === 8) {
    const inflated = inflateRawSync(compressedData);
    if (inflated.length !== entry.uncompressedSize) {
      throw new Error(`Invalid ZIP: ${entry.name} inflated to an unexpected size.`);
    }
    return inflated;
  }

  throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}.`);
}

function permissionBuffers(permission) {
  return [
    Buffer.from(permission, 'utf8'),
    Buffer.from(permission, 'utf16le'),
  ];
}

function findPermissionStrings(manifestBuffer, permissions) {
  return permissions.filter((permission) =>
    permissionBuffers(permission).some((permissionBuffer) => manifestBuffer.includes(permissionBuffer)),
  );
}

function extractAndroidPermissions(manifestBuffer) {
  const permissionPattern = /android\.permission\.[A-Z0-9_]+/g;
  const encodedViews = [
    manifestBuffer.toString('utf8'),
    manifestBuffer.toString('utf16le'),
  ];
  return [...new Set(encodedViews.flatMap((view) => view.match(permissionPattern) ?? []))].sort();
}

function resolveArtifactPath(artifactPath) {
  return path.resolve(process.cwd(), artifactPath);
}

function getManifestEntryNames(artifactPath) {
  const extension = path.extname(artifactPath).toLowerCase();
  const names = MANIFEST_PATHS[extension];

  if (!names) {
    throw new Error(`Unsupported artifact extension "${extension}". Expected .aab or .apk.`);
  }

  return names;
}

function verifyArtifact(artifactPath) {
  const absoluteArtifactPath = resolveArtifactPath(artifactPath);

  if (!existsSync(absoluteArtifactPath)) {
    throw new Error(`Android release artifact was not found: ${absoluteArtifactPath}`);
  }

  const artifactBuffer = readFileSync(absoluteArtifactPath);
  const entries = listZipEntries(artifactBuffer);
  const manifestEntryNames = getManifestEntryNames(absoluteArtifactPath);
  const manifestEntryName = manifestEntryNames.find((name) => entries.has(name));

  if (!manifestEntryName) {
    throw new Error(
      `AndroidManifest.xml was not found in ${absoluteArtifactPath}. Looked for: ${manifestEntryNames.join(', ')}`,
    );
  }

  const manifestBuffer = readZipEntry(artifactBuffer, entries.get(manifestEntryName));
  const restrictedPermissions = findPermissionStrings(manifestBuffer, RESTRICTED_SMS_PERMISSIONS);
  const manifestPermissionStrings = extractAndroidPermissions(manifestBuffer);

  return {
    absoluteArtifactPath,
    manifestPermissionStrings,
    manifestEntryName,
    restrictedPermissions,
  };
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const result = verifyArtifact(options.artifactPath);

  if (result.restrictedPermissions.length > 0) {
    console.error('Restricted SMS permissions found in Android release artifact:');
    for (const permission of result.restrictedPermissions) {
      console.error(`- ${permission}`);
    }
    console.error(`Artifact: ${result.absoluteArtifactPath}`);
    process.exit(1);
  }

  console.log('Android release permission verification passed.');
  console.log(`Artifact: ${result.absoluteArtifactPath}`);
  console.log(`Manifest: ${result.manifestEntryName}`);

  if (result.manifestPermissionStrings.length > 0) {
    console.log('Manifest android.permission strings:');
    for (const permission of result.manifestPermissionStrings) {
      console.log(`- ${permission}`);
    }
  } else {
    console.log('Manifest android.permission strings: none detected.');
  }
} catch (error) {
  console.error(`Android release permission verification failed: ${error.message}`);
  process.exit(1);
}
