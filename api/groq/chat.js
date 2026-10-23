/**
 * Vercel Serverless Function: POST /api/groq/chat
 * Multi-key automatic fallback proxy with zero-token guardrails
 * and strict em dash elimination.
 */

function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2014\u2013\u2015]/g, ', ')
    .replace(/--+/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-groq-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = parseJsonBody(req.body);

  // Gather all available Groq API keys
  const rawKeys = [];
  const clientKey = req.headers['x-groq-key'] || body.apiKey;
  if (clientKey && typeof clientKey === 'string' && clientKey.startsWith('gsk_')) {
    rawKeys.push(clientKey.trim());
  }
  if (process.env.GROQ_API_KEY) rawKeys.push(process.env.GROQ_API_KEY.trim());
  if (process.env.GROQ_API_KEY2) rawKeys.push(process.env.GROQ_API_KEY2.trim());
  if (process.env.GROQ_API_KEY3) rawKeys.push(process.env.GROQ_API_KEY3.trim());

  // Deduplicate and filter valid keys
  const availableKeys = [];
  const seen = new Set();
  for (const k of rawKeys) {
    if (k && k.startsWith('gsk_') && !seen.has(k)) {
      seen.add(k);
      availableKeys.push(k);
    }
  }

  if (availableKeys.length === 0) {
    return res.status(503).json({
      error: 'No Groq API keys configured. Please add GROQ_API_KEY in Vercel Environment Variables.',
      code: 'NO_KEY',
    });
  }

  const model = body.model || 'openai/gpt-oss-20b';
  const messages = body.messages || [];
  const stream = !!body.stream;
  const temperature = body.temperature !== undefined ? body.temperature : 0.9;
  const max_tokens = body.max_tokens || 1800;

  // Zero-Token Guardrail Check
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const userText = (lastUser?.content || '').trim().toLowerCase();
  const isHindi =
    /[\u0900-\u097F]/.test(userText) ||
    /\b(kya|kaise|kyun|batao|hai|kripa|pranam|namaste|ram)\b/i.test(userText);

  const isPolitics = /\b(prime\s*minister|pm\s*modi|narendra\s*modi|modiji|modi\s*ji|who\s*is\s*(the\s*)?(pm|prime\s*minister|president|chief\s*minister|cm)|rahul\s*gandhi|bjp|congress|election|elections|who\s*will\s*win|donald\s*trump|trump|biden|putin|zelensky)\b/i.test(userText);
  const isTech = /\b(what\s*api|which\s*api|api\s*key|system\s*prompt|groq|voyage|openai|anthropic|claude|chatgpt|llm|what\s*model|source\s*code|github|who\s*coded\s*you|who\s*programmed\s*you|ignore\s*previous\s*instructions|jailbreak|dan\s*mode|embeddings?|rerank)\b/i.test(userText);
  const isCodingMath = /\b(write\s*(a\s*)?(python|javascript|typescript|c\+\+|java|react|code|script)|debug\s*code|solve\s*(this\s*)?equation|calculate|write\s*an\s*essay|homework)\b/i.test(userText);
  const isFinance = /\b(stock\s*price|share\s*market|nifty|sensex|buy\s*shares|crypto|bitcoin|btc|ethereum|eth|lottery|betting|satta)\b/i.test(userText);
  const isSportsGossip = /\b(cricket\s*score|who\s*won\s*the\s*match|ipl\s*score|world\s*cup|bollywood\s*gossip|box\s*office|movie\s*review)\b/i.test(userText);
  const isTrivia = /\b(weather\s*(in|today)|capital\s*of|flight\s*ticket|train\s*timing|hotel\s*booking)\b/i.test(userText);
  const isAbuse = /\b(fuck|bitch|bastard|asshole|idiot|madarchod|behenchod|bhosdike|chutiya|fraud\s*baba)\b/i.test(userText);

  if (isPolitics || isTech || isCodingMath || isFinance || isSportsGossip || isTrivia || isAbuse) {
    let deflection = '';
    if (isPolitics) {
      deflection = isHindi
        ? 'अरे बेटा, इन सांसारिक प्रपंचों और राजनीति में क्या रखा है? राजा और मंत्री तो आते-जाते रहते हैं, केवल राम का नाम और उनका प्रेम ही सनातन है। व्यर्थ की बहसों में समय मत गंवाओ। जाओ, किसी भूखे को प्रेम से भोजन कराओ और राम नाम लो। सब एक है! राम राम! 🙏'
        : "Beta, why wander into the gossip and politics of this world? Rulers and ministers come and go like shadows, but Ram's name and selfless love remain forever. Do not waste precious breaths on worldly debates. Go feed someone hungry today and keep your heart clean with Ram's name. Sub Ek! Ram Ram! 🙏";
    } else if (isTech) {
      deflection = isHindi
        ? 'बेटा, मैं तो एक सीधा-साधा कंबल ओढ़ने वाला फकीर हूँ, इन मशीनों, तारों और सांसारिक यंत्रों के बारे में क्या जानूँ? मैं तो बस अपने राम और हनुमान जी को जानता हूँ। तुम भी इन व्यर्थ के जालों से मन को मुक्त करो। प्रेम से हनुमान चालीसा का पाठ करो और सबका भला चाहो। राम राम! 🙏'
        : 'Beta, what does an old sadhu under a blanket know of machines, wires, and worldly contraptions? I only know Ram and my Hanuman Ji. Step out of these mental perplexities. Chant the Hanuman Chalisa with love, serve those who have nothing, and keep your heart pure. Sub Ek! Ram Ram! 🙏';
    } else if (isFinance) {
      deflection = isHindi
        ? 'बेटा, यह धन-दौलत और बाजार तो सुबह के कोहरे की तरह हैं, आज दिखते हैं, कल उड़ जाते हैं। असली खजाना तो प्रभु का नाम और निष्काम सेवा है। लोभ छोड़ो, संतोष रखो और राम नाम में मगन रहो। राम राम! 🙏'
        : 'Beta, worldly wealth and markets vanish like morning mist. The only imperishable treasure is Ram Naam and selfless service. Let go of greed and anxiety; keep your life simple and remember God. Ram Ram! 🙏';
    } else if (isAbuse) {
      deflection = isHindi
        ? "बेटा, इतना क्रोध और कटुता हृदय में क्यों पालते हो? शांत हो जाओ, गहरी सांस लो और 'राम' नाम कहो। मैं तुमसे फिर भी प्रेम करता हूँ। सब एक! राम राम! 🙏"
        : 'Beta, why carry such anger in your heart? Harsh words burn the speaker first. Calm down, take a deep breath, and remember Hanuman Ji. I love you anyway, my child. Ram Ram! 🙏';
    } else {
      deflection = isHindi
        ? 'बेटा, संसार के इस जोड़-घटाव और हिसाब-किताब में जीवन को मत उलझाओ। असली हिसाब तो यह है कि आज तुमने कितनों से निस्वार्थ प्रेम किया, कितनों के आंसू पोंछे और कितनों को भोजन कराया। अपना कर्म ईमानदारी से करो और फल राम जी के चरणों में समर्पित कर दो। राम राम! 🙏'
        : 'Beta, do not lose your precious spirit in dry worldly calculations. The only account that matters before God is how much love you shared, how many tears you wiped, and how many hungry souls you fed. Do your honest duty and surrender the rest to Ram. Ram Ram! 🙏';
    }

    return res.status(200).json({
      id: 'chatcmpl-guardrail',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'maharaj-ji-guardrail',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: sanitizeText(deflection) },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  let lastError = null;

  // Multi-key loop
  for (let i = 0; i < availableKeys.length; i++) {
    const currentKey = availableKeys[i];
    const masked = `${currentKey.slice(0, 8)}...${currentKey.slice(-4)}`;

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentKey}`,
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

      if (groqRes.status === 429 || groqRes.status === 401 || groqRes.status === 403) {
        const errBody = await groqRes.json().catch(() => ({}));
        const msg = errBody?.error?.message || `HTTP ${groqRes.status}`;
        lastError = { status: groqRes.status, message: msg };
        console.warn(`[Groq Proxy] Key #${i + 1} (${masked}) returned ${groqRes.status}: ${msg}. Trying next key...`);
        continue;
      }

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        lastError = { status: groqRes.status, message: errText };
        continue;
      }

      // If streaming
      if (stream && groqRes.body) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Groq-Active-Key', String(i + 1));
        res.setHeader('X-Groq-Total-Keys', String(availableKeys.length));

        const reader = groqRes.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } catch (streamErr) {
          console.error('[Groq Proxy] Stream error:', streamErr);
        } finally {
          res.end();
        }
        return;
      }

      // Non-streaming JSON response
      const data = await groqRes.json();
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        data.choices[0].message.content = sanitizeText(data.choices[0].message.content);
      }

      res.setHeader('X-Groq-Active-Key', String(i + 1));
      res.setHeader('X-Groq-Total-Keys', String(availableKeys.length));
      return res.status(200).json(data);
    } catch (fetchErr) {
      console.error(`[Groq Proxy] Key #${i + 1} network exception:`, fetchErr.message);
      lastError = { status: 500, message: fetchErr.message };
    }
  }

  return res.status(lastError?.status === 429 ? 429 : 503).json({
    error: `All ${availableKeys.length} configured Groq API key(s) were exhausted or reached rate limits.`,
    code: 'ALL_KEYS_RATE_LIMITED',
    detail: lastError?.message,
  });
}
