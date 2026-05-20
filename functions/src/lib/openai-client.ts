import OpenAI, { AzureOpenAI } from 'openai';

// The same openai npm package supports both the direct API and Azure OpenAI.
// OPENAI_MODE=direct  → api.openai.com, standard model names (gpt-4o, text-embedding-ada-002)
// OPENAI_MODE=azure   → your Azure endpoint, deployment names match what's in Terraform
// Switching between them is just changing env vars — no code changes needed.
function createClient(): OpenAI {
  if (process.env.OPENAI_MODE === 'azure') {
    return new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      // No API key — uses DefaultAzureCredential (managed identity in Azure,
      // az login credentials locally).
      apiVersion: '2024-10-21',
    });
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

// Module-level singleton so we don't create a new HTTP client on every invocation.
const client = createClient();

// Model names differ between direct OpenAI and Azure OpenAI.
// Direct: you reference the global model name.
// Azure:  you reference the deployment name you set in Terraform (same strings here).
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const CHAT_MODEL = 'gpt-4o';

// Turn a batch of texts into 1536-dimensional vectors in a single API call.
// The OpenAI embeddings endpoint accepts an array and returns embeddings in the
// same order — much more efficient than calling embed() in a loop for every chunk.
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  // The API guarantees results are returned in the same order as the input.
  return response.data.map((item) => item.embedding);
}

// Turn a piece of text into a 1536-dimensional vector.
// Every chunk of every PDF goes through here during ingestion.
// The user's question also goes through here during a query so we can
// compare it against stored chunk vectors using cosine similarity.
export async function embed(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

// Stream a chat completion, calling onToken for each piece of text as it arrives.
// The caller is responsible for forwarding those tokens to the browser via SignalR.
// Using a callback instead of returning the stream keeps the SignalR push logic
// in the query function where it belongs.
export async function streamChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  onToken: (token: string) => Promise<void>
): Promise<void> {
  const stream = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) await onToken(token);
  }
}
