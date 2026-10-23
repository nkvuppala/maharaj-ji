/**
 * Vercel Serverless Function: POST /api/voyage/embed
 * Proxies embedding generation to Voyage AI (voyage-4-large)
 */

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  if (!VOYAGE_API_KEY) {
    return res.status(503).json({ error: 'Voyage API key not configured' });
  }

  try {
    const { query } = parseJsonBody(req.body);
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing "query" string in body' });
    }

    const voyageRes = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
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
      return res.status(voyageRes.status).json({ error: `Voyage API: ${errText}` });
    }

    const data = await voyageRes.json();
    const embedding = data.data?.[0]?.embedding;
    return res.status(200).json({ embedding });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
