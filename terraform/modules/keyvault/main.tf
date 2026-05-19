resource "azurerm_key_vault" "main" {
  name                = "kv-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  tenant_id           = var.tenant_id
  sku_name            = "standard"

  # Use Azure RBAC for access control instead of the legacy access policy model.
  enable_rbac_authorization = true

  soft_delete_retention_days = var.soft_delete_retention_days

  # Prevents permanent deletion of the vault while soft-delete retention is active.
  # Set to false in dev so you can fully destroy and recreate without hitting the
  # 7-day recovery window.
  purge_protection_enabled = false

  tags = var.tags
}

# The app's managed identity can read secrets — enough to fetch connection strings at runtime.
resource "azurerm_role_assignment" "app_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.app_principal_id
}

# The operator running Terraform can create and update secrets — needed to populate
# secrets in Phase 4 without leaving the Terraform workflow.
resource "azurerm_role_assignment" "admin_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = var.admin_principal_id
}
