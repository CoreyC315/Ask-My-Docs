import { app, InvocationContext } from '@azure/functions';
import { extractChunks } from '../lib/chunker';
import { embedBatch } from '../lib/openai-client';
import { indexChunks } from '../lib/search-client';

// Blob trigger — Azure fires this automatically whenever a file appears in
// the documents container. The `blob` argument is the raw file bytes.
// The path pattern `documents/{name}` binds the filename to the trigger metadata.
app.storageBlob('ingest', {
  path: 'documents/{name}',
  connection: 'AzureWebJobsStorage',
  handler: async (blob: Buffer, context: InvocationContext) => {
    const filename = context.triggerMetadata?.name as string;
    context.log(`Ingesting: ${filename} (${blob.length} bytes)`);

    // Use the filename (without extension, sanitised) as a stable document ID.
    // This means re-uploading the same filename overwrites the old chunks rather
    // than duplicating them — the chunk IDs are `${documentId}-${chunkIndex}`.
    const documentId = filename
      .replace(/\.[^/.]+$/, '')   // strip extension
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();

    // Step 1: extract text from the PDF and split into overlapping chunks.
    // Each chunk is ~2000 characters (~500 tokens) with a 200-char overlap.
    context.log(`Extracting chunks...`);
    const chunks = await extractChunks(blob);
    context.log(`Extracted ${chunks.length} chunks`);

    if (chunks.length === 0) {
      context.warn(`No text found in ${filename} — skipping`);
      return;
    }

    // Step 2: embed all chunks in a single API call.
    // Ada-002 turns each chunk into a 1536-dimensional vector that captures
    // its semantic meaning. Chunks about similar topics end up close together
    // in vector space, which is what makes search work.
    context.log(`Embedding ${chunks.length} chunks...`);
    const embeddings = await embedBatch(chunks.map((c) => c.content));

    // Step 3: push all chunks and their vectors into AI Search.
    // The index is created automatically on the first call if it doesn't exist.
    context.log(`Indexing chunks...`);
    await indexChunks(documentId, filename, chunks, embeddings);

    context.log(`Done — ${filename} indexed as ${chunks.length} chunks`);
  },
});
