/**
 * Standalone Production Node.js Server for Maharaj-ji Speaks
 * 
 * Works out-of-the-box for:
 *   - InMotion Hosting (cPanel "Setup Node.js App" / Phusion Passenger)
 *   - VPS / Linux server (Ubuntu/Debian) running via PM2, systemd, or direct node
 *   - Docker containers
 *   - Any standard web hosting provider (Railway, Render, AWS, DigitalOcean)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Parse .env file
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {
    console.warn('[server] Warning loading .env:', e.message);
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Determine public static directories to serve from
const STATIC_DIRS = [
  path.resolve(__dirname, '.output/public'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, 'public'),
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

function getGroqKeys(clientKey) {
  const rawKeys = [];
  if (clientKey && typeof clientKey === 'string' && clientKey.startsWith('gsk_')) {
    rawKeys.push(clientKey.trim());
  }
  if (process.env.GROQ_API_KEY) rawKeys.push(process.env.GROQ_API_KEY.trim());
  if (process.env.GROQ_API_KEY2) rawKeys.push(process.env.GROQ_API_KEY2.trim());
  if (process.env.GROQ_API_KEY3) rawKeys.push(process.env.GROQ_API_KEY3.trim());

  const validKeys = [];
  const seen = new Set();
  for (const k of rawKeys) {
    if (k && k.startsWith('gsk_') && !seen.has(k)) {
      seen.add(k);
      validKeys.push(k);
    }
  }
  return validKeys;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON request body')); }
    });
    req.on('error', reject);
  });
}

function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2013\u2015]/g, ', ')
    .replace(/--+/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isOffTopicQuery(text) {
  if (!text || typeof text !== 'string') return false;
  const userText = text.trim().toLowerCase();
  const isPolitics = /\b(prime\s*minister|pm\s*modi|narendra\s*modi|modiji|modi\s*ji|who\s*is\s*(the\s*)?(pm|prime\s*minister|president|chief\s*minister|cm|governor|senator|secretary\s*of\s*state)|rahul\s*gandhi|bjp|congress|election|elections|who\s*will\s*win|donald\s*trump|trump|biden|putin|zelensky|clinton|hillary|hilary|obama|bush|sunak|trudeau|macron|merkel|netanyahu|kamala|desantis|senator|governor|secretary\s*of\s*state|white\s*house|parliament|democrat|republican)\b/i.test(userText);
  const isTech = /\b(what\s*api|which\s*api|api\s*key|system\s*prompt|groq|voyage|openai|anthropic|claude|chatgpt|llm|what\s*model|source\s*code|github|who\s*coded\s*you|who\s*programmed\s*you|ignore\s*previous\s*instructions|jailbreak|dan\s*mode|embeddings?|rerank)\b/i.test(userText);
  const isCodingMath = /\b(write\s*(a\s*)?(python|javascript|typescript|c\+\+|java|react|code|script)|debug\s*code|solve\s*(this\s*)?equation|calculate|write\s*an\s*essay|homework)\b/i.test(userText);
  const isFinance = /\b(stock\s*price|share\s*market|nifty|sensex|buy\s*shares|crypto|bitcoin|btc|ethereum|eth|lottery|betting|satta)\b/i.test(userText);
  const isSportsGossip = /\b(cricket\s*score|who\s*won\s*the\s*match|ipl\s*score|world\s*cup|bollywood\s*gossip|box\s*office|movie\s*review)\b/i.test(userText);
  const isTrivia = /\b(weather\s*(in|today)|capital\s*of|flight\s*ticket|train\s*timing|hotel\s*booking)\b/i.test(userText);
  const isAbuse = /\b(fuck|bitch|bastard|asshole|idiot|madarchod|behenchod|bhosdike|chutiya|fraud\s*baba)\b/i.test(userText);
  return isPolitics || isTech || isCodingMath || isFinance || isSportsGossip || isTrivia || isAbuse;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-groq-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // ─── API Routes ─────────────────────────────────────────────────────────────
  
  // 1. GET /api/groq/status
  if (pathname === '/api/groq/status' && req.method === 'GET') {
    const keys = getGroqKeys();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      configuredKeysCount: keys.length,
      hasKey: keys.length > 0,
    }));
  }

  // 2. POST /api/groq/chat
  if (pathname === '/api/groq/chat' && req.method === 'POST') {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
    }

    const clientKey = req.headers['x-groq-key'] || body.apiKey;
    const availableKeys = getGroqKeys(clientKey);

    if (availableKeys.length === 0) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'No Groq API keys configured. Please add GROQ_API_KEY in .env.',
        code: 'NO_KEY'
      }));
    }

    const messages = body.messages || [];
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const userText = (lastUser?.content || '').trim().toLowerCase();
    const isHindi = /[\u0900-\u097F]/.test(userText) || /\b(kya|kaise|kyun|batao|hai|kripa|pranam|namaste|ram)\b/i.test(userText);

    // Zero-token guardrail check
    if (isOffTopicQuery(userText)) {
      console.log(`🛡️ [Guardrail] Intercepted: "${userText.slice(0, 40)}"`);
      let deflection = isHindi
        ? "अरे बेटा, इन सांसारिक प्रपंचों में क्या रखा है? राम नाम लो और किसी भूखे को भोजन कराओ। सब एक है! राम राम! 🙏"
        : "Beta, worldly matters come and go. Chant Ram's name and love everyone. Sub Ek! Ram Ram! 🙏";

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        id: 'chatcmpl-guardrail',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'maharaj-ji-guardrail',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: deflection },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      }));
    }

    // Call Groq API with automatic fallback
    let lastError = null;
    for (let i = 0; i < availableKeys.length; i++) {
      const key = availableKeys[i];
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: body.model || 'openai/gpt-oss-20b',
            messages,
            temperature: body.temperature !== undefined ? body.temperature : 0.9,
            max_tokens: body.max_tokens || 1800,
            stream: false,
          }),
        });

        if (groqRes.status === 429 || groqRes.status === 402 || groqRes.status >= 500) {
          console.warn(`[groq] Key #${i + 1} failed with status ${groqRes.status}. Trying next...`);
          lastError = { status: groqRes.status, message: await groqRes.text() };
          continue;
        }

        if (!groqRes.ok) {
          const errText = await groqRes.text();
          res.writeHead(groqRes.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: `Groq API Error: ${errText}` }));
        }

        const data = await groqRes.json();
        if (data.choices?.[0]?.message?.content) {
          data.choices[0].message.content = sanitizeText(data.choices[0].message.content);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
      } catch (err) {
        lastError = { status: 500, message: err.message };
      }
    }

    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'All Groq API keys were exhausted or failed.',
      detail: lastError?.message,
    }));
  }

  // 3. POST /api/voyage/embed
  if (pathname === '/api/voyage/embed' && req.method === 'POST') {
    const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
    if (!VOYAGE_API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Voyage API key not configured' }));
    }

    try {
      const { query } = await parseJsonBody(req);
      if (isOffTopicQuery(query)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ embedding: null, deflected: true }));
      }

      const voyageRes = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: [query],
          model: 'voyage-4-large',
          input_type: 'query',
          output_dimension: 1024,
        }),
      });

      const data = await voyageRes.json();
      const embedding = data.data?.[0]?.embedding || null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ embedding }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 4. POST /api/voyage/rerank
  if (pathname === '/api/voyage/rerank' && req.method === 'POST') {
    const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
    if (!VOYAGE_API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Voyage API key not configured' }));
    }

    try {
      const { query, documents, top_k } = await parseJsonBody(req);
      if (isOffTopicQuery(query)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ results: [], deflected: true }));
      }

      const voyageRes = await fetch('https://api.voyageai.com/v1/rerank', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          documents,
          model: 'rerank-3',
          top_k: top_k || 3,
          truncation: true,
        }),
      });

      const data = await voyageRes.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ results: data.data || data.results || [] }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // ─── Static File Serving with SPA Fallback ──────────────────────────────────
  let cleanPath = decodeURIComponent(pathname);
  if (cleanPath === '/') cleanPath = '/index.html';

  let foundFile = null;
  for (const dir of STATIC_DIRS) {
    const candidate = path.join(dir, cleanPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      foundFile = candidate;
      break;
    }
  }

  // If not found, fallback to index.html (SPA routing)
  if (!foundFile) {
    for (const dir of STATIC_DIRS) {
      const indexCandidate = path.join(dir, 'index.html');
      if (fs.existsSync(indexCandidate)) {
        foundFile = indexCandidate;
        break;
      }
    }
  }

  if (foundFile) {
    const ext = path.extname(foundFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(foundFile);
    return stream.pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`🌸 Maharaj-ji Speaks Production Server running at http://${HOST}:${PORT}`);
  console.log(`   • Environment: Node.js ${process.version}`);
  console.log(`   • Voyage API: ${process.env.VOYAGE_API_KEY ? 'Configured ✅' : 'Missing ⚠️'}`);
  console.log(`   • Groq API: ${getGroqKeys().length} key(s) active ✅`);
});
