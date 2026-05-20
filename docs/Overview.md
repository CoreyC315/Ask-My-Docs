# AskMyDocs

A cloud-native RAG (Retrieval Augmented Generation) web app where users upload documents and chat with them in real time. Upload a PDF, ask questions in natural language, and get AI-powered answers streamed live to the browser — all backed by Azure.

## Quick Links

- [[Architecture]] — how the services connect and data flows
- [[Infrastructure]] — Terraform modules and Azure resources
- [[Build Plan]] — phases and current progress

## Tech Stack

| Layer | Service | Role |
|---|---|---|
| Frontend | Azure App Service | Hosts the Next.js UI |
| Backend | Azure Functions | Ingest + query serverless functions |
| Storage | Azure Blob Storage | Stores uploaded PDFs |
| Vector DB | Azure AI Search | Indexes and searches document chunks |
| AI — Embeddings | Azure OpenAI (Ada-002) | Converts text to vectors |
| AI — Chat | Azure OpenAI (GPT-4o) | Generates streaming answers |
| Real-time | Azure SignalR | Streams GPT-4o tokens to the browser |
| Secrets | Azure Key Vault | Stores all secrets, accessed via managed identity |
| Identity | User-Assigned Managed Identity | Passwordless auth between all services |
| Observability | App Insights + Log Analytics | Telemetry, logs, dashboards |
| IaC | Terraform | All infrastructure defined as code |

## The Core Idea

Traditional search finds documents by keyword matching. RAG goes further:

1. **Ingest** — split documents into overlapping chunks, convert each chunk into a vector (a list of numbers that encodes semantic meaning), and store both in a search index.
2. **Query** — convert the user's question into a vector the same way, find the chunks whose vectors are mathematically closest (semantically similar), and feed those chunks to GPT-4o as context.
3. **Answer** — GPT-4o reads the retrieved chunks and generates an answer grounded in the actual document content, streamed token by token back to the browser.
