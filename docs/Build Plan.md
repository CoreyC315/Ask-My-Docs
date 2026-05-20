# Build Plan

See [[Architecture]] for how the services fit together and [[Infrastructure]] for the Terraform module breakdown.

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

## Phase 3 — AI Services
> The intelligence layer

- [ ] `modules/ai` — Azure OpenAI account
- [ ] GPT-4o deployment
- [ ] Ada-002 embedding deployment
- [ ] AI Search service
- [ ] AI Search index schema (chunks + 1536-dim vectors)

---

## Phase 4 — Integration
> Wire everything together

- [ ] `modules/signalr` — SignalR Service (Free tier in dev)
- [ ] `modules/iam` — role assignments: managed identity → Storage, AI Search, OpenAI
- [ ] Key Vault secrets populated with service connection strings

---

## Phase 5 — Application Code
> The actual app

- [ ] Ingest Function — blob trigger → PDF chunking → Ada embedding → AI Search index
- [ ] Query Function — HTTP trigger → vector search → GPT-4o stream → SignalR push
- [ ] Next.js frontend — upload UI + real-time chat with SignalR client

---

## Phase 6 — Validation
> Make sure it all works end to end

- [ ] App Insights dashboard + alerts
- [ ] End-to-end test: upload PDF → ask question → verify streaming response
