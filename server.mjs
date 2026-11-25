import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_AUDIO_DIR = path.join(__dirname, 'audio');
export const DEFAULT_AUDIO_ROOT =
  process.env.AUDIO_ROOT ||
  (fs.existsSync(LOCAL_AUDIO_DIR)
    ? LOCAL_AUDIO_DIR
    : path.join(os.homedir(), 'Desktop', 'Word_List_Audio'));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2',
};

const naturalCompare = (a, b) =>
  a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

export function parseAudioFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.mp3') return null;
  const stem = filename.slice(0, -ext.length);
  const match = stem.match(/^(\d+)_(.+)$/);
  if (match) {
    const indexStr = match[1];
    const index = Number.parseInt(indexStr, 10);
    const word = match[2].replace(/_/g, ' ').trim();
    return { index, indexStr, word, filename };
  }
  return { index: 0, indexStr: '000', word: stem.replace(/_/g, ' ').trim(), filename };
}

export async function scanAudioCatalog(audioRoot = DEFAULT_AUDIO_ROOT) {
  const listEntries = await fsp.readdir(audioRoot, { withFileTypes: true });
  const listDirs = listEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort(naturalCompare);

  const lists = [];
  let totalWords = 0;

  for (const listName of listDirs) {
    const listPath = path.join(audioRoot, listName);
    const unitEntries = await fsp.readdir(listPath, { withFileTypes: true });
    const unitDirs = unitEntries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort(naturalCompare);

    const units = [];
    let listWordCount = 0;

    for (const unitName of unitDirs) {
      const unitPath = path.join(listPath, unitName);
      const files = await fsp.readdir(unitPath);
      const words = [];

      for (const file of files) {
        if (file.startsWith('.')) continue;
        const parsed = parseAudioFilename(file);
        if (!parsed) continue;
        const id = `${listName}/${unitName}/${file}`;
        const audioUrl = `/audio/${encodeURIComponent(listName)}/${encodeURIComponent(unitName)}/${encodeURIComponent(file)}`;
        words.push({
          id,
          index: parsed.index,
          indexStr: parsed.indexStr,
          word: parsed.word,
          filename: file,
          listName,
          unitName,
          audioUrl,
        });
      }

      words.sort((a, b) => a.index - b.index || naturalCompare(a.filename, b.filename));
      listWordCount += words.length;
      totalWords += words.length;

      units.push({
        id: `${listName}/${unitName}`,
        name: unitName,
        listName,
        wordCount: words.length,
        words,
      });
    }

    lists.push({
      id: listName,
      name: listName,
      wordCount: listWordCount,
      unitCount: units.length,
      units,
    });
  }

  return {
    audioRoot,
    totalLists: lists.length,
    totalUnits: lists.reduce((acc, l) => acc + l.unitCount, 0),
    totalWords,
    lists,
  };
}

function safeResolve(baseDir, relativeSegments) {
  const resolvedBase = path.resolve(baseDir);
  const target = path.resolve(resolvedBase, ...relativeSegments);
  if (target !== resolvedBase && !target.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return target;
}

async function serveAudioFile(req, res, filePath) {
  let stat;
  try {
    stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
  } catch {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const total = stat.size;
  const range = req.headers.range;

  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      res.end();
      return;
    }
    const start = match[1] ? Number.parseInt(match[1], 10) : 0;
    const end = match[2] ? Math.min(Number.parseInt(match[2], 10), total - 1) : total - 1;

    if (start > end || start >= total) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      res.end();
      return;
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': total,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
  });
  fs.createReadStream(filePath).pipe(res);
}

async function serveStatic(req, res, pathname) {
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const segments = cleanPath.split('/').filter(Boolean);
  let target = safeResolve(DIST_DIR, segments);

  try {
    if (target) {
      const stat = await fsp.stat(target);
      if (stat.isFile()) {
        const ext = path.extname(target).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        fs.createReadStream(target).pipe(res);
        return;
      }
    }
  } catch {
    // Fallback to index.html for SPA routes
  }

  const indexHtml = path.join(DIST_DIR, 'index.html');
  try {
    await fsp.access(indexHtml);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(indexHtml).pipe(res);
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Frontend build not found. Run `npm run build` first.');
  }
}

export function createAppServer({ audioRoot = DEFAULT_AUDIO_ROOT } = {}) {
  let catalogCache = null;
  let cacheTime = 0;
  const CACHE_TTL_MS = 5000;

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, audioRoot }));
        return;
      }

      if (pathname === '/api/catalog') {
        const forceRefresh = url.searchParams.get('refresh') === '1';
        const now = Date.now();
        if (!catalogCache || forceRefresh || now - cacheTime > CACHE_TTL_MS) {
          catalogCache = await scanAudioCatalog(audioRoot);
          cacheTime = now;
        }
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end(JSON.stringify(catalogCache));
        return;
      }

      if (pathname.startsWith('/audio/')) {
        const rawSegments = pathname.slice('/audio/'.length).split('/').filter(Boolean);
        let decoded;
        try {
          decoded = rawSegments.map((seg) => decodeURIComponent(seg));
        } catch {
          res.writeHead(400);
          res.end('Bad Request');
          return;
        }
        const resolved = safeResolve(audioRoot, decoded);
        if (!resolved) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        await serveAudioFile(req, res, resolved);
        return;
      }

      await serveStatic(req, res, pathname);
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const server = createAppServer();
  server.listen(PORT, HOST, () => {
    console.log(`IELTS Word Audio server running at http://${HOST}:${PORT}`);
    console.log(`Serving audio from: ${DEFAULT_AUDIO_ROOT}`);
  });
}
