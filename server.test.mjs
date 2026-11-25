import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createAppServer, parseAudioFilename, scanAudioCatalog } from './server.mjs';

test('parseAudioFilename parses standard indexed mp3 filenames', () => {
  assert.deepEqual(parseAudioFilename('001_abandon.mp3'), {
    index: 1,
    indexStr: '001',
    word: 'abandon',
    filename: '001_abandon.mp3',
  });
  assert.deepEqual(parseAudioFilename('050_thank_you.mp3'), {
    index: 50,
    indexStr: '050',
    word: 'thank you',
    filename: '050_thank_you.mp3',
  });
  assert.equal(parseAudioFilename('.DS_Store'), null);
});

test('scanAudioCatalog scans real Desktop Word_List_Audio folder', async () => {
  const catalog = await scanAudioCatalog();
  assert.equal(catalog.totalLists, 7);
  assert.equal(catalog.totalUnits, 35);
  assert.equal(catalog.totalWords, 3489);
  assert.equal(catalog.lists[0].name, 'Word List 1');
  assert.equal(catalog.lists[0].units[0].name, 'Unit 1');
  assert.equal(catalog.lists[0].units[0].words[0].indexStr, '001');
  assert.equal(catalog.lists[0].units[0].words[0].word, 'abandon');
});

test('HTTP server serves catalog, Range audio streaming, and blocks path traversal', async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Catalog API
    const catRes = await fetch(`${baseUrl}/api/catalog`);
    assert.equal(catRes.status, 200);
    const catalog = await catRes.json();
    assert.equal(catalog.totalWords, 3489);

    // 2. Audio streaming with Range header
    const firstWord = catalog.lists[0].units[0].words[0];
    const audioRes = await fetch(`${baseUrl}${firstWord.audioUrl}`, {
      headers: { Range: 'bytes=0-1023' },
    });
    assert.equal(audioRes.status, 206);
    assert.equal(audioRes.headers.get('content-type'), 'audio/mpeg');
    const buf = await audioRes.arrayBuffer();
    assert.equal(buf.byteLength, 1024);

    // 3. Path traversal blocked
    const badRes = await new Promise((resolve, reject) => {
      http
        .get(`${baseUrl}/audio/..%2F..%2Fetc%2Fpasswd`, (res) => {
          res.resume();
          resolve(res);
        })
        .on('error', reject);
    });
    assert.equal(badRes.statusCode, 403);
  } finally {
    server.close();
  }
});
