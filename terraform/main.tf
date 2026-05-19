data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.tags
}

# Single user-assigned identity shared by all services in the app.
resource "azurerm_user_assigned_identity" "main" {
  name                = "id-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "monitoring" {
  source = "./modules/monitoring"

  prefix         = local.prefix
  location       = azurerm_resource_group.main.location
  rg_name        = azurerm_resource_group.main.name
  tags           = local.tags
  retention_days = local.skus.log_retention_days
}

module "keyvault" {
  source = "./modules/keyvault"

  prefix              = local.prefix
  location            = azurerm_resource_group.main.location
  rg_name             = azurerm_resource_group.main.name
  tags                = local.tags
  tenant_id           = data.azurerm_client_config.current.tenant_id
  # Grant the shared managed identity read access to secrets.
  app_principal_id    = azurerm_user_assigned_identity.main.principal_id
  # Grant the operator running terraform admin access to populate secrets.
  admin_principal_id  = data.azurerm_client_config.current.object_id
}
