variable "prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "rg_name" {
  type = string
}

variable "tags" {
  type = map(string)
}

variable "app_service_plan_sku" {
  description = "SKU for the App Service Plan. B1 for dev, P1v3 for prod."
  type        = string
}

variable "identity_id" {
  description = "Resource ID of the user-assigned managed identity attached to both apps."
  type        = string
}

variable "storage_account_name" {
  description = "Storage account name used by the Function App for its internal state (locks, triggers)."
  type        = string
}

variable "storage_primary_connection_string" {
  description = "Connection string for the Function App's internal storage — not the documents bucket."
  type        = string
  sensitive   = true
}

variable "appinsights_connection_string" {
  description = "App Insights connection string injected as an env var into both apps."
  type        = string
  sensitive   = true
}
