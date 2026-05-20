# Runbook

Operational notes for working with this project's infrastructure. See [[Build Plan]] for the phase checklist and [[Infrastructure]] for the Terraform module breakdown.

---

## Destroy + Rebuild Checklist

When you run `terraform destroy` and want to re-apply later, do these steps **in order**:

### 1. Destroy
```bash
cd terraform
terraform destroy
```

### 2. Purge the soft-deleted Key Vault

Azure holds deleted Key Vaults in a "soft-delete" limbo for 90 days. Because KV names are **globally unique across all Azure subscriptions**, the name `kv-askmydocs-dev` stays reserved even after destroy. The next `terraform apply` will fail with `VaultAlreadyExists` unless you purge it first.

```bash
az keyvault purge \
  --name kv-askmydocs-dev \
  --location westus2 \
  --subscription 0876a2c2-6582-47bc-bdf0-c755461e94a0
```

This takes about 30 seconds. You can confirm it's gone with:

```bash
az keyvault list-deleted \
  --subscription 0876a2c2-6582-47bc-bdf0-c755461e94a0 \
  --query "[?name=='kv-askmydocs-dev']"
```

An empty result means you're clear.

### 3. Apply
```bash
terraform apply
```

---

## Terraform State Drift (Orphaned Resources)

If `terraform apply` fails mid-run (timeout, transient Azure 404, etc.), some resources may exist in Azure but not be tracked in Terraform state. Symptoms:

- `A resource with the ID "..." already exists — to be managed via Terraform this resource needs to be imported`

Fix: import the orphaned resource into state, then re-run apply.

```bash
# General pattern
terraform import <terraform_address> <azure_resource_id>

# Azure resource IDs use PascalCase provider names — the CLI sometimes returns
# lowercase (e.g. "microsoft.insights" instead of "Microsoft.Insights").
# Always use the correctly-cased form or the import will fail.
```

Resources we've had to import during initial setup and their correct addresses:

| Azure Resource | Terraform Address |
|---|---|
| App Service Plan | `module.compute.azurerm_service_plan.main` |
| App Insights | `module.monitoring.azurerm_application_insights.main` |
| Function App | `module.compute.azurerm_linux_function_app.main` |

Provider path casing reference:
- `Microsoft.Web/serverFarms/...`
- `Microsoft.Insights/components/...`
- `Microsoft.Web/sites/...`

---

## Local Dev Setup (picking up after a destroy)

After re-applying Terraform, the connection strings change. Update `functions/local.settings.json` with fresh values before running `npm start`.

### Get the values

```bash
# Storage connection string → AzureWebJobsStorage
az storage account show-connection-string \
  --name staskmydocsdevs7ttw2 \
  --resource-group rg-askmydocs-dev \
  --subscription 0876a2c2-6582-47bc-bdf0-c755461e94a0 \
  --query connectionString -o tsv

# SignalR connection string → AZURE_SIGNALR_CONNECTION_STRING
az signalr key list \
  --name sigr-askmydocs-dev \
  --resource-group rg-askmydocs-dev \
  --subscription 0876a2c2-6582-47bc-bdf0-c755461e94a0 \
  --query primaryConnectionString -o tsv

# AI Search admin key → AZURE_SEARCH_KEY
az search admin-key show \
  --service-name srch-askmydocs-dev \
  --resource-group rg-askmydocs-dev \
  --subscription 0876a2c2-6582-47bc-bdf0-c755461e94a0 \
  --query primaryKey -o tsv
```

The OpenAI API key is yours — it doesn't change. `AZURE_SEARCH_ENDPOINT` and `AZURE_STORAGE_ACCOUNT_NAME` are fixed and already in `local.settings.json.example`.

### Run locally

```bash
# Terminal 1 — functions backend
cd functions && npm start

# Terminal 2 — Next.js frontend
cd frontend && npm run dev
```

Open `http://localhost:3000`. The function app runs on port 7071.

---

## Azure OpenAI Access

Azure OpenAI is not available to subscriptions by default — it requires a separate approval from Microsoft.

**Error when not approved:**
```
SpecialFeatureOrQuotaIdRequired: The subscription does not have QuotaId/Feature
required by SKU 'S0' from kind 'OpenAI' or contains blocked QuotaId/Feature.
```

**How to request access:** Go to [aka.ms/oai/access](https://aka.ms/oai/access) and submit the form. Select the `payg-sub` subscription (`0876a2c2-6582-47bc-bdf0-c755461e94a0`). Approval takes 1–10 business days.

Once approved, `terraform apply` will pick up exactly where it left off — the OpenAI account, GPT-4o deployment, and Ada-002 deployment are the only things waiting.

---

## Subscription + Region

| Setting | Value |
|---|---|
| Subscription | `payg-sub` |
| Subscription ID | `0876a2c2-6582-47bc-bdf0-c755461e94a0` |
| Region | `westus2` |

**Why westus2?** East US hit App Service quota limits (`SubscriptionIsOverQuotaForSku`) on the payg-sub at project start. West US 2 had quota pre-seeded. If you ever need to change regions, update `variable "location"` and `variable "openai_location"` in `variables.tf` — but note the Key Vault purge step above will also need the correct `--location` flag.

**Why payg-sub?** The original free-tier subscription had a subscription-level App Service worker quota of 0 that couldn't be raised via support ticket. The payg-sub got quota approved for Standard BS Family vCPUs in West US 2.
