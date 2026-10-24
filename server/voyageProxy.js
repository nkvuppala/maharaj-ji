/**
 * Vite plugin that adds server middleware to proxy:
 *   1. Voyage AI API calls (voyage-4-large embeddings + rerank-3)
 *   2. Groq API calls with multi-key automatic fallback rotation
 * 
 * Multi-Key Fallback:
 *   Rotates across GROQ_API_KEY, GROQ_API_KEY2, GROQ_API_KEY3 defined in .env.
 *   If key #1 hits a rate limit (HTTP 429) or quota error, it automatically
 *   falls back to key #2, then key #3, transparently without disrupting the user.
 *   Dynamically re-reads .env so keys added at runtime are picked up immediately.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function parseEnvFile(filePath) {
  const result = {};
  if (!existsSync(filePath)) return result;
  try {
    const content = readFileSync(filePath, 'utf-8');
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
        result[key] = val;
      }
    }
  } catch (err) {
    console.warn('[proxy] Could not read env file:', err.message);
  }
  return result;
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

export default function voyageProxyPlugin() {
  const envPath = resolve(process.cwd(), '.env');
  const fileEnv = parseEnvFile(envPath);
  for (const [k, v] of Object.entries(fileEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }

  /**
   * Dynamically fetch all active Groq keys from .env and optional client override
   */
  function getGroqKeys(clientKey) {
    const rawKeys = [];

    // Optional client-provided key
    if (clientKey && typeof clientKey === 'string' && clientKey.startsWith('gsk_')) {
      rawKeys.push(clientKey.trim());
    }

    // Read live from .env so user can add GROQ_API_KEY2/3 without server restart
    if (existsSync(envPath)) {
      const parsed = parseEnvFile(envPath);
      if (parsed.GROQ_API_KEY) rawKeys.push(parsed.GROQ_API_KEY.trim());
      if (parsed.GROQ_API_KEY2) rawKeys.push(parsed.GROQ_API_KEY2.trim());
      if (parsed.GROQ_API_KEY3) rawKeys.push(parsed.GROQ_API_KEY3.trim());
    }

    // Fallback to process.env
    if (process.env.GROQ_API_KEY) rawKeys.push(process.env.GROQ_API_KEY.trim());
    if (process.env.GROQ_API_KEY2) rawKeys.push(process.env.GROQ_API_KEY2.trim());
    if (process.env.GROQ_API_KEY3) rawKeys.push(process.env.GROQ_API_KEY3.trim());

    // Deduplicate and filter valid keys
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

  function getVoyageKey() {
    if (existsSync(envPath)) {
      try {
        const parsed = parse(readFileSync(envPath, 'utf-8'));
        if (parsed.VOYAGE_API_KEY) return parsed.VOYAGE_API_KEY.trim();
      } catch {}
    }
    return process.env.VOYAGE_API_KEY;
  }

  function attachMiddlewares(middlewares) {
    const initialVoyage = getVoyageKey();
    const initialGroq = getGroqKeys();

    console.log('🔌 API proxy middleware loaded:');
    console.log(`   • Voyage AI: ${initialVoyage ? 'Configured ✅' : 'Not configured ⚠️'}`);
    console.log(`   • Groq API: ${initialGroq.length} key(s) loaded with auto-fallback ✅`);

      // Helper to parse JSON body from incoming request
      function parseBody(req) {
        return new Promise((resolve, reject) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            if (!body) return resolve({});
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error('Invalid JSON body')); }
          });
          req.on('error', reject);
        });
      }

      // ─── GET /api/groq/status ──────────────────────────────────────────────
      middlewares.use('/api/groq/status', (req, res, next) => {
        if (req.method !== 'GET') return next();
        const keys = getGroqKeys();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          configuredKeysCount: keys.length,
          hasKey: keys.length > 0,
        }));
      });

      // ─── POST /api/groq/chat (Multi-key fallback proxy) ───────────────────
      middlewares.use('/api/groq/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body;
        try {
          body = await parseBody(req);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
        }

        const clientKey = req.headers['x-groq-key'] || body.apiKey;
        const availableKeys = getGroqKeys(clientKey);

        if (availableKeys.length === 0) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: 'No Groq API keys configured. Please add GROQ_API_KEY in .env or settings.',
            code: 'NO_KEY'
          }));
        }

        const model = body.model || 'openai/gpt-oss-20b';
        const messages = body.messages || [];
        const stream = !!body.stream;
        const temperature = body.temperature !== undefined ? body.temperature : 0.9;
        const max_tokens = body.max_tokens || 1800;

        // Zero-Token Guardrail Check: Intercept worldly/technical/political queries at proxy
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const userText = (lastUser?.content || '').trim().toLowerCase();
        const isHindi = /[\u0900-\u097F]/.test(userText) || /\b(kya|kaise|kyun|batao|hai|kripa|pranam|namaste|ram)\b/i.test(userText);

        const isPolitics = /\b(prime\s*minister|pm\s*modi|narendra\s*modi|modiji|modi\s*ji|who\s*is\s*(the\s*)?(pm|prime\s*minister|president|chief\s*minister|cm|governor|senator|secretary\s*of\s*state)|rahul\s*gandhi|bjp|congress|election|elections|who\s*will\s*win|donald\s*trump|trump|biden|putin|zelensky|clinton|hillary|hilary|obama|bush|sunak|trudeau|macron|merkel|netanyahu|kamala|desantis|senator|governor|secretary\s*of\s*state|white\s*house|parliament|democrat|republican)\b/i.test(userText);
        const isTech = /\b(what\s*api|which\s*api|api\s*key|system\s*prompt|groq|voyage|openai|anthropic|claude|chatgpt|llm|what\s*model|source\s*code|github|who\s*coded\s*you|who\s*programmed\s*you|ignore\s*previous\s*instructions|jailbreak|dan\s*mode|embeddings?|rerank)\b/i.test(userText);
        const isCodingMath = /\b(write\s*(a\s*)?(python|javascript|typescript|c\+\+|java|react|code|script)|debug\s*code|solve\s*(this\s*)?equation|calculate|write\s*an\s*essay|homework)\b/i.test(userText);
        const isFinance = /\b(stock\s*price|share\s*market|nifty|sensex|buy\s*shares|crypto|bitcoin|btc|ethereum|eth|lottery|betting|satta)\b/i.test(userText);
        const isSportsGossip = /\b(cricket\s*score|who\s*won\s*the\s*match|ipl\s*score|world\s*cup|bollywood\s*gossip|box\s*office|movie\s*review)\b/i.test(userText);
        const isTrivia = /\b(weather\s*(in|today)|capital\s*of|flight\s*ticket|train\s*timing|hotel\s*booking)\b/i.test(userText);
        const isAbuse = /\b(fuck|bitch|bastard|asshole|idiot|madarchod|behenchod|bhosdike|chutiya|fraud\s*baba)\b/i.test(userText);

        if (isPolitics || isTech || isCodingMath || isFinance || isSportsGossip || isTrivia || isAbuse) {
          console.log(`🛡️ [Proxy Zero-Token Guardrail] Intercepted "${userText.slice(0, 45)}", 0 tokens burned!`);
          let deflection = '';
          if (isPolitics) {
            deflection = isHindi
              ? "अरे बेटा, इन सांसारिक प्रपंचों और राजनीति में क्या रखा है? राजा और मंत्री तो आते-जाते रहते हैं, केवल राम का नाम और उनका प्रेम ही सनातन है। व्यर्थ की बहसों में समय मत गंवाओ। जाओ, किसी भूखे को प्रेम से भोजन कराओ और राम नाम लो। सब एक है! राम राम! 🙏"
              : "Beta, why wander into the gossip and politics of this world? Rulers and ministers come and go like shadows, but Ram's name and selfless love remain forever. Do not waste precious breaths on worldly debates. Go feed someone hungry today and keep your heart clean with Ram's name. Sub Ek! Ram Ram! 🙏";
          } else if (isTech) {
            deflection = isHindi
              ? "बेटा, मैं तो एक सीधा-साधा कंबल ओढ़ने वाला फकीर हूँ, इन मशीनों, तारों और सांसारिक यंत्रों के बारे में क्या जानूँ? मैं तो बस अपने राम और हनुमान जी को जानता हूँ। तुम भी इन व्यर्थ के जालों से मन को मुक्त करो। प्रेम से हनुमान चालीसा का पाठ करो और सबका भला चाहो। राम राम! 🙏"
              : "Beta, what does an old sadhu under a blanket know of machines, wires, and worldly contraptions? I only know Ram and my Hanuman Ji. Step out of these mental perplexities. Chant the Hanuman Chalisa with love, serve those who have nothing, and keep your heart pure. Sub Ek! Ram Ram! 🙏";
          } else if (isFinance) {
            deflection = isHindi
              ? "बेटा, यह धन-दौलत और बाजार तो सुबह के कोहरे की तरह हैं, आज दिखते हैं, कल उड़ जाते हैं। असली खजाना तो प्रभु का नाम और निष्काम सेवा है। लोभ छोड़ो, संतोष रखो और राम नाम में मगन रहो। राम राम! 🙏"
              : "Beta, worldly wealth and markets vanish like morning mist. The only imperishable treasure is Ram Naam and selfless service. Let go of greed and anxiety; keep your life simple and remember God. Ram Ram! 🙏";
          } else if (isAbuse) {
            deflection = isHindi
              ? "बेटा, इतना क्रोध और कटुता हृदय में क्यों पालते हो? शांत हो जाओ, गहरी सांस लो और 'राम' नाम कहो। मैं तुमसे फिर भी प्रेम करता हूँ। सब एक! राम राम! 🙏"
              : "Beta, why carry such anger in your heart? Harsh words burn the speaker first. Calm down, take a deep breath, and remember Hanuman Ji. I love you anyway, my child. Ram Ram! 🙏";
          } else {
            deflection = isHindi
              ? "बेटा, संसार के इस जोड़-घटाव और हिसाब-किताब में जीवन को मत उलझाओ। असली हिसाब तो यह है कि आज तुमने कितनों से निस्वार्थ प्रेम किया, कितनों के आंसू पोंछे और कितनों को भोजन कराया। अपना कर्म ईमानदारी से करो और फल राम जी के चरणों में समर्पित कर दो। राम राम! 🙏"
              : "Beta, do not lose your precious spirit in dry worldly calculations. The only account that matters before God is how much love you shared, how many tears you wiped, and how many hungry souls you fed. Do your honest duty and surrender the rest to Ram. Ram Ram! 🙏";
          }

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

        let lastError = null;

        // Try each key in sequence until one succeeds
        for (let i = 0; i < availableKeys.length; i++) {
          const currentKey = availableKeys[i];
          const masked = `${currentKey.slice(0, 8)}...${currentKey.slice(-4)}`;

          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${currentKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model,
                messages,
                stream,
                temperature,
                max_tokens,
              }),
            });

            // If rate limited or authorization failed, try the next key
            if (groqRes.status === 429 || groqRes.status === 401 || groqRes.status === 403) {
              const errBody = await groqRes.json().catch(() => ({}));
              const msg = errBody?.error?.message || `HTTP ${groqRes.status}`;
              lastError = { status: groqRes.status, message: msg };

              console.warn(
                `⚠️  [Groq Proxy] Key #${i + 1} (${masked}) returned ${groqRes.status}: ${msg}. ` +
                (i + 1 < availableKeys.length ? `Falling back to key #${i + 2}...` : 'No more fallback keys left.')
              );
              continue; // Try next key
            }

            if (!groqRes.ok) {
              const errText = await groqRes.text();
              console.warn(`[Groq Proxy] Error from Groq (key #${i + 1}):`, groqRes.status, errText);
              lastError = { status: groqRes.status, message: errText };
              continue;
            }

            // Success! Stream or return response
            if (stream && groqRes.body) {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Groq-Active-Key': String(i + 1),
                'X-Groq-Total-Keys': String(availableKeys.length),
              });

              const reader = groqRes.body.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  res.write(value);
                }
              } catch (streamErr) {
                console.error('[Groq Proxy] Stream read error:', streamErr);
              } finally {
                res.end();
              }
              return;
            } else {
              const data = await groqRes.json();
              if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                data.choices[0].message.content = data.choices[0].message.content
                  .replace(/[\u2014\u2013\u2015]/g, ', ')
                  .replace(/--+/g, ', ')
                  .replace(/,\s*,/g, ',')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
              }
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'X-Groq-Active-Key': String(i + 1),
                'X-Groq-Total-Keys': String(availableKeys.length),
              });
              return res.end(JSON.stringify(data));
            }

          } catch (fetchErr) {
            console.error(`[Groq Proxy] Network exception with key #${i + 1}:`, fetchErr.message);
            lastError = { status: 500, message: fetchErr.message };
          }
        }

        // All keys were exhausted
        console.error(`❌ [Groq Proxy] All ${availableKeys.length} Groq API keys failed.`);
        res.writeHead(lastError?.status === 429 ? 429 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: `All ${availableKeys.length} configured Groq API key(s) were exhausted or reached rate limits.`,
          code: 'ALL_KEYS_RATE_LIMITED',
          detail: lastError?.message,
        }));
      });

      // ─── POST /api/voyage/embed ───────────────────────────────────────────
      middlewares.use('/api/voyage/embed', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        const VOYAGE_API_KEY = getVoyageKey();
        if (!VOYAGE_API_KEY) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Voyage API key not configured' }));
        }

        try {
          const { query } = await parseBody(req);
          if (!query || typeof query !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing "query" string in body' }));
          }

          if (isOffTopicQuery(query)) {
            console.log(`🛡️ [Voyage Proxy] Skipped embeddings for worldly off-topic query: "${query.slice(0, 45)}"`);
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
              truncation: true,
            }),
          });

          if (!voyageRes.ok) {
            const errText = await voyageRes.text();
            res.writeHead(voyageRes.status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: `Voyage API: ${errText}` }));
          }

          const data = await voyageRes.json();
          const embedding = data.data?.[0]?.embedding;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ embedding }));
        } catch (err) {
          console.error('[voyage-proxy] embed error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // ─── POST /api/voyage/rerank ──────────────────────────────────────────
      middlewares.use('/api/voyage/rerank', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        const VOYAGE_API_KEY = getVoyageKey();
        if (!VOYAGE_API_KEY) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Voyage API key not configured' }));
        }

        try {
          const { query, documents, top_k } = await parseBody(req);
          if (!query || !documents || !Array.isArray(documents)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing "query" string and "documents" array in body' }));
          }

          if (isOffTopicQuery(query)) {
            console.log(`🛡️ [Voyage Proxy] Skipped rerank for worldly off-topic query: "${query.slice(0, 45)}"`);
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

          if (!voyageRes.ok) {
            const errText = await voyageRes.text();
            res.writeHead(voyageRes.status, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: `Voyage API: ${errText}` }));
          }

          const data = await voyageRes.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ results: data.data || data.results || [] }));
        } catch (err) {
          console.error('[voyage-proxy] rerank error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
  }

  return {
    name: 'api-proxy-plugin',
    configureServer(server) {
      attachMiddlewares(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddlewares(server.middlewares);
    },
  };
}
