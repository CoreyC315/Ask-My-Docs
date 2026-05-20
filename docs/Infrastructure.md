# Infrastructure

All infrastructure is defined as Terraform code in `/terraform`. See [[Overview]] for the tech stack and [[Build Plan]] for phase progress.

## Resource Naming Convention

All resources follow Azure naming conventions with a consistent prefix:

```
{type-prefix}-{project}-{environment}
e.g. func-askmydocs-dev
```

| Prefix | Resource type |
|---|---|
| `rg-` | Resource Group |
| `id-` | Managed Identity |
| `log-` | Log Analytics Workspace |
| `appi-` | Application Insights |
| `kv-` | Key Vault |
| `st` | Storage Account (no hyphen — Azure doesn't allow them) |
| `asp-` | App Service Plan |
| `func-` | Function App |
| `app-` | App Service |
| `srch-` | AI Search |
| `oai-` | Azure OpenAI |
| `sigr-` | SignalR |

---

## Terraform Module Map

```
terraform/
├── main.tf           ← resource group, managed identity, module calls
├── providers.tf      ← azurerm + azuread + random providers, local backend
├── variables.tf      ← input variables + SKU map locals
├── outputs.tf
└── modules/
    ├── monitoring/   ← Log Analytics + App Insights
    ├── keyvault/     ← Key Vault + role assignments
    ├── storage/      ← Storage Account + documents container
    ├── compute/      ← App Service Plan + Function App + App Service
    ├── ai/           ← Azure OpenAI + AI Search + index schema  [Phase 3]
    ├── signalr/      ← SignalR Service                          [Phase 4]
    └── iam/          ← remaining role assignments               [Phase 4]
```

---

## Resources by Module

### Root (`main.tf`)
| Resource | Name | Purpose |
|---|---|---|
| Resource Group | `rg-askmydocs-dev` | Container for all resources |
| Managed Identity | `id-askmydocs-dev` | Shared identity for all services |

### `modules/monitoring`
| Resource | Name | Purpose |
|---|---|---|
| Log Analytics Workspace | `log-askmydocs-dev` | Central log store (30-day retention in dev) |
| Application Insights | `appi-askmydocs-dev` | App telemetry, linked to workspace |

### `modules/keyvault`
| Resource | Name | Purpose |
|---|---|---|
| Key Vault | `kv-askmydocs-dev` | Secret storage, RBAC-enabled |
| Role Assignment | — | Managed identity → Secrets User |
| Role Assignment | — | Operator (you) → Secrets Officer |

### `modules/storage`
| Resource | Name | Purpose |
|---|---|---|
| Storage Account | `staskmydocs[random]` | Blob storage, LRS, no public access |
| Blob Container | `documents` | Landing zone for uploaded PDFs |

### `modules/compute`
| Resource | Name | Purpose |
|---|---|---|
| App Service Plan | `asp-askmydocs-dev` | Shared B1 Linux compute |
| Function App | `func-askmydocs-dev` | Serverless backend (Node 20) |
| App Service | `app-askmydocs-dev` | Next.js frontend (Node 20 LTS) |

---

## Environment SKU Map

Switching `environment = "prod"` upgrades every service automatically:

| Service | dev | prod |
|---|---|---|
| App Service Plan | B1 (~$13/mo) | P1v3 |
| AI Search | free ($0) | basic |
| SignalR | Free ($0) | Standard |
| OpenAI capacity | 10K TPM | 30K TPM |
| Log retention | 30 days | 90 days |

---

## Destroy / Rebuild Workflow

```bash
# Tear everything down (billing stops immediately)
cd terraform
terraform destroy

# Rebuild from scratch (~5 minutes)
terraform apply
```

State is stored locally in `terraform/terraform.tfstate` — this file is gitignored and must not be deleted between destroy/apply cycles.
