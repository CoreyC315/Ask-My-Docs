output "key_vault_id" {
  description = "Resource ID — used when adding role assignments that scope to this vault."
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "Vault URI — used by the SDK to fetch secrets at runtime, e.g. https://kv-askmydocs-dev.vault.azure.net/"
  value       = azurerm_key_vault.main.vault_uri
}

output "key_vault_name" {
  description = "Vault name — used when writing secrets via Terraform in Phase 4."
  value       = azurerm_key_vault.main.name
}
