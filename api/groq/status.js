/**
 * Vercel Serverless Function: GET /api/groq/status
 * Reports the number of active Groq API keys configured in environment variables.
 */

export default function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-groq-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY2,
    process.env.GROQ_API_KEY3,
  ];

  const validKeys = rawKeys.filter(
    (k) => k && typeof k === 'string' && k.trim().startsWith('gsk_')
  );

  return res.status(200).json({
    configuredKeysCount: validKeys.length,
    hasKey: validKeys.length > 0,
  });
}
