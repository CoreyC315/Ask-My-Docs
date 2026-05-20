# Architecture

## Ingestion Flow

When a user uploads a PDF, it kicks off an automated pipeline that processes the document and makes it searchable.

```mermaid
flowchart TD
    A([User]) -->|uploads PDF| B[App Service\napp-askmydocs-dev]
    B -->|stores file| C[(Blob Storage\ndocuments/)]
    C -->|blob trigger fires| D[Function App — ingest\nfunc-askmydocs-dev]

    D --> E{for each chunk}
    E -->|text| F[OpenAI Ada-002\ntext-embedding-ada-002]
    F -->|1536-dim vector| E
    E -->|chunk + vector| G[(AI Search\ndocuments index)]

    style A fill:#f5f5f5
    style C fill:#0078d4,color:#fff
    style F fill:#412991,color:#fff
    style G fill:#0078d4,color:#fff
```

**Steps:**
1. User uploads PDF via the Next.js UI
2. App Service writes the file to Blob Storage (`documents` container)
3. The blob trigger fires automatically — Function App starts ingesting within seconds
4. Function splits the PDF into overlapping chunks (~500 tokens each with overlap)
5. Each chunk is sent to Ada-002, which returns a 1536-dimensional vector
6. Chunk text + vector are pushed to the AI Search index together

---

## Query Flow

When a user asks a question, the app finds the most relevant chunks and streams a grounded answer.

```mermaid
flowchart TD
    A([User]) -->|types question| B[App Service\napp-askmydocs-dev]
    B -->|HTTP call| C[Function App — query\nfunc-askmydocs-dev]

    C -->|embed question| D[OpenAI Ada-002]
    D -->|question vector| C

    C -->|vector search| E[(AI Search\ndocuments index)]
    E -->|top 5 chunks| C

    C -->|question + chunks as prompt| F[OpenAI GPT-4o]
    F -->|token stream| C
    C -->|push tokens| G[SignalR]
    G -->|real-time stream| A

    style A fill:#f5f5f5
    style D fill:#412991,color:#fff
    style E fill:#0078d4,color:#fff
    style F fill:#412991,color:#fff
    style G fill:#0078d4,color:#fff
```

**Steps:**
1. User types a question in the chat UI
2. App Service forwards it to the query Function App via HTTP
3. Function embeds the question using Ada-002 (same model as ingestion)
4. AI Search finds the 5 chunks whose vectors are closest to the question vector
5. Function builds a prompt: system instructions + retrieved chunks + question
6. GPT-4o streams the answer back token by token
7. Each token is pushed to the browser via SignalR — the user sees the answer appear live

---

## Identity & Secrets

No passwords exist anywhere in the application code or config.

```mermaid
flowchart LR
    ID[Managed Identity\nid-askmydocs-dev]

    ID -->|Secrets User| KV[Key Vault\nkv-askmydocs-dev]
    ID -->|Storage Blob Data Contributor| ST[(Blob Storage)]
    ID -->|Search Index Data Contributor| SR[(AI Search)]
    ID -->|Cognitive Services User| OAI[OpenAI]

    FUNC[Function App] -.->|authenticates as| ID
    APP[App Service] -.->|authenticates as| ID
```

Both the Function App and App Service are assigned `id-askmydocs-dev`. When either service needs to talk to Blob Storage, Key Vault, AI Search, or OpenAI, Azure checks the identity's role assignments — no keys or passwords required.

---

## Observability

All services report to the same App Insights instance, which stores data in the shared Log Analytics workspace.

| What | Where |
|---|---|
| Function App logs + traces | `appi-askmydocs-dev` |
| App Service request logs | `appi-askmydocs-dev` |
| All raw data | `log-askmydocs-dev` (Log Analytics) |
| Query language | KQL (Kusto Query Language) |
