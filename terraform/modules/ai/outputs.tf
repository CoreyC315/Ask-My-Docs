output "openai_endpoint" {
  description = "Azure OpenAI REST endpoint. Used by both the ingest and query functions."
  value       = azurerm_cognitive_account.openai.endpoint
}

output "openai_id" {
  description = "Resource ID of the OpenAI account. Used in Phase 4 to grant the managed identity Cognitive Services User role."
  value       = azurerm_cognitive_account.openai.id
}

output "search_endpoint" {
  description = "AI Search REST endpoint. Used by the ingest function to push chunks and the query function to search them."
  value       = "https://${azurerm_search_service.main.name}.search.windows.net"
}

output "search_id" {
  description = "Resource ID of the AI Search service. Used in Phase 4 to grant the managed identity Search Index Data Contributor role."
  value       = azurerm_search_service.main.id
}
