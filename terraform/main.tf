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

module "storage" {
  source = "./modules/storage"

  prefix   = local.prefix
  location = azurerm_resource_group.main.location
  rg_name  = azurerm_resource_group.main.name
  tags     = local.tags
}

module "signalr" {
  source = "./modules/signalr"

  prefix   = local.prefix
  location = azurerm_resource_group.main.location
  rg_name  = azurerm_resource_group.main.name
  tags     = local.tags
  sku      = local.skus.signalr
}

# Store the SignalR connection string in Key Vault so the Function App
# can read it via a Key Vault reference instead of a plain env var.
resource "azurerm_key_vault_secret" "signalr_connection_string" {
  name         = "signalr-connection-string"
  value        = module.signalr.connection_string
  key_vault_id = module.keyvault.key_vault_id
}

module "iam" {
  source = "./modules/iam"

  principal_id       = azurerm_user_assigned_identity.main.principal_id
  storage_account_id = module.storage.account_id
  search_service_id  = module.ai.search_id
}

module "compute" {
  source = "./modules/compute"

  prefix               = local.prefix
  location             = azurerm_resource_group.main.location
  rg_name              = azurerm_resource_group.main.name
  tags                 = local.tags
  app_service_plan_sku = local.skus.app_service_plan
  identity_id          = azurerm_user_assigned_identity.main.id

  storage_account_name              = module.storage.account_name
  storage_primary_connection_string = module.storage.primary_connection_string

  appinsights_connection_string = module.monitoring.connection_string
  keyvault_name                 = module.keyvault.key_vault_name
  search_endpoint               = module.ai.search_endpoint
  signalr_hostname              = module.signalr.hostname
}

module "ai" {
  source = "./modules/ai"

  prefix          = local.prefix
  location        = azurerm_resource_group.main.location
  openai_location = var.openai_location
  rg_name         = azurerm_resource_group.main.name
  tags            = local.tags
  openai_capacity = local.skus.openai_capacity
  ai_search_sku   = local.skus.ai_search
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
