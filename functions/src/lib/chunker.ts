import pdf from 'pdf-parse';

export interface Chunk {
  content: string;
  chunkIndex: number;
}

// How large each chunk is in characters. ~2000 chars ≈ 500 tokens,
// which fits comfortably within Ada-002's 8191-token input limit and
// leaves plenty of room for multiple chunks in a GPT-4o context window.
const CHUNK_SIZE = 2000;

// How many characters of the previous chunk to repeat at the start of
// the next one. Overlap prevents a sentence that straddles a boundary
// from being split across two chunks, losing its context in both.
const OVERLAP = 200;

// Extract all text from a PDF buffer, then split it into overlapping chunks.
// Returns an array of chunks with their index so we can build unique IDs.
export async function extractChunks(buffer: Buffer): Promise<Chunk[]> {
  const { text } = await pdf(buffer);

  // Collapse runs of whitespace/newlines that pdf-parse leaves behind —
  // they inflate character counts without adding searchable content.
  const cleaned = text.replace(/\s+/g, ' ').trim();

  const chunks: Chunk[] = [];
  let i = 0;

  while (i < cleaned.length) {
    let end = Math.min(i + CHUNK_SIZE, cleaned.length);

    // Walk end back to the nearest space so we never cut a word in half.
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(' ', end);
      if (lastSpace > i) end = lastSpace;
    }

    const content = cleaned.slice(i, end).trim();

    // Skip any chunk that is too short to be useful (e.g. a stray header).
    if (content.length > 50) {
      chunks.push({ content, chunkIndex: chunks.length });
    }

    i += CHUNK_SIZE - OVERLAP;
  }

  return chunks;
}
