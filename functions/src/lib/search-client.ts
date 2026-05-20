import {
  SearchClient,
  SearchIndexClient,
  AzureKeyCredential,
  SearchIndex,
} from '@azure/search-documents';
import { DefaultAzureCredential } from '@azure/identity';
import { Chunk } from './chunker';

// The number of dimensions in an Ada-002 embedding vector.
// This must match the index schema — changing it requires rebuilding the index.
const DIMENSIONS = 1536;

// Document stored in the AI Search index.
// Each row is one chunk of a PDF plus its embedding vector.
interface IndexedChunk {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
}

function getCredential() {
  // In Azure the Function App uses managed identity (no key needed).
  // Locally, set AZURE_SEARCH_KEY in local.settings.json to use an API key
  // instead — grab it from the portal under the search service > Keys.
  if (process.env.AZURE_SEARCH_KEY) {
    return new AzureKeyCredential(process.env.AZURE_SEARCH_KEY);
  }
  // DefaultAzureCredential chains through: env vars → managed identity → az login.
  // If you're logged in via `az login` locally this just works, provided your
  // account has the Search Index Data Contributor role on the search service.
  return new DefaultAzureCredential();
}

function getClients() {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME!;
  const credential = getCredential();

  return {
    indexClient: new SearchIndexClient(endpoint, credential),
    searchClient: new SearchClient<IndexedChunk>(endpoint, indexName, credential),
    indexName,
  };
}

// Module-level flag so we only check/create the index once per cold start,
// not on every document ingested.
let indexReady = false;

// Create the index if it doesn't already exist.
// The schema defines every field the ingest function will write and the
// query function will read. The vector field needs dimensions and an
// algorithm profile — HNSW (Hierarchical Navigable Small World) is the
// standard approximate nearest-neighbour algorithm used for vector search.
async function ensureIndex(): Promise<void> {
  if (indexReady) return;

  const { indexClient, indexName } = getClients();

  const schema: SearchIndex = {
    name: indexName,
    fields: [
      // key: true marks this as the unique document ID.
      { name: 'id', type: 'Edm.String', key: true, filterable: true },
      // documentId ties all chunks back to the same uploaded file.
      { name: 'documentId', type: 'Edm.String', filterable: true },
      { name: 'filename', type: 'Edm.String', filterable: true },
      // The raw text of the chunk — returned alongside search results so
      // GPT-4o can read it as context.
      { name: 'content', type: 'Edm.String', searchable: true },
      { name: 'chunkIndex', type: 'Edm.Int32', filterable: true },
      // The 1536-dim Ada-002 vector. searchable: true opts it into vector search.
      // hidden: true — vectors are large, no need to send them back in results.
      {
        name: 'embedding',
        type: 'Collection(Edm.Single)',
        searchable: true,
        hidden: true,
        vectorSearchDimensions: DIMENSIONS,
        vectorSearchProfileName: 'hnsw-profile',
      },
    ],
    vectorSearch: {
      algorithms: [{ name: 'hnsw', kind: 'hnsw' }],
      profiles: [{ name: 'hnsw-profile', algorithmConfigurationName: 'hnsw' }],
    },
  };

  await indexClient.createOrUpdateIndex(schema);
  indexReady = true;
}

// Upload all chunks for a document to the search index.
// embeddings[i] is the Ada-002 vector for chunks[i].
export async function indexChunks(
  documentId: string,
  filename: string,
  chunks: Chunk[],
  embeddings: number[][]
): Promise<void> {
  await ensureIndex();
  const { searchClient } = getClients();

  const documents: IndexedChunk[] = chunks.map((chunk, i) => ({
    // ID must be unique across the whole index. Combining document ID
    // and chunk index guarantees that — re-ingesting the same file
    // will overwrite existing chunks rather than creating duplicates.
    id: `${documentId}-${chunk.chunkIndex}`,
    documentId,
    filename,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    embedding: embeddings[i],
  }));

  // Upload in batches of 100 — the SDK limit per request.
  for (let i = 0; i < documents.length; i += 100) {
    await searchClient.uploadDocuments(documents.slice(i, i + 100));
  }
}

export interface SearchResult {
  content: string;
  filename: string;
  score: number;
}

// Find the topK chunks whose embeddings are most similar to the query vector.
// Returns the raw text of each matching chunk so the query function can
// paste them into the GPT-4o prompt as context.
export async function vectorSearch(
  embedding: number[],
  topK = 5
): Promise<SearchResult[]> {
  await ensureIndex();
  const { searchClient } = getClients();

  const results = await searchClient.search('*', {
    vectorSearchOptions: {
      queries: [
        {
          kind: 'vector',
          vector: embedding,
          fields: ['embedding'],
          kNearestNeighborsCount: topK,
        },
      ],
    },
    select: ['content', 'filename'],
    top: topK,
  });

  const hits: SearchResult[] = [];
  for await (const result of results.results) {
    hits.push({
      content: result.document.content,
      filename: result.document.filename,
      score: result.score ?? 0,
    });
  }
  return hits;
}
