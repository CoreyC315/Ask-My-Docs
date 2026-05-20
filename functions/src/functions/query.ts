import { app, InvocationContext } from '@azure/functions';
import { embed } from '../lib/openai-client';
import { streamChat } from '../lib/openai-client';
import { vectorSearch } from '../lib/search-client';
import { sendToUser } from '../lib/signalr';

interface QueryRequest {
  question: string;
  userId: string;
}

// HTTP trigger — called by the frontend when the user sends a message.
// Returns 202 immediately so the browser isn't blocked, then does the
// actual work (search + GPT stream) asynchronously via SignalR.
app.http('query', {
  methods: ['POST'],
  route: 'query',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const { question, userId } = (await request.json()) as QueryRequest;

    if (!question?.trim() || !userId) {
      return { status: 400, jsonBody: { error: 'question and userId are required' } };
    }

    context.log(`Query from ${userId}: ${question}`);

    // Fire-and-forget: don't await. The HTTP response goes back immediately
    // while the pipeline runs in the background pushing tokens to SignalR.
    runQueryPipeline(question, userId, context).catch((err) => {
      context.error('Query pipeline failed:', err);
      // Best-effort: tell the frontend something went wrong so it doesn't
      // sit waiting forever for tokens that will never arrive.
      sendToUser('chat', userId, 'error', [{ message: 'Something went wrong. Please try again.' }]).catch(() => {});
    });

    return { status: 202, jsonBody: { message: 'Processing' } };
  },
});

async function runQueryPipeline(
  question: string,
  userId: string,
  context: InvocationContext
): Promise<void> {
  // Step 1: embed the question using the same model used to embed the chunks.
  // This puts the question in the same vector space as the stored chunks so
  // we can measure how similar they are.
  context.log('Embedding question...');
  const questionEmbedding = await embed(question);

  // Step 2: search AI Search for the 5 most similar chunks.
  // "Most similar" means closest in vector space — i.e. semantically related,
  // not necessarily sharing the same keywords.
  context.log('Searching for relevant chunks...');
  const chunks = await vectorSearch(questionEmbedding, 5);

  if (chunks.length === 0) {
    await sendToUser('chat', userId, 'token', [{ content: "I couldn't find any relevant content in your documents to answer that question." }]);
    await sendToUser('chat', userId, 'done', [{}]);
    return;
  }

  // Step 3: build the prompt.
  // The retrieved chunks become the "context" block. GPT-4o is instructed to
  // answer only from this content — this is the "Retrieval Augmented" part of RAG.
  // Without it, GPT-4o would answer from its training data, which may be wrong
  // or irrelevant to the user's specific documents.
  const contextBlock = chunks
    .map((c, i) => `[${i + 1}] (from ${c.filename})\n${c.content}`)
    .join('\n\n---\n\n');

  const messages: { role: 'system' | 'user'; content: string }[] = [
    {
      role: 'system',
      content: `You are a helpful assistant that answers questions based strictly on the provided document excerpts.
If the answer cannot be found in the excerpts, say so clearly — do not make up information.
Cite which excerpt number you used when relevant.

Document excerpts:
---
${contextBlock}
---`,
    },
    {
      role: 'user',
      content: question,
    },
  ];

  // Step 4: stream the GPT-4o response token by token.
  // Each token is pushed to the browser via SignalR as it arrives.
  // The frontend listens for 'token' events and appends each one to the chat bubble,
  // creating the typewriter effect.
  context.log('Streaming response...');
  await streamChat(messages, async (token) => {
    await sendToUser('chat', userId, 'token', [{ content: token }]);
  });

  // Signal the frontend that the stream is complete so it can stop the
  // loading indicator and re-enable the input box.
  await sendToUser('chat', userId, 'done', [{}]);
  context.log('Query complete');
}
