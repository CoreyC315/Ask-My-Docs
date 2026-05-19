resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_storage_account" "main" {
  name                     = "st${replace(var.prefix, "-", "")}${random_string.suffix.result}"
  location                 = var.location
  resource_group_name      = var.rg_name
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Disable anonymous public access — blobs are only reachable via the
  # managed identity or a SAS token, never open to the internet.
  allow_nested_items_to_be_public = false

  tags = var.tags
}

# The container where users' uploaded PDFs land before ingestion.
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}
