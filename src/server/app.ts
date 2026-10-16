import express, { Request, Response } from 'express';

const app = express();

// Enable JSON parsing
app.use(express.json());

// CORS & Global Headers
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// In-memory cache to ensure instant folder & video responses
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function getCached(key: string) {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// Resilient fetch helper with 25s timeout and automatic retry to avoid aborted operations
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 2,
  timeoutMs = 25000
): Promise<globalThis.Response> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeout);
      if (res.ok) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt < retries) {
        // Exponential backoff delay
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'GB STUDY API', timestamp: new Date().toISOString() });
});

// API: Folder Contents
app.get('/api/folder_contents', async (req: Request, res: Response) => {
  const { course_id, parent_id = '-1', start = '0' } = req.query;
  if (!course_id) {
    return res.status(400).json({ status: 400, message: 'Missing course_id' });
  }

  const cacheKey = `folder:${course_id}:${parent_id}:${start}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const targetUrl = `https://vidya.studybeepro.site/get/folder_contentsv3?course_id=${encodeURIComponent(
    String(course_id)
  )}&parent_id=${encodeURIComponent(String(parent_id))}&start=${encodeURIComponent(String(start))}`;

  try {
    const upstreamRes = await fetchWithRetry(
      targetUrl,
      {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://vidya.studybeepro.site/',
      },
      2,
      25000
    );

    const data = await upstreamRes.json();
    setCache(cacheKey, data);
    return res.json(data);
  } catch (err: any) {
    console.warn(`Upstream folder fetch warning for ${course_id}/${parent_id}:`, err?.message || err);
    // Return graceful structure so client knows to check direct endpoint
    return res.status(200).json({
      status: 200,
      message: 'Temporary upstream delay',
      data: [],
      error: err?.message || 'Upstream timeout',
    });
  }
});

// API: Video Details
app.get('/api/video_details', async (req: Request, res: Response) => {
  const { course_id, video_id } = req.query;
  if (!course_id || !video_id) {
    return res.status(400).json({ success: false, message: 'Missing course_id or video_id' });
  }

  const cacheKey = `video:${course_id}:${video_id}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const targetUrl = `https://vidya.studybeepro.site/get/fetchVideoDetailsById?course_id=${encodeURIComponent(
    String(course_id)
  )}&video_id=${encodeURIComponent(String(video_id))}`;

  try {
    const upstreamRes = await fetchWithRetry(
      targetUrl,
      {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://vidya.studybeepro.site/',
      },
      2,
      25000
    );

    const data = await upstreamRes.json();
    setCache(cacheKey, data);
    return res.json(data);
  } catch (err: any) {
    console.warn(`Error fetching video details ${course_id}/${video_id}:`, err?.message || err);
    return res.status(200).json({
      success: false,
      message: err?.message || 'Video details temporarily delayed',
    });
  }
});

// API: Video Stream Proxy (M3U8 manifest rewriter + TS segment forwarder)
app.get('/api/video_stream', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const upstreamUrl = `https://vidya.studybeepro.site/video?url=${encodeURIComponent(url)}`;
    let upstreamRes: globalThis.Response;

    try {
      upstreamRes = await fetchWithRetry(
        upstreamUrl,
        {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://vidya.studybeepro.site/',
        },
        1,
        20000
      );
    } catch {
      // Direct stream fallback
      upstreamRes = await fetchWithRetry(
        url,
        {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        1,
        20000
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');

    // If playlist, rewrite TS chunk paths to route through /api/video_stream
    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const text = await upstreamRes.text();
      const rewritten = text.replace(/\/video\?url=/g, '/api/video_stream?url=');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewritten);
    }

    // Binary TS chunks
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    const arrayBuf = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    console.error('Video stream error:', err?.message || err);
    return res.status(500).send('Stream error');
  }
});

// API: PDF Proxy (Returns application/pdf inline so browser opens it immediately)
app.get('/api/pdf_proxy', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const upstreamUrl = `https://vidya.studybeepro.site/pdf?url=${encodeURIComponent(url)}`;
    let upstreamRes: globalThis.Response;

    try {
      upstreamRes = await fetchWithRetry(
        upstreamUrl,
        {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://vidya.studybeepro.site/',
        },
        1,
        25000
      );
    } catch {
      // Direct PDF fetch fallback
      upstreamRes = await fetchWithRetry(
        url,
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        1,
        25000
      );
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="GB_STUDY_Notes.pdf"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuf = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    console.error('PDF proxy error:', err?.message || err);
    // If proxy fails, redirect directly to original URL as final fallback
    return res.redirect(url);
  }
});

export default app;
