resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.tags
}

module "monitoring" {
  source = "./modules/monitoring"

  prefix   = local.prefix
  location = azurerm_resource_group.main.location
  rg_name  = azurerm_resource_group.main.name
  tags     = local.tags
}
