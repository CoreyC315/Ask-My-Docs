output "function_app_name" {
  description = "Function App name — used when deploying function code via Azure CLI or GitHub Actions."
  value       = azurerm_linux_function_app.main.name
}

output "function_app_hostname" {
  description = "Function App default hostname, e.g. func-askmydocs-dev.azurewebsites.net"
  value       = azurerm_linux_function_app.main.default_hostname
}

output "web_app_name" {
  description = "App Service name — used when deploying the Next.js frontend."
  value       = azurerm_linux_web_app.main.name
}

output "web_app_hostname" {
  description = "App Service default hostname, e.g. app-askmydocs-dev.azurewebsites.net"
  value       = azurerm_linux_web_app.main.default_hostname
}

output "service_plan_id" {
  description = "App Service Plan resource ID — referenced if we add autoscale rules later."
  value       = azurerm_service_plan.main.id
}
