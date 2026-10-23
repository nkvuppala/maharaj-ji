/**
 * Voyage AI RAG Pipeline
 * 
 * Semantic search over pre-computed embeddings using:
 *   1. Client-side cosine similarity (fast, no API call) for initial retrieval
 *   2. Server-proxied Voyage AI rerank-3 for precision re-scoring
 * 
 * The pipeline: Query → Cosine Top-K → Rerank Top-N → Inject into prompt
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmbeddedDocument {
  id: string;
  type: 'story' | 'teaching';
  title: string;
  category: string;
  tags: string[];
  contextText: string;
  embedding: number[];
}

interface EmbeddingsData {
  model: string;
  dimension: number;
  createdAt: string;
  totalDocuments: number;
  documents: EmbeddedDocument[];
}

interface RerankedResult {
  index: number;
  relevance_score: number;
  document?: string;
}

interface RAGResult {
  context: string;        // Formatted context to inject into system prompt
  sources: string[];      // Titles of retrieved sources
  scores: number[];       // Relevance scores from reranker
}

// ─── Embeddings Cache ────────────────────────────────────────────────────────

let cachedEmbeddings: EmbeddingsData | null = null;
let loadPromise: Promise<EmbeddingsData | null> | null = null;

/**
 * Load pre-computed embeddings from data/embeddings.json
 * Cached after first load, only fetched once per session
 */
async function loadEmbeddings(): Promise<EmbeddingsData | null> {
  if (cachedEmbeddings) return cachedEmbeddings;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch('/data/embeddings.json');
      if (!res.ok) {
        console.warn('[RAG] embeddings.json not found, RAG disabled. Run: node scripts/buildEmbeddings.js');
        return null;
      }
      cachedEmbeddings = await res.json();
      console.log(`[RAG] Loaded ${cachedEmbeddings!.totalDocuments} embeddings (${cachedEmbeddings!.model})`);
      return cachedEmbeddings;
    } catch (err) {
      console.warn('[RAG] Failed to load embeddings:', err);
      return null;
    }
  })();

  return loadPromise;
}

// ─── Vector Math ─────────────────────────────────────────────────────────────

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Voyage API Calls (via server proxy) ─────────────────────────────────────

/**
 * Embed a user query using voyage-4-large (via server proxy)
 */
async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const res = await fetch('/api/voyage/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      console.warn('[RAG] Embed query failed:', res.status);
      return null;
    }

    const data = await res.json();
    return data.embedding || null;
  } catch (err) {
    console.warn('[RAG] Embed query error:', err);
    return null;
  }
}

/**
 * Rerank candidate documents using rerank-3 (via server proxy)
 */
async function rerankDocuments(
  query: string,
  documents: string[],
  topK: number = 3
): Promise<RerankedResult[]> {
  try {
    const res = await fetch('/api/voyage/rerank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents, top_k: topK }),
    });

    if (!res.ok) {
      console.warn('[RAG] Rerank failed:', res.status);
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('[RAG] Rerank error:', err);
    return [];
  }
}

// ─── Main RAG Pipeline ──────────────────────────────────────────────────────

/**
 * Full RAG pipeline:
 *   1. Embed the user's query with voyage-4-large
 *   2. Cosine similarity against all pre-computed document embeddings
 *   3. Take top 10 candidates
 *   4. Rerank with rerank-3 to get the best 3
 *   5. Return formatted context for the system prompt
 */
export async function retrieveContext(userMessage: string): Promise<RAGResult | null> {
  // Step 0: Load embeddings
  const embeddings = await loadEmbeddings();
  if (!embeddings || embeddings.documents.length === 0) {
    return null;
  }

  // Step 1: Embed the user's query
  const queryEmbedding = await embedQuery(userMessage);
  if (!queryEmbedding) {
    // Fallback: keyword-based search if Voyage embed fails
    return fallbackKeywordSearch(userMessage, embeddings);
  }

  // Step 2: Cosine similarity: score all documents
  const scored = embeddings.documents.map((doc, index) => ({
    index,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
    doc,
  }));

  // Step 3: Sort by score and take top 10 candidates for reranking
  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 10);

  // Step 4: Rerank with Voyage rerank-3
  const candidateTexts = candidates.map(c => c.doc.contextText);
  const reranked = await rerankDocuments(userMessage, candidateTexts, 3);

  if (reranked.length > 0) {
    // Use reranked results
    const topDocs = reranked
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 3);

    const contextParts: string[] = [];
    const sources: string[] = [];
    const scores: number[] = [];

    for (const result of topDocs) {
      const candidate = candidates[result.index];
      if (candidate) {
        contextParts.push(candidate.doc.contextText);
        sources.push(candidate.doc.title);
        scores.push(result.relevance_score);
      }
    }

    return {
      context: contextParts.join('\n\n---\n\n'),
      sources,
      scores,
    };
  }

  // Fallback: use cosine similarity top 3 if reranking fails
  const top3 = candidates.slice(0, 3);
  return {
    context: top3.map(c => c.doc.contextText).join('\n\n---\n\n'),
    sources: top3.map(c => c.doc.title),
    scores: top3.map(c => c.score),
  };
}

/**
 * Fallback keyword search when Voyage embedding API is unavailable
 */
function fallbackKeywordSearch(query: string, embeddings: EmbeddingsData): RAGResult | null {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 2);

  const scored = embeddings.documents.map(doc => {
    let score = 0;
    const searchTarget = `${doc.title} ${doc.category} ${doc.tags.join(' ')} ${doc.contextText}`.toLowerCase();
    for (const word of words) {
      if (searchTarget.includes(word)) score++;
    }
    // Boost stories over teachings for richer context
    if (doc.type === 'story') score += 0.5;
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0).slice(0, 2);

  if (top.length === 0) return null;

  return {
    context: top.map(t => t.doc.contextText).join('\n\n---\n\n'),
    sources: top.map(t => t.doc.title),
    scores: top.map(t => t.score),
  };
}

/**
 * Check if the RAG system is available
 */
export async function isRAGAvailable(): Promise<boolean> {
  const embeddings = await loadEmbeddings();
  return embeddings !== null && embeddings.documents.length > 0;
}
