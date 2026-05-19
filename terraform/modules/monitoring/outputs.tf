output "workspace_id" {
  description = "Log Analytics workspace resource ID — used when linking other services to this workspace."
  value       = azurerm_log_analytics_workspace.main.id
}

output "instrumentation_key" {
  description = "App Insights instrumentation key — passed to Function App and App Service as an env var."
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "connection_string" {
  description = "App Insights connection string — preferred over instrumentation key for newer SDKs."
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
