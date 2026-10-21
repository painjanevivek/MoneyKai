import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const require = createRequire(import.meta.url);

test('shell quoting rejects line terminators after comments and preserves ordinary arguments', () => {
  const { quote, parse } = require('shell-quote');
  for (const terminator of ['\n', '\r', '\u2028', '\u2029']) {
    const unsafe = 'a' + terminator + 'printf marker;#';
    assert.throws(() => quote(['echo', { comment: 'comment' }, unsafe]), TypeError);
    assert.throws(() => quote([...parse('tool http://example.invalid/#fragment'), unsafe]), TypeError);
  }
  assert.deepEqual(parse('code --wait "a b.ts"'), ['code', '--wait', 'a b.ts']);
  assert.equal(quote(['echo', 'a b']), "echo 'a b'");
});

test('Windows editor command construction rejects expansion and line-break inputs', () => {
  const editorRoot = dirname(require.resolve('launch-editor'));
  const construct = require(join(editorRoot, 'construct-windows-launch-command.js'));
  for (const unsafe of ['file%PATH%.ts', 'file\nname.ts', 'file\rname.ts']) {
    assert.throws(() => construct('code', [unsafe]));
  }
  assert.match(construct('code', ['C:\\project\\a b.ts']), /a b\.ts/);
});

test('Metro still reads PNG and JPEG buffers with the patched image parser', () => {
  const metroRoot = dirname(require.resolve('metro/package.json'));
  const { getAssetSize } = require(join(metroRoot, 'src/Assets.js'));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6naAAAAAASUVORK5CYII=', 'base64');
  assert.deepEqual(getAssetSize('png', png, 'fixture.png'), { width: 1, height: 1 });
  const jpeg = readFileSync(new URL('../apps/MoneyKai-web/assets/images/moneykai-logo.jpeg', import.meta.url));
  const size = getAssetSize('jpeg', jpeg, 'moneykai-logo.jpeg');
  assert.ok(Number.isInteger(size.width) && size.width > 0);
  assert.ok(Number.isInteger(size.height) && size.height > 0);
});

test('zero-length ICNS entries fail promptly instead of looping', () => {
  const fromMetro = createRequire(require.resolve('metro/package.json'));
  const script = [
    "const { imageSize } = require(process.argv[1]);",
    "const input = Buffer.from('69636e73000000106963303700000000', 'hex');",
    "try { imageSize(input); process.exitCode = 2; }",
    "catch (error) { if (!(error instanceof TypeError)) throw error; }",
  ].join('\n');
  const result = spawnSync(process.execPath, ['-e', script, fromMetro.resolve('image-size')], {
    timeout: 5000,
    encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('Firestore Node transport preserves request and permission-error contracts', { timeout: 15000 }, async () => {
  const fromFirestore = createRequire(require.resolve('@firebase/firestore'));
  const grpc = fromFirestore('@grpc/grpc-js');
  const protobuf = require('protobufjs');
  const { initializeApp, deleteApp } = require('firebase/app');
  const { getFirestore, connectFirestoreEmulator, doc, getDoc, terminate } = require('firebase/firestore');
  const server = new grpc.Server();
  let requestDocumentSeen = false;
  const documentPath = 'projects/moneykai-security-test/databases/(default)/documents/checks/compatibility';
  const wire = protobuf.Root.fromJSON({ nested: {
    ListenRequest: { fields: { addTarget: { type: 'Target', id: 2 } } },
    Target: { fields: { targetId: { type: 'int32', id: 5 } } },
    ListenResponse: { fields: { targetChange: { type: 'TargetChange', id: 2 } } },
    TargetChange: { fields: {
      targetChangeType: { type: 'int32', id: 1 },
      targetIds: { type: 'int32', id: 2, rule: 'repeated' },
      cause: { type: 'Status', id: 3 },
    } },
    Status: { fields: { code: { type: 'int32', id: 1 }, message: { type: 'string', id: 2 } } },
  } });
  const requestType = wire.lookupType('ListenRequest');
  const responseType = wire.lookupType('ListenResponse');
  server.addService({
    listen: {
      path: '/google.firestore.v1.Firestore/Listen',
      requestStream: true,
      responseStream: true,
      requestSerialize: (value) => value,
      requestDeserialize: (value) => value,
      responseSerialize: (value) => Buffer.from(responseType.encode(value).finish()),
      responseDeserialize: (value) => value,
    },
  }, {
    listen(call) {
      call.once('data', (request) => {
        requestDocumentSeen = request.includes(Buffer.from(documentPath));
        const targetId = requestType.decode(request).addTarget.targetId;
        call.write({ targetChange: {
          targetChangeType: 2,
          targetIds: [targetId],
          cause: { code: grpc.status.PERMISSION_DENIED, message: 'dependency compatibility control' },
        } });
      });
    },
  });
  const port = await new Promise((resolve, reject) => {
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
      if (error) reject(error);
      else resolve(boundPort);
    });
  });
  const app = initializeApp({ projectId: 'moneykai-security-test', apiKey: 'test-only', appId: 'test-only' }, 'dependency-security');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', port, { mockUserToken: { sub: 'dependency-test' } });
  try {
    await assert.rejects(getDoc(doc(db, 'checks', 'compatibility')), { code: 'permission-denied' });
    assert.equal(requestDocumentSeen, true);
  } finally {
    await terminate(db);
    await deleteApp(app);
    server.forceShutdown();
  }
});
