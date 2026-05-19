output "account_name" {
  description = "Storage account name — needed by the Function App blob trigger config."
  value       = azurerm_storage_account.main.name
}

output "account_id" {
  description = "Resource ID — used when assigning the managed identity Blob Storage roles."
  value       = azurerm_storage_account.main.id
}

output "primary_connection_string" {
  description = "Connection string — stored in Key Vault, read by the Function App at runtime."
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "documents_container_name" {
  description = "Name of the blob container that holds uploaded PDFs."
  value       = azurerm_storage_container.documents.name
}
