# Shared hosting plan — both the Function App and App Service run on this.
# Changing the SKU here resizes compute for the entire application at once.
resource "azurerm_service_plan" "main" {
  name                = "asp-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku
  tags                = var.tags
}

# Function App — runs the ingest and query functions.
# The blob trigger on the documents container fires the ingest function
# automatically when a new PDF is uploaded. The query function is HTTP-triggered
# and called directly by the frontend.
resource "azurerm_linux_function_app" "main" {
  name                = "func-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  service_plan_id     = azurerm_service_plan.main.id
  tags                = var.tags

  # Function Apps need their own storage account for internal bookkeeping:
  # trigger state, distributed locks, and deployment packages.
  # This is separate from the documents bucket the app uses.
  storage_account_name       = var.storage_account_name
  storage_uses_managed_identity = true

  identity {
    type         = "UserAssigned"
    identity_ids = [var.identity_id]
  }

  site_config {
    application_stack {
      node_version = "20"
    }
  }

  app_settings = {
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.appinsights_connection_string
    # Tells App Insights SDK which identity to use when authenticating.
    ApplicationInsightsAgent_EXTENSION_VERSION = "~4"
  }
}

# App Service — hosts the Next.js frontend.
# It calls the Function App over HTTP for document upload and chat queries.
resource "azurerm_linux_web_app" "main" {
  name                = "app-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  service_plan_id     = azurerm_service_plan.main.id
  tags                = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [var.identity_id]
  }

  site_config {
    application_stack {
      node_version = "20-lts"
    }
    # always_on requires Basic tier (B1) or above — not available on F1 free tier.
    always_on = var.app_service_plan_sku == "F1" ? false : true
  }

  app_settings = {
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.appinsights_connection_string
    # URL of the Function App — frontend uses this to call the backend.
    FUNCTION_APP_URL = "https://func-${var.prefix}.azurewebsites.net"
  }
}
