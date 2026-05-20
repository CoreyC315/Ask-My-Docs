output "connection_string" {
  description = "SignalR connection string. Stored in Key Vault and injected into the Function App."
  value       = azurerm_signalr_service.main.primary_connection_string
  sensitive   = true
}

output "hostname" {
  description = "SignalR service hostname, used by the frontend to open a WebSocket connection."
  value       = "${azurerm_signalr_service.main.name}.service.signalr.net"
}
