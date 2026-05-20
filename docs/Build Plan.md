# Build Plan

See [[Architecture]] for how the services fit together, [[Infrastructure]] for the Terraform module breakdown, and [[Runbook]] for destroy/rebuild steps and known gotchas.

---

## Phase 1 — Foundation ✅
> Resource Group, observability, secrets, identity

- [x] `providers.tf` — azurerm, azuread, random providers; local backend
- [x] `variables.tf` — project/environment/location inputs; SKU map locals
- [x] Resource Group — `rg-askmydocs-dev`
- [x] `modules/monitoring` — Log Analytics + App Insights
- [x] User-Assigned Managed Identity — `id-askmydocs-dev`
- [x] `modules/keyvault` — Key Vault with RBAC; role assignments for app identity and operator

---

## Phase 2 — Storage + Compute ✅
> Where files live and where code runs

- [x] `modules/storage` — Storage Account + `documents` blob container
- [x] `modules/compute` — App Service Plan (B1), Function App, App Service

---

## Phase 3 — AI Services ⏸ Partial
> The intelligence layer

- [ ] `modules/ai` — Azure OpenAI account ← blocked, waiting on subscription approval (see [[Runbook#Azure OpenAI Access]])
- [ ] GPT-4o deployment ← blocked
- [ ] Ada-002 embedding deployment ← blocked
- [x] AI Search service — `srch-askmydocs-dev` deployed
- [x] AI Search index schema — defined in `functions/src/lib/search-client.ts`, created on first ingest

---

## Phase 4 — Integration ✅
> Wire everything together

- [x] `modules/signalr` — SignalR Service `sigr-askmydocs-dev` (Free_F1 in dev)
- [x] `modules/iam` — Storage Blob Data Contributor + Search Index Data Contributor on managed identity
- [x] Key Vault secrets — `openai-api-key` (manual), `signalr-connection-string` (Terraform)

---

## Phase 5 — Application Code ✅
> The actual app

- [x] Upload Function — HTTP trigger → writes PDF to blob storage
- [x] Ingest Function — blob trigger → PDF chunking → Ada embedding → AI Search index
- [x] Query Function — HTTP trigger → vector search → GPT-4o stream → SignalR push
- [x] Negotiate Function — returns SignalR client access token
- [x] Next.js frontend — drag-and-drop upload + real-time streaming chat UI

### Local dev status (as of end of session)
- `functions/local.settings.json` set up with real connection strings ✅
- Function app runs locally (`npm start` in `functions/`) ✅
- Frontend runs locally (`npm run dev` in `frontend/`) ✅
- End-to-end upload + chat not yet tested — pick up here next session

---

## Phase 6 — Validation
> Make sure it all works end to end

- [ ] End-to-end test: upload PDF → ask question → verify streaming response
- [ ] Fix any issues found during testing
- [ ] App Insights dashboard + alerts
- [ ] Deploy to Azure App Service + Function App
